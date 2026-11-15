export function MethodologyPage() {
  return (
    <section className="prose">
      <h1>Methodology & Limitations</h1>
      <p>
        KAIROS is an <strong>end-of-day risk monitor</strong>, not a directional price predictor and not buy/sell
        signals. It displays calibrated uncertainty ranges, volatility estimates, and correction probabilities
        computed after market close over 7- and 30-trading-day horizons.
      </p>

      <h2>Models & Empirical Walk-Forward Findings</h2>
      <ul>
        <li>
          <strong>M1 — Price midpoint & intervals (Random walk + empirical quantiles):</strong> The price midpoint
          stays at the last closing price. In leak-free walk-forward evaluation, ARIMA (rMAE ≈ 1, insignificant) and
          XGBoost (worse than naive) failed to beat the random-walk baseline. The 80% uncertainty range uses empirical
          trailing h-day return quantiles (750-day window), which achieved nominal 70%–90% coverage across TLKM, DCII,
          and GOTO (whereas GARCH-normal intervals failed on DCII).
        </li>
        <li>
          <strong>M2 — Volatility (GARCH-t vs. fallback):</strong> Time-varying GARCH-t passed QLIKE evaluation on
          TLKM (h=7 relative QLIKE vs. constant variance <code>rel_const = 0.877</code>; h=30 marginal{" "}
          <code>0.923</code>). On GOTO and DCII, constant long-run variance outperformed GARCH, so both tickers use
          long-run variance and carry a <em>low reliability / thin liquidity</em> badge. If GARCH fails to converge, the
          service falls back to EWMA/constant variance with a <code>degraded</code> status.
        </li>
        <li>
          <strong>M3 — Correction probability (Volatility-implied):</strong> Estimates the probability of a drawdown
          exceeding a frozen threshold <code>θ</code> (set via the <code>0.85 · σ_init · √h</code> rule), displayed
          alongside the trailing 252-day rolling base rate for context. On TLKM h=7, vol-implied M3 scored BSS +0.043
          (equivalent to supervised baselines without training complexity).
        </li>
        <li>
          <strong>Leak-free verification:</strong> Label-overlap embargo of h trading days is enforced on every origin,
          and permutation tests collapse to the naive baseline, confirming no data leakage.
        </li>
      </ul>

      <h2>Reading the Chart</h2>
      <ul>
        <li>
          <strong>Actual Close (EOD):</strong> Solid high-contrast line showing historical adjusted close prices.
        </li>
        <li>
          <strong>Walk-Forward (Backtest, Out-of-Sample):</strong> Dotted grey line showing past walk-forward medians
          plotted at their target dates.
        </li>
        <li>
          <strong>Forward Forecast & Bands:</strong> Solid blue median (flat random walk), dashed blue 80% empirical
          interval, and dotted amber 95% interval. Future x-axis dates skip weekends only; exchange holidays are not
          modeled.
        </li>
      </ul>

      <h2>Known Limitations</h2>
      <ul>
        <li>Small effective sample size (~35 to 55 non-overlapping 30-day windows per ticker).</li>
        <li>Non-stationary historical correction base rates across market regimes.</li>
        <li>GOTO price plateau (95 consecutive zero-return days ending 2026-09-25) renders GOTO metrics unreliable.</li>
        <li>DCII exhibits thin liquidity with 15.3% non-traded days (zero volume retained with <code>is_traded</code> flag).</li>
        <li>Suspected survivorship bias in historical Kaggle benchmark datasets.</li>
        <li>Future dividends are not reflected in historical adjusted closing prices.</li>
        <li>
          <code>^JKSE</code> index features originate from the same Yahoo Finance provider and have not been
          independently verified.
        </li>
      </ul>

      <h2>Data Provenance</h2>
      <p>
        Daily prices are fetched from Yahoo Finance via <code>yfinance</code> (<code>auto_adjust=False</code>), with 8
        audited zero-volume days repaired from Kaggle historical data and current-day partial candles dropped.
      </p>
    </section>
  );
}
