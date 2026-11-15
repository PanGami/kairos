# ingestion

One-off scheduled batch job (ADR-005, ADR-009, ADR-013). Owns the `instruments`, `prices_daily`, and `ingestion_runs` tables.

## Responsibilities (SR-01, SR-02, SR-03)
1. Reads active instruments from the `instruments` registry (`status = 'active'`).
2. Seeds from `canonical.parquet` (if mounted) and/or fetches EOD candles from `yfinance` (`auto_adjust=False`), dropping unfinalized current-day candles (`as_of_date = D-1`).
3. Applies validation and repair rules (repairs the 8 erroneous `yfinance` zero-volume days from audited Kaggle records, retains genuine zero-volume days with `is_traded = False`, and logs post-2024 zero-volume warnings).
4. Upserts canonical prices into `prices_daily`, records the run in `ingestion_runs`, and invokes `ml-service.ComputeForecast` via gRPC per active instrument.

## Run
```bash
docker compose run --rm ingestion
```
