import type { ChartType, IndicatorKey } from "../utils/chartPrefs";
import type { RangeKey } from "../utils/priceStats";

export type DashboardChartLayerKey = "actual" | "backtest" | "cone80" | "cone95";

export interface DashboardChartHoverMessages {
  defaultHint: string;
  layers: Record<DashboardChartLayerKey, { label: string; desc: string }>;
}

export const dashboardChartHoverEn: DashboardChartHoverMessages = {
  defaultHint: "Hover over the white close line, emerald 80% cone, or amber 95% bounds to inspect each layer.",
  layers: {
    actual: {
      label: "ACTUAL EOD CLOSE",
      desc: "Trailing adjusted closing prices up to the latest end-of-day snapshot.",
    },
    backtest: {
      label: "WALK-FORWARD MEDIAN",
      desc: "Out-of-sample historical medians verified with an h-day leak-free embargo.",
    },
    cone80: {
      label: "80% EMPIRICAL CONE (M1)",
      desc: "Forward random-walk median paired with the 80% core interval from 750-day empirical quantiles.",
    },
    cone95: {
      label: "95% TAIL BOUNDARY (M1)",
      desc: "Outer 95% tail risk envelope highlighting extreme historical return dispersion.",
    },
  },
};

export const dashboardChartHoverId: DashboardChartHoverMessages = {
  defaultHint: "Arahkan kursor ke garis putih penutupan, area hijau 80%, atau batas kuning 95% untuk info lapisan.",
  layers: {
    actual: {
      label: "PENUTUPAN AKTUAL (EOD)",
      desc: "Jejak harga penutupan penyesuaian historis hingga snapshot akhir hari terbaru.",
    },
    backtest: {
      label: "MEDIAN WALK-FORWARD",
      desc: "Median uji historis out-of-sample dengan embargo h-hari bebas kebocoran data.",
    },
    cone80: {
      label: "KERUCUT EMPIRIS 80% (M1)",
      desc: "Median proyeksi random-walk beserta pita inti 80% dari kuantil empiris 750 hari.",
    },
    cone95: {
      label: "BATAS EKOR 95% (M1)",
      desc: "Amplop risiko ekor terluar 95% untuk menandai dispersi guncangan harga ekstrem.",
    },
  },
};

export interface ChartUiMessages {
  toolbarAriaLabel: string;
  symbolSearchLabel: string;
  symbolButtonAriaLabel: (id: string) => string;
  intervalTag: string;
  intervalHint: string;
  rangeGroupAriaLabel: string;
  ranges: Record<RangeKey, { label: string; aria: string }>;
  typeGroupAriaLabel: string;
  types: Record<ChartType, string>;
  indicatorsButton: (activeCount: number) => string;
  menu: {
    ariaLabel: string;
    title: string;
    groups: Record<"overlays" | "volume" | "risk", string>;
    items: Record<IndicatorKey, { label: string; desc: string }>;
    reset: string;
    close: string;
  };
  legend: {
    ariaLabel: string;
    median: string;
    items: Record<IndicatorKey, string>;
  };
  ohlc: {
    ariaLabel: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    openTitle: string;
    highTitle: string;
    lowTitle: string;
    closeTitle: string;
    volumeTitle: string;
  };
  stats: {
    ariaLabel: string;
    rangeHigh: string;
    rangeLow: string;
    high52w: string;
    low52w: string;
    avgVolume20d: string;
    rangeChange: string;
    note: (bars: number) => string;
  };
  canvasAriaLabel: (id: string, type: string, days: number) => string;
  series: {
    median: string;
    upper80: string;
    lower80: string;
    upper95: string;
    lower95: string;
    backtest: string;
    price: string;
  };
}

export interface TickerSearchMessages {
  dialogAriaLabel: string;
  badge: string;
  title: string;
  lead: string;
  searchLabel: string;
  searchPlaceholder: string;
  sortedNote: string;
  resultsCount: (shown: number, total: number) => string;
  empty: (query: string) => string;
  guestNote: (featuredId: string) => string;
  guestSignIn: string;
  selected: string;
  close: string;
  closeAriaLabel: string;
  watchlist: {
    showingTop: (shown: number, total: number) => string;
    browseAll: (total: number) => string;
    browseAriaLabel: string;
  };
}

