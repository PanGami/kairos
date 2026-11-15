# KAIROS — Handover to Start Backend Coding

As of Friday, November 13, 2026. This document is self-contained and supersedes earlier handovers for starting backend development. Model decisions, data rules, and walk-forward results are final (not repeated in full here — refer to the Nov 12/13 handover docs for detailed numbers). Working language: English.

Related attachments: `kairos_walkforward.py`, `canonical.parquet` (v2), `kairos_eda.ipynb` (the legacy walk-forward section is INVALID — do not use).

---

## 0. Decision Status (Locked)

**Product:** KAIROS — a risk monitor with calibrated uncertainty estimates. NOT a price predictor, NOT buy/sell signals. End-of-day (not real-time). Case study: IDX digital infrastructure (TLKM, GOTO, DCII).

**Model positioning (final as of Nov 13):**
- M1 (price): midpoint = naive / random walk. XGBoost & ARIMA rejected for the midpoint. Output = last price + intervals.
- M1 80% interval = **empirical** (default). GARCH-normal as fallback.
- M2 (volatility): GARCH-t. Proven only for TLKM; GOTO & DCII use long-run variance + "low reliability" badge.
- M3 (correction probability): **vol-implied** (no training), equivalent to XGBoost. θ from registry ($0.85 \cdot \sigma_{\text{init}} \cdot \sqrt{h}$ rule, frozen).
- XGBoost returns only as a challenger if proven stable (M2 TLKM / M3 DCII h30). NOT in MVP.

**V1 Serving:** no serialized model files. "Model" = fit procedure (GARCH-t + empirical interval + vol-implied M3) + per-run parameters stored in the DB.

---

## 1. Backend Architecture (To Start Coding)

**3 deployable units:**
1. `gateway` (Go) — REST/JSON to browser, auth/rate limiting, Redis cache, calls ml-service via gRPC.
2. `ml-service` (Python) — **pure gRPC server (grpcio), NOT FastAPI**. Owns `forecast_*` and `model_specs` tables. Exposes `GetForecast`, `ListInstruments`, `ComputeForecast`. HTTP only if needed for health probes.
3. `ingestion` (Python) — one-off job (not a long-running service). Owns `prices_*` and `instruments` tables. After successful ingest → calls `ComputeForecast` per active instrument.

Frontend = static files served by Caddy (no separate nginx container).

**Why ml-service is not FastAPI:** inter-service communication = gRPC (locked). ml-service is never called by the browser. Adding FastAPI = two protocols for no reason. Health checks are satisfied by the gRPC health protocol or a tiny stdlib endpoint.

**Datastores:**
- PostgreSQL = source of truth (prices, forecasts, instruments, runs). Semi-structured parts (quantile paths, GARCH parameters) live in JSONB columns.
- Redis = `GetForecast` response cache (invalidated on successful run) + rate-limit counters. Ephemeral; safe to lose at any time.
- NO: MongoDB, message broker, time-series DB, managed DB (all V2+).

**Scheduling:** systemd timer / cron on the VM → `docker compose run --rm ingestion`. Runs morning WIB on trading days, drops current-day candles, deterministic `as_of_date` = D-1. (Exact schedule vs. IDX market close needs verification.)

**Fitting strategy (Nov 13 decision):**
- MVP = **daily batch fit** for 3–4 active tickers. Idempotent, unique key `(instrument_id, as_of_date, spec_version)` + upsert. Failure of 1 instrument → `failed`/`degraded` status without stopping the others.
- Lazy / compute-on-first-request = **V2+** (requires single-flight locks, job queues, pending states, anti-abuse quotas). Not built in MVP.
- Large scale (tens of thousands+ instruments) = hybrid hot/warm/cold tiers + queues + horizontal workers + storage partitioning. Feasibility study, not MVP. "1 million" scale requires a licensed data provider (yfinance is insufficient).

---

## 2. API Contracts (Source of Truth)

Exchange-neutral proto package: `kairos.forecast.v1` (no IDX-specific terms).

```proto
service ForecastService {
  rpc GetForecast(GetForecastRequest) returns (GetForecastResponse);
  rpc ListInstruments(ListInstrumentsRequest) returns (ListInstrumentsResponse);
  rpc ComputeForecast(ComputeForecastRequest) returns (ComputeForecastResponse); // internal
}

message GetForecastRequest { string instrument_id = 1; int32 horizon_days = 2; } // h = 7 | 30
```

