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
- auth-service: `users`, `user_sessions`
- gateway: `api_keys` (admin only)
- Cross-owner queries are FORBIDDEN. Gateway reads forecasts and auth sessions via gRPC, not SQL.

## Engineering & Code Organization (MANDATORY)

- **Large-Scale Codebase Mindset**: Always architect and write code assuming this project will scale into a large codebase. Prioritize dynamic configuration over hardcoding, high human-readability, and strict Single Responsibility Principle (SRP) so no file ever grows into hundreds or thousands of lines.
- Stateless, 12-factor, SIGTERM graceful shutdown, JSON logs to stdout, request-id propagated via gRPC metadata.
- Non-root, multi-stage, version-tagged images. Health/readiness includes gRPC health.
- **No Monolithic Files ("God Files")**: Never combine server bootstrap, routing, transport handlers, business/domain logic, inter-service communication, raw SQL/cache queries, and helper utilities into a single file. Keep files small, focused, and split by domain across every language in the stack (Go, Python, TypeScript/React):
  - **Bootstrap / Entrypoint** (`main.go`, `server.py`, `main.tsx`): Process startup, env/config wiring, and graceful shutdown only — never define route tables or endpoint mappings here.
  - **Routing Layer** (`routes/`, `routes/<domain>.routes.go`, `routes/<domain>.routes.ts`, `routes/<domain>_routes.py`): Dedicated `routes/` folder where URL/RPC route registrations (e.g., `mux.HandleFunc(...)`, router mounts) are split per domain/service (e.g., `instrument.routes.go`, `forecast.routes.go`, `admin.routes.go`, `health.routes.go`).
  - **Transport / Handlers / UI** (`handler/`, `servicer.py`, `components/`): Thin HTTP/gRPC request-response mapping or UI rendering; delegates immediately to `services/`. No raw SQL, no direct external RPC wiring, and no heavy domain math.
  - **Service & Inter-Service Communication Layer** (`services/<domain>.service.ts`, `services/<domain>.service.go`, `services/<domain>_service.py`): Dedicated `services/` folder per application where communication with other services (gRPC/REST clients, external providers) and domain orchestration are split per domain (e.g., `forecast.service.ts`, `instrument.service.ts`, `auth.service.ts`) — never cram all API/gRPC calls into one giant client or handler file.
  - **Domain / Core Logic** (`forecast.py`, `validator.py`, `domain/`): Pure business, modeling, or validation logic, decoupled from I/O so it can be unit-tested in isolation.
  - **Data Access / Repositories** (`db.py`, `repository/`, `cache/`): Database connections, SQL queries, and Redis operations, split by domain/table owner as queries grow.
  - **Shared Service Utilities** (`config.py`, `middleware/`, `utils/`): Reusable within-service helpers (structured logging, request-id propagation, rate limiting) to prevent duplicate helper functions.

## UI/UX & Frontend Design Rules (see docs/design/DESIGN.md)

- **Design Source of Truth**: All frontend UI, color tokens, typography, and page layouts MUST follow `docs/design/DESIGN.md`.
- **Zero-Symbol & No-Emoticon Rule**: Emoticons, emojis, and decorative symbols/glyphs (`-`, `—`, `✓`, `★`, `🔒`, `⚠`, `•`, etc.) are FORBIDDEN in UI labels, copy, badges, and buttons. Use pure typographic status pills (`VERIFIED`, `UNVERIFIED`, `LOCKED`, `FEATURED TODAY`) and structured layout spacing.
- **Core Color Rule (Stockbit-Referenced 60-30-10)**: Use Matte Carbon (`#121212` / `#181818` dark, `#F4F6F8` / `#FFFFFF` light) as 60% foundation, Stockbit Signature Emerald (`#00AB6B` dark / `#006B42` light) as 30% active brand accent and primary CTA highlight, and Financial Amber (`#F59E0B` dark / `#92400E` light) for 95% tail/warning thresholds.
- **Typography**: Use `'Plus Jakarta Sans'` (display headings at `600`/`700` and UI/body at `400`/`500`/`600`) and `'JetBrains Mono'` with `tabular-nums` (numeric data/tickers). Never use Inter, Roboto, or Arial.

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
