"""Pure data validation and Kaggle repair rules for canonical price series (ADR-013, SR-02)."""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

# Audited Kaggle repair records for erroneous yfinance zero-volume days (ADR-013 / SR-02).
KAGGLE_REPAIRS: dict[str, dict[str, dict[str, float | int]]] = {
    "IDX:TLKM": {
        "2020-03-13": {"first_trade": 0.0, "high": 3490.0, "low": 3080.0, "close": 3390.0, "volume": 172248400},
    },
    "IDX:GOTO": {
        "2024-01-15": {"first_trade": 91.0, "high": 92.0, "low": 90.0, "close": 92.0, "volume": 1514483800},
        "2024-03-25": {"first_trade": 69.0, "high": 69.0, "low": 67.0, "close": 69.0, "volume": 1659401900},
        "2024-03-26": {"first_trade": 69.0, "high": 71.0, "low": 68.0, "close": 70.0, "volume": 2963091300},
    },
    "IDX:DCII": {
        "2022-03-14": {"first_trade": 0.0, "high": 44000.0, "low": 43400.0, "close": 44000.0, "volume": 5500},
        "2024-01-15": {"first_trade": 0.0, "high": 40000.0, "low": 39950.0, "close": 39950.0, "volume": 1300},
        "2024-03-25": {"first_trade": 0.0, "high": 35825.0, "low": 35800.0, "close": 35800.0, "volume": 500},
        "2024-03-26": {"first_trade": 0.0, "high": 35600.0, "low": 35475.0, "close": 35500.0, "volume": 1700},
    },
}


def validate_and_repair(
    raw_df: pd.DataFrame,
    instrument_id: str,
    currency: str = "IDR",
    reliability_tier: str = "full",
    cutoff_date: str | None = None,
) -> tuple[pd.DataFrame, int, list[dict[str, Any]]]:
    """Convert raw yfinance OHLCV DataFrame to canonical schema v2 with Kaggle repairs & validation."""
    if raw_df is None or raw_df.empty:
        return pd.DataFrame(), 0, []

    df = raw_df.copy()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df.index = pd.to_datetime(df.index).tz_localize(None)
    df = df.sort_index()

    # Drop current-day unfinalized candle (ADR-005 / ADR-013: deterministic as_of_date = D-1)
    if cutoff_date:
        df = df[df.index < pd.Timestamp(cutoff_date)]

    if df.empty:
        return pd.DataFrame(), 0, []

    df["source"] = "yfinance"
    repairs_map = KAGGLE_REPAIRS.get(instrument_id, {})
    repair_count = 0

    for dt_str, k_rec in repairs_map.items():
        ts = pd.Timestamp(dt_str)
        if ts in df.index and int(df.at[ts, "Volume"]) == 0:
            adj_factor = float(df.at[ts, "Adj Close"]) / float(df.at[ts, "Close"])
            open_val = float(k_rec["first_trade"]) if float(k_rec["first_trade"]) > 0 else np.nan
            df.loc[ts, ["Open", "High", "Low", "Close", "Volume"]] = [
                open_val,
                float(k_rec["high"]),
                float(k_rec["low"]),
                float(k_rec["close"]),
                int(k_rec["volume"]),
            ]
            df.at[ts, "Adj Close"] = float(k_rec["close"]) * adj_factor
            df.at[ts, "source"] = "kaggle_repair"
            repair_count += 1

    # Fill missing Open from previous Close (ADR-013)
    df["Open"] = df["Open"].replace(0, np.nan).fillna(df["Close"].shift(1)).fillna(df["Close"])

    can = df.rename(
        columns={
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
            "Adj Close": "adj_close",
            "Volume": "volume",
        }
    )[["open", "high", "low", "close", "adj_close", "volume", "source"]].copy()

    can.index.name = "trade_date"
    can = can.reset_index()
    can["instrument_id"] = instrument_id
    can["currency"] = currency
    can["volume"] = can["volume"].astype(np.int64)
    can["is_traded"] = can["volume"] > 0
    can["adj_factor"] = can["adj_close"] / can["close"]

    # Validate OHLC bounds (drop corrupt rows)
    valid_mask = (
        (can["low"] <= can["high"] + 1e-6)
        & (can["close"] <= can["high"] + 1e-6)
        & (can["close"] >= can["low"] - 1e-6)
        & can["close"].notna()
        & can["adj_close"].notna()
    )
    warnings: list[dict[str, Any]] = []
    invalid_count = int((~valid_mask).sum())
    if invalid_count > 0:
        warnings.append({"instrument_id": instrument_id, "type": "invalid_ohlc_dropped", "count": invalid_count})
        can = can[valid_mask].copy()

    # Post-May 2024 zero-volume warning on liquid ('full' tier) stocks (ADR-013)
    if reliability_tier == "full":
        post_kaggle_vol0 = can[(can["trade_date"] > pd.Timestamp("2024-05-16")) & (~can["is_traded"])]
        for _, r in post_kaggle_vol0.iterrows():
            warnings.append(
                {
                    "instrument_id": instrument_id,
                    "type": "post_2024_zero_volume",
                    "trade_date": pd.Timestamp(r["trade_date"]).strftime("%Y-%m-%d"),
                }
            )

    return can, repair_count, warnings