REST at gateway:
- `GET /v1/instruments`
- `GET /v1/instruments/{id}/forecast?h=7|30`
- `GET /v1/instruments/{id}/history`
- `POST /v1/admin/refresh` (API key)
- `GET /healthz`, `GET /readyz`

Forecast responses MUST include: median (= last price), interval quantiles (80%/95%), daily & annualized vol + band, correction probability + rolling base rate, `as_of_date`, `status` (ok|degraded|failed), reliability badge.

**Proto stubs are generated at build time** (buf, pinned version), NOT committed. `buf breaking` in CI.

---

## 3. Data Model (Initial Schema)

- `instruments` — **registry**: internal id (`IDX:TLKM`), symbol, MIC, currency, timezone, provider symbol mapping (`TLKM.JK`), `status` (active|paused|insufficient_data|delisted), tier, `reliability_tier`. "Active universe" = `status=active`. Jobs only iterate over this list. Adding a ticker = adding a row/config, not changing code.
- `prices_daily` — canonical schema v2: `instrument_id`, `trade_date`, `open`, `high`, `low`, `close`, `adj_close`, `volume`, `currency`, `source` (yfinance|kaggle_repair), `is_traded`, `adj_factor`.
- `model_specs` — model registry (frozen at onboarding): key `(instrument_id, target, horizon, spec_version)`; fields: M3 θ, burn-in, reliability policy, walk-forward metrics.
- `forecast_runs` — `as_of_date`, git SHA, data hash/window, `status`, duration.
- `forecasts` — values (median, interval quantiles, daily/annual vol, probability), GARCH parameters (omega, alpha, beta, nu), empirical quantiles, JSONB `path` column (quantile path k=1..h for the actual-vs-forecast chart).
- `ingestion_runs` — data repair logs & zero-volume warnings.
- `api_keys` — owned by gateway. **ONLY for the admin endpoint** (`POST /v1/admin/refresh`). NOT for public users.
- `users` / sessions / passwords — **NOT built in MVP.** Public dashboard without login (see section 9). User login = V2+.

Postgres is shared BUT per-service table ownership is strict: gateway never queries `forecast_*` tables. No cross-owner queries.

---

## 4. Daily Fit Flow (To Be Coded)

1. `ingestion`: fetch yfinance → apply validation/repair rules → write canonical prices to Postgres.
2. On success → call `ml-service.ComputeForecast(instrument_id, as_of_date)` per active instrument.
3. ml-service reads adjusted returns up to `as_of_date`, for $h \in \{7, 30\}$:
   - M1 = last close + empirical interval (historical h-day returns, last 750).
   - M2 = fit GARCH-t, mean h-day forecast variance.
   - M3 = vol-implied probability using θ from registry.
4. Write to `forecast_runs`/`forecasts`. Gateway reads via gRPC `GetForecast` (Redis cached).
5. GARCH fit failure → EWMA/constant variance fallback, status `degraded`. GOTO/DCII → long-run variance + "low reliability" badge.

**Backfill for the actual-vs-forecast chart:** `BackfillForecasts` repeats `ComputeForecast` backward (~100 origins). UI labels: historical = "walk-forward (backtest, out-of-sample)", forward = "forecast". Both are clearly labeled.

**Mandatory golden test:** fixed price fixture → ml-service output = notebook output within tolerance. ml-service forecasting code = separate copy from the notebook (split-ready rule: no shared code across folders).

---

## 5. Repository Structure (Monorepo `kairos`, MIT)

```
api/{proto,openapi}
services/{gateway,ml-service,ingestion}   # each service: Dockerfile, own deps, README; non-root multi-stage
ml/{notebooks,src,configs}                # research, NOT in production images
web
deploy/{compose,caddy,k8s}
config
docs/{architecture,adr,prd}
scripts
data            # gitignored
.github/workflows
AGENTS.md  LICENSE  SECURITY.md  CONTRIBUTING.md  .env.example
```

Split-ready rules: no imports across service folders; communication only via contracts (.proto/OpenAPI) + network; config via env vars; per-service CI (path filters); Conventional Commits scoped per service.

---

## 6. Engineering Principles (Enforced from First Commit)

- Stateless, 12-factor, health/readiness (including gRPC health), SIGTERM graceful shutdown, JSON logs to stdout, request-id propagated via gRPC metadata.
- Non-root, multi-stage, version-tagged images. Models/data separated from images.
- K8s-ready, though MVP deployment = Docker Compose.

