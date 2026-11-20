"""KAIROS ml-service forecasting procedures (M1 empirical, M2 GARCH-t/const, M3 vol-implied).

Separate copy from ml/kairos_walkforward.py per AGENTS.md & ADR-001/ADR-011/ADR-014.
Consistency with the research walk-forward implementation is enforced via golden tests.
"""
from __future__ import annotations

from typing import Any

import numpy as np
from scipy.stats import norm

try:
    from arch import arch_model
except ImportError:  # pragma: no cover - fallback only if arch is absent in minimal test env
    arch_model = None

BURN: dict[str, int] = {"IDX:TLKM": 0, "IDX:GOTO": 120, "IDX:DCII": 120, "TLKM": 0, "GOTO": 120, "DCII": 120}
INIT: int = 500
STEP: int = 10
HS: tuple[int, ...] = (7, 30)
S0: int = 60
GRID: list[float] = [0.03, 0.05, 0.07, 0.10, 0.15, 0.20, 0.25]
EMPIRICAL_WINDOW: int = 750
TRADING_DAYS_YEAR: int = 245
BARRIER_BETA: float = 0.5826


def snap(x: float) -> float:
    return min(GRID, key=lambda g: abs(g - x))


def default_thetas(r: np.ndarray, horizons: tuple[int, ...] = HS) -> dict[int, float]:
    sd0 = float(np.asarray(r[:INIT], dtype=float).std())
    return {h: snap(0.85 * sd0 * np.sqrt(h)) for h in horizons}


