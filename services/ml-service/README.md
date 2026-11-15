# ml-service

Pure gRPC server (grpcio) — **NOT FastAPI** (ADR-010). Owns the `model_specs`, `forecast_runs`, and `forecasts` tables.

## RPCs (contract: `api/proto/kairos/forecast/v1/forecast.proto`)
- `GetForecast` — read by the gateway for the dashboard.
- `ListInstruments` — populates the dropdown.
- `ComputeForecast` — internal, triggered by ingestion/scheduler after daily data arrives.

## Current Stage
Hello-world stub: returns dummy values labeled `DEGRADED` so it is clearly distinguishable from a real fit result.
Health is exposed via the gRPC health protocol.

## Next (SR-04)
Fit GARCH-t + empirical intervals + vol-implied M3, written to `forecasts`. Code = **separate copy**
from the `ml/` notebooks (AGENTS.md), verified via **golden tests** (requires fixtures from `canonical.parquet`).

## Build
Proto stubs are generated during the Docker build (`protogen` stage), not committed.
```bash
docker build -f services/ml-service/Dockerfile -t kairos-ml-service .
```