**Security (repo will be public):**
- Secret scanning + push protection; gitleaks pre-commit + CI from the first commit.
- Complete `.gitignore` + `.env.example`; NO committed datasets/model artifacts.
- Dependabot, CodeQL, branch protection (PR required + green CI), Trivy image scanning.
- NSG: only 80/443; SSH keys + IP allowlist; Postgres/Redis NOT exposed.
- Secrets in VM `.env` file (`chmod 600`) + GitHub Environments (required reviewers) for CI.
- Pin third-party Actions to commit SHAs; minimal permissions per workflow; no `pull_request_target`.
- NO Azure IPs, subscription IDs, or resource names in public docs/repo.

**Abuse/spam protection (public read-only dashboard):**
- Attack surface = purely read-only. No login, no user writes, no user requests that trigger model fitting (fitting = daily batch). Views = small row `SELECT` + cache → lightweight.
- Per-IP rate limiting at gateway (token bucket) [MVP MANDATORY].
- Aggressive Redis caching + `Cache-Control`/ETag (data changes 1×/day) → bots hammering the same endpoint hit cache, near-zero Postgres cost [MVP MANDATORY].
- Fronting Caddy: request body size limits, timeouts; optional additional rate limiting at proxy.
- `POST /v1/admin/refresh` = the only expensive action → gated by API key + IP allowlist.
- NOT for MVP (over-engineering): WAF, CAPTCHA, CDN, user auth.
- **Known limitation (documented, not solved in MVP):** per-IP rate limiting does not stop distributed DDoS (many IPs). Accepted risk for a portfolio project; mitigation (CDN/WAF) = V2+.

---

## 7. ADRs to Write

1. Monorepo for MVP, split-ready by design
2. Single VM + Docker Compose for MVP demo; Container Apps/AKS as roadmap
3. GitHub Actions instead of Jenkins
4. Market-agnostic core, IDX as first market
5. Batch forecast stored in DB, not online inference
6. Proto generated at build, not committed
7. PostgreSQL plain, no broker
8. Backfilled walk-forward for the actual-vs-forecast chart
9. **Nightly batch fit, no on-demand training (lazy = V2+)**
10. **gRPC-only ml-service (no FastAPI); REST only at gateway**
11. ml-service serving = fit procedure, not serialized model (`H_PROD` = 7 AND 30)

---

## 8. Execution Order (Not Figma First)

1. Lock API/data contracts (sections 2–3) — source of truth.
2. Deploy hello-world no later than **Nov 14**: gateway → ml-service stub → Postgres, via Caddy + HTTPS.
3. Parallel backend + frontend development against contracts (frontend uses schema-compliant dummy data).
4. Lo-fi wireframe (not hi-fi) + mandatory states list: loading, error, empty, **insufficient-data**, "data as of", disclaimer.
5. Hi-fi Figma + design system = [MVP IF TIME PERMITS].

Cut-line: if behind schedule at the end of Nov 14 → drop LSTM & hi-fi Figma BEFORE sacrificing cloud deployment & baseline quality.

---

## 9. Open Questions (To Decide Before/During Coding)

1. ~~Public dashboard without login?~~ **DECIDED (Nov 13): public without login.** Users only view. No `users`/sessions/passwords table in MVP. `api_keys` is strictly for the admin endpoint. Protection = per-IP rate limiting + aggressive caching + gated admin endpoint (see section 6, "Abuse/spam protection").
2. Ingestion cron schedule vs. IDX market close (verify).
3. Azure DNS label `*.<region>.cloudapp.azure.com` for Caddy HTTPS (verify in portal; never include in public docs).

---

## 10. Needs Verification (Do Not Trust Unverified Claims)

- yfinance ToS & behavior from datacenter IPs (not yet tested from Colab/VM).
- Remaining Azure for Students credit; B-series SKU availability in `indonesiacentral` (`az vm list-skus`, `az vm list-usage`).
- GitHub Actions minutes quota & security features on private repos for Free/Student Pack accounts.
- IDX ARA/ARB (auto-rejection) rules per historical period.
- Work ownership terms (Vinix) + university IP policy → blocker for making the repo public (public no earlier than Nov 19).

---

**Coding session starter prompt:** "Continue KAIROS from this handover. Start backend coding: scaffold the monorepo (section 5), proto/OpenAPI contracts (section 2), then hello-world gateway→ml-service→Postgres for the Nov 14 deployment. ml-service = pure gRPC (grpcio), not FastAPI."
