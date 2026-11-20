# KAIROS web

End-of-day risk monitor dashboard (React + TypeScript + Vite + lightweight-charts). Built to static assets and served by Caddy, which also reverse-proxies `/v1/*` to the gateway (ADR-015).

Not a price predictor and not buy/sell signals.

## Design Specification (MANDATORY)

All UI components, themes, color tokens, typography, and page structures MUST follow [DESIGN.md](../docs/design/DESIGN.md):
- **Core Palette (60-30-10)**: Deep Institutional Slate Navy (`#0A101D` / `#111A2E`) + Quantitative Maritime Cyan-Blue (`#0EA5E9` / `#0284C7`) as connected main colors, with Sovereign Signal Amber (`#F59E0B` / `#D97706`) reserved strictly for Primary Action Buttons.
- **Zero Symbols / No Emoticons**: Never render emojis or decorative text symbols (`-`, `✓`, `★`, `🔒`, `⚠`, `•`) in UI surfaces; use clean uppercase typographic badges (`VERIFIED`, `UNVERIFIED`, `LOCKED`, `FEATURED TODAY`) instead.

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
