# auth-service

Pure Go gRPC microservice handling Google OAuth ID token verification and opaque session tokens. Owns the `users` and `user_sessions` tables (AGENTS.md).

## RPCs (contract: `api/proto/kairos/auth/v1/auth.proto`)
- `SignInWithGoogle` — validates a Google ID token (`oauth2.googleapis.com/tokeninfo` or local dev bypass when `AUTH_DEV_BYPASS=true`) and issues a 7-day SHA-256-hashed opaque session token.
- `ValidateSession` — checks session validity against PostgreSQL.
- `SignOut` — revokes an active session token.

## Layout

| Path | Responsibility |
| --- | --- |
| `cmd/auth-service/main.go` | Process bootstrap, Postgres connection, schema check, `SIGTERM` shutdown |
| `internal/routes/` | gRPC service and health route registration |
| `internal/handler/servicer.go` | Thin protobuf request/response adapter |
| `internal/services/` | Google token verification (`google.service.go`) and session domain logic (`session.service.go`) |
| `internal/repository/user.repository.go` | PostgreSQL queries for `users` and `user_sessions` |

## Build & Test
```bash
docker build -f services/auth-service/Dockerfile -t kairos-auth-service .
```
