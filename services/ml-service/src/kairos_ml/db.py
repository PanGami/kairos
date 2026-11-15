"""PostgreSQL connection and repository queries for ml-service."""
from __future__ import annotations

import json
import os
from typing import Any

from kairos_ml import forecast as fc

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


def loads_json(val: Any) -> dict | list:
    if val is None:
        return {}
    if isinstance(val, (dict, list)):
        return val
    return json.loads(val)


def fetch_instruments(only_active: bool) -> list[tuple]:
    with get_conn() as conn, conn.cursor() as cur:
        if only_active:
            cur.execute(
                """
                SELECT instrument_id, symbol, mic, currency, timezone, status, reliability_tier
                FROM instruments
                WHERE status = 'active'
                ORDER BY instrument_id
                """
            )
        else:
            cur.execute(
                """
                SELECT instrument_id, symbol, mic, currency, timezone, status, reliability_tier
                FROM instruments
                ORDER BY instrument_id
                """
            )
        return cur.fetchall()


def fetch_latest_forecast(instrument_id: str, horizon: int) -> tuple | None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                f.instrument_id,
                f.horizon,
                f.as_of_date::text,
                r.status,
                i.reliability_tier,
                f.median,
                f.lower80,
                f.upper80,
                f.lower95,
                f.upper95,
                f.vol_daily,
                f.vol_annual,
                f.prob_correction,
                f.garch_params,
                f.empirical_q,
                f.path,
                r.created_at
            FROM forecasts f
            JOIN forecast_runs r ON r.id = f.run_id
            JOIN instruments i ON i.instrument_id = f.instrument_id
            WHERE f.instrument_id = %s AND f.horizon = %s
            ORDER BY f.as_of_date DESC
            LIMIT 1
            """,
            (instrument_id, horizon),
        )
        return cur.fetchone()


def fetch_history(instrument_id: str) -> tuple[list[tuple], list[tuple]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT trade_date::text, adj_close
            FROM prices_daily
            WHERE instrument_id = %s
            ORDER BY trade_date ASC
            """,
            (instrument_id,),
        )
        price_rows = cur.fetchall()

        cur.execute(
            """
            SELECT as_of_date::text, horizon, median, lower80, upper80
            FROM forecasts
            WHERE instrument_id = %s
              AND as_of_date < COALESCE(
                  (SELECT MAX(as_of_date) FROM forecasts WHERE instrument_id = %s),
                  CURRENT_DATE
              )
            ORDER BY as_of_date ASC, horizon ASC
            """,
            (instrument_id, instrument_id),
        )
        bt_rows = cur.fetchall()
    return price_rows, bt_rows


def fetch_instrument_specs_and_prices(
    cur, instrument_id: str, spec_version: str, as_of_date: str
) -> tuple[tuple | None, int, dict[int, float], list[tuple]]:
    cur.execute(
        "SELECT status, reliability_tier FROM instruments WHERE instrument_id = %s",
        (instrument_id,),
    )
    inst_row = cur.fetchone()
    if not inst_row:
        return None, 0, {}, []

    cur.execute(
        """
        SELECT horizon, theta, burn_in
        FROM model_specs
        WHERE instrument_id = %s AND target = 'M3' AND spec_version = %s
        """,
        (instrument_id, spec_version),
    )
    spec_rows = cur.fetchall()
    burn_in = fc.BURN.get(instrument_id, 0)
    thetas: dict[int, float] = {}
    for h_val, th_val, b_val in spec_rows:
        burn_in = int(b_val)
        if th_val is not None:
            thetas[int(h_val)] = float(th_val)

    if as_of_date:
        cur.execute(
            """
            SELECT trade_date::text, adj_close
            FROM prices_daily
            WHERE instrument_id = %s AND trade_date <= %s::date
            ORDER BY trade_date ASC
            """,
            (instrument_id, as_of_date),
        )
    else:
        cur.execute(
            """
            SELECT trade_date::text, adj_close
            FROM prices_daily
            WHERE instrument_id = %s
            ORDER BY trade_date ASC
            """,
            (instrument_id,),
        )
    price_rows = cur.fetchall()
    return inst_row, burn_in, thetas, price_rows


