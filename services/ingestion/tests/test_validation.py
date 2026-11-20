"""Unit tests for ingestion validation and Kaggle repair rules (ADR-013, SR-02)."""
from __future__ import annotations

from pathlib import Path
import sys
import unittest

import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "services" / "ingestion" / "src"))

from kairos_ingestion.ingest import validate_and_repair  # noqa: E402


class IngestionValidationTest(unittest.TestCase):
    def test_kaggle_repair_and_current_day_drop(self) -> None:
        dates = pd.to_datetime(["2020-03-12", "2020-03-13", "2026-11-15"])
        raw = pd.DataFrame(
            {
                "Open": [3400.0, 3310.0, 2050.0],
                "High": [3450.0, 3310.0, 2060.0],
                "Low": [3300.0, 3310.0, 2040.0],
                "Close": [3310.0, 3310.0, 2050.0],
                "Adj Close": [2242.15428, 2242.15428, 2050.0],
                "Volume": [100000000, 0, 50000000],
            },
            index=dates,
        )
        can, repairs, warnings = validate_and_repair(
            raw,
            instrument_id="IDX:TLKM",
            currency="IDR",
            reliability_tier="full",
            cutoff_date="2026-11-15",
        )
        # Current-day candle (2026-11-15) must be dropped
        self.assertEqual(len(can), 2)
        self.assertEqual(repairs, 1)
        self.assertEqual(len(warnings), 0)

        repaired_row = can[can["trade_date"] == pd.Timestamp("2020-03-13")].iloc[0]
        self.assertEqual(repaired_row["source"], "kaggle_repair")
        self.assertEqual(repaired_row["close"], 3390.0)
        self.assertEqual(repaired_row["open"], 3310.0)  # First Trade=0 filled from previous Close
        self.assertTrue(bool(repaired_row["is_traded"]))
        self.assertAlmostEqual(repaired_row["adj_close"], 3390.0 * (2242.15428 / 3310.0), places=5)

    def test_post_2024_zero_volume_warning_and_is_traded_flag(self) -> None:
        dates = pd.to_datetime(["2025-02-10", "2025-02-11"])
        raw = pd.DataFrame(
            {
                "Open": [2500.0, 2500.0],
                "High": [2550.0, 2500.0],
                "Low": [2480.0, 2500.0],
                "Close": [2500.0, 2500.0],
                "Adj Close": [2500.0, 2500.0],
                "Volume": [80000000, 0],
            },
            index=dates,
        )
        can, repairs, warnings = validate_and_repair(
            raw,
            instrument_id="IDX:TLKM",
            currency="IDR",
            reliability_tier="full",
            cutoff_date="2026-11-15",
        )
        self.assertEqual(repairs, 0)
        self.assertEqual(len(can), 2)
        self.assertFalse(bool(can.iloc[1]["is_traded"]))
        self.assertEqual(len(warnings), 1)
        self.assertEqual(warnings[0]["type"], "post_2024_zero_volume")


if __name__ == "__main__":
    unittest.main()
