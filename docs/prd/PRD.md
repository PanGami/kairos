# KAIROS: Product Requirements Document (PRD)

Versi dokumen: 1.0 (13 November 2026)
Status: Draft untuk persetujuan. Dokumen pendamping: `docs/adr/ADR.md` (keputusan arsitektur dan model).

Konvensi: prioritas memakai **[WAJIB MVP]**, **[MVP JIKA SEMPAT]**, **[V1.x]**, **[V2+]**. Fakta terukur dibedakan dari hipotesis. Asumsi ditulis eksplisit.

---

## 1. Ringkasan

**Nama:** KAIROS
**Judul:** KAIROS: A Market Intelligence & Volatility Forecasting Platform
**Subjudul:** Case Study: IDX Digital Infrastructure Equities (TLKM, GOTO, DCII)
**Judul brief asli (tampil di slide pembuka):** Web-App Prediksi Volatilitas dan Tren Harga Saham Sektor Infrastruktur Digital BEI Menggunakan Time-Series Forecasting.

KAIROS adalah dashboard web yang menampilkan estimasi ketidakpastian untuk tiga saham BEI sektor infrastruktur digital pada horizon 7 dan 30 hari: rentang harga, volatilitas, dan probabilitas koreksi. Data harian end-of-day. Prediksi dihitung sekali setelah pasar tutup dan disimpan, bukan dihitung saat pengguna membuka halaman.

**Posisi produk (berdasar hasil walk-forward, bukan klaim awal):** KAIROS adalah **pemantau risiko dengan estimasi ketidakpastian terkalibrasi**, bukan peramal harga. Titik tengah harga adalah random walk (harga terakhir) dengan interval. Nilai utamanya ada di volatilitas dan probabilitas koreksi.

**Bukan nasihat investasi dan bukan sinyal beli/jual.**

Catatan penamaan: evaluasi risiko konflik merek/domain, pelafalan global, tagline, dan apakah label "Market Intelligence" cukup dibuktikan fitur MVP masih tertunda (Fase 2). Sampai terbukti, klaim "enterprise" tidak dipakai kecuali auth/RBAC/audit log/observability benar-benar ada.

## 2. Latar belakang dan tujuan

**Pemberi tugas:** Vinix (tugas portofolio per peserta). **Penilai:** mentor data scientist berpengalaman 10+ tahun. Fokusnya membangun dengan benar, bukan mengesankan. Scope tidak bisa digeser.

**Tujuan produk:**
1. Memenuhi seluruh acceptance criteria brief (bagian 8).
2. Menunjukkan metodologi time-series yang jujur: evaluasi walk-forward tanpa kebocoran, kriteria sukses ditetapkan sebelum melihat hasil, hasil negatif dilaporkan.
3. Menunjukkan rekayasa end-to-end: gateway Go, ml-service Python via gRPC, PostgreSQL, Redis, Docker Compose, deploy ke Azure dengan HTTPS, CI/CD.
4. Menjadi portofolio open source untuk target karier Fullstack AI Engineer (level middle hingga advanced, melamar global).

**Tujuan pribadi yang tidak menjadi fitur produk:** pembelajaran Azure (belum berpengalaman), mempraktikkan spec-driven development dengan alat AI.

## 3. Non-tujuan

- Bukan sinyal beli/jual, saran ukuran lot, stop-loss, atau agen trading.
- Bukan data real-time atau intraday. Harga live adalah pembanding V2+ dan tidak pernah menjadi input model.
- Tidak mengklaim kepastian arah harga. Tidak menulis "random walk terbukti", "GARCH pasti cocok", atau menampilkan puncak harga mentah sebagai level teradjust.
- Tidak ada akun pengguna, watchlist pribadi, alert, atau pembayaran di MVP.
- Tidak ada monetisasi. Ekspansi global hanya studi kelayakan teknis.
- Tidak memakai LSTM kecuali data membenarkan (saat ini tidak).

## 4. Pengguna dan skenario (asumsi, dirinci di area UI/UX)

