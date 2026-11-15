# KAIROS: Product Requirements Document (PRD)

Document version: 1.0 (November 13, 2026)
Status: Draft for approval. Companion document: `docs/adr/ADR.md` (architecture and model decisions).

Conventions: priorities use **[MVP MANDATORY]**, **[MVP IF TIME PERMITS]**, **[V1.x]**, **[V2+]**. Measured facts are distinguished from hypotheses. Assumptions are stated explicitly.

---

## 1. Executive Summary

**Name:** KAIROS
**Title:** KAIROS: A Market Intelligence & Volatility Forecasting Platform
**Subtitle:** Case Study: IDX Digital Infrastructure Equities (TLKM, GOTO, DCII)
**Original brief title (displayed on opening slide):** Web-App for Volatility and Price Trend Prediction of IDX Digital Infrastructure Sector Stocks Using Time-Series Forecasting.

KAIROS is a web dashboard displaying calibrated uncertainty estimates for three IDX digital infrastructure equities over 7- and 30-day horizons: price ranges, volatility, and correction probability. It uses daily end-of-day data. Forecasts are computed once after market close and stored, rather than computed on the fly when a user opens the page.

**Product positioning (grounded in walk-forward findings, not initial claims):** KAIROS is a **risk monitor with calibrated uncertainty estimates**, not a directional price predictor. The price midpoint is a random walk (last closing price) surrounded by empirical intervals. Its primary value lies in volatility forecasting and correction probability estimation.

**Not investment advice and not buy/sell signals.**

Naming note: evaluation of trademark/domain conflicts, global pronunciation, tagline, and whether the "Market Intelligence" label is sufficiently substantiated by MVP features is deferred to Phase 2. Until substantiated, "enterprise" claims are avoided unless auth/RBAC/audit logs/observability are genuinely implemented.

## 2. Background and Objectives

**Sponsor:** Vinix (individual portfolio assignment). **Evaluator:** senior data scientist mentor with 10+ years of experience. The focus is on building with methodological integrity rather than flashy claims. Core scope is fixed.

**Product objectives:**
1. Fulfill all acceptance criteria from the project brief (section 8).
2. Demonstrate honest time-series methodology: leak-free walk-forward evaluation, success criteria defined before viewing results, and transparent reporting of negative findings.
3. Demonstrate end-to-end engineering: Go gateway, Python ml-service via gRPC, PostgreSQL, Redis, Docker Compose, Azure cloud deployment with HTTPS, and CI/CD.
4. Serve as an open-source portfolio piece targeting mid-to-senior Fullstack AI Engineer roles globally.

**Personal objectives (not product features):** learning Azure cloud infrastructure from scratch, practicing spec-driven development with AI coding agents.

## 3. Non-Goals

- Not buy/sell signals, position sizing advice, stop-loss recommendations, or an automated trading agent.
- Not real-time or intraday data. Live prices are for comparison only in V2+ and never serve as model inputs.
- Makes no claims of directional price certainty. Never states "random walk is proven", "GARCH is guaranteed to fit", or displays unadjusted price peaks as adjusted levels.
- No user accounts, personal watchlists, alerts, or payment processing in the MVP.
- No monetization. Global expansion is strictly a technical feasibility study.
- Does not use LSTM unless justified by the data (currently not justified).

## 4. Users and Scenarios (Assumptions, Detailed in UI/UX Scope)

| User | Need | Primary Scenario |
| --- | --- | --- |
| Evaluator/mentor | Verify methodological rigor and brief completeness | Selects tickers, inspects charts and metric cards, reviews limitations, inspects repo and documentation |
| Recruiter/engineer | Assess engineering quality | Opens live demo, reads README, architecture diagrams, ADRs, and CI/CD pipelines |
| General equity-curious visitor | Understand risk rather than chase trading signals | Views volatility and correction probabilities with historical context and disclaimers |

MVP user behavior is strictly **read-only**: no user input is persisted and no user action triggers model computation. Public dashboard without login (ADR-012).

## 5. MVP Scope (V1)

