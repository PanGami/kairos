# KAIROS — Handover untuk Mulai Coding Backend

Per Jumat, 13 November 2026. Dokumen ini mandiri dan menggantikan handover sebelumnya untuk keperluan memulai backend. Keputusan model, data, dan hasil walk-forward sudah final (tidak diulang penuh di sini — rujuk dokumen handover versi 12/13 Nov untuk detail angka). Bahasa kerja: Indonesia (istilah teknis boleh Inggris).

Lampiran terkait: `kairos_walkforward.py`, `canonical.parquet` (v2), `final_project_EDA.ipynb` (bagian walk-forward lama TIDAK VALID — jangan dipakai).

---

## 0. Status keputusan (yang sudah terkunci)

**Produk:** KAIROS — pemantau risiko dengan estimasi ketidakpastian terkalibrasi. BUKAN peramal harga, BUKAN sinyal beli/jual. End-of-day (bukan real-time). Case study: IDX digital infra (TLKM, GOTO, DCII).

**Posisi model (final 13 Nov):**
- M1 (harga): titik tengah = naive / random walk. XGBoost & ARIMA ditolak untuk titik tengah. Output = harga terakhir + interval.
- Interval M1 80% = **empiris** (default). GARCH-normal cadangan.
- M2 (volatilitas): GARCH-t. Terbukti hanya untuk TLKM; GOTO & DCII pakai varians jangka panjang + badge "keandalan rendah".
- M3 (probabilitas koreksi): **vol-implied** (tanpa pelatihan), setara XGBoost. θ dari registry (aturan 0,85·σ_awal·√h, dibekukan).
- XGBoost hanya kembali sebagai challenger bila terbukti stabil (M2 TLKM / M3 DCII h30). TIDAK di MVP.

**Serving V1:** tidak ada file model. "Model" = prosedur fit (GARCH-t + interval empiris + M3 vol-implied) + parameter per run, disimpan di DB.

---

## 1. Arsitektur backend (untuk mulai coding)

**3 unit deploy:**
1. `gateway` (Go) — REST/JSON ke browser, auth/rate limit, cache Redis, panggil ml-service via gRPC.
2. `ml-service` (Python) — **server gRPC murni (grpcio), BUKAN FastAPI**. Pemilik tabel `forecast_*` dan `model_specs`. Mengekspos `GetForecast`, `ListInstruments`, `ComputeForecast`. HTTP hanya untuk health probe.
3. `ingestion` (Python) — job sekali jalan (bukan service hidup). Pemilik tabel `prices_*` dan `instruments`. Setelah ingest sukses → panggil `ComputeForecast` per instrumen aktif.

Frontend = file statis disajikan Caddy (tanpa container nginx terpisah).

**Kenapa ml-service bukan FastAPI:** komunikasi antar-service = gRPC (sudah dikunci). ml-service tidak pernah dipanggil browser. Menambah FastAPI = dua protokol tanpa alasan. Health check cukup gRPC health protocol atau endpoint stdlib kecil.

**Datastore:**
- PostgreSQL = sumber kebenaran (harga, forecast, instrumen, run). Bagian semi-terstruktur (jalur kuantil, parameter GARCH) di kolom JSONB.
- Redis = cache respons `GetForecast` (invalidate saat run sukses) + counter rate limit. Boleh hilang kapan saja.
- TidakK: MongoDB, broker, time-series DB, managed DB (semua V2+).

**Penjadwalan:** systemd timer / cron di VM → `docker compose run --rm ingestion`. Jalan pagi WIB hari bursa, buang candle hari berjalan, `as_of_date` = D-1 deterministik. (Jam persis vs jam tutup BEI perlu diverifikasi.)

**Strategi fit (keputusan 13 Nov):**
- MVP = **fit batch harian** untuk 3–4 ticker aktif. Idempoten, kunci unik `(instrument_id, as_of_date, spec_version)` + upsert. Kegagalan 1 instrumen → status `failed`/`degraded`, tidak menghentikan yang lain.
- Lazy / compute-on-first-request = **V2+** (butuh single-flight lock, antrean, status pending, kuota anti-abuse). Tidak dibangun di MVP.
- Skala besar (puluhan ribu+ instrumen) = hibrida tier hot/warm/cold + antrean + worker horizontal + partisi penyimpanan. Studi kelayakan, bukan MVP. Skala "1 juta" butuh penyedia data berlisensi (yfinance tidak cukup).

---

## 2. Kontrak API (sumber kebenaran)

Package proto netral: `kairos.forecast.v1` (tanpa istilah IDX).

```proto
service ForecastService {
  rpc GetForecast(GetForecastRequest) returns (GetForecastResponse);
  rpc ListInstruments(ListInstrumentsRequest) returns (ListInstrumentsResponse);
  rpc ComputeForecast(ComputeForecastRequest) returns (ComputeForecastResponse); // internal
}

message GetForecastRequest { string instrument_id = 1; int32 horizon_days = 2; } // h = 7 | 30
```

