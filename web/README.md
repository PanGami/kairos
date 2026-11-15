# KAIROS web

End-of-day risk monitor dashboard (React + TypeScript + Vite + lightweight-charts). Built to static assets and served by Caddy, which also reverse-proxies `/v1/*` to the gateway (ADR-015).

Not a price predictor and not buy/sell signals.

## Layout

| Folder | Responsibility |
| --- | --- |
| `src/main.tsx` | Bootstrap only |
| `src/routes/` | Route tables per domain |
| `src/pages/` | Page composition |
| `src/components/` | Presentational UI |
| `src/hooks/` | Data/state hooks |
| `src/services/` | API calls per domain (`*.service.ts`) |
| `src/utils/` | Pure helpers |
| `src/types/` | API contract types (mirror `api/openapi/kairos.v1.yaml`) |

## Dev

```
npm install
npm run dev     # proxies /v1 to VITE_GATEWAY_URL (default http://localhost:8080)
```