### 5.1 User Features

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-01 | Ticker dropdown populated dynamically from the API (`GET /v1/instruments`), not hardcoded | MVP MANDATORY |
| FR-02 | Actual price and forward forecast chart with 80% and 95% confidence bands | MVP MANDATORY |
| FR-03 | Historical walk-forward series (backtest, out-of-sample) on the chart, labeled distinctly from the forward forecast | MVP MANDATORY |
| FR-04 | 7- and 30-day horizon selector | MVP MANDATORY |
| FR-05 | Volatility card: daily and annualized volatility with uncertainty bands | MVP MANDATORY |
| FR-06 | Correction probability card (0 to 100%) with threshold θ definition and rolling base rate comparison (e.g., trailing 1 year) | MVP MANDATORY |
| FR-07 | Display of "data as of [date]" and "last successful update" | MVP MANDATORY |
| FR-08 | Persistent disclaimer: not investment advice, end-of-day data, forecasts carry uncertainty | MVP MANDATORY |
| FR-09 | UI states: loading, error, empty, insufficient-data, degraded | MVP MANDATORY |
| FR-10 | Reliability badge ("low reliability / thin liquidity") for GOTO and DCII | MVP MANDATORY |
| FR-11 | Concise methodology and limitations explainer (why the midpoint is a random walk) | MVP MANDATORY |
| FR-12 | Threshold-based badges ("high volatility vs. history", "insufficient data") | MVP IF TIME PERMITS |
| FR-13 | Live out-of-sample accuracy history (stored predictions vs. actuals after horizon elapses) | V1.x |
| FR-14 | Challenger model view (XGBoost M2 TLKM) for comparison, only if proven stable | MVP IF TIME PERMITS |

UI language: English (with optional Indonesian toggle in V2+, followed by full i18n).

### 5.2 System Features

| ID | Requirement | Priority |
| --- | --- | --- |
| SR-01 | Scheduled ingestion from yfinance (`auto_adjust=False`) into canonical schema, backed by instrument registry | MVP MANDATORY |
| SR-02 | Data validation and repair rules (8 erroneous yfinance zero-volume days repaired from Kaggle; current-day candles dropped; zero volume retained with `is_traded`) | MVP MANDATORY |
| SR-03 | Fallback to last valid data if yfinance fails; demo path reads strictly from DB | MVP MANDATORY |
| SR-04 | Daily batch fit per active instrument: M1 (random walk + empirical intervals), M2 (GARCH-t), M3 (vol-implied); results written to `forecast_runs` and `forecasts` | MVP MANDATORY |
| SR-05 | Walk-forward backfill for the actual-vs-forecast chart | MVP MANDATORY |
| SR-06 | Fallback to EWMA or constant variance with `degraded` status if GARCH fails to converge | MVP MANDATORY |
| SR-07 | Go gateway (REST) and Python ml-service (gRPC); versioned `.proto` and OpenAPI contracts | MVP MANDATORY |
| SR-08 | PostgreSQL and Redis (cache) | MVP MANDATORY |
| SR-09 | Per-IP rate limiting, health endpoints (`/healthz`, `/readyz`, gRPC health), admin refresh endpoint gated by API key | MVP MANDATORY |
| SR-10 | Docker Compose, single Azure VM, HTTPS via Caddy | MVP MANDATORY |
| SR-11 | GitHub Actions: build, test, scan, push to GHCR, deploy via SSH | MVP MANDATORY |
| SR-12 | Golden test: ml-service output matches notebook output within tolerance | MVP MANDATORY |
| SR-13 | Documentation: OpenAPI, `.proto`, README, architecture diagram, core ADRs | MVP MANDATORY |
| SR-14 | Onboarding an additional ticker via configuration only (e.g., BBCA as a 4th ticker) | MVP IF TIME PERMITS |
| SR-15 | `pg_dump` backup to Azure Blob | MVP IF TIME PERMITS |
| SR-16 | Local MLflow, Postman collection (derived from OpenAPI), `^JKSE` index features, pooled model experiments | MVP IF TIME PERMITS |
| SR-17 | Kaggle enrichment (foreign flow, Remarks) | MVP IF TIME PERMITS |

### 5.3 Required Fields in Forecast Responses

`median` (= last price), 80% and 95% interval quantiles, daily and annualized volatility with bands, correction probability with θ and rolling base rate, `as_of_date`, `status` (`ok` | `degraded` | `failed`), reliability badge, and quantile `path` k=1..h for charting.

## 6. Non-Functional Requirements

