export type Locale = "en" | "id";

export interface Messages {
  nav: {
    primaryAriaLabel: string;
    footerAriaLabel: string;
    brandTag: string;
    dashboard: string;
    watcher: string;
    methodology: string;
    signIn: string;
    signOut: string;
    verified: string;
    switchToLight: string;
    switchToDark: string;
    languageGroupLabel: string;
    switchToEnglish: string;
    switchToIndonesian: string;
  };
  footer: {
    dataAsOfSnapshot: string;
    lastUpdateNightly: string;
    sourceAudit: string;
    pipelineTag: string;
    disclaimer: string;
  };
  dashboard: {
    heroAriaLabel: string;
    headline: string;
    lead: string;
    pillarsAriaLabel: string;
    pillars: Array<{
      code: string;
      title: string;
      desc: string;
      primary: boolean;
    }>;
    ctaAriaLabel: string;
    ctaTitle: string;
    ctaDesc: string;
    openWatcher: string;
    readMethodology: string;
    signInGoogle: string;
  };
  watcher: {
    loadingInstruments: string;
    loadError: (err: string) => string;
    reloadPage: string;
    emptyInstruments: string;
    workspaceAriaLabel: string;
    watchlistAriaLabel: string;
    statsAriaLabel: string;
    lockedDialogAriaLabel: (id: string) => string;
    lockedTitle: (id: string, mic: string) => string;
    lockedBody: (featuredId: string, lockedNames: string) => string;
    dismiss: string;
    signInAllTickers: string;
    marketDataError: (id: string, err: string) => string;
    insufficientHistory: string;
    lowReliabilityWarning: string;
    degradedWarning: string;
    loadingChartAriaLabel: string;
    loadingChartTitle: (horizon: number, id: string) => string;
    loadingChartCanvasAriaLabel: string;
    provenanceAriaLabel: string;
    dataAsOf: (date: string) => string;
    lastSuccessfulUpdate: (ts: string) => string;
    horizonTag: (horizon: number) => string;
  };
  watchlist: {
    panelAriaLabel: string;
    title: string;
    tickersCount: (count: number) => string;
    listAriaLabel: string;
    featuredToday: string;
    locked: string;
    fullTier: string;
    lowReliability: string;
    insufficientData: string;
  };
  badges: {
    degraded: string;
    lastClose: string;
    asOf: string;
  };
  horizon: {
    label: string;
    groupAriaLabel: string;
  };
  forecastSummary: {
    coneAriaLabel: string;
    coneTitle: string;
    horizonMeta: (days: number) => string;
    range80Label: string;
    rangeConnector: string;
    interval95Label: string;
    forwardMedianLabel: string;
    volAriaLabel: string;
    volTitle: string;
    volMeta: string;
    annualizedVol: string;
    dailyVol: string;
    volBand: string;
    drawdownAriaLabel: string;
    drawdownTitle: string;
    drawdownMeta: string;
    correctionProb: string;
    drawdownThreshold: string;
    baseRate252d: string;
  };
  chart: {
    sectionAriaLabel: string;
    titleWithTicker: (id: string, days: number) => string;
    titleNoTicker: (days: number) => string;
    updating: (days: number) => string;
    subtitle: (days: number) => string;
    legendAriaLabel: string;
    legendActual: string;
    legendBacktest: string;
    legendMedian: string;
    legend80: string;
    legend95: string;
    seriesActual: string;
    seriesBacktest: string;
    seriesMedian: string;
    seriesUpper80: string;
    seriesLower80: string;
    seriesUpper95: string;
    seriesLower95: string;
    canvasAriaLabel: (id: string, days: number) => string;
  };
  editorial: {
    ariaLabel: string;
    title: string;
    collapse: string;
    expand: string;
    headline: string;
    copy: string;
    modelPrefix: string;
    models: Array<{
      code: string;
      name: string;
      spec: string;
    }>;
  };
  methodology: {
    title: string;
    lead: string;
    modelsAriaLabel: string;
    modelsTitle: string;
    modelsMeta: string;
    modelSpecs: Array<{ code: string; title: string; desc: string }>;
    chartGuideAriaLabel: string;
    chartGuideTitle: string;
    chartGuideMeta: string;
    chartSeriesGuide: Array<{ label: string; swatchClass: string; desc: string }>;
    limitationsAriaLabel: string;
    limitationsTitle: string;
    limitationsMeta: string;
    limitations: Array<{ label: string; value: string }>;
    provenanceAriaLabel: string;
    provenanceTitle: string;
    provenanceMeta: string;
    provenanceItems: Array<{ label: string; value: string }>;
  };
  login: {
    checkingAuth: string;
    scriptLoadError: string;
    googleSignInFailed: string;
    signInFailed: string;
    title: string;
    description: string;
    signingIn: string;
    devSignInButton: string;
    unavailableBanner: string;
    continueGuest: string;
  };
  protectedRoute: {
    checkingSession: string;
  };
}

