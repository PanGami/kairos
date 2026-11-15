"""PostgreSQL connection and repository queries for ingestion."""
from __future__ import annotations

import json
import os
from typing import Any

import pandas as pd

try:
    import psycopg  # type: ignore
except ImportError:  # pragma: no cover
    psycopg = None  # type: ignore

try:
    import psycopg2  # type: ignore
except ImportError:  # pragma: no cover
    psycopg2 = None  # type: ignore


def get_conn():
    dsn = (
        f"host={os.environ.get('POSTGRES_HOST', 'postgres')} "
        f"port={os.environ.get('POSTGRES_PORT', '5432')} "
        f"user={os.environ.get('POSTGRES_USER', 'kairos')} "
        f"password={os.environ.get('POSTGRES_PASSWORD', 'change_me_locally')} "
        f"dbname={os.environ.get('POSTGRES_DB', 'kairos')}"
    )
    if psycopg is not None:
        return psycopg.connect(dsn)
    if psycopg2 is not None:
        return psycopg2.connect(dsn)
    raise RuntimeError("Neither psycopg nor psycopg2 is installed")


def fetch_active_instruments(cur) -> list[tuple[str, str, str, str, str]]:
    cur.execute(
        """
        SELECT instrument_id, symbol, provider_symbol, currency, reliability_tier
        FROM instruments
        WHERE status = 'active'
        ORDER BY instrument_id
        """
    )
    return cur.fetchall()


def count_prices(cur) -> int:
    cur.execute("SELECT COUNT(*) FROM prices_daily")
    return int(cur.fetchone()[0])


def get_last_trade_date(cur, instrument_id: str) -> str | None:
    cur.execute(
        "SELECT MAX(trade_date)::text FROM prices_daily WHERE instrument_id = %s",
        (instrument_id,),
    )
    return cur.fetchone()[0]


def get_global_as_of_date(cur) -> str:
    cur.execute("SELECT COALESCE(MAX(trade_date), CURRENT_DATE)::text FROM prices_daily")
    return str(cur.fetchone()[0])


def upsert_canonical_df(cur, df: pd.DataFrame) -> int:
    if df.empty:
        return 0
    rows_written = 0
    for r in df.itertuples(index=False):
        dt_str = pd.Timestamp(r.trade_date).strftime("%Y-%m-%d")
        cur.execute(
            """
            INSERT INTO prices_daily (
                instrument_id, trade_date, open, high, low, close,
                adj_close, volume, currency, source, is_traded, adj_factor
            )
            VALUES (%s, %s::date, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (instrument_id, trade_date)
            DO UPDATE SET
                open = EXCLUDED.open,
                high = EXCLUDED.high,
                low = EXCLUDED.low,
                close = EXCLUDED.close,
                adj_close = EXCLUDED.adj_close,
                volume = EXCLUDED.volume,
                source = EXCLUDED.source,
                is_traded = EXCLUDED.is_traded,
                adj_factor = EXCLUDED.adj_factor
            WHERE prices_daily.source != 'kaggle_repair' OR EXCLUDED.source = 'kaggle_repair'
            """,
            (
                str(r.instrument_id),
                dt_str,
                float(r.open),
                float(r.high),
                float(r.low),
                float(r.close),
                float(r.adj_close),
                int(r.volume),
                str(r.currency),
                str(r.source),
                bool(r.is_traded),
                float(r.adj_factor),
            ),
        )
        rows_written += 1
    return rows_written


def record_ingestion_run(
    cur,
    as_of_date: str,
    status: str,
    rows_written: int,
    repairs: int,
    warnings: list[dict[str, Any]],
    duration_ms: int,
) -> None:
    cur.execute(
        """
        INSERT INTO ingestion_runs (as_of_date, status, rows_written, repairs, warnings, duration_ms)
        VALUES (%s::date, %s, %s, %s, %s::jsonb, %s)
        """,
        (as_of_date, status, rows_written, repairs, json.dumps(warnings), duration_ms),
    )


def needs_backfill(instrument_id: str) -> bool:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(DISTINCT as_of_date) FROM forecasts WHERE instrument_id = %s",
            (instrument_id,),
        )
        return int(cur.fetchone()[0]) <= 1