| Area | Requirement | Verification |
| --- | --- | --- |
| Claim integrity | Labeled "end-of-day forecast", never "real-time"; backtest and forward forecast series clearly distinguished | UI and copy review |
| Read performance | Target (not yet benchmarked): page load and forecast responses feel instant when served from cache; cached p95 target set after load testing | Load test in QA |
| VM memory | Entire stack fits within a 4 GB VM with headroom for OS and batch jobs (hypothesis) | `docker stats` |
| Demo reliability | Layered fallbacks: local Compose, recorded video, screenshots | Pre-demo checklist |
| Reproducibility | Every run records git SHA, data hash and window, and spec version | `forecast_runs` table |
| Infrastructure security | NSG allows only 80/443; SSH key + IP allowlist; Postgres and Redis not exposed; non-root containers; secrets in VM `.env` (`chmod 600`) and GitHub Environments | Security checklist |
| Public repo security | Secret scanning + push protection, gitleaks, Dependabot, CodeQL, branch protection, Trivy, SHA-pinned Actions, no `pull_request_target` | CI and pre-release audit |
| Observability | JSON logs to stdout, request-id via gRPC metadata, run status persisted; Prometheus metrics optional | Log review |
| Accessibility | Status never communicated by color alone; adequate contrast; keyboard navigation for primary controls | UI review |
| Cost | Within \$100 Azure credit; budget alerts at \$20/\$50/\$80; deallocation policy | Azure Portal |
| Portability | K8s-ready (stateless, 12-factor, graceful shutdown, health probes) | ADR-002 |

## 7. Model and Data Success Criteria

Defined prior to viewing walk-forward results (ADR-014).

| Target | "Works" If | Current Walk-Forward Results (Measured Facts) |
| --- | --- | --- |
| M2 volatility | QLIKE beats rolling-vol naive in a majority of folds/years and `rel_const` < 1 | TLKM h7 passes (GARCH 0.877), TLKM h30 marginal (0.923). GOTO and DCII: constant variance is best |
| M1 interval | Nominal 80% coverage falls between ~70% and 90% | Empirical: passes for TLKM, DCII, GOTO. GARCH-normal fails on DCII |
| M3 correction | BSS > 0 and AUC well above 0.5 on an adequate sample | TLKM h7 marginal (+0.043 vol-implied), TLKM h30 fails, DCII h30 XGBoost +0.137 (candidate), GOTO unreliable |
| M1 price | Not required to beat naive; rMAE reported transparently | ARIMA rMAE ≈ 1 (insignificant), XGBoost worse than naive |
| Methodology | Permutation test collapses to naive baseline | Passes (no data leakage) |

Per-ticker reliability policy: TLKM full tier; GOTO and DCII use long-run variance with a "low reliability / thin liquidity" badge. DCII h30 correction probability from XGBoost remains experimental, not a production feature.

Limitations that must appear in documentation and presentations: small effective sample size (~35 to 55 non-overlapping windows per ticker for h=30), non-stationary correction base rate, GOTO price plateau (95 consecutive zero-return days), DCII having 15.3% non-traded days, suspected survivorship bias in Kaggle, future dividends not reflected in adjusted prices, and `^JKSE` series not yet independently verified.

## 8. Brief Acceptance Criteria Mapping

| Brief Criterion | Fulfillment in KAIROS | Status |
| --- | --- | --- |
| Predict price, volatility, and correction probability for TLKM, GOTO, DCII | M1 (price range), M2, M3 for the three tickers | Planned (FR-02, 05, 06) |
| 7- to 30-day horizon | h=7 and h=30 | Planned (FR-04) |
| Time-series ML | Random walk + empirical intervals, GARCH-t, vol-implied; ARIMA and XGBoost evaluated and reported | Evaluation complete |
| LSTM optional, only if justified by data | Not used; rationale documented | Complete |
| Kaggle `eren2222` data (2020–2024) + yfinance | Kaggle for audit and repair, yfinance primary | Complete |
| "IDX Tech-Stock Predictor Dashboard" with ticker dropdown | KAIROS dashboard with API-driven dropdown | Planned (FR-01) |
| Actual vs. predicted chart with confidence intervals | FR-02, FR-03 (walk-forward backfill) | Planned |
| Open frontend technology choice | React | Locked (TypeScript/Vite/chart library open) |
| Original brief title on opening slide | Included | Planned (deck) |

## 9. Schedule and Cut-Line

