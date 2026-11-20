# KAIROS

**A Market Intelligence & Volatility Forecasting Platform**
_Case Study: IDX Digital Infrastructure Equities (TLKM, GOTO, DCII)_

> Original brief: Web-App for Volatility and Price Trend Prediction of IDX Digital Infrastructure Sector Stocks Using Time-Series Forecasting.

KAIROS is an **end-of-day** dashboard that displays calibrated uncertainty estimates (price ranges, volatility, correction probability) for 7- and 30-day horizons. Forecasts are computed once after market close and stored — the dashboard only reads stored results.

**KAIROS is a risk monitor, not a price predictor. It is not investment advice and does not provide buy/sell signals.**

## Architecture Overview

| Unit | Language | Role |
| --- | --- | --- |
| `web` | React + TypeScript (Vite) | Static dashboard (served by Caddy) |
| `gateway` | Go | REST to browser, rate limiting, Redis cache, Turnstile CAPTCHA, calls gRPC services |
| `auth-service` | Go | gRPC authentication, Google OAuth, OTP email verification, session & admin management |
| `ml-service` | Python (grpcio) | Fits GARCH-t + empirical intervals + vol-implied M3; owns forecast tables |
| `ingestion` | Python | Scheduled job: yfinance → validation → `prices_daily` → triggers `ComputeForecast` |

Infra: PostgreSQL (source of truth), Redis (cache), Caddy (TLS), Docker Compose.

Docs: [`AGENTS.md`](AGENTS.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/DESIGN.md`](docs/DESIGN.md) · contracts in [`api/`](api/).

## Run Locally

```bash
cp .env.example .env     # adjust values if needed (defaults work out of the box)
docker compose -f docker-compose.local.yml up -d --build
# dashboard + reverse-proxied API (Caddy):
curl http://localhost/v1/instruments
# gateway direct health:
curl http://localhost:8080/healthz
```

`Makefile` shortcuts: `make up`, `make ingest`, `make test` (`test-python`, `test-go`, `test-web`), `make proto`, `make proto-breaking`.

## Structure

```
api/{proto,openapi}        contracts (source of truth)
services/{gateway,ml-service,ingestion,auth-service}
web/                       React + TS frontend (Vite)
ml/                        research (notebooks) — NOT included in production images
deploy/{caddy,db}          Caddy reverse proxy config and PostgreSQL schema/seed
docs/{ARCHITECTURE.md,DESIGN.md}
docker-compose.{local,production}.yml
```

## Contributing & Security

- **Workflow**: Binding rules live in [`AGENTS.md`](AGENTS.md). Update contracts (`api/proto`, `api/openapi`) first, work on short-lived branches off `main`, keep cross-service imports strictly forbidden, and use Conventional Commits scoped per service (`feat(gateway): ...`, `fix(ml-service): ...`, `docs: ...`).
- **Vulnerability Reporting**: Please report security vulnerabilities privately via GitHub Security Advisories on this repository rather than opening public issues.
- **Repository Practices**: `.env`, `data/`, model artifacts, and generated proto stubs are never committed. CI (`.github/workflows/ci.yml`) enforces `gitleaks`, `buf lint`, Python/Go unit & golden tests, frontend build, and Docker Compose + `Trivy` (`HIGH,CRITICAL` vuln/misconfig/secret) scanning; `.github/dependabot.yml` keeps dependencies updated. Per-IP and auth rate limiting, Cloudflare Turnstile CAPTCHA, SHA-256 hashed session tokens, and API-key-gated `/v1/admin/refresh` are enforced; distributed DDoS mitigation (CDN/WAF) is planned for V2+.

## Data & Attribution

This project uses market data from third-party sources for **educational/portfolio, non-commercial** purposes:
- Kaggle dataset `eren2222/indonesia-stock-exchange-idx-historical-price`
- Yahoo Finance via the `yfinance` library

Neither source is **re-licensed** by this project; users must comply with each provider's original terms. The terms of use for yfinance and Kaggle **require verification** prior to public release. **KAIROS is not investment advice and does not provide buy/sell signals.**

## Author

- **Panca Nugraha Wicaksana** ([@PanGami](https://github.com/PanGami)) · `pancanugrahawicaksana@gmail.com`

## License

[MIT](LICENSE).

## Status

`v1.0.0` ready (end-of-day risk monitor, walk-forward backfill, authentication/admin management, and Docker Compose deployment). See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system architecture, service reference, ADRs, and the V2+ roadmap.
