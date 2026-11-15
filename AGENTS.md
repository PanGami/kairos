# AGENTS.md — Rules for AI Agents & Contributors

This document is binding for Kiro, Gemini, Claude, and human contributors.

## Principles

- Product = end-of-day risk monitor. NOT a price predictor, NOT buy/sell signals. Do not add "real-time" or "enterprise" claims.
- AI-generated ML code MUST be verified (permutation/leakage tests) before results are trusted.
- Distinguish measured facts vs. hypotheses. Do not fabricate numbers.

## Split-Ready Rules (MANDATORY)

- Each service is self-contained: its own dependency file, Dockerfile, and README.
- Cross-service folder imports are FORBIDDEN. Communication happens strictly via contracts (`.proto`/OpenAPI) and network.
- Configuration via environment variables (see `.env.example`).
- Forecasting code in `services/ml-service` is a SEPARATE COPY from `ml/` (notebooks). Consistency is enforced via golden tests, not shared code.

## Contracts

- `api/proto/**` and `api/openapi/**` = source of truth. Update contracts first, then implement.
- Proto stubs are GENERATED at build time (buf), NOT committed. `buf breaking` runs in CI.
- Exchange-neutral proto package: `kairos.forecast.v1` (no IDX-specific terms).

## PostgreSQL Table Ownership (Single DB, Strict Ownership)

- ingestion: `instruments`, `prices_daily`, `ingestion_runs`
- ml-service: `model_specs`, `forecast_runs`, `forecasts`
- gateway: `api_keys` (admin only)
- Cross-owner queries are FORBIDDEN. Gateway reads forecasts via gRPC, not SQL.

## Engineering

- Stateless, 12-factor, SIGTERM graceful shutdown, JSON logs to stdout, request-id propagated via gRPC metadata.
- Non-root, multi-stage, version-tagged images. Health/readiness includes gRPC health.

## Security (Repository Will Be Public)

- DO NOT commit `data/`, model artifacts, or `.env`. gitleaks in pre-commit + CI.
- No Azure IPs, subscription IDs, or resource names in the repository.
- Conventional Commits scoped per service, e.g., `feat(gateway): ...`, `fix(ml-service): ...`.

## Locked Decisions (see docs/adr/ADR.md)

- Split-ready monorepo (ADR-001), single VM + Compose (ADR-002), GitHub Actions (ADR-003).
- Market-agnostic core (ADR-004), batch forecast stored in DB (ADR-005), proto generated at build (ADR-006).
- PostgreSQL + Redis cache, no message broker (ADR-007). Nightly batch fit, no on-demand training (ADR-009).
- Pure gRPC ml-service, NOT FastAPI (ADR-010). Serving = fit procedure, not serialized model files (ADR-011).
- Public read-only dashboard without login (ADR-012). yfinance primary, Kaggle for repair (ADR-013).
- Models: random walk (M1), GARCH-t (M2), vol-implied (M3) (ADR-014).
