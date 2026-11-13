# ml-service

Server gRPC murni (grpcio) — **BUKAN FastAPI** (ADR-010). Pemilik tabel `model_specs`, `forecast_runs`, `forecasts`.

## RPC (kontrak: `api/proto/kairos/forecast/v1/forecast.proto`)
- `GetForecast` — dibaca gateway untuk dashboard.
- `ListInstruments` — isi dropdown.
- `ComputeForecast` — internal, dipicu ingestion/scheduler setelah data harian masuk.

## Tahap saat ini
Hello-world stub: membalas nilai dummy berlabel `DEGRADED` agar jelas belum hasil fit nyata.
Health lewat gRPC health protocol.

## Berikutnya (SR-04)
Fit GARCH-t + interval empiris + M3 vol-implied, ditulis ke `forecasts`. Kode = **salinan terpisah**
dari notebook `ml/` (AGENTS.md), dijaga **golden test** (butuh fixture dari `canonical.parquet`).

## Build
Stub proto digenerate saat build Docker (stage `protogen`), tidak di-commit.
```bash
docker build -f services/ml-service/Dockerfile -t kairos-ml-service .
```
