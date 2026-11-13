# AGENTS.md — Aturan untuk agen AI & kontributor

Dokumen ini mengikat untuk Kiro, Gemini, Claude, dan kontributor manusia.

## Prinsip

- Produk = pemantau risiko end-of-day. BUKAN peramal harga, BUKAN sinyal beli/jual. Jangan menambah klaim "real-time" atau "enterprise".
- Kode ML buatan AI WAJIB diverifikasi (uji permutasi/leakage) sebelum hasilnya dipercaya.
- Tandai fakta terukur vs hipotesis. Jangan mengarang angka.

## Aturan split-ready (WAJIB)

- Tiap service mandiri: dependency file sendiri, Dockerfile, README sendiri.
- DILARANG import lintas folder service. Komunikasi hanya lewat kontrak (`.proto`/OpenAPI) dan jaringan.
- Konfigurasi via environment variable (lihat `.env.example`).
- Kode forecasting di `services/ml-service` adalah SALINAN TERPISAH dari `ml/` (notebook). Konsistensi dijaga golden test, bukan berbagi kode.

## Kontrak

- `api/proto/**` dan `api/openapi/**` = sumber kebenaran. Ubah kontrak dulu, baru implementasi.
- Stub proto DIGENERATE saat build (buf), TIDAK di-commit. `buf breaking` di CI.
- Package proto netral: `kairos.forecast.v1` (tanpa istilah IDX).

## Kepemilikan tabel PostgreSQL (satu DB, kepemilikan ketat)

- ingestion: `instruments`, `prices_daily`, `ingestion_runs`
- ml-service: `model_specs`, `forecast_runs`, `forecasts`
- gateway: `api_keys` (admin saja)
- DILARANG query lintas pemilik. Gateway membaca forecast lewat gRPC, bukan SQL.

## Engineering

- Stateless, 12-factor, graceful shutdown SIGTERM, log JSON ke stdout, request-id via metadata gRPC.
- Image non-root, multi-stage, bertag versi. Health/readiness termasuk gRPC health.

## Keamanan (repo akan publik)

- JANGAN commit `data/`, artefak model, atau `.env`. gitleaks pre-commit + CI.
- Tanpa IP/subscription ID/nama resource Azure di repo.
- Conventional Commits dengan scope per service, mis. `feat(gateway): ...`, `fix(ml-service): ...`.

## Keputusan terkunci (lihat docs/adr/ADR.md)

- Monorepo split-ready (ADR-001), single VM + Compose (ADR-002), GitHub Actions (ADR-003).
- Market-agnostic core (ADR-004), batch forecast tersimpan (ADR-005), proto generate saat build (ADR-006).
- PostgreSQL + Redis cache, tanpa broker (ADR-007). Nightly batch fit, tanpa on-demand (ADR-009).
- ml-service gRPC murni, BUKAN FastAPI (ADR-010). Serving = prosedur fit, bukan file model (ADR-011).
- Dashboard publik tanpa login (ADR-012). yfinance primer, Kaggle perbaikan (ADR-013).
- Model: random walk (M1), GARCH-t (M2), vol-implied (M3) (ADR-014).