const en: Messages = {
  nav: {
    primaryAriaLabel: "Primary navigation",
    footerAriaLabel: "Footer navigation",
    brandTag: "EOD RISK MONITOR",
    dashboard: "Dashboard",
    watcher: "Watcher",
    methodology: "Methodology",
    signIn: "Sign In",
    signOut: "Sign Out",
    verified: "VERIFIED",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    languageGroupLabel: "Language selection",
    switchToEnglish: "Switch language to English",
    switchToIndonesian: "Switch language to Indonesian",
  },
  footer: {
    dataAsOfSnapshot: "DATA AS OF EOD SNAPSHOT",
    lastUpdateNightly: "LAST SUCCESSFUL UPDATE NIGHTLY BATCH",
    sourceAudit: "SOURCE YFINANCE AND KAGGLE AUDITED REPAIR",
    pipelineTag: "END-OF-DAY BATCH PIPELINE",
    disclaimer:
      "KAIROS is an educational and statistical end-of-day risk monitor based on historical data and calibrated uncertainty estimates. It does not constitute investment advice, buy or sell signals, or a solicitation to trade any security.",
  },
  dashboard: {
    heroAriaLabel: "KAIROS platform overview",
    headline: "Quantifying Post-Close Equity Uncertainty and Tail Risk.",
    lead:
      "KAIROS is an end-of-day risk intelligence system for IDX digital infrastructure equities. Instead of speculative price targets or buy and sell signals, it calibrates nightly forward uncertainty cones, conditional volatility regimes, and drawdown probabilities verified through leak-free walk-forward backtesting.",
    pillarsAriaLabel: "Three calibrated risk models",
    pillars: [
      {
        code: "M1",
        title: "Empirical Price Range",
        desc: "Anchors the midpoint at the latest closing price and projects 80% and 95% forward return intervals over 7-day and 30-day horizons.",
        primary: true,
      },
      {
        code: "M2",
        title: "GARCH-t Volatility",
        desc: "Estimates time-varying daily and annualized return dispersion, with automatic long-run variance fallback on thin-liquidity stocks.",
        primary: false,
      },
      {
        code: "M3",
        title: "Correction Probability",
        desc: "Quantifies the likelihood of a drawdown crossing threshold theta within the active horizon against the 252-day rolling base rate.",
        primary: false,
      },
    ],
    ctaAriaLabel: "Open interactive risk watcher",
    ctaTitle: "Ready to inspect interactive EOD price cones and trailing backtests?",
    ctaDesc:
      "Guest mode grants immediate access to IDX:TLKM across 7-day and 30-day horizons inside Risk Watcher. Sign in with Google anytime to unlock all available stocks.",
    openWatcher: "Open Risk Watcher",
    readMethodology: "Read Methodology",
    signInGoogle: "Sign In with Google",
  },
  watcher: {
    loadingInstruments: "Loading active instrument universe from gateway...",
    loadError: (err) =>
      `Failed to load instrument list (${err}). Verify the gateway service is running and reload this page.`,
    reloadPage: "Reload page",
    emptyInstruments:
      "No active instruments are configured yet. Run the ingestion job or inspect database seeds before checking forecasts.",
    workspaceAriaLabel: "Core risk workspace",
    watchlistAriaLabel: "Emitter watchlist",
    statsAriaLabel: "Risk statistics and model calibration",
    lockedDialogAriaLabel: (id) => `Sign in required for ${id}`,
    lockedTitle: (id, mic) => `${id} (${mic}) requires a signed-in session`,
    lockedBody: (featuredId, lockedNames) =>
      `Guest mode displays ${featuredId}. Sign in with Google to inspect ${lockedNames}.`,
    dismiss: "Dismiss",
    signInAllTickers: "Sign in to view all tickers",
    marketDataError: (id, err) =>
      `Failed to load market data for ${id} (${err}). Switch horizon or reload the workspace.`,
    insufficientHistory: "Insufficient history for this instrument: statistical forecast is unavailable.",
    lowReliabilityWarning:
      "Low reliability and thin liquidity: volatility uses long-run fallback variance. Interpret intervals with caution.",
    degradedWarning:
      "Degraded run status: model fell back to constant or EWMA variance for this horizon.",
    loadingChartAriaLabel: "Loading forecast chart",
    loadingChartTitle: (horizon, id) =>
      `Loading ${horizon}-day forecast cone and trailing closes for ${id}...`,
    loadingChartCanvasAriaLabel: "Loading chart data",
    provenanceAriaLabel: "Instrument snapshot provenance",
    dataAsOf: (date) => `DATA AS OF ${date}`,
    lastSuccessfulUpdate: (ts) => `LAST SUCCESSFUL UPDATE ${ts}`,
    horizonTag: (horizon) => `HORIZON ${horizon}D`,
  },
  watchlist: {
    panelAriaLabel: "Emitter watchlist",
    title: "EMITTER WATCHLIST",
    tickersCount: (count) => `${count} TICKERS`,
    listAriaLabel: "Emitter selection",
    featuredToday: "FEATURED TODAY",
    locked: "LOCKED",
    fullTier: "FULL TIER",
    lowReliability: "LOW RELIABILITY",
    insufficientData: "INSUFFICIENT DATA",
  },
  badges: {
    degraded: "DEGRADED",
    lastClose: "LAST CLOSE",
    asOf: "AS OF",
  },
  horizon: {
    label: "HORIZON",
    groupAriaLabel: "Horizon",
  },
  forecastSummary: {
    coneAriaLabel: "Empirical price cone",
    coneTitle: "EMPIRICAL PRICE CONE (M1)",
    horizonMeta: (days) => `${days}D HORIZON`,
    range80Label: "80% EMPIRICAL PRICE RANGE",
    rangeConnector: "to",
    interval95Label: "95% Tail Interval",
    forwardMedianLabel: "Forward Median (M1)",
    volAriaLabel: "Volatility regime statistics",
    volTitle: "VOLATILITY REGIME (M2)",
    volMeta: "ANNUAL AND DAILY",
    annualizedVol: "Annualized Vol (M2)",
    dailyVol: "Daily Vol (M2)",
    volBand: "Volatility Band (M2)",
    drawdownAriaLabel: "Drawdown risk statistics",
    drawdownTitle: "DRAWDOWN RISK (M3)",
    drawdownMeta: "TAIL THRESHOLD",
    correctionProb: "Correction Prob (M3)",
    drawdownThreshold: "Drawdown Threshold",
    baseRate252d: "252D Base Rate",
  },
  chart: {
    sectionAriaLabel: "Uncertainty envelope and price chart",
    titleWithTicker: (id, days) =>
      `${id}: Where does the ${days}-day empirical cone sit against trailing closes?`,
    titleNoTicker: (days) =>
      `Where does the ${days}-day empirical cone sit against trailing closes?`,
    updating: (days) => `UPDATING ${days}D...`,
    subtitle: (days) =>
      `Trailing EOD close series paired with out-of-sample walk-forward medians and forward ${days}-day intervals.`,
    legendAriaLabel: "Chart series legend",
    legendActual: "ACTUAL CLOSE",
    legendBacktest: "WALK-FORWARD BACKTEST",
    legendMedian: "FORWARD MEDIAN",
    legend80: "80% INTERVAL",
    legend95: "95% INTERVAL",
    seriesActual: "Actual",
    seriesBacktest: "Backtest median",
    seriesMedian: "Forecast median",
    seriesUpper80: "80% upper",
    seriesLower80: "80% lower",
    seriesUpper95: "95% upper",
    seriesLower95: "95% lower",
    canvasAriaLabel: (id, days) => `${id} ${days}-day EOD price and uncertainty cone chart`,
  },
  editorial: {
    ariaLabel: "Calibration specification",
    title: "CALIBRATION SPECIFICATION",
    collapse: "Collapse",
    expand: "Expand",
    headline: "Calibrated End-of-Day Equity Uncertainty and Tail-Risk Monitor.",
    copy:
      "KAIROS computes nightly post-close price intervals, conditional volatility estimates, and drawdown probabilities rather than directional price predictions or trading signals.",
    modelPrefix: "MODEL",
    models: [
      {
        code: "M1",
        name: "Empirical Price Range",
        spec: "Random walk midpoint paired with trailing 80% and 95% empirical return intervals.",
      },
      {
        code: "M2",
        name: "GARCH-t Volatility",
        spec: "Time-varying conditional volatility with automated constant-variance fallback on thin names.",
      },
      {
        code: "M3",
        name: "Correction Probability",
        spec: "Volatility-implied drawdown probability benchmarked against the 252-day rolling base rate.",
      },
    ],
  },
  methodology: {
    title: "Methodology and Calibration Limitations",
    lead:
      "KAIROS is an end-of-day risk monitor, not a directional price predictor and not trading signals. Models M1, M2, and M3 calibrate post-close uncertainty over 7- and 30-trading-day horizons.",
    modelsAriaLabel: "Calibrated risk models",
    modelsTitle: "CALIBRATED RISK MODELS",
    modelsMeta: "M1 / M2 / M3",
    modelSpecs: [
      {
        code: "MODEL M1",
        title: "Empirical Price Range",
        desc: "Random-walk midpoint anchored at the latest close. Trailing 750-day empirical quantiles preserve 70% to 90% coverage across TLKM, DCII, and GOTO, where ARIMA (rMAE approximately 1) and XGBoost failed to beat naive baselines.",
      },
      {
        code: "MODEL M2",
        title: "GARCH-t Volatility",
        desc: "Passed QLIKE evaluation on TLKM (rel_const = 0.877 at h=7, 0.923 at h=30). Thin-liquidity names GOTO and DCII automatically fall back to constant long-run variance with low reliability status, or EWMA on non-convergence.",
      },
      {
        code: "MODEL M3",
        title: "Correction Probability",
        desc: "Estimates drawdown likelihood past frozen threshold theta via the 0.85 x sigma_init x sqrt(h) rule beside the 252-day rolling base rate. On TLKM h=7, M3 achieved BSS +0.043 without supervised training overhead.",
      },
      {
        code: "LEAK-FREE",
        title: "Walk-Forward Embargo Verification",
        desc: "Enforces an h-day label-overlap embargo at every origin. Permutation tests collapse strictly to naive baselines, verifying zero forward data leakage.",
      },
    ],
    chartGuideAriaLabel: "Reading the chart",
    chartGuideTitle: "READING THE CHART",
    chartGuideMeta: "5 SERIES",
    chartSeriesGuide: [
      {
        label: "Actual Close (EOD)",
        swatchClass: "swatch-actual",
        desc: "Solid high-contrast series of historical adjusted closing prices.",
      },
      {
        label: "Walk-Forward Backtest",
        swatchClass: "swatch-backtest",
        desc: "Dotted neutral series plotting historical out-of-sample medians at target dates.",
      },
      {
        label: "Forward Median",
        swatchClass: "swatch-forecast",
        desc: "Solid emerald median (flat random walk) anchored at latest EOD close.",
      },
      {
        label: "80% Empirical Interval",
        swatchClass: "swatch-80",
        desc: "Dashed emerald 80% empirical interval bounds derived from trailing returns.",
      },
      {
        label: "95% Tail Interval",
        swatchClass: "swatch-95",
        desc: "Dotted amber 95% tail interval marking extreme dispersion boundaries.",
      },
    ],
    limitationsAriaLabel: "Known statistical limitations",
    limitationsTitle: "KNOWN STATISTICAL LIMITATIONS",
    limitationsMeta: "SAMPLE AND REGIME",
    limitations: [
      {
        label: "Sample Horizon",
        value: "Approximately 35 to 55 non-overlapping 30D windows per ticker.",
      },
      {
        label: "Regime Drift",
        value: "Historical 252D correction base rates remain non-stationary across regimes.",
      },
      {
        label: "IDX:GOTO Plateau",
        value: "95 consecutive zero-return days ending 2026-09-25 render metrics unreliable.",
      },
      {
        label: "IDX:DCII Liquidity",
        value: "15.3% non-traded days retained at zero volume with an is_traded flag.",
      },
    ],
    provenanceAriaLabel: "Data provenance and benchmarks",
    provenanceTitle: "DATA PROVENANCE AND BENCHMARKS",
    provenanceMeta: "EOD PIPELINE",
    provenanceItems: [
      {
        label: "Primary Feed",
        value: "Yahoo Finance via yfinance with auto_adjust=False and partial candles dropped.",
      },
      {
        label: "Audited Repair",
        value: "8 zero-volume anomalies repaired from historical Kaggle snapshots.",
      },
      {
        label: "Market Calendar",
        value: "Future axis skips weekends only; future dividends and JKSE source risks apply.",
      },
    ],
  },
  login: {
    checkingAuth: "Checking authentication...",
    scriptLoadError: "Failed to load Google Sign-In script.",
    googleSignInFailed: "Google Sign-In failed",
    signInFailed: "Sign-in failed",
    title: "End-of-Day Risk Monitor",
    description:
      "Sign in with your Google account to access calibrated volatility intervals and drawdown probabilities across all active equities.",
    signingIn: "Signing in...",
    devSignInButton: "Sign in with Google (Dev Sandbox)",
    unavailableBanner:
      "Google Sign-In is unavailable in this environment. Continue in guest mode to inspect IDX:TLKM inside Risk Watcher.",
    continueGuest: "Continue as Guest in Risk Watcher",
  },
  protectedRoute: {
    checkingSession: "Checking session...",
  },
};

