// KAIROS auth-service bootstrap: connects PostgreSQL, registers gRPC routes, and handles SIGTERM shutdown.
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	_ "github.com/lib/pq"
	"google.golang.org/grpc"

	"github.com/kairos/auth-service/internal/handler"
	"github.com/kairos/auth-service/internal/repository"
	"github.com/kairos/auth-service/internal/routes"
	"github.com/kairos/auth-service/internal/services"
)

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func connectPostgres() (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		env("POSTGRES_HOST", "postgres"),
		env("POSTGRES_PORT", "5432"),
		env("POSTGRES_USER", "kairos"),
		env("POSTGRES_PASSWORD", "change_me_locally"),
		env("POSTGRES_DB", "kairos"),
	)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	for i := 0; i < 10; i++ {
		if err = db.Ping(); err == nil {
			return db, nil
		}
		time.Sleep(time.Second)
	}
	return nil, err
}

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	db, err := connectPostgres()
	if err != nil {
		slog.Error("connect postgres", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	store := repository.NewPostgresUserStore(db)
	if err := store.EnsureSchema(context.Background()); err != nil {
		slog.Error("ensure schema", "err", err)
		os.Exit(1)
	}

	devBypass := strings.EqualFold(env("AUTH_DEV_BYPASS", "false"), "true")
	verifier := services.NewGoogleTokenVerifier(os.Getenv("GOOGLE_CLIENT_ID"), devBypass)
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASSWORD")
	emailSvc := services.NewSMTPEmailService(
		env("SMTP_HOST", "smtp.gmail.com"),
		env("SMTP_PORT", "587"),
		smtpUser,
		smtpPass,
		os.Getenv("SMTP_FROM"),
	)
	sessionSvc := services.NewSessionService(verifier, store, emailSvc)
	authHandler := handler.NewAuthServicer(sessionSvc)

	srv := grpc.NewServer()
	routes.RegisterAuthRoutes(srv, authHandler)
	routes.RegisterHealthRoutes(srv)

	addr := ":" + env("AUTH_SERVICE_PORT", "50052")
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		slog.Error("listen", "addr", addr, "err", err)
		os.Exit(1)
	}

	go func() {
		slog.Info("auth-service started",
			"addr", addr,
			"dev_bypass", devBypass,
			"smtp_configured", strings.TrimSpace(smtpUser) != "" && strings.TrimSpace(smtpPass) != "",
		)
		if err := srv.Serve(lis); err != nil {
			slog.Error("serve", "err", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
	<-stop
	slog.Info("shutting down")
	srv.GracefulStop()
}
