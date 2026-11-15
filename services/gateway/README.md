# gateway

Go. Serves REST to the browser, enforces per-IP rate limiting, caches in Redis, and calls ml-service via gRPC. The only unit that speaks REST (ADR-010). Owns the `api_keys` table (admin only).

## Endpoints (contract: `api/openapi/kairos.v1.yaml`)
- `GET /healthz`, `GET /readyz`
- `GET /v1/instruments`
- `GET /v1/instruments/{id}/forecast?h=7|30`
- `GET /v1/instruments/{id}/history`
- `POST /v1/admin/refresh` (header `X-Admin-Api-Key`)

## Current Stage
Hello-world: `/healthz`, `/readyz` (checks ml-service), `/v1/instruments` (gRPC proxy).
Rate limiting, Redis caching, and forecast/history/admin endpoints will follow.

## Build
Go proto stubs are generated during build (`protogen` stage), not committed.
```bash
docker build -f services/gateway/Dockerfile -t kairos-gateway .
```
