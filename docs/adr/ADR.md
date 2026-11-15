# KAIROS: Architecture Decision Records (ADR)

Document version: 1.0 (November 13, 2026)
Document status: Accepted for MVP/V1. Items marked **Needs verification** have not yet been empirically proven.
Companion document: `docs/prd/PRD.md`

Conventions: each ADR contains Status, Context, Decision, Alternatives, Consequences, and Re-evaluation Trigger (when this decision should be revisited). Measured facts are distinguished from hypotheses. No numbers are quoted from memory.

## ADR Index

| ID | Title | Status |
| --- | --- | --- |
| ADR-001 | Monorepo for MVP, split-ready by design | Accepted |
| ADR-002 | Single VM + Docker Compose for MVP demo; Container Apps/AKS as roadmap | Accepted |
| ADR-003 | GitHub Actions instead of Jenkins | Accepted |
| ADR-004 | Market-agnostic core, IDX as first market | Accepted |
| ADR-005 | Batch forecast stored in DB, not online inference | Accepted |
| ADR-006 | Proto generated at build, not committed | Accepted |
| ADR-007 | PostgreSQL plain, Redis as cache only, no broker | Accepted |
| ADR-008 | Backfilled walk-forward for the actual-vs-forecast chart | Accepted |
| ADR-009 | Nightly batch fit, no on-demand training (lazy = V2) | Accepted |
| ADR-010 | gRPC-only ml-service (no FastAPI); REST only at gateway | Accepted |
| ADR-011 | Serving = fit procedure, not a serialized model | Accepted |
| ADR-012 | Public read-only dashboard, no user login | Accepted |
| ADR-013 | yfinance as primary source, Kaggle only for repair | Accepted |
| ADR-014 | Model selection: random walk (M1), GARCH-t (M2), vol-implied (M3) | Accepted |
| ADR-015 | Frontend served as static files by Caddy | Accepted |

---

## ADR-001: Monorepo for MVP, split-ready by design

**Status:** Accepted

**Context.** Single developer, three sessions, public repository for a portfolio. There are three services (Go gateway, Python ml-service, Python ingestion), one frontend, and shared contracts. Evaluators want to see well-structured microservices, but the overhead of multiple repositories does not justify the cost right now.

**Decision.** A single `kairos` monorepo (MIT, LICENSE from the first commit; full open source). Each service is self-contained so it can be split out at any time:
- Own dependency file (`go.mod` / `pyproject.toml` / `package.json`), Dockerfile, and README.
- No imports across service folders. Communication happens strictly via contracts (`.proto`, OpenAPI) and network.
- Configuration via environment variables.
- Per-service CI with path filters. Conventional Commits scoped per service. Version-tagged images per service.
- These rules are also codified in `AGENTS.md`.

**Alternatives.**
- Multi-repo from day one: clean isolation, but contract synchronization and CI overhead triple for a solo developer.
- Monorepo with Bazel/Nx: too heavy for this scale.

**Consequences.**
- (+) A single PR can update a contract and both sides of its implementation. A single place for README and architecture docs.
- (−) Boundary discipline must be enforced manually and via CI, as there is no physical repository separation.
- Forecasting code in ml-service is a separate copy from the notebooks in `ml/`. Consistency is enforced via golden tests, not shared code.

**Split path.** Extract `api/` first (`kairos-api` repo, version-tagged), then each service via `git filter-repo`, and finally `deploy/`.

**Re-evaluation trigger.** More than one team, diverging service release cycles, or monorepo CI times becoming a bottleneck.

**Branching.** Trunk-based: short-lived branches, PR to `main`, green CI mandatory (branch protection).

---

## ADR-002: Single VM + Docker Compose for MVP demo; Container Apps/AKS as roadmap

**Status:** Accepted (capacity numbers **need verification**)