| Pengguna | Kebutuhan | Skenario utama |
| --- | --- | --- |
| Penilai/mentor | Memeriksa kebenaran metodologi dan kelengkapan brief | Memilih ticker, membaca grafik dan kartu, membaca keterbatasan, membuka repo dan dokumentasi |
| Perekrut/engineer | Menilai kualitas rekayasa | Membuka demo, README, diagram arsitektur, ADR, pipeline CI/CD |
| Pengunjung umum yang tertarik saham | Memahami risiko, bukan mencari sinyal | Melihat volatilitas dan peluang koreksi dengan konteks dan disclaimer |

Perilaku pengguna MVP hanya **membaca**: tidak ada input yang disimpan dan tidak ada aksi pengguna yang memicu komputasi model. Dashboard publik tanpa login (ADR-012).

## 5. Lingkup MVP (V1)

### 5.1 Fitur pengguna

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-01 | Dropdown ticker diisi dari API (`GET /v1/instruments`), bukan daftar statis | WAJIB MVP |
| FR-02 | Grafik harga aktual dan forecast ke depan dengan confidence band 80% dan 95% | WAJIB MVP |
| FR-03 | Seri historis walk-forward (backtest, out-of-sample) pada grafik, berlabel jelas berbeda dari forecast | WAJIB MVP |
| FR-04 | Pemilih horizon 7 dan 30 hari | WAJIB MVP |
| FR-05 | Kartu volatilitas: vol harian dan tahunan beserta pita ketidakpastian | WAJIB MVP |
| FR-06 | Kartu probabilitas koreksi (0 hingga 100%) dengan definisi ambang θ, dan pembanding base rate bergulir (mis. 1 tahun terakhir) | WAJIB MVP |
| FR-07 | Tampilan "data as of [tanggal]" dan "last successful update" | WAJIB MVP |
| FR-08 | Disclaimer persisten: bukan nasihat investasi, end-of-day, prediksi tidak pasti | WAJIB MVP |
| FR-09 | State: loading, error, empty, insufficient-data, degraded | WAJIB MVP |
| FR-10 | Badge keandalan ("keandalan rendah / likuiditas tipis") untuk GOTO dan DCII | WAJIB MVP |
| FR-11 | Penjelasan singkat metodologi dan keterbatasan (mengapa titik tengah random walk) | WAJIB MVP |
| FR-12 | Badge berbasis threshold ("volatilitas tinggi vs historis", "data tidak cukup") | MVP JIKA SEMPAT |
| FR-13 | Riwayat akurasi out-of-sample live (prediksi tersimpan vs aktual setelah horizon lewat) | V1.x |
| FR-14 | Tampilan model challenger (XGBoost M2 TLKM) sebagai pembanding, hanya bila terbukti stabil | MVP JIKA SEMPAT |

Bahasa UI V1: Indonesia. Versi berikutnya: default EN dengan toggle ID, lalu multi-bahasa penuh (V2+).

### 5.2 Fitur sistem

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| SR-01 | Ingestion terjadwal dari yfinance (`auto_adjust=False`) ke skema kanonik, dengan registry instrumen | WAJIB MVP |
| SR-02 | Validasi dan perbaikan data sesuai aturan (8 hari yfinance palsu diperbaiki dari Kaggle; candle hari berjalan dibuang; volume 0 dipertahankan dengan `is_traded`) | WAJIB MVP |
| SR-03 | Fallback ke data valid terakhir bila yfinance gagal; jalur demo membaca dari DB | WAJIB MVP |
| SR-04 | Fit batch harian per instrumen aktif: M1 (random walk + interval empiris), M2 (GARCH-t), M3 (vol-implied); hasil ke tabel `forecast_runs` dan `forecasts` | WAJIB MVP |
| SR-05 | Backfill walk-forward untuk grafik aktual vs forecast | WAJIB MVP |
| SR-06 | Fallback EWMA atau varians konstan dengan status `degraded` bila GARCH gagal | WAJIB MVP |
| SR-07 | Gateway Go (REST) dan ml-service Python (gRPC); kontrak `.proto` dan OpenAPI berversi | WAJIB MVP |
| SR-08 | PostgreSQL dan Redis (cache) | WAJIB MVP |
| SR-09 | Rate limit per IP, health endpoint (`/healthz`, `/readyz`, gRPC health), endpoint admin refresh dengan API key | WAJIB MVP |
| SR-10 | Docker Compose, satu VM Azure, HTTPS via Caddy | WAJIB MVP |
| SR-11 | GitHub Actions: build, test, scan, push GHCR, deploy via SSH | WAJIB MVP |
| SR-12 | Golden test: keluaran ml-service setara notebook dalam toleransi | WAJIB MVP |
| SR-13 | Dokumentasi: OpenAPI, `.proto`, README, diagram arsitektur, ADR inti | WAJIB MVP |
| SR-14 | Onboarding ticker tambahan hanya lewat konfigurasi (mis. BBCA sebagai ticker ke-4) | MVP JIKA SEMPAT |
| SR-15 | Backup `pg_dump` ke Azure Blob | MVP JIKA SEMPAT |
| SR-16 | MLflow lokal, Postman collection (turunan OpenAPI), fitur indeks ^JKSE, eksperimen model pooled | MVP JIKA SEMPAT |
| SR-17 | Kaggle enrichment (foreign flow, Remarks) | MVP JIKA SEMPAT |