export const chartUiEn: ChartUiMessages = {
  toolbarAriaLabel: "Chart controls",
  symbolSearchLabel: "Search",
  symbolButtonAriaLabel: (id) => `Current ticker ${id}. Open ticker search`,
  intervalTag: "1D",
  intervalHint: "KAIROS uses end-of-day candles, so the interval is fixed at one day.",
  rangeGroupAriaLabel: "Visible time range",
  ranges: {
    "1M": { label: "1M", aria: "Show the last 1 month" },
    "3M": { label: "3M", aria: "Show the last 3 months" },
    "6M": { label: "6M", aria: "Show the last 6 months" },
    "1Y": { label: "1Y", aria: "Show the last 1 year" },
    ALL: { label: "ALL", aria: "Show the full history" },
  },
  typeGroupAriaLabel: "Chart type",
  types: { candles: "Candles", area: "Area", line: "Line" },
  indicatorsButton: (n) => (n > 0 ? `Indicators (${n})` : "Indicators"),
  menu: {
    ariaLabel: "Indicator selection",
    title: "INDICATORS",
    groups: {
      overlays: "PRICE OVERLAYS",
      volume: "VOLUME",
      risk: "KAIROS RISK LAYERS",
    },
    items: {
      sma20: { label: "SMA 20", desc: "20-day simple moving average of the close." },
      sma50: { label: "SMA 50", desc: "50-day simple moving average of the close." },
      bollinger: { label: "Bollinger Bands", desc: "20-day average with bands at 2 standard deviations." },
      volume: { label: "Volume", desc: "Daily traded volume under the price panel." },
      cone80: { label: "80% Empirical Cone", desc: "Forward median with the 80% interval from model M1." },
      cone95: { label: "95% Tail Interval", desc: "Forward 95% tail bounds from model M1." },
      backtest: { label: "Walk-Forward Backtest", desc: "Out-of-sample medians plotted at target dates." },
    },
    reset: "Reset to default",
    close: "Close",
  },
  legend: {
    ariaLabel: "Active chart layers",
    median: "FORWARD MEDIAN",
    items: {
      sma20: "SMA 20",
      sma50: "SMA 50",
      bollinger: "BOLLINGER 20, 2",
      volume: "VOLUME",
      cone80: "80% INTERVAL",
      cone95: "95% INTERVAL",
      backtest: "WALK-FORWARD BACKTEST",
    },
  },
  ohlc: {
    ariaLabel: "Price readout for the selected day",
    open: "O",
    high: "H",
    low: "L",
    close: "C",
    volume: "Vol",
    openTitle: "Open",
    highTitle: "High",
    lowTitle: "Low",
    closeTitle: "Close",
    volumeTitle: "Volume",
  },
  stats: {
    ariaLabel: "Price range statistics",
    rangeHigh: "RANGE HIGH",
    rangeLow: "RANGE LOW",
    high52w: "52W HIGH",
    low52w: "52W LOW",
    avgVolume20d: "AVG VOLUME 20D",
    rangeChange: "RANGE CHANGE",
    note: (bars) => `Computed from ${bars} trading days in view. High and low use adjusted daily bars.`,
  },
  canvasAriaLabel: (id, type, days) => `${id} ${type} chart of end-of-day prices with the ${days}-day uncertainty cone`,
  series: {
    median: "Forecast median",
    upper80: "80% upper",
    lower80: "80% lower",
    upper95: "95% upper",
    lower95: "95% lower",
    backtest: "Backtest median",
    price: "Close",
  },
};