def labels(r: np.ndarray, h: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute h-day cumulative log-return, mean realized variance, and deepest drawdown.

    For row s in 0 .. len(r) - h - 1, uses strictly r[s+1 .. s+h].
    Passing x = r[:i+1] therefore guarantees strict h-day embargo (s <= i - h).
    """
    n = len(r)
    cs = np.concatenate([[0.0], np.cumsum(r)])
    c2 = np.concatenate([[0.0], np.cumsum(r**2)])
    y1, rv, mdd = (np.full(n, np.nan) for _ in range(3))
    for s in range(n - h):
        y1[s] = cs[s + h + 1] - cs[s + 1]
        rv[s] = (c2[s + h + 1] - c2[s + 1]) / h
        mdd[s] = np.min(cs[s + 2 : s + h + 2] - cs[s + 1])
    return y1, rv, mdd


def ewma_var(x: np.ndarray, lam: float = 0.94) -> float:
    v = float(np.var(x[:20]))
    for e in x:
        v = lam * v + (1.0 - lam) * float(e) * float(e)
    return v


def fit_garch(x: np.ndarray, hmax: int) -> dict[str, Any]:
    """Fit zero-mean GARCH(1,1)-t on percentage returns; fallback to EWMA variance on failure."""
    if arch_model is not None:
        try:
            res = arch_model(x * 100.0, mean="Zero", vol="GARCH", p=1, q=1, dist="t").fit(
                disp="off", show_warning=False
            )
            gv = res.forecast(horizon=hmax, reindex=False).variance.values[-1] / 1e4
            params = {k: float(v) for k, v in res.params.items()}
            return {"gv": gv, "g_ok": 1, "params": params}
        except Exception:
            pass
    ev = ewma_var(x)
    return {"gv": np.full(hmax, ev), "g_ok": 0, "params": {"fallback": "ewma", "ewma_var": ev}}


def _quantile_path(x: np.ndarray, last_price: float, h: int) -> list[dict[str, float | int]]:
    """Compute leak-free empirical quantile path k=1..h from historical k-day returns."""
    n = len(x)
    cs = np.concatenate([[0.0], np.cumsum(x)])
    path: list[dict[str, float | int]] = []
    for k in range(1, h + 1):
        # Strictly embargoed k-day returns: s in 0 .. n - k - 1 (uses x[1 .. n-1])
        hist_k = (cs[1 + k : n + 1] - cs[1 : n + 1 - k])[-EMPIRICAL_WINDOW:]
        hc_k = hist_k - hist_k.mean()
        q10, q90 = float(np.quantile(hc_k, 0.10)), float(np.quantile(hc_k, 0.90))
        q025, q975 = float(np.quantile(hc_k, 0.025)), float(np.quantile(hc_k, 0.975))
        path.append(
            {
                "step": k,
                "median": float(last_price),
                "lower80": float(last_price * np.exp(q10)),
                "upper80": float(last_price * np.exp(q90)),
                "lower95": float(last_price * np.exp(q025)),
                "upper95": float(last_price * np.exp(q975)),
            }
        )
    return path


def fit_origin(
    x: np.ndarray,
    last_price: float,
    horizons: tuple[int, ...] = HS,
    thetas: dict[int, float] | None = None,
    reliability_tier: str = "full",
    include_path: bool = True,
) -> dict[int, dict[str, Any]]:
    """Compute M1, M2, M3 forecasts for a single origin given returns x = r[:i+1] up to as_of_date."""
    x = np.asarray(x, dtype=float)
    if len(x) < INIT:
        raise ValueError(f"insufficient history: got {len(x)} returns, need at least {INIT}")

    if thetas is None:
        thetas = default_thetas(x, horizons)

    hmax = max(horizons)
    garch_out = fit_garch(x, hmax)
    ev = ewma_var(x)
    v_const = float(np.mean(x**2))

    results: dict[int, dict[str, Any]] = {}
    for h in horizons:
        y1, rv, mdd = labels(x, h)
        embargo_len = len(x) - h  # s in 0 .. i - h

        # M1: random walk midpoint + centered empirical quantiles (last 750 embargoed h-day returns)
        hist = y1[:embargo_len][-EMPIRICAL_WINDOW:]
        hc = hist - hist.mean()
        q10, q90 = float(np.quantile(hc, 0.10)), float(np.quantile(hc, 0.90))
        q025, q975 = float(np.quantile(hc, 0.025)), float(np.quantile(hc, 0.975))

        # M2: GARCH-t mean h-day variance for full tier; long-run variance for low reliability tier (ADR-014)
        gvar = float(garch_out["gv"][:h].mean())
        g_ok = int(garch_out["g_ok"])
        if reliability_tier == "low":
            active_var = v_const
            status = "degraded"
        else:
            active_var = gvar
            status = "ok" if g_ok == 1 else "degraded"

        vol_daily = float(np.sqrt(max(active_var, 1e-12)))
        vol_annual = float(vol_daily * np.sqrt(TRADING_DAYS_YEAR))

        rv_hist = np.maximum(rv[:embargo_len][-EMPIRICAL_WINDOW:], 1e-12)
        hist_ann_vol = np.sqrt(rv_hist * TRADING_DAYS_YEAR)
        vol_lower = float(np.quantile(hist_ann_vol, 0.10))
        vol_upper = float(np.quantile(hist_ann_vol, 0.90))

        # M3: vol-implied correction probability (reflection principle + discrete barrier correction)
        thr = float(thetas[h])
        tr = np.arange(S0, embargo_len)
        ytr3 = (mdd[tr] <= np.log(1.0 - thr)).astype(int)
        p_base = float(ytr3.mean()) if len(ytr3) > 0 else 0.0

        sg = float(np.sqrt(max(gvar, 1e-12)))
        b = float(np.log(1.0 - thr) - BARRIER_BETA * sg)
        p_vol = float(min(1.0, 2.0 * norm.cdf(b / (sg * np.sqrt(h)))))

        path = _quantile_path(x, last_price, h) if include_path else []

        results[h] = {
            "horizon": h,
            "status": status,
            "reliability_tier": reliability_tier,
            "last_price": float(last_price),
            "median": float(last_price),
            "lower80": float(last_price * np.exp(q10)),
            "upper80": float(last_price * np.exp(q90)),
            "lower95": float(last_price * np.exp(q025)),
            "upper95": float(last_price * np.exp(q975)),
            "q10": q10,
            "q90": q90,
            "q025": q025,
            "q975": q975,
            "v_garch": gvar,
            "v_const": v_const,
            "v_ewma": ev,
            "g_ok": g_ok,
            "vol_daily": vol_daily,
            "vol_annual": vol_annual,
            "vol_lower": vol_lower,
            "vol_upper": vol_upper,
            "theta": thr,
            "prob_correction": p_vol,
            "rolling_base_rate": p_base,
            "garch_params": {
                **garch_out["params"],
                "g_ok": g_ok,
                "v_garch": gvar,
                "v_const": v_const,
                "v_ewma": ev,
                "vol_lower": vol_lower,
                "vol_upper": vol_upper,
            },
            "empirical_q": {
                "q10": q10,
                "q90": q90,
                "q025": q025,
                "q975": q975,
                "theta": thr,
                "rolling_base_rate": p_base,
                "last_price": float(last_price),
            },
            "path": path,
        }
    return results
