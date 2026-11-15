"""Mandatory golden test (ADR-001, ADR-011, SR-12):
Verifies that services/ml-service forecasting code (a separate copy from ml/)
produces identical outputs to the walk-forward reference implementation on canonical.parquet.
"""
from __future__ import annotations

from pathlib import Path
import sys
import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd
from scipy.stats import norm

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "services" / "ml-service" / "src"))

from kairos_ml import forecast as ml_forecast  # noqa: E402


def _ref_origin(r: np.ndarray, i: int, h: int, thr: float, gv: np.ndarray) -> dict[str, float]:
    """Reference formulas extracted verbatim from ml/kairos_walkforward.py."""
    n = len(r)
    cs = np.concatenate([[0.0], np.cumsum(r)])
    c2 = np.concatenate([[0.0], np.cumsum(r**2)])
    y1, rv, mdd = (np.full(n, np.nan) for _ in range(3))
    for s in range(n - h):
        y1[s] = cs[s + h + 1] - cs[s + 1]
        rv[s] = (c2[s + h + 1] - c2[s + 1]) / h
        mdd[s] = np.min(cs[s + 2 : s + h + 2] - cs[s + 1])

    x = r[: i + 1]
    ev = float(np.var(x[:20]))
    for e in x:
        ev = 0.94 * ev + 0.06 * float(e) * float(e)

    tr = np.arange(60, i - h + 1)
    gvar = float(gv[:h].mean())
    hist = y1[np.arange(0, i - h + 1)][-750:]
    hc = hist - hist.mean()
    q10, q90 = float(np.quantile(hc, 0.1)), float(np.quantile(hc, 0.9))

    ytr3 = (mdd[tr] <= np.log(1.0 - thr)).astype(int)
    p_base = float(ytr3.mean())
    sg = float(np.sqrt(gvar))
    b = float(np.log(1.0 - thr) - 0.5826 * sg)
    p_vol = float(min(1.0, 2.0 * norm.cdf(b / (sg * np.sqrt(h)))))

    return {
        "q10": q10,
        "q90": q90,
        "v_const": float(np.mean(x**2)),
        "v_ewma": ev,
        "v_garch": gvar,
        "p_base": p_base,
        "p_vol": p_vol,
    }


class GoldenForecastTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        parquet_path = ROOT / "data" / "canonical.parquet"
        if parquet_path.exists():
            cls.df = pd.read_parquet(parquet_path)
        else:
            # Deterministic synthetic fixture if data/ is absent in CI
            rng = np.random.default_rng(42)
            dates = pd.bdate_range("2020-01-02", periods=900)
            frames = []
            for inst, p0 in [("IDX:TLKM", 3000.0), ("IDX:GOTO", 100.0), ("IDX:DCII", 40000.0)]:
                rets = rng.normal(0.0, 0.02, size=len(dates))
                close = p0 * np.exp(np.cumsum(rets))
                frames.append(
                    pd.DataFrame(
                        {
                            "instrument_id": inst,
                            "trade_date": dates,
                            "open": close,
                            "high": close * 1.01,
                            "low": close * 0.99,
                            "close": close,
                            "adj_close": close,
                            "volume": 100000,
                            "currency": "IDR",
                            "source": "yfinance",
                            "is_traded": True,
                            "adj_factor": 1.0,
                        }
                    )
                )
            cls.df = pd.concat(frames, ignore_index=True)

    def test_golden_parity_across_tickers_and_horizons(self) -> None:
        expected_thetas = {
            "IDX:TLKM": {7: 0.05, 30: 0.10},
            "IDX:GOTO": {7: 0.10, 30: 0.20},
            "IDX:DCII": {7: 0.05, 30: 0.10},
        }
        for inst in ("IDX:TLKM", "IDX:GOTO", "IDX:DCII"):
            sub = self.df[self.df["instrument_id"] == inst].sort_values("trade_date")
            burn = ml_forecast.BURN[inst]
            sub = sub.iloc[burn:]
            r = np.log(sub["adj_close"]).diff().dropna().values
            prices = sub["adj_close"].iloc[1:].values

            thetas = ml_forecast.default_thetas(r)
            if (ROOT / "data" / "canonical.parquet").exists():
                self.assertEqual(thetas, expected_thetas[inst])

            # Test origins at start of walk-forward, midpoint, and latest
            origins = [ml_forecast.INIT - 1, (ml_forecast.INIT - 1 + len(r) - 31) // 2, len(r) - 31]
            for i in origins:
                x = r[: i + 1]
                last_price = float(prices[i])
                tier = "full" if inst == "IDX:TLKM" else "low"
                out = ml_forecast.fit_origin(x, last_price, thetas=thetas, reliability_tier=tier)
                garch_out = ml_forecast.fit_garch(x, 30)

                for h in (7, 30):
                    ref = _ref_origin(r, i, h, thetas[h], garch_out["gv"])
                    got = out[h]
                    self.assertAlmostEqual(got["q10"], ref["q10"], places=10)
                    self.assertAlmostEqual(got["q90"], ref["q90"], places=10)
                    self.assertAlmostEqual(got["v_const"], ref["v_const"], places=10)
                    self.assertAlmostEqual(got["v_ewma"], ref["v_ewma"], places=10)
                    self.assertAlmostEqual(got["v_garch"], ref["v_garch"], places=10)
                    self.assertAlmostEqual(got["rolling_base_rate"], ref["p_base"], places=10)
                    self.assertAlmostEqual(got["prob_correction"], ref["p_vol"], places=10)
                    # Endpoint of quantile path k=h must match horizon quantiles
                    self.assertEqual(len(got["path"]), h)
                    self.assertAlmostEqual(got["path"][-1]["lower80"], got["lower80"], places=8)
                    self.assertAlmostEqual(got["path"][-1]["upper80"], got["upper80"], places=8)

    def test_reliability_and_garch_fallback_status(self) -> None:
        rng = np.random.default_rng(7)
        x = rng.normal(0.0, 0.02, size=600)
        # Simulate GARCH convergence for full tier -> status 'ok', vol_daily = sqrt(v_garch)
        fake_gv = np.full(30, 0.0004)
        with patch.object(ml_forecast, "fit_garch", return_value={"gv": fake_gv, "g_ok": 1, "params": {"omega": 0.1}}):
            full_res = ml_forecast.fit_origin(x, 2000.0, reliability_tier="full", include_path=False)
            self.assertEqual(full_res[7]["status"], "ok")
            self.assertAlmostEqual(full_res[7]["vol_daily"], 0.02, places=8)

            # Low reliability tier (GOTO/DCII) uses long-run variance v_const + degraded status
            low_res = ml_forecast.fit_origin(x, 2000.0, reliability_tier="low", include_path=False)
            self.assertEqual(low_res[7]["status"], "degraded")
            self.assertAlmostEqual(low_res[7]["vol_daily"], float(np.sqrt(np.mean(x**2))), places=8)


if __name__ == "__main__":
    unittest.main()