### 5.3 Keluaran yang harus ada pada respons forecast

`median` (= harga terakhir), kuantil interval 80% dan 95%, vol harian dan tahunan beserta pita, probabilitas koreksi dengan θ dan base rate bergulir, `as_of_date`, `status` (`ok` | `degraded` | `failed`), badge keandalan, `path` kuantil k=1..h untuk grafik.

## 6. Persyaratan non-fungsional

| Area | Persyaratan | Verifikasi |
| --- | --- | --- |
| Kejujuran klaim | Label "end-of-day forecast", bukan "real-time"; seri backtest dan forecast berlabel jelas | Review UI dan teks |
| Performa baca | Target (belum diukur): halaman dan respons forecast terasa instan karena dibaca dari cache; p95 respons cache ditetapkan setelah load test | Load test di area QA |
| Memori VM | Seluruh stack muat di VM 4 GB dengan sisa untuk OS dan job (hipotesis) | `docker stats` |
| Keandalan demo | Cadangan berlapis: Compose lokal, video rekaman, screenshot | Checklist pre-demo |
| Reprodusibilitas | Setiap run mencatat git SHA, hash dan jendela data, versi spec | Tabel `forecast_runs` |
| Keamanan | NSG hanya 80/443; SSH key + batas IP; Postgres dan Redis tidak terekspos; container non-root; secret di `.env` VM (chmod 600) dan GitHub Environments | Checklist keamanan |
| Keamanan repo publik | Secret scanning + push protection, gitleaks, Dependabot, CodeQL, branch protection, Trivy, Actions dipin SHA, tanpa `pull_request_target` | CI dan audit pra-publik |
| Observability | Log JSON ke stdout, request-id lewat metadata gRPC, status run tercatat; metrics Prometheus opsional | Review log |
| Aksesibilitas | Tidak mengandalkan warna saja untuk status; kontras memadai; navigasi keyboard untuk kontrol utama | Review UI |
| Biaya | Dalam kredit Azure $100; budget alert $20/$50/$80; kebijakan deallocate | Portal Azure |
| Portabilitas | K8s-ready (stateless, 12-factor, graceful shutdown, health) | ADR-002 |

## 7. Kriteria sukses model dan data

Ditetapkan sebelum melihat hasil (ADR-014).

| Target | "Berfungsi" jika | Hasil walk-forward saat ini (fakta terukur) |
| --- | --- | --- |
| M2 volatilitas | QLIKE lebih baik dari rolling-vol naive di sebagian besar fold/tahun dan `rel_const` < 1 | TLKM h7 lolos (GARCH 0,877), TLKM h30 marginal (0,923). GOTO dan DCII: varians konstan terbaik |
| Interval M1 | Cakupan nominal 80% sekitar 70 hingga 90% | Empiris: lolos untuk TLKM, DCII, GOTO. GARCH-normal gagal di DCII |
| M3 koreksi | BSS > 0 dan AUC jauh di atas 0,5 pada sampel memadai | TLKM h7 marginal (+0,043 vol-implied), TLKM h30 gagal, DCII h30 XGBoost +0,137 (kandidat), GOTO tidak andal |
| M1 harga | Tidak wajib mengalahkan naive; rMAE dilaporkan apa adanya | rMAE ARIMA ≈ 1 (tidak bermakna), XGBoost lebih buruk dari naive |
| Metodologi | Uji permutasi runtuh ke level naive | Lulus (tidak ada kebocoran) |