**Context.** Live demos on Azure are mandatory on November 16 and 18. Azure for Students credit is \$100 (remaining balance must be checked in the portal). Allowed regions: `malaysiawest`, `indonesiacentral`, `centralindia`, `eastasia`, `australiaeast` (preference: `indonesiacentral`, then `eastasia`, then `malaysiawest`). All resources in a single region.

**Decision.** A single B-series VM (4 GB RAM starting point) running Docker Compose: Caddy (Let's Encrypt TLS), static frontend, gateway, ml-service, Redis, PostgreSQL (managed disk volume), and a scheduled ingestion job. `pg_dump` backups to Azure Blob. Container image registry = GHCR.

Designed K8s-ready so migration does not require a rewrite: stateless, 12-factor, health/readiness probes (including gRPC health), SIGTERM graceful shutdown, DNS-based service discovery, non-root multi-stage version-tagged images, JSON logs to stdout, data stored outside containers.

**Alternatives.**
- AKS: control plane, node overhead, and operations exceed budget and timeline.
- Azure Container Apps: appealing, but PostgreSQL/Redis still need hosting, and costs are less predictable.
- Managed PostgreSQL/Redis: fixed costs are too high relative to the \$100 credit.
- ACR: GHCR is free and sufficient.

**Consequences.**
- (+) Predictable cost, single machine to debug, demo easily recoverable via local Compose.
- (−) Single point of failure, no HA. Mitigated with layered demo fallbacks: local Compose, recorded video, screenshots.
- (−) Tight memory budget. Initial estimates (**hypothesis**): Postgres ~300 MB, ml-service ~400–600 MB, Redis ~50 MB, gateway ~30 MB, Caddy ~30 MB. Must be validated with `docker stats`.
- Mandatory safeguards: NSG allowing only 80/443, SSH key + IP allowlist, Postgres/Redis with no public ports, budget alerts at \$20/\$50/\$80, deallocate/auto-shutdown policy (disks and static IPs still incur charges).
- Pre-provisioning verification: `az vm list-skus`, `az vm list-usage` for B-series SKUs in the target region.

**HTTPS without a custom domain.** The DNS label on an Azure public IP (`*.<region>.cloudapp.azure.com`) is sufficient for Let's Encrypt via Caddy (**needs verification in portal**). Real FQDNs and IPs must never appear in public documents.

**Re-evaluation trigger.** VM memory becomes a bottleneck, HA is required, or the number of active instruments exceeds single-VM capacity. Migration path: Compose, then local kind/k3d, then AKS or Container Apps.

---

## ADR-003: GitHub Actions instead of Jenkins

**Status:** Accepted

**Context.** 2 years of CI/CD experience. Repository hosted on GitHub with active Student Pack.

**Decision.** GitHub Actions: build, test, scan (Trivy), push to GHCR, deploy via SSH. Hardening:
- Minimal `permissions` per workflow; third-party Actions pinned to commit SHAs; no `pull_request_target`; approval required for fork workflows.
- Deployment secrets stored in GitHub Environments with required reviewers. Dedicated deploy SSH key with restricted privileges.
- gitleaks (pre-commit and CI), Dependabot, CodeQL.

**Alternatives.** Jenkins: an extra server to maintain (memory, patching), adding no value for the MVP.

**Consequences.** No CI server to manage. Actions minutes quota and security features for private repositories on Free/Student Pack accounts **need verification**.

**Re-evaluation trigger.** Need for self-hosted runners or pipelines outside GitHub.

---

## ADR-004: Market-agnostic core, IDX as first market

**Status:** Accepted

**Context.** The MVP covers IDX only, but the path to global expansion must remain open without a rewrite.

**Decision.** Keep the core exchange-neutral via eight architectural seams:
1. Instrument and exchange registry with internal IDs (`IDX:TLKM`; symbol, MIC, currency, timezone).
2. Canonical price schema.
3. `MarketDataProvider` interface (yfinance, Kaggle adapters) with per-provider symbol mapping.
4. Per-exchange configuration (timezone, currency, trading calendar, auto-rejection limits) in config, not code.
5. Fitting and serving parameterized by `instrument_id`; `model_specs` keyed by `(instrument_id, target, horizon, spec_version)`.
6. Exchange-neutral, versioned API and proto contracts (no IDX-specific terms; `kairos.forecast.v1`).
7. UI dropdown populated dynamically from the API.
8. Storage partitioning by exchange/instrument.

Proof of extensibility: onboarding an additional IDX ticker requires configuration only. Rules for adding a new data source: one adapter per source mapping to the canonical schema, reconciliation rules (priority, tolerance, discrepancy reporting) in config, optional columns not forced into uniformity, contract tests per adapter.

**Not built in MVP.** Licensed data providers, multi-currency conversion, non-IDX trading calendars, global/sector-pooled models, per-jurisdiction regulatory events, full i18n.

**Alternatives.** Hardcoding IDX: faster right now, but turns any expansion into a rewrite.

**Consequences.**
- (+) Adding an instrument = adding a registry row or config entry.
- (−) Introduces abstractions that are only fully proven when a second instrument and second exchange are onboarded. Unused seams must be critically reviewed in Phase 2 to avoid over-engineering.
- Onboarding quality gate: minimum history, liquidity, completeness. Tickers that fail are marked `insufficient_data` and the UI surfaces their status.

**Re-evaluation trigger.** When the first non-IDX exchange is considered (requires feasibility study: data licensing, calendars, regulations, localization).

---

## ADR-005: Batch forecast stored in DB, not online inference

**Status:** Accepted

**Context.** End-of-day data, 7- and 30-day horizons. Forecasts do not change intraday. yfinance is unreliable for interactive request-time fetching.

**Decision.** Forecasts are computed once after successful ingestion, anchored at the latest finalized trading day (D-1), and stored in PostgreSQL. The dashboard only reads stored results and displays "data as of [date]" and "last successful update". Product terminology: **end-of-day forecast**. Never use the term "real-time".

yfinance is called only by scheduled ingestion and the admin refresh endpoint, falling back to the last valid data on failure. The demo path reads strictly from the DB. Live price comparison is V2+ and never serves as model input.

**Alternatives.** Online inference per request: high latency, depends on yfinance availability during demos, and could produce inconsistent results across users on the same day.

**Consequences.**
- (+) Lightweight, deterministic read path. Demos do not depend on external data provider network calls.
- (+) Stored forecasts can be compared against actuals once the horizon elapses (true out-of-sample live accuracy tracking, V1.x).
- (−) Data lags by up to one trading day. This must be stated clearly in the UI.

**Schedule.** A systemd timer or cron job on the VM runs `docker compose run --rm ingestion` on weekday mornings (WIB). Candles dated on the current calendar day are dropped so `as_of_date` is deterministic. Exact timing relative to IDX market close **needs verification**.

**Re-evaluation trigger.** Intraday requirements or a reliable streaming data source.

---

## ADR-006: Proto generated at build, not committed

**Status:** Accepted

**Context.** Two languages (Go, Python) consume a single `.proto` contract.

**Decision.** Stubs are generated at build time per service using `buf` (pinned version) and are not committed to git. The contract follows semver in package `kairos.forecast.v1`; `buf breaking` in CI enforces backward compatibility.

**Alternatives.** Committing generated code: works out of the box in IDEs, but creates noisy diffs and risks drift between `.proto` and stubs.

**Consequences.** Local development requires a code generation step (Makefile target). Zero drift between contracts and stubs. Breaking changes require bumping the package version (`v2`).

**Re-evaluation trigger.** Splitting `api/` into its own repository (stubs can be published as versioned packages).

---

## ADR-007: PostgreSQL plain, Redis as cache only, no broker

**Status:** Accepted

**Context.** Tabular data, fixed schema, small volume. Previous open questions: PostgreSQL vs. time-series DB vs. MongoDB vs. Redis, and whether a message broker is needed.

**Decision.**
- Standard PostgreSQL as the source of truth (instruments, prices, forecasts, runs). Semi-structured data (quantile paths, GARCH parameters) stored in JSONB columns.
- Redis used strictly for caching `GetForecast` responses (invalidated upon successful run) and rate-limit counters. Can be lost without data loss.
- No message broker. Pipeline orchestration lives in the ingestion job, which invokes `ComputeForecast` per instrument.

**Table ownership (single Postgres instance, strict ownership):**
- ingestion: `instruments`, `prices_daily`, `ingestion_runs`
- ml-service: `model_specs`, `forecast_runs`, `forecasts`
- gateway: `api_keys` (admin only)
- No cross-owner queries. Gateway never touches forecast tables; it reads via gRPC.

**Alternatives.**
- MongoDB: the schema is fixed and requires relational constraints and idempotent upserts, offering no advantage while adding another container to a 4 GB VM.
- Redis as primary storage: forecast history must be durable.
- TimescaleDB/Influx: projected scale (thousands of instruments × ~250 days × 2 horizons per year) is still small enough for plain Postgres.
- Broker (RabbitMQ/Kafka): a single daily batch job does not justify one.

**Consequences.** A single durable data technology to operate. Idempotency via unique key `(instrument_id, as_of_date, spec_version)` and upserts. Full quantile paths in JSONB grow with instrument count; at large scale, retain paths only for the latest run and last N days (V2).

**Re-evaluation trigger.** A broker becomes justified when lazy job queues (ADR-009) or horizontal workers are introduced.

---

## ADR-008: Backfilled walk-forward for the actual-vs-forecast chart

**Status:** Accepted

**Context.** The project brief requires an actual-vs-predicted chart with confidence intervals. Daily serving produces only one forward forecast per day, leaving no historical prediction series to plot against actuals on day one.

**Decision.** `ComputeForecast` accepts an `as_of_date` parameter, allowing a `BackfillForecasts` command to replay it backward (~100 origins) using only data available up to each origin. The quantile path k=1..h is stored in the `path` JSONB column.

The UI distinguishes two separate series:
- Historical: "walk-forward (backtest, out-of-sample)".
- Forward: "forecast".

**Alternatives.** Showing only the forward forecast: fails to meet the brief. Plotting in-sample fitted values: misleading.

**Consequences.** Backfill is retrospective, not a live track record. A true live track record accumulates over time as daily predictions are stored and horizons elapse (V1.x). Backfill and daily serving must execute identical code, enforced by golden tests.

---

## ADR-009: Nightly batch fit, no on-demand training (lazy = V2)

**Status:** Accepted

**Context.** Question: fit every night for all instruments, or fit when the first user requests an instrument that day (compute-on-first-request)? And how does this behave at large scale?

**Decision.** For MVP: daily batch fit for all active instruments in the registry (3 to 4 tickers).
- A single GARCH-t fit per instrument produces a 30-day forecast; both h=7 and h=30 values are derived from that same fit.
- Jobs are idempotent. Failure on one instrument does not halt the others; per-instrument status is recorded (`ok` / `degraded` / `failed`).

Lazy vs. batch comparison:
- Lazy avoids computing unviewed stocks, but penalizes the first visitor with latency, requires a per-instrument *single-flight lock*, requires anti-abuse quotas, forces on-demand ingestion (hitting yfinance rate limits), and leaves gaps in the daily track record.
- Batch guarantees a warm demo, predictable scheduling, and an unbroken historical record.

**Alternatives.** Pure lazy, or hybrid in MVP. With 3 tickers, lazy adds complexity without saving anything.

**Consequences for scale (feasibility study, not MVP target).** All numbers below are hypotheses until `ComputeForecast` is benchmarked.
- Total listed equities worldwide are well below 1 million (needs verification). A 1-million figure is only reached if other instrument classes are included.
- Large-scale architecture = tiered hybrid: *hot* (daily batch), *warm* (weekly batch or lazy), *cold* (lazy only, or cheap models like EWMA).
- Requires a job queue and horizontal workers (the first point where a broker and K8s are justified), storage partitioning by exchange and date, incremental fitting (parameter warm-starts), and a licensed data provider. yfinance is insufficient.
- Registry quality gates filter out instruments lacking minimum history or liquidity.

**Re-evaluation trigger.** Active instrument count or batch runtime approaches the nightly window limit, or user demand emerges for long-tail tickers.

---

## ADR-010: gRPC-only ml-service (no FastAPI); REST only at gateway

**Status:** Accepted

**Context.** Question: should ml-service use FastAPI?

**Decision.** ml-service is a pure gRPC server (`grpcio`) exposing `GetForecast`, `ListInstruments`, and `ComputeForecast`. The browser speaks only REST/JSON to the Go gateway, which translates requests to gRPC. Health checks use the gRPC health protocol or a tiny stdlib endpoint. ml-service is never called directly by the browser.

**Alternatives.** FastAPI in ml-service: introduces two protocols in one service without need, violating the boundary that internal contracts are gRPC.

**Consequences.** Manual testing of ml-service uses `grpcurl` or test clients. gRPC contract tests are mandatory (QA scope). Adding REST directly to ml-service is forbidden without a new ADR.

**Re-evaluation trigger.** A genuine internal non-gRPC consumer.

---

## ADR-011: Serving = fit procedure, not a serialized model

**Status:** Accepted

**Context.** Walk-forward evaluation rejected XGBoost for M1 and M3, and XGBoost M2 only outperformed on TLKM. GARCH-t fits in seconds.

**Decision.** In V1, a "model" = the fit procedure (GARCH-t + empirical interval + vol-implied M3) plus the parameters stored per run. There is no separate training stage, no serialized model artifact file, no file-based model registry, and MLflow is optional.

Stored in DB:
- `model_specs`: M3 θ ($0.85 \cdot \sigma_{\text{init}} \cdot \sqrt{h}$ rule, frozen), burn-in, reliability policy, walk-forward metrics.
- `forecast_runs`: `as_of_date`, git SHA, data hash and window, status, duration.
- `forecasts`: median, interval quantiles, daily/annual vol, probability, GARCH parameters (omega, alpha, beta, nu), empirical quantiles used, `path`.

GARCH fit failure: fallback to EWMA or constant variance with status `degraded`. `H_PROD` covers both 7 and 30 days per the brief.

Quality gate: golden test with a fixed price fixture; ml-service output must match the notebook output within tolerance.

**Consequences.** The ml-service image ships only `numpy`, `pandas`, `scipy`, and `arch` (CPU-only). No `^JKSE` dependency in MVP (index features were used only by XGBoost). Azure Blob is used only for `pg_dump` backups.

**XGBoost returns only if** the M2 TLKM or M3 DCII h30 challenger proves stable. At that point: export in native XGBoost JSON format (never pickle), versioned feature schema, model version registry, `^JKSE` dependency, and scheduled retraining decoupled from daily inference.

---

## ADR-012: Public read-only dashboard, no user login

**Status:** Accepted (approved November 13, 2026)

**Context.** MVP user behavior is strictly read-only: select a ticker, view charts and cards, read the disclaimer. No user action persists data or triggers computation.

**Decision.** Public dashboard without login. No `users`, sessions, or passwords tables. `api_keys` is used strictly for `POST /v1/admin/refresh`.

Bot and spam protection:
- Per-IP rate limiting at the gateway (token bucket) plus request body size limits and timeouts in Caddy.
- Aggressive Redis caching with `Cache-Control`/ETag, since data changes once per day.
- Admin endpoint gated by API key and IP allowlist.
- NSG exposes only ports 80/443.

**Known limitation.** Per-IP rate limiting does not stop distributed attacks (many IPs). Accepted risk for a portfolio project. Mitigation (CDN/WAF) moves to V2.

**Alternatives.** JWT login: adds tables, UI screens, and attack surface without any user-facing feature that needs identity.

**Re-evaluation trigger.** Features requiring user identity (personal watchlists, email alerts, per-user quotas).

---

## ADR-013: yfinance as primary source, Kaggle only for repair

**Status:** Accepted (behavior from datacenter IPs **needs verification**)

**Context (measured facts).**
- Cross-check of raw Close between Kaggle and yfinance over the overlap period: 0.0 difference at the 50/95/99% quantiles.
- Kaggle ends on 2024-05-16 and omits traded days (TLKM: 72 of 1,057; GOTO: 30 of 501; DCII: 43 of 803).
- yfinance is erroneous on 8 days (`Volume=0` with stale `O=H=L=C`) that Kaggle records as actively traded.
- yfinance is unofficial, rate-limited, and its current-day candle is unfinalized.

**Decision.**
- yfinance (`auto_adjust=False`) = primary source. Kaggle is not the primary source.
- yfinance zero-volume days that Kaggle records as traded are repaired from Kaggle (`source=kaggle_repair`): `adj_close = close_kaggle * (yfinance adj_close / close on that day)`, open from `First Trade` if > 0, else previous close.
- Current-day candles are dropped. Genuine zero-volume days are retained with `is_traded=False`.
- OHLC for modeling = adjusted (`raw * adj_factor`). Raw prices are for display only.
- 120-day post-listing burn-in applied to GOTO and DCII.
- Post-May 2024 (no secondary source for cross-check): zero volume on liquid stocks is flagged as a data quality warning and cross-checked across tickers on the same date. Never silently repaired. This rule does not catch erroneous prices accompanied by non-zero volume.

**Consequences.**
- Limitations: future dividends are not reflected in historical adjusted prices. Suspected survivorship bias in the Kaggle dataset is unproven and documented as a limitation.
- Kaggle/Yahoo data is not re-licensed by this project. The README includes a "Data & Attribution" section stating educational/portfolio non-commercial use. Terms of use for yfinance and Kaggle **need verification**.
- The `canonical.parquet` v2 schema forms the basis of the `prices_daily` table.

**Re-evaluation trigger.** Adoption of a licensed data provider, or yfinance blocking VM datacenter IPs.

---

## ADR-014: Model selection: random walk (M1), GARCH-t (M2), vol-implied (M3)

**Status:** Accepted. Based on leak-free walk-forward evaluation (expanding window, INIT=500, STEP=10, h-day embargo), passing the permutation test.

**Context (measured facts).**
- Permutation test (TLKM): ARIMA rMAE 1.001/1.000; GARCH `rel_const` 0.994/1.049; M3 vol-implied AUC ≈ 0.50. Zero data leakage. Differences within ±7% ($n \approx 58$) are noise (EWMA achieved 0.926 on permuted data).
- M1: ARIMA rMAE 0.986 to 1.007 (insignificant), XGBoost 1.06 to 1.33 (worse than naive).
- M2: TLKM h7 GARCH `rel_const` 0.877 and beats rolling-h in 5/5 years (passes); TLKM h30 is marginal (GARCH 0.923, beats rolling-h in only 2/5 years). GOTO and DCII: constant variance is best across all horizons.
- M3: fundamentally a function of volatility; vol-implied matches XGBoost. DCII h30 XGBoost BSS +0.137, AUC 0.706, wins 4/4 years: candidate, not yet trusted.
- 80% interval (passes if coverage is 70% to 90%): empirical TLKM 76.5%/75.2%, DCII 76.9%/77.6%, GOTO 89.4%/88.9%. GARCH-normal fails on DCII (69.2%/61.8%).

**Decision.**
- M1: midpoint = random walk (last price). Empirical intervals (centered quantiles of historical h-day returns, last 750) as default. ARIMA dropped. XGBoost M1 rejected.
- M2: zero-mean GARCH-t. Full tier for TLKM. GOTO and DCII use long-run variance with a "low reliability / thin liquidity" badge.
- M3: vol-implied probability (reflection principle with $0.5826\sigma$ discrete barrier correction), θ frozen in registry. Accompanied by a rolling base rate for comparison.
- LSTM, Prophet, TFT: not used. ~500 to 1,600 rows per ticker is prone to overfitting with no evidence of exploitable signal.
- Product = risk monitor and random-walk-centered price range estimator. Not a directional price predictor, not buy/sell signals.

**Success criteria (defined prior to viewing results):**
- M2 works if QLIKE beats rolling-vol naive in a majority of folds/years and `rel_const` < 1.
- Intervals work if 80% nominal coverage falls within 70% to 90%.
- M3 works if BSS > 0 and AUC is well above 0.5 on an adequate sample size.
- M1 is not required to beat naive; rMAE is reported transparently.

**Consequences.**
- Effective sample size is small (~35 to 55 non-overlapping windows per ticker for h=30), so claims must remain conservative.
- Methodological flaws in the earlier notebook (wrong M3 target, XGBoost without embargo, apples-to-oranges scale comparisons, a leakage test that did not permute properly) have been corrected. Legacy results must not be used.
- GOTO price plateau (95 consecutive days of return = 0, ending 2026-09-25) renders GOTO metrics unreliable until addressed. The "price pinned at exchange floor" hypothesis remains unverified.
- Historical IDX ARA/ARB rules per period have not been verified; exact limit flags are deferred.

**Re-evaluation trigger.** XGBoost challenger passes robustness checks, rolling base rate alters M3 DCII assessment, or volatility-scaled historical simulation intervals prove superior.

---

## ADR-015: Frontend served as static files by Caddy

**Status:** Accepted

**Context.** VM memory is constrained. The React frontend compiles to static assets at build time.

**Decision.** Built web assets are served directly by Caddy (which reverse-proxies `/v1/*` to the gateway). No nginx container or Node server in production.

**Alternatives.** Separate nginx container: extra memory and configuration for no benefit.

**Consequences.** One fewer process on the VM. Cache and security headers (CSP, etc.) are configured in Caddy. Specific choices of TypeScript/Vite/financial charting library remain open and will be finalized in the UI/UX workstream.

---

## Architecture Decision Roadmap

| Version | Anticipated Architecture Decisions | Related ADRs |
| --- | --- | --- |
| V1 (MVP, Nov 16 and 18, 2026) | All ADRs above apply | 001 to 015 |
| V1.x | Live accuracy history, per-period ARA/ARB flags (once rules verified), threshold-based UI badges, Blob backups, local MLflow, 4th ticker via config, XGBoost challenger if validated | 008, 011, 013, 014 |
| V2 | Hybrid lazy fitting + queues and broker, user login if required by new features, CDN/WAF, automated drift monitoring, migration to Container Apps or AKS, managed DB/Redis, SSE/WebSocket, live price comparison, i18n (EN default + ID toggle) | 002, 007, 009, 012 |
| V3 | Multi-market (feasibility study: data licensing, calendars, regulations, localization), licensed data provider, global/sector models, per-jurisdiction regulatory events, full i18n | 004, 013 |

Global expansion is pursued as a technical feasibility study, not monetization.

## Open Items & Verification Checklist

1. Ingestion schedule timing relative to IDX market close.
2. Azure DNS label for Caddy HTTPS (never commit to public docs).
3. Remaining Azure for Students credit and B-series SKU availability in `indonesiacentral` (`az vm list-skus`, `az vm list-usage`).
4. yfinance terms of use and behavior from datacenter IPs (not yet tested from VM). Version used: 0.2.66 (`pip show yfinance`).
5. GitHub Actions minutes quota and private repo security features on Free/Student Pack accounts.
6. IDX ARA/ARB rules per period (including the suspected ±7% limit during the early pandemic period).
7. Independent verification of `^JKSE` data and 2026 events (both series originate from the same provider).
8. Benchmark runtime per `ComputeForecast` call and ml-service memory footprint via `docker stats`.
9. Handling of the GOTO zero-return plateau.
10. Work ownership terms (Vinix) and university IP policy: blocker for making the repository public (public no earlier than November 19).