| Date | Milestone |
| --- | --- |
| Thursday Nov 12 (Session 1) | EDA review, data cleaning complete, baselines trained (live presentation in Colab notebook) |
| Friday Nov 13 | Leak-free walk-forward evaluation and model decisions; these ADR and PRD documents |
| Saturday Nov 14 | First cloud deployment (hello-world acceptable): gateway, ml-service stub, Postgres, Caddy HTTPS. Hard deadline today |
| Monday Nov 16 (Session 2) | Minimal model tuning, web app draft, initial deployment and CI/CD pipeline. Mandatory live demo on Azure |
| Tuesday Nov 17 | Feature freeze; full dress rehearsal on cloud URL |
| Wednesday Nov 18 (Session 3) | Full presentation simulation and live demo (MVP deadline) |
| Earliest Nov 19 | Public repository release, following security audit and legal/IP clearance |

**Cut-line rule:** if behind schedule at the end of November 14, drop LSTM and UI polish (lo-fi wireframes suffice) before sacrificing cloud deployment and baseline quality. Out-of-scope features move to the post-session roadmap.

**Execution order:** API/data contracts first, then hello-world deployment, then parallel backend and frontend implementation against contracts (frontend uses schema-compliant dummy data), then lo-fi wireframes covering all mandatory states. High-fidelity UI polish only if time permits.

Reminder: maintain pace and sleep. Burnout risk is real on a tight solo schedule.

## 10. Success Metrics

Product metrics (no user analytics in MVP):
- Live demo on Azure running over HTTPS during Session 2 and Session 3, with zero runtime dependency on yfinance during the demo.
- All brief criteria in section 8 fulfilled.
- "Honest findings" narrative clearly articulated during the presentation: data anomalies discovered and repaired, permutation test passed, M2 proven on TLKM, M1 does not beat naive, M3 behaves as a volatility function, GOTO and DCII limitations surfaced.

Technical metrics:
- Green CI on every PR to `main`; golden tests passing.
- Daily pipeline succeeds with `ok` run status for TLKM; `degraded` or low-reliability tier surfaced accurately for GOTO and DCII.
- Zero secrets or data artifacts in git history (verified by gitleaks/trufflehog audit prior to public release).

## 11. Dependencies, Assumptions, and Risks

**Assumptions:**
- Solo developer, CPU-only compute (free Colab as backup).
- AI tooling: Claude (planning, architecture, review), Gemini Pro (brainstorming, quick syntax), Kiro (coding agent, 1,000 quota reserved for Session 2). AI-generated ML code must be verified (permutation and leakage tests) before trusting results.
- Public read-only dashboard without login.

**Key risks:**

| Risk | Impact | Mitigation | Nature |
| --- | --- | --- | --- |
| yfinance is unofficial, rate-limited, datacenter IP behavior untested | Ingestion fails on VM | Adapter + fallback to last valid data; demo reads from DB; licensed provider on roadmap | Hypothesis |
| Dirty data (8 erroneous zero-volume days found) | Silent model corruption | Validation rules, repair logs, cross-ticker warnings | Measured |
| Weak directional signal (M1 does not beat naive) | Evaluator perceives product as failed | Clear positioning as a risk monitor; transparent explanation of negative results | Measured |
| GOTO price plateau and DCII thin liquidity | Unreliable metrics | Low-reliability badge, long-run variance fallback | Measured |
| Single VM and 4 GB RAM limit | Demo crash | Layered demo fallbacks; `docker stats` validation | Hypothesis |
| 3-session timeline, solo developer | Feature cuts | Daily cut-lines; contract-first execution order | Measured |
| Limited Azure credit (\$100) | VM deallocated or unexpected billing | Budget alerts, deallocation policy, portal balance checks | Needs verification |
| Legal: work ownership (Vinix), university IP policy, Kaggle/Yahoo data terms | Repo cannot be made public | Keep repo private initially; publish no earlier than Nov 19 after clearance | Release blocker |
| Bots or spam traffic | VM resource exhaustion | Rate limiting, Redis caching, gated admin endpoint. Distributed DDoS accepted as known limitation | Measured |

## 12. Legal, Ethics, and Disclaimers

