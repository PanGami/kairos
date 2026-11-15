export function MethodologyPage() {
  return (
    <section className="prose">
      <h1>Methodology</h1>
      <p>
        KAIROS is an <strong>end-of-day risk monitor</strong>. It estimates how uncertain the next 7 and 30 trading
        days may be. It does not predict direction and does not issue buy/sell signals.
      </p>
      <h2>Models</h2>
      <ul>
        <li>
          <strong>M1 — Random walk:</strong> the median stays at the last close; the range is derived from
          historical return dispersion.
        </li>
        <li>
          <strong>M2 — GARCH-t:</strong> time-varying volatility with heavy-tailed returns, used for the 80% and
          95% ranges and the annualized volatility. If the fit fails, the service falls back and marks the status as
          degraded.
        </li>
        <li>
          <strong>M3 — Volatility-implied drawdown probability:</strong> the probability of a drawdown beyond a
          fixed threshold θ, shown next to the rolling historical base rate for context.
        </li>
      </ul>
      <h2>Reading the chart</h2>
      <ul>
        <li>Solid dark line: actual closing price.</li>
        <li>Dotted grey line: median of past walk-forward forecasts, plotted at their target dates.</li>
        <li>Blue lines: forecast median and 80% range. Amber dotted lines: 95% range.</li>
        <li>Future dates skip weekends only; exchange holidays are not modeled in the chart.</li>
      </ul>
      <h2>Reliability</h2>
      <p>
        Instruments with short or irregular price history are labelled <em>low</em> or <em>insufficient</em>.
        Treat their ranges with extra caution.
      </p>
      <h2>Data</h2>
      <p>Daily prices from Yahoo Finance via yfinance, with audited repairs for known bad days. Updated after market close.</p>
    </section>
  );
}