Kebijakan reliabilitas per ticker: TLKM penuh; GOTO dan DCII memakai varians jangka panjang dengan badge "keandalan rendah / likuiditas tipis". Probabilitas koreksi DCII h30 dari XGBoost adalah eksperimen, bukan fitur produksi.

Keterbatasan yang harus tampil di dokumentasi dan presentasi: sampel efektif kecil (±35 hingga 55 jendela non-overlap per ticker untuk h=30), base rate koreksi tidak stasioner, plateau GOTO (95 hari return nol), DCII dengan 15,3% hari tanpa transaksi, dugaan survivorship bias pada Kaggle, dividen mendatang tidak diperhitungkan, dan seri ^JKSE belum diverifikasi independen.

## 8. Pemetaan acceptance criteria brief

| Kriteria brief | Pemenuhan di KAIROS | Status |
| --- | --- | --- |
| Prediksi harga, volatilitas, dan probabilitas koreksi untuk TLKM, GOTO, DCII | M1 (rentang harga), M2, M3 untuk tiga ticker | Direncanakan (FR-02, 05, 06) |
| Horizon 7 hingga 30 hari | h=7 dan h=30 | Direncanakan (FR-04) |
| ML time-series | Random walk + interval empiris, GARCH-t, vol-implied; ARIMA dan XGBoost diuji dan hasilnya dilaporkan | Selesai evaluasi |
| LSTM tidak wajib, hanya bila data membenarkan | Tidak dipakai; alasan terdokumentasi | Selesai |
| Data Kaggle eren2222 (2020 hingga 2024) + yfinance | Kaggle untuk audit dan perbaikan, yfinance primer | Selesai |
| Dashboard "BEI Tech-Stock Predictor Dashboard" dengan dropdown ticker | Dashboard KAIROS dengan dropdown dari API | Direncanakan (FR-01) |
| Grafik aktual vs prediksi dengan confidence interval | FR-02, FR-03 (backfill walk-forward) | Direncanakan |
| Teknologi frontend bebas | React | Terkunci (varian TypeScript/Vite/library chart terbuka) |
| Judul brief asli di slide pembuka | Dicantumkan | Direncanakan (deck) |

## 9. Jadwal dan cut-line

| Tanggal | Tonggak |
| --- | --- |
| Kamis 12 Nov (Sesi 1) | Review EDA, cleaning selesai, baseline dilatih (presentasi langsung di notebook Colab) |
| Jumat 13 Nov | Walk-forward nyata dan keputusan model; ADR dan PRD ini |
| Sabtu 14 Nov | Deploy pertama (boleh hello-world): gateway, ml-service stub, Postgres, Caddy HTTPS. Paling lambat hari ini |
| Senin 16 Nov (Sesi 2) | Model tuning minimal, draft web app, deployment awal dan pipeline. Demo wajib live di Azure |
| Selasa 17 Nov | Feature freeze; rehearsal penuh di URL cloud |
| Rabu 18 Nov (Sesi 3) | Simulasi presentasi penuh dan live demo (batas MVP) |
| Paling cepat 19 Nov | Repo publik, setelah audit keamanan dan klarifikasi legal |

**Aturan potong:** bila tertinggal pada akhir 14 November, buang LSTM dan Figma hi-fi (cukup wireframe) sebelum mengorbankan deploy cloud dan kualitas baseline. Fitur di luar MVP masuk roadmap pasca-sesi.

**Urutan kerja:** kontrak API/data, lalu deploy hello-world, lalu backend dan frontend paralel terhadap kontrak (frontend memakai data dummy sesuai skema), lalu wireframe lo-fi dengan semua state wajib. Figma hi-fi hanya bila ada ruang.

Peringatan: jaga ritme dan tidur. Risiko burnout nyata pada jadwal solo yang ketat.

## 10. Metrik keberhasilan

