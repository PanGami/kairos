"""KAIROS ingestion entrypoint: orchestrates seed/fetch, DB persistence, and forecast service trigger."""
from __future__ import annotations

from datetime import datetime
import os
import time
from typing import Any
from zoneinfo import ZoneInfo

import pandas as pd

from kairos_ingestion import config, db
from kairos_ingestion.services.forecast_service import trigger_forecasts
from kairos_ingestion.validator import KAGGLE_REPAIRS, validate_and_repair  # noqa: F401

try:
    import yfinance as yf
except ImportError:  # pragma: no cover
    yf = None


def run_ingestion() -> int:
    t0 = time.time()
    today_local = datetime.now(ZoneInfo(config.TZ_NAME)).strftime("%Y-%m-%d")
    cutoff_date = os.environ.get("INGEST_CUTOFF_DATE", today_local)

    total_rows = 0
    total_repairs = 0
    all_warnings: list[dict[str, Any]] = []

    with db.get_conn() as conn, conn.cursor() as cur:
        active_instruments = db.fetch_active_instruments(cur)

        if config.CANONICAL_PARQUET_PATH.exists() and db.count_prices(cur) == 0:
            config.log("info", "Seeding prices_daily from canonical.parquet", path=str(config.CANONICAL_PARQUET_PATH))
            seed_df = pd.read_parquet(config.CANONICAL_PARQUET_PATH)
            total_rows += db.upsert_canonical_df(cur, seed_df)
            total_repairs += int((seed_df["source"] == "kaggle_repair").sum())
            conn.commit()

        if not config.SKIP_YFINANCE and yf is not None:
            for inst_id, _sym, provider_sym, currency, rel_tier in active_instruments:
                start_dt = db.get_last_trade_date(cur, inst_id) or "2020-01-01"
                try:
                    raw = yf.download(provider_sym, start=start_dt, auto_adjust=False, progress=False)
                    can_df, rep_cnt, warns = validate_and_repair(
                        raw,
                        instrument_id=inst_id,
                        currency=currency,
                        reliability_tier=rel_tier,
                        cutoff_date=cutoff_date,
                    )
                    total_rows += db.upsert_canonical_df(cur, can_df)
                    total_repairs += rep_cnt
                    all_warnings.extend(warns)
                    conn.commit()
                except Exception as exc:
                    config.log("warn", "yfinance fetch failed; falling back to stored DB data", instrument_id=inst_id, err=str(exc))
                    all_warnings.append({"instrument_id": inst_id, "type": "yfinance_fallback", "error": str(exc)})

        as_of_date = db.get_global_as_of_date(cur)
        dur_ms = int((time.time() - t0) * 1000)
        run_status = "degraded" if any(w.get("type") == "yfinance_fallback" for w in all_warnings) else "ok"
        db.record_ingestion_run(cur, as_of_date, run_status, total_rows, total_repairs, all_warnings, dur_ms)
        conn.commit()

    trigger_forecasts(active_instruments)
    config.log("info", "Ingestion job finished", rows_written=total_rows, repairs=total_repairs, warnings=len(all_warnings))
    return 0


if __name__ == "__main__":
    raise SystemExit(run_ingestion())
