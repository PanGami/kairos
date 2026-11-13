# KAIROS: Architecture Decision Records (ADR)

Versi dokumen: 1.0 (13 November 2026)
Status dokumen: Accepted untuk MVP/V1. Item bertanda **Perlu verifikasi** belum dibuktikan.
Dokumen pendamping: `docs/prd/PRD.md`

Konvensi: setiap ADR berisi Status, Konteks, Keputusan, Alternatif, Konsekuensi, dan Pemicu tinjau ulang (kapan keputusan ini harus dibuka lagi). Fakta terukur dibedakan dari hipotesis. Tidak ada angka dari memori.

## Daftar ADR

| ID | Judul | Status |
| --- | --- | --- |
| ADR-001 | Monorepo for MVP, split-ready by design | Accepted |
| ADR-002 | Single VM + Docker Compose for MVP demo; Container Apps/AKS as roadmap | Accepted |
| ADR-003 | GitHub Actions instead of Jenkins | Accepted |
| ADR-004 | Market-agnostic core, IDX as first market | Accepted |
| ADR-005 | Batch forecast stored in DB, not online inference | Accepted |
| ADR-006 | Proto generated at build, not committed | Accepted |
| ADR-007 | PostgreSQL plain, Redis as cache only, no broker | Accepted |
| ADR-008 | Backfilled walk-forward for the actual-vs-forecast chart | Accepted |
| ADR-009 | Nightly batch fit, no on-demand training (lazy = V2) | Accepted |
| ADR-010 | gRPC-only ml-service (no FastAPI); REST only at gateway | Accepted |
| ADR-011 | Serving = fit procedure, not a serialized model | Accepted |
| ADR-012 | Public read-only dashboard, no user login | Accepted |
| ADR-013 | yfinance as primary source, Kaggle only for repair | Accepted |
| ADR-014 | Model selection: random walk (M1), GARCH-t (M2), vol-implied (M3) | Accepted |
| ADR-015 | Frontend served as static files by Caddy | Accepted |

---

## ADR-001: Monorepo for MVP, split-ready by design

**Status:** Accepted

**Konteks.** Satu pengembang, tiga sesi, repo publik untuk portofolio. Ada tiga service (gateway Go, ml-service Python, ingestion Python), satu frontend, dan kontrak bersama. Penilai ingin melihat microservices yang benar, tetapi overhead banyak repo tidak sebanding dengan manfaatnya sekarang.

**Keputusan.** Satu monorepo `kairos` (MIT, LICENSE sejak commit pertama; full open source). Setiap service mandiri sehingga bisa dipecah kapan saja:
- Dependency file sendiri (`go.mod` / `pyproject.toml` / `package.json`), Dockerfile, README.
- Tanpa import lintas folder service. Komunikasi hanya lewat kontrak (`.proto`, OpenAPI) dan jaringan.
- Konfigurasi via environment variable.
- CI per service dengan path filter. Conventional Commits dengan scope per service. Image bertag versi per service.
- Aturan ini ditulis juga di `AGENTS.md`.

**Alternatif.**
- Multi-repo sejak awal: isolasi bersih, tetapi sinkronisasi kontrak dan CI tiga kali lipat untuk solo developer.
- Monorepo dengan Bazel/Nx: terlalu berat untuk skala ini.

**Konsekuensi.**
- (+) Satu PR bisa mengubah kontrak dan kedua sisinya. Satu tempat untuk README dan arsitektur.
- (−) Disiplin batas harus ditegakkan manual dan lewat CI, karena tidak ada pemisah fisik.
- Kode forecasting di ml-service adalah salinan terpisah dari notebook di `ml/`. Konsistensi dijaga golden test, bukan berbagi kode.

**Jalur pemecahan.** `api/` lebih dulu (repo `kairos-api`, bertag versi), lalu tiap service lewat `git filter-repo`, terakhir `deploy/`.

**Pemicu tinjau ulang.** Lebih dari satu tim, siklus rilis service berbeda, atau waktu CI monorepo mengganggu.

**Branching.** Trunk-based: branch pendek, PR ke `main`, CI hijau wajib (branch protection).

