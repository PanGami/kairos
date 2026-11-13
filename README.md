# KAIROS

**A Market Intelligence & Volatility Forecasting Platform**
_Case Study: IDX Digital Infrastructure Equities (TLKM, GOTO, DCII)_

> Brief asli: Web-App Prediksi Volatilitas dan Tren Harga Saham Sektor Infrastruktur Digital BEI Menggunakan Time-Series Forecasting.

KAIROS adalah dashboard **end-of-day** yang menampilkan estimasi ketidakpastian (rentang harga, volatilitas, probabilitas koreksi) untuk horizon 7 dan 30 hari. Prediksi dihitung sekali setelah pasar tutup dan disimpan — dashboard hanya membaca hasil tersimpan.

**KAIROS adalah pemantau risiko, bukan peramal harga. Bukan nasihat investasi dan bukan sinyal beli/jual.**

## Arsitektur singkat

| Unit | Bahasa | Peran |
| --- | --- | --- |
| `web` | React + TypeScript (Vite) | Dashboard statis (disajikan Caddy) |
| `gateway` | Go | REST ke browser, rate limit, cache Redis, panggil ml-service via gRPC |
| `ml-service` | Python (grpcio) | Fit GARCH-t + interval empiris + M3 vol-implied; pemilik tabel forecast |
| `ingestion` | Python | Job terjadwal: yfinance → validasi → `prices_daily` → picu `ComputeForecast` |

Infra: PostgreSQL (sumber kebenaran), Redis (cache), Caddy (TLS), Docker Compose.

Dokumen: [`docs/prd/PRD.md`](docs/prd/PRD.md) · [`docs/adr/ADR.md`](docs/adr/ADR.md) · kontrak di [`api/`](api/).

## Jalankan di lokal

```bash
cp .env.example .env     # isi nilainya untuk lokal
docker compose up --build
# gateway health:
curl http://localhost:8080/healthz
```

## Struktur

```
api/{proto,openapi}        kontrak (sumber kebenaran)
services/{gateway,ml-service,ingestion}
web/                       frontend React + TS (Vite)
ml/                        riset (notebook) — TIDAK masuk image produksi
deploy/{compose,caddy,k8s}
docs/{architecture,adr,prd}
config/                    konfigurasi bursa/instrumen
```

## Data & Attribution

Proyek ini memakai data pasar dari sumber pihak ketiga untuk tujuan **edukasi/portofolio, non-komersial**:
- Kaggle dataset `eren2222/indonesia-stock-exchange-idx-historical-price`
- Yahoo Finance via library `yfinance`

Kedua sumber **tidak dilisensikan ulang** oleh proyek ini; pengguna wajib mematuhi ketentuan asli masing-masing. Ketentuan yfinance dan Kaggle **perlu diverifikasi** sebelum rilis publik. **KAIROS bukan nasihat investasi dan bukan sinyal beli/jual.**

## Lisensi

[MIT](LICENSE).

## Status

MVP dalam pengembangan. Lihat PRD bagian 13 untuk roadmap V1 → V3.