const id: Messages = {
  nav: {
    primaryAriaLabel: "Navigasi utama",
    footerAriaLabel: "Navigasi footer",
    brandTag: "MONITOR RISIKO EOD",
    dashboard: "Dasbor",
    watcher: "Pemantau",
    methodology: "Metodologi",
    signIn: "Masuk",
    signOut: "Keluar",
    verified: "TERVERIFIKASI",
    switchToLight: "Ubah ke mode terang",
    switchToDark: "Ubah ke mode gelap",
    languageGroupLabel: "Pilihan bahasa",
    switchToEnglish: "Ubah bahasa ke Inggris",
    switchToIndonesian: "Ubah bahasa ke Indonesia",
  },
  footer: {
    dataAsOfSnapshot: "DATA PER SNAPSHOT EOD",
    lastUpdateNightly: "PEMBARUAN SUKSES TERAKHIR BATCH MALAM",
    sourceAudit: "SUMBER YFINANCE DAN PERBAIKAN TERAUDIT KAGGLE",
    pipelineTag: "PIPELINE BATCH AKHIR HARI",
    disclaimer:
      "KAIROS adalah monitor risiko akhir hari yang bersifat edukatif dan statistik berbasis data historis serta estimasi ketidakpastian terkalibrasi. Layanan ini bukan saran investasi, sinyal beli atau jual, maupun ajakan bertransaksi efek.",
  },
  dashboard: {
    heroAriaLabel: "Ringkasan platform KAIROS",
    headline: "Mengukur Ketidakpastian Ekuitas dan Risiko Ekor Pasca-Penutupan.",
    lead:
      "KAIROS adalah sistem intelijen risiko akhir hari untuk saham infrastruktur digital BEI. Alih-alih target harga spekulatif atau sinyal beli dan jual, sistem ini mengkalibrasi kerucut ketidakpastian ke depan setiap malam, rezim volatilitas bersyarat, dan probabilitas penurunan yang terverifikasi melalui backtesting walk-forward bebas kebocoran data.",
    pillarsAriaLabel: "Tiga model risiko terkalibrasi",
    pillars: [
      {
        code: "M1",
        title: "Rentang Harga Empiris",
        desc: "Menjangkarkan titik tengah pada harga penutupan terbaru dan memproyeksikan interval imbal hasil 80% dan 95% untuk horizon 7 hari dan 30 hari.",
        primary: true,
      },
      {
        code: "M2",
        title: "Volatilitas GARCH-t",
        desc: "Mengestimasi dispersi imbal hasil harian dan tahunan yang berubah terhadap waktu, dengan fallback varians jangka panjang otomatis untuk saham berlikuiditas tipis.",
        primary: false,
      },
      {
        code: "M3",
        title: "Probabilitas Koreksi",
        desc: "Mengukur peluang drawdown menembus ambang theta dalam horizon aktif dibandingkan tingkat dasar bergulir 252 hari.",
        primary: false,
      },
    ],
    ctaAriaLabel: "Buka pemantau risiko interaktif",
    ctaTitle: "Siap memeriksa kerucut harga EOD interaktif dan backtest historis?",
    ctaDesc:
      "Mode tamu memberikan akses langsung ke IDX:TLKM pada horizon 7 hari dan 30 hari di dalam Pemantau Risiko. Masuk dengan Google kapan saja untuk membuka seluruh saham yang tersedia.",
    openWatcher: "Buka Pemantau Risiko",
    readMethodology: "Baca Metodologi",
    signInGoogle: "Masuk dengan Google",
  },
  watcher: {
    loadingInstruments: "Memuat daftar instrumen aktif dari gateway...",
    loadError: (err) =>
      `Gagal memuat daftar instrumen (${err}). Pastikan layanan gateway berjalan lalu muat ulang halaman ini.`,
    reloadPage: "Muat ulang halaman",
    emptyInstruments:
      "Belum ada instrumen aktif yang dikonfigurasi. Jalankan proses ingesti atau periksa seed basis data sebelum melihat proyeksi.",
    workspaceAriaLabel: "Ruang kerja risiko utama",
    watchlistAriaLabel: "Daftar pantau emiten",
    statsAriaLabel: "Statistik risiko dan kalibrasi model",
    lockedDialogAriaLabel: (id) => `Perlu masuk untuk mengakses ${id}`,
    lockedTitle: (id, mic) => `${id} (${mic}) memerlukan sesi masuk`,
    lockedBody: (featuredId, lockedNames) =>
      `Mode tamu menampilkan ${featuredId}. Masuk dengan Google untuk memeriksa ${lockedNames}.`,
    dismiss: "Tutup",
    signInAllTickers: "Masuk untuk lihat semua saham",
    marketDataError: (id, err) =>
      `Gagal memuat data pasar untuk ${id} (${err}). Ubah horizon atau muat ulang ruang kerja.`,
    insufficientHistory: "Riwayat data tidak mencukupi untuk instrumen ini: proyeksi statistik tidak tersedia.",
    lowReliabilityWarning:
      "Reliabilitas rendah dan likuiditas tipis: volatilitas menggunakan fallback varians jangka panjang. Tafsirkan interval dengan hati-hati.",
    degradedWarning:
      "Status eksekusi terdegradasi: model beralih ke varians konstan atau EWMA untuk horizon ini.",
    loadingChartAriaLabel: "Memuat grafik proyeksi",
    loadingChartTitle: (horizon, id) =>
      `Memuat kerucut proyeksi ${horizon} hari dan penutupan historis untuk ${id}...`,
    loadingChartCanvasAriaLabel: "Memuat data grafik",
    provenanceAriaLabel: "Asal snapshot instrumen",
    dataAsOf: (date) => `DATA PER ${date}`,
    lastSuccessfulUpdate: (ts) => `PEMBARUAN SUKSES TERAKHIR ${ts}`,
    horizonTag: (horizon) => `HORIZON ${horizon}H`,
  },
  watchlist: {
    panelAriaLabel: "Daftar pantau emiten",
    title: "DAFTAR PANTAU EMITEN",
    tickersCount: (count) => `${count} EMITEN`,
    listAriaLabel: "Pilihan emiten",
    featuredToday: "UNGGULAN HARI INI",
    locked: "TERKUNCI",
    fullTier: "TIER PENUH",
    lowReliability: "RELIABILITAS RENDAH",
    insufficientData: "DATA TIDAK CUKUP",
  },
  badges: {
    degraded: "TERDEGRADASI",
    lastClose: "PENUTUPAN TERAKHIR",
    asOf: "PER TANGGAL",
  },
  horizon: {
    label: "HORIZON",
    groupAriaLabel: "Horizon",
  },
  forecastSummary: {
    coneAriaLabel: "Kerucut harga empiris",
    coneTitle: "KERUCUT HARGA EMPIRIS (M1)",
    horizonMeta: (days) => `HORIZON ${days}H`,
    range80Label: "RENTANG HARGA EMPIRIS 80%",
    rangeConnector: "hingga",
    interval95Label: "Interval Ekor 95%",
    forwardMedianLabel: "Median Proyeksi (M1)",
    volAriaLabel: "Statistik rezim volatilitas",
    volTitle: "REZIM VOLATILITAS (M2)",
    volMeta: "TAHUNAN DAN HARIAN",
    annualizedVol: "Vol Tahunan (M2)",
    dailyVol: "Vol Harian (M2)",
    volBand: "Pita Volatilitas (M2)",
    drawdownAriaLabel: "Statistik risiko drawdown",
    drawdownTitle: "RISIKO DRAWDOWN (M3)",
    drawdownMeta: "AMBANG EKOR",
    correctionProb: "Probabilitas Koreksi (M3)",
    drawdownThreshold: "Ambang Drawdown",
    baseRate252d: "Tingkat Dasar 252H",
  },
  chart: {
    sectionAriaLabel: "Grafik harga dan amplop ketidakpastian",
    titleWithTicker: (id, days) =>
      `${id}: Di mana posisi kerucut empiris ${days} hari terhadap penutupan historis?`,
    titleNoTicker: (days) =>
      `Di mana posisi kerucut empiris ${days} hari terhadap penutupan historis?`,
    updating: (days) => `MEMPERBARUI ${days}H...`,
    subtitle: (days) =>
      `Deret penutupan EOD historis dipadukan dengan median walk-forward out-of-sample dan interval ke depan ${days} hari.`,
    legendAriaLabel: "Legenda seri grafik",
    legendActual: "PENUTUPAN AKTUAL",
    legendBacktest: "BACKTEST WALK-FORWARD",
    legendMedian: "MEDIAN PROYEKSI",
    legend80: "INTERVAL 80%",
    legend95: "INTERVAL 95%",
    seriesActual: "Aktual",
    seriesBacktest: "Median backtest",
    seriesMedian: "Median proyeksi",
    seriesUpper80: "Batas atas 80%",
    seriesLower80: "Batas bawah 80%",
    seriesUpper95: "Batas atas 95%",
    seriesLower95: "Batas bawah 95%",
    canvasAriaLabel: (id, days) => `Grafik harga EOD dan kerucut ketidakpastian ${days} hari untuk ${id}`,
  },
  editorial: {
    ariaLabel: "Spesifikasi kalibrasi",
    title: "SPESIFIKASI KALIBRASI",
    collapse: "Tutup",
    expand: "Buka",
    headline: "Monitor Ketidakpastian Ekuitas dan Risiko Ekor Akhir Hari Terkalibrasi.",
    copy:
      "KAIROS menghitung interval harga pasca-penutupan harian, estimasi volatilitas bersyarat, dan probabilitas drawdown alih-alih prediksi arah harga atau sinyal transaksi.",
    modelPrefix: "MODEL",
    models: [
      {
        code: "M1",
        name: "Rentang Harga Empiris",
        spec: "Titik tengah random walk dipadukan dengan interval imbal hasil empiris 80% dan 95%.",
      },
      {
        code: "M2",
        name: "Volatilitas GARCH-t",
        spec: "Volatilitas bersyarat dinamis dengan fallback varians konstan otomatis pada saham berlikuiditas tipis.",
      },
      {
        code: "M3",
        name: "Probabilitas Koreksi",
        spec: "Probabilitas drawdown berbasis volatilitas yang diukur terhadap tingkat dasar bergulir 252 hari.",
      },
    ],
  },
  methodology: {
    title: "Metodologi dan Batasan Kalibrasi",
    lead:
      "KAIROS adalah monitor risiko akhir hari, bukan prediktor arah harga dan bukan sinyal perdagangan. Model M1, M2, dan M3 mengkalibrasi ketidakpastian pasca-penutupan pada horizon 7 dan 30 hari bursa.",
    modelsAriaLabel: "Model risiko terkalibrasi",
    modelsTitle: "MODEL RISIKO TERKALIBRASI",
    modelsMeta: "M1 / M2 / M3",
    modelSpecs: [
      {
        code: "MODEL M1",
        title: "Rentang Harga Empiris",
        desc: "Titik tengah random-walk yang dijangkarkan pada penutupan terbaru. Kuantil empiris 750 hari menjaga cakupan 70% hingga 90% pada TLKM, DCII, dan GOTO, saat ARIMA (rMAE sekitar 1) dan XGBoost gagal mengungguli baseline naif.",
      },
      {
        code: "MODEL M2",
        title: "Volatilitas GARCH-t",
        desc: "Lolos evaluasi QLIKE pada TLKM (rel_const = 0,877 pada h=7, 0,923 pada h=30). Saham berlikuiditas tipis GOTO dan DCII otomatis beralih ke varians jangka panjang konstan dengan status reliabilitas rendah, atau EWMA bila tidak konvergen.",
      },
      {
        code: "MODEL M3",
        title: "Probabilitas Koreksi",
        desc: "Mengestimasi peluang drawdown melewati ambang beku theta lewat aturan 0,85 x sigma_init x sqrt(h) bersama tingkat dasar bergulir 252 hari. Pada TLKM h=7, M3 mencapai BSS +0,043 tanpa beban pelatihan tersupervisi.",
      },
      {
        code: "BEBAS KEBOCORAN",
        title: "Verifikasi Embargo Walk-Forward",
        desc: "Menerapkan embargo tumpang tindih label h-hari pada setiap titik asal. Uji permutasi runtuh tepat ke baseline naif, membuktikan nol kebocoran data masa depan.",
      },
    ],
    chartGuideAriaLabel: "Cara membaca grafik",
    chartGuideTitle: "CARA MEMBACA GRAFIK",
    chartGuideMeta: "5 SERI",
    chartSeriesGuide: [
      {
        label: "Penutupan Aktual (EOD)",
        swatchClass: "swatch-actual",
        desc: "Garis solid kontras tinggi yang menampilkan harga penutupan penyesuaian historis.",
      },
      {
        label: "Backtest Walk-Forward",
        swatchClass: "swatch-backtest",
        desc: "Garis titik-titik netral yang memplot median out-of-sample historis pada tanggal target.",
      },
      {
        label: "Median Proyeksi",
        swatchClass: "swatch-forecast",
        desc: "Garis median emerald solid (random walk datar) yang berjangkar pada penutupan EOD terbaru.",
      },
      {
        label: "Interval Empiris 80%",
        swatchClass: "swatch-80",
        desc: "Garis putus-putus emerald batas interval empiris 80% dari distribusi imbal hasil historis.",
      },
      {
        label: "Interval Ekor 95%",
        swatchClass: "swatch-95",
        desc: "Garis titik-titik amber batas ekor 95% yang menandai batas dispersi ekstrem.",
      },
    ],
    limitationsAriaLabel: "Batasan statistik yang diketahui",
    limitationsTitle: "BATASAN STATISTIK YANG DIKETAHUI",
    limitationsMeta: "SAMPEL DAN REZIM",
    limitations: [
      {
        label: "Horizon Sampel",
        value: "Sekitar 35 hingga 55 jendela 30H non-tumpang tindih per saham.",
      },
      {
        label: "Pergeseran Rezim",
        value: "Tingkat dasar koreksi historis 252H bersifat non-stasioner lintas rezim.",
      },
      {
        label: "Dataran IDX:GOTO",
        value: "95 hari berturut-turut dengan imbal hasil nol hingga 2026-09-25 membuat metrik tidak andal.",
      },
      {
        label: "Likuiditas IDX:DCII",
        value: "15,3% hari tanpa transaksi dipertahankan pada volume nol dengan penanda is_traded.",
      },
    ],
    provenanceAriaLabel: "Asal data dan tolok ukur",
    provenanceTitle: "ASAL DATA DAN TOLOK UKUR",
    provenanceMeta: "PIPELINE EOD",
    provenanceItems: [
      {
        label: "Sumber Utama",
        value: "Yahoo Finance melalui yfinance dengan auto_adjust=False dan candle parsial dibuang.",
      },
      {
        label: "Perbaikan Teraudit",
        value: "8 anomali volume nol diperbaiki dari snapshot historis Kaggle.",
      },
      {
        label: "Kalender Pasar",
        value: "Sumbu masa depan hanya melewati akhir pekan; risiko dividen masa depan dan sumber JKSE berlaku.",
      },
    ],
  },
  login: {
    checkingAuth: "Memeriksa autentikasi...",
    scriptLoadError: "Gagal memuat skrip Google Sign-In.",
    googleSignInFailed: "Masuk dengan Google gagal",
    signInFailed: "Proses masuk gagal",
    title: "Monitor Risiko Akhir Hari",
    description:
      "Masuk dengan akun Google Anda untuk mengakses interval volatilitas terkalibrasi dan probabilitas drawdown di seluruh saham aktif.",
    signingIn: "Sedang masuk...",
    devSignInButton: "Masuk dengan Google (Dev Sandbox)",
    unavailableBanner:
      "Google Sign-In tidak tersedia di lingkungan ini. Lanjutkan dalam mode tamu untuk memeriksa IDX:TLKM di Pemantau Risiko.",
    continueGuest: "Lanjutkan sebagai Tamu di Pemantau Risiko",
  },
  protectedRoute: {
    checkingSession: "Memeriksa sesi...",
  },
};

export const MESSAGES: Record<Locale, Messages> = { en, id };