---

## ADR-002: Single VM + Docker Compose for MVP demo; Container Apps/AKS as roadmap

**Status:** Accepted (angka kapasitas **perlu verifikasi**)

**Konteks.** Demo wajib live di Azure pada 16 dan 18 November. Kredit Azure for Students $100 (sisa perlu dicek di portal). Region yang diizinkan: malaysiawest, indonesiacentral, centralindia, eastasia, australiaeast (preferensi indonesiacentral, lalu eastasia, lalu malaysiawest). Semua resource satu region.

**Keputusan.** Satu VM B-series (titik awal 4 GB RAM) menjalankan Docker Compose: Caddy (TLS Let's Encrypt), frontend statis, gateway, ml-service, Redis, PostgreSQL (volume managed disk), dan job ingestion terjadwal. Backup `pg_dump` ke Azure Blob. Registry image = GHCR.

Dirancang K8s-ready agar migrasi tidak menulis ulang: stateless, 12-factor, health/readiness (termasuk gRPC health), graceful shutdown SIGTERM, service discovery via DNS, image non-root multi-stage bertag versi, log JSON ke stdout, data di luar container.

**Alternatif.**
- AKS: kontrol plane, node, dan operasi di luar anggaran dan waktu.
- Azure Container Apps: menarik, tetapi PostgreSQL/Redis tetap perlu diurus, dan biaya kurang bisa diprediksi.
- Managed PostgreSQL/Redis: biaya tetap terlalu besar terhadap kredit $100.
- ACR: GHCR sudah gratis dan cukup.

**Konsekuensi.**
- (+) Biaya terprediksi, satu mesin untuk di-debug, demo mudah dipulihkan lewat Compose lokal.
- (−) Titik tunggal kegagalan, tanpa HA. Diredam dengan cadangan demo berlapis: Compose lokal, video rekaman, screenshot.
- (−) Memori sempit. Perkiraan awal (**hipotesis**): Postgres ±300 MB, ml-service ±400–600 MB, Redis ±50 MB, gateway ±30 MB, Caddy ±30 MB. Wajib divalidasi dengan `docker stats`.
- Tindakan wajib: NSG hanya 80/443, SSH key + batas IP, Postgres/Redis tanpa port publik, budget alert $20/$50/$80, kebijakan deallocate/auto-shutdown (disk dan IP statis tetap ditagih).
- Verifikasi sebelum membuat resource: `az vm list-skus`, `az vm list-usage` untuk SKU B-series di region terpilih.

**HTTPS tanpa domain.** Label DNS pada public IP Azure (`*.<region>.cloudapp.azure.com`) cukup untuk Let's Encrypt via Caddy (**perlu verifikasi di portal**). FQDN dan IP tidak boleh masuk dokumen publik.

**Pemicu tinjau ulang.** Memori VM jadi pembatas, kebutuhan HA, atau jumlah instrumen aktif melewati kemampuan satu VM. Kriteria migrasi: Compose, lalu kind/k3d lokal, lalu AKS atau Container Apps.

---

## ADR-003: GitHub Actions instead of Jenkins

**Status:** Accepted

**Konteks.** Pengalaman CI/CD 2 tahun. Repo di GitHub, Student Pack aktif.

**Keputusan.** GitHub Actions: build, test, scan (Trivy), push ke GHCR, deploy via SSH. Hardening:
- `permissions` minimal per workflow; Actions pihak ketiga dipin ke SHA; tanpa `pull_request_target`; approval untuk workflow dari fork.
- Secret deploy di GitHub Environments dengan required reviewer. SSH key khusus deploy dengan hak terbatas.
- gitleaks (pre-commit dan CI), Dependabot, CodeQL.

**Alternatif.** Jenkins: server tambahan untuk dirawat (memori, patch), tidak memberi nilai tambah untuk MVP.

**Konsekuensi.** Tidak ada server CI untuk dikelola. Kuota menit Actions dan fitur keamanan repo private pada akun Free/Student Pack **perlu diverifikasi**.

**Pemicu tinjau ulang.** Kebutuhan runner self-hosted atau pipeline di luar GitHub.

---

## ADR-004: Market-agnostic core, IDX as first market

**Status:** Accepted

**Konteks.** MVP hanya IDX, tetapi jalur ekspansi global harus terbuka tanpa menulis ulang.

**Keputusan.** Inti dibuat netral terhadap bursa dengan delapan seam:
1. Registry instrumen dan bursa dengan ID internal (`IDX:TLKM`; symbol, MIC, currency, timezone).
2. Skema kanonik harga.
3. Interface `MarketDataProvider` (adapter yfinance, Kaggle) dengan pemetaan simbol per provider.
4. Konfigurasi per bursa (timezone, currency, kalender, ARA/ARB) di config, bukan kode.
5. Fit dan serving berparameter `instrument_id`; `model_specs` berkunci `(instrument_id, target, horizon, spec_version)`.
6. API dan proto netral (tanpa istilah IDX) dan berversi (`kairos.forecast.v1`).
7. Dropdown UI berasal dari API.
8. Partisi penyimpanan per bursa/instrumen.

Bukti ekstensibilitas: onboarding ticker IDX tambahan hanya lewat konfigurasi. Aturan sumber data baru: satu adapter per sumber ke skema kanonik, aturan rekonsiliasi (prioritas, toleransi, laporan selisih) di konfigurasi, kolom opsional tidak dipaksa seragam, tes kontrak per adapter.

**Tidak dibangun di MVP.** Provider berlisensi, multi-currency, kalender bursa lain, model global/per-sektor, event regulasi per yurisdiksi, i18n penuh.

**Alternatif.** Hardcode IDX: lebih cepat sekarang, tetapi setiap ekspansi menjadi penulisan ulang.

**Konsekuensi.**
- (+) Menambah instrumen = baris registry atau konfigurasi.
- (−) Ada abstraksi yang baru terbukti saat instrumen kedua dan bursa kedua masuk. Seam yang tidak dipakai harus ditinjau kritis di Fase 2 agar tidak menjadi over-engineering.
- Quality gate onboarding: riwayat minimum, likuiditas, kelengkapan. Yang gagal ditandai `insufficient_data` dan UI menampilkan statusnya.

**Pemicu tinjau ulang.** Saat bursa non-IDX pertama dipertimbangkan (butuh studi kelayakan: lisensi data, kalender, regulasi, lokalisasi).

---

## ADR-005: Batch forecast stored in DB, not online inference

**Status:** Accepted

**Konteks.** Data end-of-day, horizon 7 dan 30 hari. Prediksi tidak berubah dalam sehari. yfinance tidak andal untuk akses interaktif.

**Keputusan.** Prediksi dihitung sekali setelah ingestion sukses, dari hari bursa terakhir yang final (D-1), lalu disimpan di PostgreSQL. Dashboard hanya membaca hasil tersimpan dan menampilkan "data as of [tanggal]" serta "last successful update". Istilah produk: **end-of-day forecast**. Tidak memakai kata "real-time".

yfinance hanya dipanggil oleh ingestion terjadwal dan tombol refresh admin, dengan fallback ke data valid terakhir. Jalur demo membaca dari DB. Harga live sebagai pembanding adalah V2+ dan tidak pernah menjadi input model.

**Alternatif.** Inferensi online per request: latensi tinggi, bergantung pada yfinance saat demo, hasil bisa berbeda antar pengguna pada hari yang sama.

**Konsekuensi.**
- (+) Read path ringan dan deterministik. Demo tidak bergantung pada jaringan ke penyedia data.
- (+) Prediksi tersimpan bisa dibandingkan dengan aktual setelah horizon lewat (riwayat akurasi out-of-sample nyata, V1.x).
- (−) Data tertinggal paling lama satu hari bursa. Ini harus dinyatakan jelas di UI.

**Jadwal.** systemd timer atau cron di VM menjalankan `docker compose run --rm ingestion` pagi WIB di hari kerja. Candle bertanggal hari berjalan dibuang, sehingga `as_of_date` deterministik. Jam persis terhadap jam tutup BEI **perlu diverifikasi**.

**Pemicu tinjau ulang.** Kebutuhan intraday atau sumber data yang andal untuk streaming.

---

## ADR-006: Proto generated at build, not committed

**Status:** Accepted

**Konteks.** Dua bahasa (Go, Python) mengonsumsi satu kontrak `.proto`.

**Keputusan.** Stub digenerate saat build per service dengan `buf` (versi dipin) dan tidak di-commit. Kontrak berversi semver di package `kairos.forecast.v1`; `buf breaking` di CI menjaga kompatibilitas mundur.

**Alternatif.** Commit kode hasil generate: IDE langsung bekerja, tetapi diff berisik dan stub bisa tidak sinkron dengan `.proto`.

**Konsekuensi.** Lingkungan lokal perlu langkah generate (Makefile target). Tidak ada drift antara kontrak dan stub. Perubahan yang melanggar kompatibilitas memaksa naik versi package (`v2`).

**Pemicu tinjau ulang.** Pemecahan `api/` menjadi repo sendiri (stub bisa dipublikasikan sebagai paket berversi).

---

## ADR-007: PostgreSQL plain, Redis as cache only, no broker

**Status:** Accepted

**Konteks.** Data tabular, skema tetap, volume kecil. Pertanyaan terbuka sebelumnya: PostgreSQL vs time-series DB vs MongoDB vs Redis, dan perlunya broker.

**Keputusan.**
- PostgreSQL biasa sebagai sumber kebenaran (instrumen, harga, forecast, run). Bagian semi-terstruktur (jalur kuantil, parameter GARCH) di kolom JSONB.
- Redis hanya cache respons `GetForecast` (di-invalidate saat run sukses) dan counter rate limit. Boleh hilang tanpa kehilangan data.
- Tidak ada message broker. Orkestrasi pipeline ada di job ingestion yang memanggil `ComputeForecast` per instrumen.

**Kepemilikan tabel (satu Postgres, kepemilikan ketat):**
- ingestion: `instruments`, `prices_daily`, `ingestion_runs`
- ml-service: `model_specs`, `forecast_runs`, `forecasts`
- gateway: `api_keys` (admin saja)
- Tidak ada query lintas pemilik. Gateway tidak menyentuh tabel forecast; ia membaca lewat gRPC.

**Alternatif.**
- MongoDB: skema tetap dan butuh constraint serta upsert idempoten, jadi tidak ada keuntungan. Menambah container di VM 4 GB.
- Redis sebagai penyimpanan: riwayat forecast harus awet.
- TimescaleDB/Influx: perkiraan skala (ribuan instrumen × ±250 hari × 2 horizon per tahun) masih kecil untuk Postgres biasa.
- Broker (RabbitMQ/Kafka): satu job harian tidak membenarkannya.

**Konsekuensi.** Satu teknologi data untuk dioperasikan. Idempotensi lewat kunci unik `(instrument_id, as_of_date, spec_version)` dan upsert. Jalur kuantil lengkap di JSONB tumbuh seiring jumlah instrumen; pada skala besar disimpan hanya untuk run terbaru dan N hari terakhir (V2).

**Pemicu tinjau ulang.** Broker dibenarkan saat ada antrean pekerjaan lazy (ADR-009) atau worker horizontal.

---

## ADR-008: Backfilled walk-forward for the actual-vs-forecast chart

**Status:** Accepted

**Konteks.** Brief meminta grafik aktual vs prediksi dengan confidence interval. Serving harian hanya menghasilkan satu titik ke depan per hari, sehingga tidak ada deret prediksi historis untuk digambar terhadap aktual.

**Keputusan.** `ComputeForecast` berparameter `as_of_date`, sehingga perintah `BackfillForecasts` mengulanginya mundur (±100 origin) memakai hanya data sampai tiap origin. Jalur kuantil k=1..h disimpan di JSONB `path`.

UI menandai dua seri berbeda:
- Historis: "walk-forward (backtest, out-of-sample)".
- Ke depan: "forecast".

**Alternatif.** Hanya menampilkan forecast ke depan: tidak memenuhi brief. Menggambar fitted values in-sample: menyesatkan.

**Konsekuensi.** Backfill bersifat retrospektif, bukan rekam jejak live. Rekam jejak live baru terbentuk seiring prediksi harian terkumpul dan horizon lewat (V1.x). Backfill dan serving harus memakai kode yang sama, dijaga oleh golden test.

---

## ADR-009: Nightly batch fit, no on-demand training (lazy = V2)

**Status:** Accepted

**Konteks.** Pertanyaan: fit tiap malam untuk semua instrumen, atau saat pengguna pertama memicu pada hari itu (compute-on-first-request)? Dan bagaimana pada skala besar?

**Keputusan.** Untuk MVP: fit batch harian untuk instrumen aktif dalam registry (3 hingga 4 ticker).
- Satu fit GARCH-t per instrumen menghasilkan prakiraan h=30; nilai h=7 dan h=30 diambil dari fit yang sama.
- Pekerjaan idempoten. Kegagalan satu instrumen tidak menghentikan yang lain; statusnya dicatat (`ok` / `degraded` / `failed`).

Perbandingan lazy vs batch:
- Lazy tidak menghitung saham yang tidak pernah dilihat, tetapi pengguna pertama menunggu, perlu *single-flight lock* per instrumen, perlu kuota anti-abuse, ingestion ikut on-demand (kena rate limit yfinance), dan rekam jejak harian berlubang.
- Batch memberi demo yang siap, jadwal yang terprediksi, dan rekam jejak utuh.

**Alternatif.** Lazy penuh, atau hibrida sejak MVP. Dengan 3 ticker lazy menambah kompleksitas tanpa menghemat apa pun.

**Konsekuensi untuk skala (studi kelayakan, bukan target MVP).** Semua angka di bawah adalah hipotesis sampai `ComputeForecast` dibenchmark.
- Jumlah saham tercatat di seluruh dunia jauh di bawah 1 juta (perlu diverifikasi). Angka 1 juta hanya tercapai bila instrumen lain ikut dihitung.
- Arsitektur skala besar = hibrida bertingkat: *hot* (batch harian), *warm* (batch mingguan atau lazy), *cold* (hanya lazy, atau model murah seperti EWMA).
- Membutuhkan antrean pekerjaan dan worker horizontal (titik pertama broker dan K8s dibenarkan), partisi penyimpanan per bursa dan tanggal, pekerjaan inkremental (warm start parameter), dan penyedia data berlisensi. yfinance tidak mencukupi.
- Quality gate registry menahan instrumen yang tidak memenuhi riwayat minimum atau likuiditas.

**Pemicu tinjau ulang.** Jumlah instrumen aktif atau waktu batch mendekati batas jendela malam, atau ada permintaan ticker ekor panjang dari pengguna.

---

## ADR-010: gRPC-only ml-service (no FastAPI); REST only at gateway

**Status:** Accepted

**Konteks.** Pertanyaan: apakah ml-service memakai FastAPI?

**Keputusan.** ml-service adalah server gRPC murni (`grpcio`) dengan `GetForecast`, `ListInstruments`, `ComputeForecast`. Browser hanya berbicara REST/JSON ke gateway Go, yang menerjemahkan ke gRPC. Health memakai gRPC health protocol atau endpoint stdlib kecil. ml-service tidak pernah dipanggil browser.

**Alternatif.** FastAPI di ml-service: dua protokol di satu service tanpa kebutuhan, dan melanggar batas bahwa kontrak internal adalah gRPC.

**Konsekuensi.** Pengujian ml-service manual memakai `grpcurl` atau klien tes. Contract test gRPC wajib (area QA). Penambahan REST langsung ke ml-service dilarang kecuali ADR baru.

**Pemicu tinjau ulang.** Konsumen non-gRPC internal yang nyata.

---

## ADR-011: Serving = fit procedure, not a serialized model

**Status:** Accepted

**Konteks.** Hasil walk-forward menolak XGBoost untuk M1 dan M3, dan XGBoost M2 hanya unggul di TLKM. GARCH-t difit dalam hitungan detik.

**Keputusan.** Di V1, "model" = prosedur fit (GARCH-t + interval empiris + M3 vol-implied) beserta parameter yang disimpan per run. Tidak ada tahap training terpisah, tidak ada file model, tidak ada model registry berbasis file, MLflow bersifat opsional.

Yang disimpan:
- `model_specs`: θ M3 (aturan 0,85·σ_awal·√h, dibekukan), burn-in, kebijakan reliabilitas, metrik walk-forward.
- `forecast_runs`: `as_of_date`, git SHA, hash dan jendela data, status, durasi.
- `forecasts`: median, kuantil interval, vol harian/tahunan, probabilitas, parameter GARCH (omega, alpha, beta, nu), kuantil empiris yang dipakai, `path`.

Kegagalan fit GARCH: fallback EWMA atau varians konstan dengan status `degraded`. `H_PROD` mencakup 7 dan 30 hari sesuai brief.

Kualitas: golden test dengan fixture harga tetap, keluaran ml-service harus sama dengan notebook dalam toleransi.

**Konsekuensi.** Image ml-service memuat numpy, pandas, scipy, arch (CPU saja). Tidak ada ketergantungan ^JKSE di MVP (fitur indeks hanya dipakai XGBoost). Blob hanya untuk backup `pg_dump`.

**XGBoost kembali hanya jika** challenger M2 TLKM atau M3 DCII h30 terbukti stabil. Saat itu: ekspor format JSON native XGBoost (bukan pickle), skema fitur berversi, registry versi model, dependensi ^JKSE, dan retraining terjadwal terpisah dari inferensi harian.

---

## ADR-012: Public read-only dashboard, no user login

**Status:** Accepted (disetujui 13 November 2026)

**Konteks.** Perilaku pengguna MVP hanya membaca: pilih ticker, lihat grafik dan kartu, baca disclaimer. Tidak ada aksi pengguna yang menyimpan data atau memicu komputasi.

**Keputusan.** Dashboard publik tanpa login. Tidak ada tabel `users`, sesi, atau password. `api_keys` hanya untuk `POST /v1/admin/refresh`.

Perlindungan terhadap bot dan spam:
- Rate limit per IP di gateway (token bucket) dan batas ukuran request dan timeout di Caddy.
- Cache Redis agresif dengan `Cache-Control`/ETag, karena data berubah satu kali sehari.
- Endpoint admin berpagar API key dan batas IP.
- NSG hanya membuka 80/443.

**Limitation yang diketahui.** Rate limit per IP tidak menahan serangan terdistribusi (banyak IP). Risiko diterima untuk proyek portofolio. Mitigasi (CDN/WAF) masuk V2.

**Alternatif.** Login JWT: menambah tabel, layar, dan permukaan serang tanpa fitur yang membutuhkannya.

**Pemicu tinjau ulang.** Fitur yang memerlukan identitas (watchlist pribadi, alert email, kuota per pengguna).

---

## ADR-013: yfinance as primary source, Kaggle only for repair

**Status:** Accepted (perilaku dari IP datacenter **perlu diverifikasi**)

**Konteks (fakta terukur).**
- Cross-check Close mentah Kaggle vs yfinance pada periode overlap: selisih 0,0 pada kuantil 50/95/99%.
- Kaggle berhenti pada 2024-05-16 dan melewatkan hari yang traded (TLKM 72 dari 1.057, GOTO 30 dari 501, DCII 43 dari 803).
- yfinance salah pada 8 hari (Volume=0 dengan O=H=L=C basi) yang Kaggle catat traded.
- yfinance tidak resmi, punya rate limit, dan candle hari berjalan belum final.

**Keputusan.**
- yfinance (`auto_adjust=False`) = sumber primer. Kaggle bukan sumber utama.
- Hari yfinance dengan volume 0 yang Kaggle catat traded diperbaiki dari Kaggle (`source=kaggle_repair`): `adj_close = close_kaggle × (adj/close yfinance hari itu)`, open dari `First Trade` bila > 0, selain itu close kemarin.
- Candle hari berjalan dibuang. Volume nol dipertahankan dengan `is_traded`.
- OHLC untuk model = teradjust (mentah × `adj_factor`). Harga mentah hanya untuk tampilan.
- Burn-in 120 hari setelah listing hanya untuk GOTO dan DCII.
- Setelah Mei 2024 (tidak ada pembanding): volume 0 pada saham likuid ditandai sebagai peringatan kualitas data dan dicek lintas ticker pada tanggal yang sama. Tidak diperbaiki diam-diam. Aturan ini tidak menangkap harga salah dengan volume tidak nol.

**Konsekuensi.**
- Keterbatasan: dividen mendatang tidak diperhitungkan dalam harga teradjust. Dugaan survivorship bias pada Kaggle belum terbukti dan dicatat sebagai keterbatasan.
- Data Kaggle/Yahoo tidak dilisensikan oleh proyek. README memuat bagian "Data & Attribution" yang menyatakan proyek edukasi/portofolio non-komersial. Ketentuan yfinance dan Kaggle **perlu diverifikasi**.
- Skema `canonical.parquet` v2 menjadi dasar tabel `prices_daily`.

**Pemicu tinjau ulang.** Penyedia berlisensi, atau yfinance diblokir dari IP VM.

---

## ADR-014: Model selection: random walk (M1), GARCH-t (M2), vol-implied (M3)

**Status:** Accepted. Berdasar walk-forward nyata (expanding window, INIT=500, STEP=10, embargo h hari), uji permutasi lulus.

**Konteks (fakta terukur).**
- Uji permutasi (TLKM): ARIMA rMAE 1,001/1,000; GARCH rel_const 0,994/1,049; M3 vol-implied AUC ≈ 0,50. Tidak ada kebocoran. Selisih di bawah ±7% (n ≈ 58) tidak bermakna (EWMA mendapat 0,926 pada data acak).
- M1: rMAE ARIMA 0,986 hingga 1,007 (tidak bermakna), XGBoost 1,06 hingga 1,33 (lebih buruk dari naive).
- M2: TLKM h7 GARCH rel_const 0,877 dan menang atas rolling-h di 5/5 tahun (lolos); TLKM h30 marginal (GARCH 0,923, menang atas rolling-h hanya 2/5 tahun). GOTO dan DCII: varians konstan terbaik di semua horizon.
- M3: pada dasarnya fungsi volatilitas; vol-implied setara XGBoost. DCII h30 XGBoost BSS +0,137, AUC 0,706, menang 4/4 tahun: kandidat, belum dipercaya.
- Interval 80% (lolos bila 70 hingga 90%): empiris TLKM 76,5%/75,2%, DCII 76,9%/77,6%, GOTO 89,4%/88,9%. GARCH-normal gagal di DCII (69,2%/61,8%).

**Keputusan.**
- M1: titik tengah = random walk (harga terakhir). Interval empiris (kuantil terpusat dari h-day return historis, 750 terakhir) sebagai default. ARIMA tidak dipakai. XGBoost M1 ditolak.
- M2: GARCH-t mean nol. TLKM penuh. GOTO dan DCII memakai varians jangka panjang dengan badge "keandalan rendah / likuiditas tipis".
- M3: probabilitas vol-implied (refleksi dengan koreksi barrier diskret 0,5826σ), θ dibekukan di registry. Disertai base rate bergulir sebagai pembanding.
- LSTM, Prophet, TFT: tidak dipakai. Data ±500 hingga 1.600 baris per ticker rawan overfit dan tidak ada bukti struktur yang layak dikejar.
- Produk = pemantau risiko dan rentang harga berpusat random walk. Bukan peramal harga, bukan sinyal beli/jual.

**Kriteria sukses (ditetapkan sebelum melihat hasil):**
- M2 berfungsi bila QLIKE lebih baik dari rolling-vol naive di sebagian besar fold/tahun dan `rel_const` < 1.
- Interval berfungsi bila cakupan 80% berada di kisaran 70 hingga 90%.
- M3 berfungsi bila BSS > 0 dan AUC jauh di atas 0,5 pada sampel memadai.
- M1 tidak wajib mengalahkan naive; rMAE dilaporkan apa adanya.

**Konsekuensi.**
- Sampel efektif kecil (±35 hingga 55 jendela non-overlap per ticker untuk h=30), jadi klaim harus konservatif.
- Dua kegagalan metodologis pada notebook lama (target M3 salah, XGBoost tanpa embargo, perbandingan skala tidak setara, uji leakage tidak mengacak apa pun) sudah dikoreksi. Hasil lama tidak boleh dipakai.
- Plateau GOTO (95 hari return = 0, berakhir 2026-09-25) membuat metrik GOTO tidak andal sampai ditangani. Hipotesis "harga tertahan di batas minimum" belum diverifikasi.
- Aturan ARA/ARB BEI per periode belum diverifikasi; flag persisnya ditunda.

**Pemicu tinjau ulang.** Challenger XGBoost lolos uji ketahanan, base rate bergulir mengubah penilaian M3 DCII, atau perbaikan interval (historical simulation berskala volatilitas) terbukti.

---

## ADR-015: Frontend served as static files by Caddy

**Status:** Accepted

**Konteks.** Memori VM terbatas. Frontend React adalah aplikasi statis setelah build.

**Keputusan.** Hasil build web disajikan langsung oleh Caddy (reverse proxy ke gateway untuk `/v1/*`). Tidak ada container nginx atau server Node di produksi.

**Alternatif.** Container nginx terpisah: memori dan konfigurasi tambahan tanpa manfaat.

**Konsekuensi.** Satu proses lebih sedikit di VM. Header cache dan keamanan (CSP, dsb.) dikonfigurasi di Caddy. Pilihan TypeScript/Vite/library chart finansial masih terbuka dan diputuskan di area UI/UX.

---

## Roadmap keputusan arsitektur

| Versi | Keputusan arsitektur yang diperkirakan | ADR terkait |
| --- | --- | --- |
| V1 (MVP, 16 dan 18 Nov 2026) | Semua ADR di atas berlaku | 001 hingga 015 |
| V1.x | Riwayat akurasi live, flag ARA/ARB per periode (setelah aturan terverifikasi), badge UI berbasis threshold, backup ke Blob, MLflow lokal, ticker ke-4 via konfigurasi, challenger XGBoost bila lolos uji | 008, 011, 013, 014 |
| V2 | Fit lazy hibrida + antrean dan broker, login pengguna bila ada fitur yang membutuhkan, CDN/WAF, drift monitoring otomatis, migrasi Container Apps atau AKS, managed DB/Redis, SSE/WebSocket, harga live pembanding, i18n (default EN + toggle ID) | 002, 007, 009, 012 |
| V3 | Multi-market (studi kelayakan: lisensi data, kalender, regulasi, lokalisasi), penyedia data berlisensi, model global/per-sektor, event regulasi per yurisdiksi, i18n penuh | 004, 013 |

Ekspansi global dikerjakan sebagai studi kelayakan teknis, bukan monetisasi.

## Item terbuka dan perlu diverifikasi

1. Jam penjadwalan ingestion terhadap jam tutup BEI.
2. Label DNS Azure untuk HTTPS Caddy (jangan masuk dokumen publik).
3. Sisa kredit Azure for Students dan ketersediaan SKU B-series di indonesiacentral (`az vm list-skus`, `az vm list-usage`).
4. Ketentuan dan perilaku yfinance dari IP datacenter (belum diuji dari VM). Versi yang dipakai: 0.2.66 (`pip show yfinance`).
5. Kuota GitHub Actions dan fitur keamanan repo private pada akun Free/Student Pack.
6. Aturan ARA/ARB BEI per periode (termasuk dugaan batas ±7% pada periode awal).
7. Verifikasi independen data ^JKSE dan peristiwa 2026 (kedua seri berasal dari penyedia yang sama).
8. Benchmark waktu per `ComputeForecast` dan memori ml-service dengan `docker stats`.
9. Penanganan plateau GOTO.
10. Kepemilikan hasil karya (ketentuan Vinix) dan kebijakan IP kampus: blocker publikasi repo (publik paling cepat 19 November).