REST di gateway:
- `GET /v1/instruments`
- `GET /v1/instruments/{id}/forecast?h=7|30`
- `GET /v1/instruments/{id}/history`
- `POST /v1/admin/refresh` (API key)
- `GET /healthz`, `GET /readyz`

Respons forecast WAJIB memuat: median (= harga terakhir), kuantil interval (80%/95%), vol harian & tahunan + pita, probabilitas koreksi + base rate bergulir, `as_of_date`, `status` (ok|degraded|failed), badge keandalan.

**Stub proto digenerate saat build** (buf, versi dipin), TIDAK di-commit. `buf breaking` di CI.

---

## 3. Model data (skema awal)

- `instruments` — **registry**: id internal (`IDX:TLKM`), symbol, MIC, currency, timezone, mapping simbol per provider (`TLKM.JK`), `status` (active|paused|insufficient_data|delisted), tier, `reliability_tier`. "Universe aktif" = `status=active`. Job hanya iterasi daftar ini. Tambah ticker = tambah baris/konfigurasi, bukan ubah kode.
- `prices_daily` — skema kanonik v2: `instrument_id`, `trade_date`, `open`, `high`, `low`, `close`, `adj_close`, `volume`, `currency`, `source` (yfinance|kaggle_repair), `is_traded`, `adj_factor`.
- `model_specs` — registry model (dibekukan saat onboarding): kunci `(instrument_id, target, horizon, spec_version)`; isi: θ M3, burn-in, kebijakan reliabilitas, metrik walk-forward.
- `forecast_runs` — `as_of_date`, git SHA, hash/jendela data, `status`, durasi.
- `forecasts` — nilai (median, kuantil interval, vol harian/tahunan, probabilitas), parameter GARCH (omega, alpha, beta, nu), kuantil empiris, kolom JSONB `path` (jalur kuantil k=1..h untuk grafik aktual-vs-forecast).
- `ingestion_runs` — log perbaikan data & peringatan volume 0.
- `api_keys` — milik gateway. **HANYA untuk endpoint admin** (`POST /v1/admin/refresh`). BUKAN untuk user publik.
- `users` / sesi / password — **TIDAK dibangun di MVP.** Dashboard publik tanpa login (lihat bagian 11). Login pengguna = V2+.

Postgres dipakai bersama TAPI kepemilikan tabel per service ketat: gateway tidak pernah query tabel `forecast_*`. Tanpa query lintas pemilik.

---

## 4. Alur fit harian (yang di-coding)

1. `ingestion`: ambil yfinance → terapkan aturan validasi/perbaikan → tulis harga kanonik ke Postgres.
2. Setelah sukses → `ml-service.ComputeForecast(instrument_id, as_of_date)` per instrumen aktif.
3. ml-service baca return teradjust s.d. `as_of_date`, untuk h ∈ {7,30}:
   - M1 = close terakhir + interval empiris (h-day return historis, 750 terakhir).
   - M2 = fit GARCH-t, rata-rata varians prakiraan h hari.
   - M3 = probabilitas vol-implied dengan θ dari registry.
4. Tulis ke `forecast_runs`/`forecasts`. Gateway baca via gRPC `GetForecast` (Redis cache).
5. Fit GARCH gagal → fallback EWMA/varians konstan, status `degraded`. GOTO/DCII → varians jangka panjang + badge "keandalan rendah".

**Backfill untuk grafik aktual-vs-forecast:** `BackfillForecasts` mengulang `ComputeForecast` mundur (~100 origin). UI label: historis = "walk-forward (backtest, out-of-sample)", ke depan = "forecast". Keduanya diberi label jelas.

**Golden test wajib:** fixture harga tetap → output ml-service = output notebook dalam toleransi. Kode forecasting ml-service = salinan terpisah dari notebook (aturan split-ready: tidak berbagi kode lintas folder).

---

## 5. Struktur repo (monorepo `kairos`, MIT)

```
api/{proto,openapi}
services/{gateway,ml-service,ingestion}   # tiap service: Dockerfile, deps sendiri, README; non-root multi-stage
ml/{notebooks,src,configs}                # riset, BUKAN di image produksi
web
deploy/{compose,caddy,k8s}
config
docs/{architecture,adr,prd}
scripts
data            # gitignored
.github/workflows
AGENTS.md  LICENSE  SECURITY.md  CONTRIBUTING.md  .env.example
```

Aturan split-ready: tanpa import lintas folder service; komunikasi hanya lewat kontrak (.proto/OpenAPI) + jaringan; konfigurasi via env var; CI per service (path filter); Conventional Commits scope per service.

