# gateway

Go. REST ke browser, rate limit per IP, cache Redis, panggil ml-service via gRPC. Satu-satunya
unit yang bicara REST (ADR-010). Pemilik tabel `api_keys` (admin saja).

## Endpoint (kontrak: `api/openapi/kairos.v1.yaml`)
- `GET /healthz`, `GET /readyz`
- `GET /v1/instruments`
- `GET /v1/instruments/{id}/forecast?h=7|30`
- `GET /v1/instruments/{id}/history`
- `POST /v1/admin/refresh` (header `X-Admin-Api-Key`)

## Tahap saat ini
Hello-world: `/healthz`, `/readyz` (cek ml-service), `/v1/instruments` (proxy gRPC).
Rate limit, cache Redis, dan endpoint forecast/history/admin menyusul.

## Build
Stub Go proto digenerate saat build (stage `protogen`), tidak di-commit.
```bash
docker build -f services/gateway/Dockerfile -t kairos-gateway .
```
