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
| `gateway` | Go | REST to browser, rate limiting, Redis cache, calls ml-service via gRPC |
| `ml-service` | Python (grpcio) | Fits GARCH-t + empirical intervals + vol-implied M3; owns forecast tables |
| `ingestion` | Python | Scheduled job: yfinance → validation → `prices_daily` → triggers `ComputeForecast` |

Infra: PostgreSQL (source of truth), Redis (cache), Caddy (TLS), Docker Compose.

Docs: [`docs/prd/PRD.md`](docs/prd/PRD.md) · [`docs/adr/ADR.md`](docs/adr/ADR.md) · contracts in [`api/`](api/).

## Run Locally

```bash
cp .env.example .env     # adjust values if needed (defaults work out of the box)
docker compose -f docker-compose.local.yml up -d --build
# dashboard + reverse-proxied API (Caddy):
curl http://localhost/v1/instruments
# gateway direct health:
curl http://localhost:8080/healthz
```

## Structure

```
api/{proto,openapi}        contracts (source of truth)
services/{gateway,ml-service,ingestion}
web/                       React + TS frontend (Vite)
ml/                        research (notebooks) — NOT included in production images
deploy/{compose,caddy,k8s}
docs/{architecture,adr,prd}
config/                    exchange/instrument configuration
```

## Data & Attribution

This project uses market data from third-party sources for **educational/portfolio, non-commercial** purposes:
- Kaggle dataset `eren2222/indonesia-stock-exchange-idx-historical-price`
- Yahoo Finance via the `yfinance` library

Neither source is **re-licensed** by this project; users must comply with each provider's original terms. The terms of use for yfinance and Kaggle **require verification** prior to public release. **KAIROS is not investment advice and does not provide buy/sell signals.**

## License

[MIT](LICENSE).

## Status

MVP in development. See PRD section 13 for the V1 → V3 roadmap.
