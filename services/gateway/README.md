# gateway

Go. Serves REST to the browser, enforces per-IP rate limiting, caches in Redis, and calls ml-service via gRPC. The only unit that speaks REST (ADR-010). Owns the `api_keys` table (admin only).

## Endpoints (contract: `api/openapi/kairos.v1.yaml`)
- `GET /healthz`, `GET /readyz`
- `GET /v1/instruments`
- `GET /v1/instruments/{id}/forecast?h=7|30`
- `GET /v1/instruments/{id}/history`
- `POST /v1/admin/refresh` (header `X-Admin-Api-Key`)

## Layout

| Path | Responsibility |
| --- | --- |
| `cmd/gateway/main.go` | Process bootstrap, env wiring, graceful shutdown |
| `internal/routes/` | Domain-split route registration (`health`, `instrument`, `forecast`, `admin`) |
| `internal/handler/` | Thin HTTP request/response mapping and ETag caching |
| `internal/services/` | Inter-service gRPC clients (`instrument.service.go`, `forecast.service.go`) |
| `internal/cache/` | Minimal RESP2 Redis cache client |
| `internal/middleware/` | Per-IP token-bucket rate limiter, CORS, `X-Request-Id`, JSON access logs |

## Build & Test
Go proto stubs are generated during build (`protogen` stage), not committed. Docker build runs `go test -v ./...` before compiling the static binary.
```bash
docker build -f services/gateway/Dockerfile -t kairos-gateway .
```