def mark_insufficient_data(
    cur,
    instrument_id: str,
    as_of_date: str,
    spec_version: str,
    git_sha: str,
    row_count: int,
    duration_ms: int,
) -> None:
    cur.execute(
        "UPDATE instruments SET status = 'insufficient_data', reliability_tier = 'insufficient' WHERE instrument_id = %s",
        (instrument_id,),
    )
    cur.execute(
        """
        INSERT INTO forecast_runs (instrument_id, as_of_date, spec_version, git_sha, data_window, status, duration_ms)
        VALUES (%s, %s::date, %s, %s, %s, 'failed', %s)
        ON CONFLICT (instrument_id, as_of_date, spec_version)
        DO UPDATE SET status = 'failed', duration_ms = EXCLUDED.duration_ms
        """,
        (instrument_id, as_of_date, spec_version, git_sha, f"n={row_count}", duration_ms),
    )


def ensure_m3_specs(
    cur,
    instrument_id: str,
    spec_version: str,
    thetas: dict[int, float],
    burn_in: int,
    rel_tier: str,
) -> None:
    for h_val, th_val in thetas.items():
        cur.execute(
            """
            INSERT INTO model_specs (instrument_id, target, horizon, spec_version, theta, burn_in, reliability)
            VALUES (%s, 'M3', %s, %s, %s, %s, %s)
            ON CONFLICT (instrument_id, target, horizon, spec_version) DO NOTHING
            """,
            (instrument_id, h_val, spec_version, th_val, burn_in, rel_tier),
        )


def upsert_forecast_origin(
    cur,
    instrument_id: str,
    origin_date: str,
    spec_version: str,
    git_sha: str,
    data_window: str,
    run_status: str,
    duration_ms: int,
    res_by_h: dict[int, dict[str, Any]],
) -> int:
    cur.execute(
        """
        INSERT INTO forecast_runs (instrument_id, as_of_date, spec_version, git_sha, data_window, status, duration_ms)
        VALUES (%s, %s::date, %s, %s, %s, %s, %s)
        ON CONFLICT (instrument_id, as_of_date, spec_version)
        DO UPDATE SET
            git_sha = EXCLUDED.git_sha,
            data_window = EXCLUDED.data_window,
            status = EXCLUDED.status,
            duration_ms = EXCLUDED.duration_ms,
            created_at = now()
        RETURNING id
        """,
        (instrument_id, origin_date, spec_version, git_sha, data_window, run_status, duration_ms),
    )
    run_id = cur.fetchone()[0]

    written = 0
    for h_val, h_data in res_by_h.items():
        cur.execute(
            """
            INSERT INTO forecasts (
                run_id, instrument_id, as_of_date, horizon,
                median, lower80, upper80, lower95, upper95,
                vol_daily, vol_annual, prob_correction,
                garch_params, empirical_q, path
            )
            VALUES (%s, %s, %s::date, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb)
            ON CONFLICT (instrument_id, as_of_date, horizon)
            DO UPDATE SET
                run_id = EXCLUDED.run_id,
                median = EXCLUDED.median,
                lower80 = EXCLUDED.lower80,
                upper80 = EXCLUDED.upper80,
                lower95 = EXCLUDED.lower95,
                upper95 = EXCLUDED.upper95,
                vol_daily = EXCLUDED.vol_daily,
                vol_annual = EXCLUDED.vol_annual,
                prob_correction = EXCLUDED.prob_correction,
                garch_params = EXCLUDED.garch_params,
                empirical_q = EXCLUDED.empirical_q,
                path = EXCLUDED.path
            """,
            (
                run_id,
                instrument_id,
                origin_date,
                h_val,
                h_data["median"],
                h_data["lower80"],
                h_data["upper80"],
                h_data["lower95"],
                h_data["upper95"],
                h_data["vol_daily"],
                h_data["vol_annual"],
                h_data["prob_correction"],
                json.dumps(h_data["garch_params"]),
                json.dumps(h_data["empirical_q"]),
                json.dumps(h_data["path"]),
            ),
        )
        written += 1
    return written