Metrik produk (tidak ada analitik pengguna di MVP):
- Demo live di Azure berjalan dengan HTTPS pada Sesi 2 dan Sesi 3, tanpa bergantung pada yfinance saat demo.
- Seluruh kriteria brief pada bagian 8 terpenuhi.
- Bagian "temuan jujur" dapat dijelaskan dalam presentasi: masalah data ditemukan dan diperbaiki, uji permutasi lulus, M2 terbukti untuk TLKM, M1 tidak mengalahkan naive, M3 setara fungsi volatilitas, keterbatasan GOTO dan DCII.

Metrik teknis:
- CI hijau di setiap PR ke `main`; golden test lolos.
- Pipeline harian sukses dan status run `ok` untuk TLKM; `degraded` atau reliabilitas rendah tampil benar untuk GOTO dan DCII.
- Tidak ada secret atau artefak data di riwayat repo (audit gitleaks/trufflehog sebelum publik).

## 11. Ketergantungan, asumsi, dan risiko

**Asumsi:**
- Pengguna bekerja solo, CPU saja (Colab gratis sebagai cadangan).
- Alat AI: Claude (perencanaan, arsitektur, review), Gemini Pro (brainstorming, sintaks cepat), Kiro (coding agent, 1.000 kuota, dihemat untuk Sesi 2). Kode ML buatan AI wajib diverifikasi (uji permutasi dan leakage) sebelum hasilnya dipercaya.
- Dashboard publik tanpa login.

**Risiko utama:**

| Risiko | Dampak | Mitigasi | Sifat |
| --- | --- | --- | --- |
| yfinance tidak resmi, rate limit, perilaku dari IP datacenter belum diuji | Ingestion gagal di VM | Adapter + fallback ke data valid terakhir; demo membaca dari DB; penyedia berlisensi di roadmap | Hipotesis |
| Data tidak bersih (8 hari palsu ditemukan) | Model rusak diam-diam | Aturan validasi, log perbaikan, peringatan lintas ticker | Terukur |
| Hasil model lemah (M1 tidak mengalahkan naive) | Penilai mengira produk gagal | Posisi produk jelas sebagai pemantau risiko; hasil negatif dijelaskan | Terukur |
| Plateau GOTO dan likuiditas tipis DCII | Metrik tidak andal | Badge keandalan rendah, varians jangka panjang | Terukur |
| VM tunggal dan memori 4 GB | Demo gagal | Cadangan berlapis; validasi `docker stats` | Hipotesis |
| Waktu 3 sesi, solo | Fitur terpotong | Cut-line harian; urutan kerja kontrak-dulu | Terukur |
| Kredit Azure terbatas ($100) | VM mati atau tagihan | Budget alert, deallocate, cek sisa kredit di portal | Perlu verifikasi |
| Legal: kepemilikan hasil karya (Vinix), kebijakan IP kampus, lisensi data Kaggle/Yahoo | Repo tidak boleh publik | Repo privat dulu; publik paling cepat 19 Nov setelah klarifikasi | Blocker publikasi |
| Bot atau spam | Beban VM | Rate limit, cache, endpoint admin berpagar. DDoS terdistribusi diterima sebagai limitation | Terukur |

## 12. Legal, etika, dan disclaimer

- **Disclaimer (teks acuan, disempurnakan di area UI/UX dan legal):** "KAIROS adalah proyek edukasi dan portofolio. Informasi ditampilkan berdasarkan data harian akhir hari dan estimasi statistik yang mengandung ketidakpastian. Bukan nasihat investasi dan bukan ajakan membeli atau menjual efek apa pun."
- **Data & Attribution di README:** data Kaggle dan Yahoo tidak dilisensikan oleh proyek; proyek non-komersial. Ketentuan keduanya perlu diverifikasi.
- **Lisensi repo:** MIT (full open source) dengan LICENSE sejak commit pertama. Cek lisensi dependensi (go-licenses, pip-licenses, license-checker) sebelum publik.
- **Regulasi produk prediksi lintas negara:** dibahas di area legal pada Fase 2, relevan untuk ekspansi global.
- Tanpa IP, subscription ID, atau nama resource Azure di dokumen publik.

## 13. Roadmap versi

