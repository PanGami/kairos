# ml-service

Pure gRPC server (grpcio) — **NOT FastAPI** (ADR-010). Owns the `model_specs`, `forecast_runs`, and `forecasts` tables.

## RPCs (contract: `api/proto/kairos/forecast/v1/forecast.proto`)
- `GetForecast` — read by the gateway for the dashboard.
- `ListInstruments` — populates the dropdown.
- `GetHistory` — returns actual prices + historical walk-forward backtest series.
- `ComputeForecast` — internal, triggered by ingestion/scheduler after daily data arrives.

## Layout

| Path | Responsibility |
| --- | --- |
| `src/kairos_ml/server.py` | gRPC server bootstrap and `SIGTERM` graceful shutdown |
| `src/kairos_ml/routes/` | gRPC servicer and health check registration (`forecast_routes.py`, `health_routes.py`) |
| `src/kairos_ml/servicer.py` | Thin protobuf request/response adapter |
| `src/kairos_ml/services/` | Domain orchestration (`instrument_service.py`, `forecast_service.py`) |
| `src/kairos_ml/forecast.py` | Pure M1/M2/M3 math copy verified by golden tests |
| `src/kairos_ml/db.py` | PostgreSQL connection and table-owned queries |
| `src/kairos_ml/config.py` | Env config, JSON logger, `x-request-id` extraction |
| `tests/test_golden.py` | Golden parity and reliability fallback tests |

## Implementation (SR-04, SR-05, SR-06, SR-12)
- Fits M1 (random walk midpoint + empirical 80%/95% intervals), M2 (zero-mean GARCH-t for `full` tier; long-run variance for `low` tier; EWMA fallback on non-convergence), and M3 (vol-implied correction probability with frozen $\theta$).
- Forecasting logic in `src/kairos_ml/forecast.py` is a **separate copy** from `ml/kairos_walkforward.py` (AGENTS.md), verified via golden tests (`tests/test_golden.py`).
- Health is exposed via the gRPC health protocol.

## Build
Proto stubs are generated during the Docker build (`protogen` stage), not committed.
```bash
docker build -f services/ml-service/Dockerfile -t kairos-ml-service .
```