- **Disclaimer (reference copy, refined in UI/UX and legal review):** "KAIROS is an educational and portfolio project. Information is based on end-of-day historical data and statistical estimates subject to uncertainty. It does not constitute investment advice or a solicitation to buy or sell any security."
- **Data & Attribution in README:** Kaggle and Yahoo Finance data are not re-licensed by this project; strictly non-commercial use. Terms of use for both providers require verification.
- **Repository license:** MIT (full open source) with `LICENSE` committed from day one. Audit dependency licenses (`go-licenses`, `pip-licenses`, `license-checker`) before making the repository public.
- **Cross-border financial forecasting regulations:** addressed in Phase 2 legal review, relevant to global expansion.
- Never include Azure IPs, subscription IDs, or resource names in public documents.

## 13. Version Roadmap

### V1 (MVP): November 16 and 18, 2026
Scope defined in section 5 (all MVP MANDATORY items). Three tickers, daily batch fit, read-only dashboard, single-VM Azure deployment, CI/CD, core documentation. If time permits: 4th ticker via config, Blob backups, local MLflow, Postman collection, threshold badges.

### V1.x (Post-Session, Same Repository)
- Live accuracy history: comparing stored forecasts against realized prices once horizons elapse (FR-13).
- Verify historical IDX ARA/ARB rules per period, then surface exact ARA/ARB flags as features and UI badges.
- Address GOTO zero-return plateau once the underlying hypothesis is verified.
- Interval improvements (volatility-scaled historical simulation), validated via walk-forward evaluation.
- XGBoost challenger: M2 TLKM and M3 DCII h30 included only if they pass robustness checks (rolling base rate, year-by-year stability). If promoted: native JSON export, versioned feature schema, model version registry, `^JKSE` dependency.
- Kaggle enrichment (foreign flow), provided Kaggle-only features are never required at serving time.
- Repository security audit and public release (after legal clearance), polished README, demo video, case study, status badges.

### V2
- Hybrid lazy fitting (hot/warm/cold tiers) with job queues, *single-flight locks*, and anti-abuse quotas (ADR-009).
- User login and personal watchlists if new features require identity (ADR-012); CDN/WAF.
- Automated drift monitoring; model registry if supervised models return.
- Migration to Azure Container Apps or AKS (validated locally on kind/k3d first), managed PostgreSQL/Redis; Jenkins is not planned.
- SSE/WebSocket and webhooks; live prices for comparison only (never as model inputs).
- English default UI with Indonesian toggle.

### V3 (Global Feasibility Study, Non-Commercial)
- Multi-market support: non-IDX exchanges with per-exchange calendars, timezones, currencies, and configs.
- Licensed market data provider replacing yfinance.
- Global or sector-pooled models (cold-start handling for newly listed equities), per-jurisdiction regulatory event flags (NLP/event flags).
- Full i18n; regulatory review of financial forecasting tools, data licensing, and per-country localization.

## 14. Open Questions

1. Ingestion cron schedule relative to IDX market close (verify).
2. Azure DNS label for Caddy HTTPS (verify in portal).
3. Specific TypeScript/Vite setup and financial charting library for the frontend.
4. Handling of the GOTO price plateau before displaying GOTO metrics.
5. Vinix work ownership terms and university IP policy.
6. Whether positioning KAIROS as a "risk monitor with random-walk price ranges" is accepted by the evaluator as fulfilling the brief's "price prediction" requirement (confirm during or before Session 2).
7. KAIROS naming evaluation: trademark/domain conflict risk, global pronunciation, tagline.

## 15. Glossary

- **h:** forecast horizon in trading days (7 or 30). **D-1:** latest finalized trading day.
- **M1/M2/M3:** modeling targets for price (cumulative return), volatility (realized variance), and correction probability.
- **QLIKE:** quasi-likelihood variance evaluation metric. **rMAE:** MAE relative to naive baseline. **BSS:** Brier skill score relative to base rate. **AUC:** area under the ROC curve.
- **rel_const:** model QLIKE relative to constant variance; values below 1 indicate outperformance.
- **Walk-forward:** expanding-window evaluation using only data available up to each forecast origin; **embargo** = h-day gap preventing label overlap leakage.
- **θ:** M3 correction threshold, frozen per instrument and horizon ($0.85 \cdot \sigma_{\text{init}} \cdot \sqrt{h}$ rule snapped to grid).
- **Registry:** the `instruments` table (authoritative list of instruments and their statuses) and `model_specs` table (frozen per-instrument model specifications).
- **ARA/ARB:** IDX upper/lower auto-rejection price limits (_Auto Rejection Atas / Bawah_; historical rules per period require verification).