export const chartUiId: ChartUiMessages = {
  toolbarAriaLabel: "Kontrol grafik",
  symbolSearchLabel: "Cari",
  symbolButtonAriaLabel: (id) => `Emiten saat ini ${id}. Buka pencarian emiten`,
  intervalTag: "1H",
  intervalHint: "KAIROS memakai candle akhir hari, sehingga interval tetap satu hari.",
  rangeGroupAriaLabel: "Rentang waktu tampilan",
  ranges: {
    "1M": { label: "1B", aria: "Tampilkan 1 bulan terakhir" },
    "3M": { label: "3B", aria: "Tampilkan 3 bulan terakhir" },
    "6M": { label: "6B", aria: "Tampilkan 6 bulan terakhir" },
    "1Y": { label: "1T", aria: "Tampilkan 1 tahun terakhir" },
    ALL: { label: "SEMUA", aria: "Tampilkan seluruh riwayat" },
  },
  typeGroupAriaLabel: "Jenis grafik",
  types: { candles: "Candle", area: "Area", line: "Garis" },
  indicatorsButton: (n) => (n > 0 ? `Indikator (${n})` : "Indikator"),
  menu: {
    ariaLabel: "Pilihan indikator",
    title: "INDIKATOR",
    groups: {
      overlays: "OVERLAY HARGA",
      volume: "VOLUME",
      risk: "LAPISAN RISIKO KAIROS",
    },
    items: {
      sma20: { label: "SMA 20", desc: "Rata-rata bergerak sederhana 20 hari dari harga penutupan." },
      sma50: { label: "SMA 50", desc: "Rata-rata bergerak sederhana 50 hari dari harga penutupan." },
      bollinger: { label: "Bollinger Bands", desc: "Rata-rata 20 hari dengan pita 2 simpangan baku." },
      volume: { label: "Volume", desc: "Volume transaksi harian di bawah panel harga." },
      cone80: { label: "Kerucut Empiris 80%", desc: "Median proyeksi beserta interval 80% dari model M1." },
      cone95: { label: "Interval Ekor 95%", desc: "Batas ekor 95% ke depan dari model M1." },
      backtest: { label: "Backtest Walk-Forward", desc: "Median out-of-sample pada tanggal target." },
    },
    reset: "Kembalikan ke bawaan",
    close: "Tutup",
  },
  legend: {
    ariaLabel: "Lapisan grafik aktif",
    median: "MEDIAN PROYEKSI",
    items: {
      sma20: "SMA 20",
      sma50: "SMA 50",
      bollinger: "BOLLINGER 20, 2",
      volume: "VOLUME",
      cone80: "INTERVAL 80%",
      cone95: "INTERVAL 95%",
      backtest: "BACKTEST WALK-FORWARD",
    },
  },
  ohlc: {
    ariaLabel: "Data harga untuk hari terpilih",
    open: "B",
    high: "T",
    low: "R",
    close: "P",
    volume: "Vol",
    openTitle: "Pembukaan",
    highTitle: "Tertinggi",
    lowTitle: "Terendah",
    closeTitle: "Penutupan",
    volumeTitle: "Volume",
  },
  stats: {
    ariaLabel: "Statistik rentang harga",
    rangeHigh: "TERTINGGI RENTANG",
    rangeLow: "TERENDAH RENTANG",
    high52w: "TERTINGGI 52M",
    low52w: "TERENDAH 52M",
    avgVolume20d: "RATA VOLUME 20H",
    rangeChange: "PERUBAHAN RENTANG",
    note: (bars) => `Dihitung dari ${bars} hari bursa pada tampilan. Tertinggi dan terendah memakai bar harian yang disesuaikan.`,
  },
  canvasAriaLabel: (id, type, days) => `Grafik ${type} harga akhir hari ${id} beserta kerucut ketidakpastian ${days} hari`,
  series: {
    median: "Median proyeksi",
    upper80: "Batas atas 80%",
    lower80: "Batas bawah 80%",
    upper95: "Batas atas 95%",
    lower95: "Batas bawah 95%",
    backtest: "Median backtest",
    price: "Penutupan",
  },
};

export const tickerSearchEn: TickerSearchMessages = {
  dialogAriaLabel: "Ticker search",
  badge: "TICKER SEARCH",
  title: "Search Tickers",
  lead: "Find any listed emitter. Results are ordered from the most confident forecast to the least confident.",
  searchLabel: "Search by ticker, symbol, or exchange",
  searchPlaceholder: "Type TLKM, GOTO, DCII",
  sortedNote: "SORTED BY CONFIDENCE, HIGHEST FIRST",
  resultsCount: (shown, total) => `${shown} OF ${total} TICKERS`,
  empty: (query) => `No ticker matches "${query}". Try a shorter symbol.`,
  guestNote: (featuredId) =>
    `Guest mode opens only ${featuredId}. Sign in with Google to open every other ticker.`,
  guestSignIn: "Sign in to unlock all tickers",
  selected: "SELECTED",
  close: "Close",
  closeAriaLabel: "Close ticker search",
  watchlist: {
    showingTop: (shown, total) => `Top ${shown} of ${total} by confidence`,
    browseAll: (total) => `Search all ${total} tickers`,
    browseAriaLabel: "Open ticker search to browse every emitter",
  },
};

export const tickerSearchId: TickerSearchMessages = {
  dialogAriaLabel: "Pencarian emiten",
  badge: "PENCARIAN EMITEN",
  title: "Cari Emiten",
  lead: "Temukan emiten yang tersedia. Hasil diurutkan dari proyeksi paling meyakinkan hingga paling rendah.",
  searchLabel: "Cari berdasarkan kode, simbol, atau bursa",
  searchPlaceholder: "Ketik TLKM, GOTO, DCII",
  sortedNote: "DIURUTKAN BERDASARKAN KEYAKINAN, TERTINGGI DI ATAS",
  resultsCount: (shown, total) => `${shown} DARI ${total} EMITEN`,
  empty: (query) => `Tidak ada emiten yang cocok dengan "${query}". Coba simbol yang lebih pendek.`,
  guestNote: (featuredId) =>
    `Mode tamu hanya membuka ${featuredId}. Masuk dengan Google untuk membuka emiten lainnya.`,
  guestSignIn: "Masuk untuk membuka semua emiten",
  selected: "DIPILIH",
  close: "Tutup",
  closeAriaLabel: "Tutup pencarian emiten",
  watchlist: {
    showingTop: (shown, total) => `${shown} teratas dari ${total} berdasarkan keyakinan`,
    browseAll: (total) => `Cari semua ${total} emiten`,
    browseAriaLabel: "Buka pencarian emiten untuk melihat semua emiten",
  },
};
