# ingestion

One-off scheduled batch job (ADR-005, ADR-009, ADR-013). Owns the `instruments`, `prices_daily`, and `ingestion_runs` tables.

## Responsibilities (SR-01, SR-02, SR-03)
1. Reads active instruments from the `instruments` registry (`status = 'active'`).
2. Seeds from `canonical.parquet` (if mounted) and/or fetches EOD candles from `yfinance` (`auto_adjust=False`), dropping unfinalized current-day candles (`as_of_date = D-1`).
3. Applies validation and repair rules (repairs the 8 erroneous `yfinance` zero-volume days from audited Kaggle records, retains genuine zero-volume days with `is_traded = False`, and logs post-2024 zero-volume warnings).
4. Upserts canonical prices into `prices_daily`, records the run in `ingestion_runs`, and invokes `ml-service.ComputeForecast` via gRPC per active instrument.

## Layout

| Path | Responsibility |
| --- | --- |
| `src/kairos_ingestion/ingest.py` | Pipeline orchestration entrypoint |
| `src/kairos_ingestion/services/forecast_service.py` | gRPC client calling `ml-service.ComputeForecast` |
| `src/kairos_ingestion/validator.py` | Pure OHLC validation and audited Kaggle repairs |
| `src/kairos_ingestion/db.py` | PostgreSQL connection and upsert/run-tracking queries |
| `src/kairos_ingestion/config.py` | Env config and structured JSON logger |
| `tests/test_validation.py` | Unit tests for repairs, candle drop, and zero-volume flags |

## Run
```bash
docker compose -f docker-compose.local.yml run --rm ingestion
```
