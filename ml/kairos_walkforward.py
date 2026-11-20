import numpy as np, pandas as pd, warnings, xgboost as xgb
from arch import arch_model
from statsmodels.tsa.arima.model import ARIMA
from scipy.stats import norm
from sklearn.metrics import roc_auc_score
warnings.filterwarnings("ignore")

BURN = {"TLKM": 0, "GOTO": 120, "DCII": 120}   # burn-in for recently-IPO'd stocks
INIT, STEP, HS, S0 = 500, 10, (7, 30), 60
ORDERS = [(1, 0, 0), (2, 0, 0), (1, 0, 1)]
GRID = [0.03, 0.05, 0.07, 0.10, 0.15, 0.20, 0.25]
Z80 = 1.2816

def feats(r, jr):
    s, j = pd.Series(r), pd.Series(jr)
    cs = s.cumsum()
    return pd.DataFrame({
        "r0": s, "r1": s.shift(1), "r2": s.shift(2), "r4": s.shift(4),
        "mom5": s.rolling(5).sum(), "mom20": s.rolling(20).sum(),
        "vol5": s.rolling(5).std(), "vol20": s.rolling(20).std(), "vol60": s.rolling(60).std(),
        "absr5": s.abs().rolling(5).mean(),
        "ewma": np.sqrt((s**2).ewm(alpha=0.06, adjust=False).mean()),
        "dd60": cs - cs.rolling(60).max(),
        "j0": j, "j5": j.rolling(5).sum(), "jvol20": j.rolling(20).std()}).values

def labels(r, h):
    N = len(r); cs = np.concatenate([[0], np.cumsum(r)]); c2 = np.concatenate([[0], np.cumsum(r**2)])
    y1, rv, mdd = (np.full(N, np.nan) for _ in range(3))
    for s in range(N - h):                      # label for row s uses r[s+1 .. s+h]
        y1[s] = cs[s+h+1] - cs[s+1]
        rv[s] = (c2[s+h+1] - c2[s+1]) / h
        mdd[s] = np.min(cs[s+2:s+h+2] - cs[s+1])  # deepest cumulative drawdown (close-to-close)
    return y1, rv, mdd

def snap(x):
    return min(GRID, key=lambda g: abs(g - x))

def ewma_var(x, lam=0.94):
    v = np.var(x[:20])
    for e in x: v = lam*v + (1-lam)*e*e
    return v

def classics(x, hmax):
    o = {}
    try:
        res = arch_model(x*100, mean="Zero", vol="GARCH", p=1, q=1, dist="t").fit(disp="off", show_warning=False)
        o["gv"] = res.forecast(horizon=hmax, reindex=False).variance.values[-1] / 1e4; o["g_ok"] = 1
    except Exception:
        o["gv"] = np.full(hmax, ewma_var(x)); o["g_ok"] = 0
    best = None
    for od in ORDERS:
        try:
            f = ARIMA(x*100, order=od, trend="n").fit()
            if best is None or f.aic < best[0]: best = (f.aic, f, od)
        except Exception: pass
    o["acum"] = np.cumsum(best[1].forecast(hmax)/100) if best else np.zeros(hmax)
    o["order"] = str(best[2]) if best else "none"
    return o

def xgb_r():
    return xgb.XGBRegressor(n_estimators=150, max_depth=3, learning_rate=0.03, subsample=0.8,
                            colsample_bytree=0.8, min_child_weight=10, random_state=0, verbosity=0, n_jobs=2)

def xgb_c():
    return xgb.XGBClassifier(n_estimators=150, max_depth=3, learning_rate=0.03, subsample=0.8,
                             colsample_bytree=0.8, min_child_weight=10, random_state=0, verbosity=0, n_jobs=2)

