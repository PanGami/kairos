# ---- Stage 1: generate Go proto stubs, run unit tests & build binary ----
FROM golang:1.22-alpine AS build
RUN apk add --no-cache protobuf
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.1 && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
ENV PATH=$PATH:/root/go/bin

WORKDIR /app
COPY services/auth-service/go.mod ./
RUN go mod download || true

COPY api/proto ./proto
ENV GO_PKG=github.com/kairos/auth-service/gen/kairos/auth/v1;authv1
RUN mkdir -p gen && \
    protoc -I proto \
      --go_out=gen --go_opt=module=github.com/kairos/auth-service/gen \
      --go_opt=Mkairos/auth/v1/auth.proto=${GO_PKG} \
      --go-grpc_out=gen --go-grpc_opt=module=github.com/kairos/auth-service/gen \
      --go-grpc_opt=Mkairos/auth/v1/auth.proto=${GO_PKG} \
      proto/kairos/auth/v1/auth.proto && \
    rm -rf proto

COPY services/auth-service/ ./
RUN go mod tidy && \
    go test -v ./... && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/auth-service ./cmd/auth-service

# ---- Stage 2: runtime (non-root, minimal) ----
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/auth-service /auth-service
ENV AUTH_SERVICE_PORT=50052
EXPOSE 50052
USER nonroot:nonroot
ENTRYPOINT ["/auth-service"]