---

## 6. Prinsip engineering (dipatuhi sejak commit pertama)

- Stateless, 12-factor, health/readiness (termasuk gRPC health), graceful shutdown SIGTERM, log JSON ke stdout, request-id dipropagasi via metadata gRPC.
- Image non-root, multi-stage, bertag versi. Model/data terpisah dari image.
- K8s-ready tapi deploy MVP = Docker Compose.

**Keamanan (repo akan publik):**
- Secret scanning + push protection; gitleaks pre-commit + CI sejak commit pertama.
- `.gitignore` lengkap + `.env.example`; TANPA commit dataset/artefak model.
- Dependabot, CodeQL, branch protection (PR wajib + CI hijau), Trivy scan.
- NSG: hanya 80/443; SSH key + batas IP; Postgres/Redis TIDAK terekspos.
- Secret di file `.env` VM (chmod 600) + GitHub Environments (required reviewer) untuk CI.
- Pin Actions pihak ketiga ke SHA; permissions minimal per workflow; tanpa `pull_request_target`.
- TANPA IP/subscription ID/nama resource Azure di dokumen/repo publik.

**Perlindungan abuse/spam (dashboard publik baca-saja):**
- Permukaan serang = murni baca. Tidak ada login, tidak ada tulisan user, tidak ada request user yang memicu fit model (fit = batch harian). View = `SELECT` baris kecil + cache → ringan.
- Rate limit per IP di gateway (token bucket) [WAJIB MVP].
- Cache Redis agresif + `Cache-Control`/ETag (data berubah 1×/hari) → bot yang hammer endpoint sama kena cache, nyaris nol biaya ke Postgres [WAJIB MVP].
- Caddy depan: batas ukuran request, timeout; bisa rate limit tambahan di proxy.
- `POST /v1/admin/refresh` = satu-satunya aksi mahal → API key + batas IP.
- TIDAK untuk MVP (over-engineering): WAF, CAPTCHA, CDN, auth user.
- **Limitation diketahui (dicatat, bukan diselesaikan):** rate-limit-per-IP tidak menahan DDoS terdistribusi (banyak IP). Risiko diterima untuk proyek portofolio; mitigasi (CDN/WAF) = V2+.

---

## 7. ADR yang perlu ditulis

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
11. ml-service serving = fit procedure, not serialized model (H_PROD = 7 DAN 30)

---

## 8. Urutan kerja (bukan Figma dulu)

1. Kunci kontrak API/data (bagian 2–3) — sumber kebenaran.
2. Deploy hello-world paling lambat **14 Nov**: gateway → ml-service stub → Postgres, lewat Caddy + HTTPS.
3. Backend + frontend paralel terhadap kontrak (frontend pakai dummy sesuai skema).
4. Wireframe lo-fi (bukan hi-fi) + daftar state wajib: loading, error, empty, **insufficient-data**, "data as of", disclaimer.
5. Figma hi-fi + design system = [MVP JIKA SEMPAT].

Cut-line: bila tertinggal akhir 14 Nov → buang LSTM & Figma hi-fi SEBELUM mengorbankan deploy cloud & kualitas baseline.

---

## 9. Pertanyaan terbuka (perlu diputuskan sebelum/selama coding)

1. ~~Dashboard publik tanpa login?~~ **DIPUTUSKAN (13 Nov): publik tanpa login.** User hanya view. Tidak ada tabel `users`/sesi/password di MVP. `api_keys` hanya untuk endpoint admin. Perlindungan = rate limit per IP + cache agresif + endpoint admin berpagar (lihat bagian 6, "Perlindungan abuse/spam").
2. Jam cron ingestion vs jam tutup BEI (verifikasi).
3. Label DNS Azure `*.<region>.cloudapp.azure.com` untuk HTTPS Caddy (verifikasi di portal; jangan masuk dokumen publik).

---

## 10. Perlu diverifikasi (jangan dipercaya dari dokumen)

- yfinance ToS & perilaku dari IP datacenter (belum diuji dari Colab/VM).
- Sisa kredit Azure for Students; ketersediaan SKU B-series di indonesiacentral (`az vm list-skus`, `az vm list-usage`).
- Kuota GitHub Actions & fitur keamanan repo private akun Free/Student Pack.
- Aturan ARA/ARB BEI per periode.
- Kepemilikan hasil karya (Vinix) + kebijakan IP kampus → blocker publikasi repo (publik paling cepat 19 Nov).

---

**Prompt pembuka sesi coding:** "Lanjutkan KAIROS dari handover ini. Mulai coding backend: scaffold monorepo (bagian 5), kontrak proto/OpenAPI (bagian 2), lalu hello-world gateway→ml-service→Postgres untuk deploy 14 Nov. ml-service = gRPC murni (grpcio), bukan FastAPI."