def walk(t, r, jr, idx, step=STEP):
    N = len(r); F = feats(r, jr)
    L = {h: labels(r, h) for h in HS}
    sd0 = r[:INIT].std()
    THR = {h: snap(0.85 * sd0 * np.sqrt(h)) for h in HS}      # a priori M3 threshold from the first 500 days
    rows = []
    for i in range(INIT-1, N-1-min(HS), step):
        x = r[:i+1]; c = classics(x, max(HS)); ev = ewma_var(x)
        for h in HS:
            if i + h > N - 1: continue
            y1, rv, mdd = L[h]
            tr = np.arange(S0, i - h + 1)                      # STRICT EMBARGO: s <= i - h
            tr = tr[~np.isnan(F[tr]).any(1) & ~np.isnan(y1[tr])]
            Xtr, Xte = F[tr], F[i:i+1]
            gvar = c["gv"][:h].mean()
            row = dict(ticker=t, h=h, date=idx[i], y1=y1[i], rv=rv[i], mdd=mdd[i], thr=THR[h],
                       a_hat=c["acum"][h-1], v_roll_h=np.mean(x[-h:]**2), v_roll20=np.mean(x[-20:]**2),
                       v_ewma=ev, v_const=np.mean(x**2), v_garch=gvar, g_ok=c["g_ok"], order=c["order"])
            # Leak-free empirical interval (only s <= i-h)
            hist = y1[np.arange(0, i-h+1)][-750:]; hc = hist - hist.mean()
            row["q10"], row["q90"] = np.quantile(hc, .1), np.quantile(hc, .9)
            # M3: label, training base rate, vol-implied
            ytr3 = (mdd[tr] <= np.log(1 - THR[h])).astype(int)
            row["y3"] = int(mdd[i] <= np.log(1 - THR[h])); row["p_base"] = ytr3.mean()
            sg = np.sqrt(gvar); b = np.log(1 - THR[h]) - 0.5826*sg
            row["p_vol"] = min(1.0, 2*norm.cdf(b / (sg*np.sqrt(h))))
            # XGBoost (with embargo)
            row["x_y1"] = xgb_r().fit(Xtr, y1[tr]).predict(Xte)[0]
            ly = np.log(np.maximum(rv[tr], 1e-6)); m2 = xgb_r().fit(Xtr, ly)
            row["x_rv"] = np.exp(m2.predict(Xte)[0]) * np.mean(np.exp(ly - m2.predict(Xtr)))
            row["x_p3"] = xgb_c().fit(Xtr, ytr3).predict_proba(Xte)[0, 1] if 0 < ytr3.mean() < 1 else ytr3.mean()
            rows.append(row)
    return pd.DataFrame(rows)

def qlike(rv, f):
    a, b = np.maximum(rv, 1e-6), np.maximum(f, 1e-6)
    return a/b - np.log(a/b) - 1

def cmp(lm, lb, yrs):
    d = pd.DataFrame({"y": yrs, "m": lm, "b": lb}).groupby("y").mean()
    return dict(win_origin=np.mean(lm < lb), years_won=f"{int((d.m < d.b).sum())}/{len(d)}")

def report(R):
    o1, o2, o3, o4 = [], [], [], []
    for (t, h), g in R.groupby(["ticker", "h"]):
        yrs = g.date.dt.year.values; y = g.y1.values; ab = np.abs(y)
        for nm, p in [("ARIMA", g.a_hat.values), ("XGB", g.x_y1.values)]:
            e = np.abs(y - p); nz = y != 0
            o1.append(dict(ticker=t, h=h, model=nm, n=len(y), MAE_naive0=ab.mean(), MAE=e.mean(), rMAE=e.mean()/ab.mean(),
                           dir_acc=np.mean(np.sign(p[nz]) == np.sign(y[nz])), base_up=np.mean(y[nz] > 0),
                           **cmp(e, ab, yrs)))
        for nm, lo, hi in [("naive+empirical", g.q10.values, g.q90.values),
                           ("naive+GARCH", -Z80*np.sqrt(g.v_garch*h), Z80*np.sqrt(g.v_garch*h))]:
            o4.append(dict(ticker=t, h=h, interval=nm, coverage80=np.mean((y >= lo) & (y <= hi)), width=np.mean(hi-lo)))
        rv = g.rv.values; qb = qlike(rv, g.v_roll_h.values); qc = qlike(rv, g.v_const.values)
        for nm, col in [("naive_roll_h", "v_roll_h"), ("const_var", "v_const"), ("roll20", "v_roll20"), ("EWMA", "v_ewma"), ("GARCH", "v_garch"), ("XGB", "x_rv")]:
            q = qlike(rv, g[col].values)
            o2.append(dict(ticker=t, h=h, model=nm, n=len(rv), QLIKE=q.mean(), rel_const=q.mean()/qc.mean(),
                           **(cmp(q, qb, yrs) if nm != "naive_roll_h" else {})))
        y3 = g.y3.values; bb = (g.p_base.values - y3)**2
        for nm, col in [("base_rate", "p_base"), ("vol_implied", "p_vol"), ("XGB", "x_p3")]:
            p = g[col].values; br = (p - y3)**2
            auc = roc_auc_score(y3, p) if 0 < y3.mean() < 1 and nm != "base_rate" else np.nan
            o3.append(dict(ticker=t, h=h, model=nm, thr=g.thr.iloc[0], n=len(y3), event_rate=y3.mean(), Brier=br.mean(),
                           BSS=1 - br.mean()/bb.mean(), AUC=auc, **(cmp(br, bb, yrs) if nm != "base_rate" else {})))
    f = lambda d: print(pd.DataFrame(d).round(4).to_string(index=False))
    print("\n== M1 (h-day cumulative return; rMAE<1 = better than naive zero) =="); f(o1)
    print("\n== M1 interval (nominal 80%) =="); f(o4)
    print("\n== M2 (QLIKE on h-day realized variance; win_* vs naive_roll_h; rel_const<1 = better than constant variance) =="); f(o2)
    print("\n== M3 (Brier skill vs base rate; BSS>0 = better) =="); f(o3)
    print("\nGARCH failed to converge:", int((R.g_ok == 0).sum()), "of", len(R), "| ARIMA order:", R["order"].value_counts().to_dict())