### V1 (MVP): 16 dan 18 November 2026
Lingkup bagian 5 (semua item WAJIB MVP). Tiga ticker, batch harian, dashboard baca-saja, deploy Azure single VM, CI/CD, dokumentasi inti. Bila waktu ada: ticker ke-4 via konfigurasi, backup Blob, MLflow lokal, Postman collection, Figma hi-fi, badge threshold.

### V1.x (pasca-sesi, dalam repo yang sama)
- Riwayat akurasi live: perbandingan prediksi tersimpan dengan aktual setelah horizon lewat (FR-13).
- Verifikasi aturan ARA/ARB per periode, lalu flag ARA/ARB persis sebagai fitur dan badge.
- Penanganan plateau GOTO setelah hipotesis diverifikasi.
- Perbaikan interval (historical simulation berskala volatilitas), diuji dengan walk-forward.
- Challenger XGBoost: M2 TLKM dan M3 DCII h30 hanya bila lolos uji ketahanan (base rate bergulir, stabil per tahun). Bila lolos: ekspor JSON native, skema fitur berversi, registry versi, dependensi ^JKSE.
- Kaggle enrichment (foreign flow) dengan syarat fitur yang hanya tersedia di Kaggle tidak menjadi input serving.
- Audit dan publikasi repo (setelah klarifikasi legal), README, demo video, case study, badge.

### V2
- Fit lazy hibrida (hot/warm/cold) dengan antrean pekerjaan, *single-flight lock*, kuota anti-abuse (ADR-009).
- Login pengguna dan watchlist pribadi bila ada fitur yang membutuhkannya (ADR-012); CDN/WAF.
- Drift monitoring otomatis; model registry bila model terawasi kembali.
- Migrasi ke Container Apps atau AKS (validasi lokal kind/k3d lebih dulu), managed PostgreSQL/Redis, Jenkins tidak direncanakan.
- SSE/WebSocket dan webhook; harga live sebagai pembanding (bukan input model).
- UI default EN dengan toggle ID.

### V3 (studi kelayakan global, bukan monetisasi)
- Multi-market: bursa non-IDX dengan kalender, timezone, currency, dan konfigurasi per bursa.
- Penyedia data berlisensi menggantikan yfinance.
- Model global atau per-sektor (cold-start untuk saham baru), event regulasi per yurisdiksi (NLP/event flags).
- i18n penuh; kajian regulasi produk prediksi, lisensi data, dan lokalisasi per negara.

## 14. Pertanyaan terbuka

1. Jam penjadwalan ingestion terhadap jam tutup BEI (verifikasi).
2. Label DNS Azure untuk HTTPS Caddy (verifikasi di portal).
3. Pilihan TypeScript/Vite dan library chart finansial untuk frontend.
4. Penanganan plateau GOTO sebelum angka GOTO ditampilkan.
5. Ketentuan Vinix atas kepemilikan hasil karya dan kebijakan IP kampus.
6. Apakah posisi "pemantau risiko dengan rentang harga random walk" diterima penilai sebagai pemenuhan brief "prediksi harga" (perlu dikonfirmasi saat Sesi 2 atau lebih awal).
7. Evaluasi nama KAIROS: risiko merek/domain, pelafalan global, tagline.

## 15. Glosarium

- **h:** horizon prediksi dalam hari bursa (7 atau 30). **D-1:** hari bursa terakhir yang final.
- **M1/M2/M3:** target harga (return kumulatif), volatilitas (varians realisasi), dan probabilitas koreksi.
- **QLIKE:** metrik evaluasi varians. **rMAE:** MAE relatif terhadap naive. **BSS:** Brier skill score terhadap base rate. **AUC:** area di bawah kurva ROC.
- **rel_const:** QLIKE model relatif terhadap varians konstan; kurang dari 1 berarti lebih baik.
- **Walk-forward:** evaluasi dengan jendela yang melebar, hanya memakai data sampai origin; **embargo** = jeda h hari agar label tidak bocor.
- **θ:** ambang koreksi M3, dibekukan per instrumen dan horizon (aturan 0,85·σ_awal·√h dibulatkan ke grid).
- **Registry:** tabel `instruments` (daftar resmi instrumen dan statusnya) dan `model_specs` (spesifikasi model beku per instrumen).
- **ARA/ARB:** batas auto-reject atas/bawah BEI (aturan per periode perlu diverifikasi).
