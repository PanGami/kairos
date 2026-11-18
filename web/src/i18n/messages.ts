import { adminUsersEn, adminUsersId, type AdminUsersMessages } from "./admin.messages";
import { authUiEn, authUiId, type AuthUiMessages } from "./auth.messages";
import {
  chartUiEn,
  chartUiId,
  dashboardChartHoverEn,
  dashboardChartHoverId,
  tickerSearchEn,
  tickerSearchId,
  type ChartUiMessages,
  type DashboardChartHoverMessages,
  type TickerSearchMessages,
} from "./chart.messages";

export type Locale = "en" | "id";

export type FooterTopicKey =
  | "about"
  | "contact"
  | "help"
  | "terms"
  | "glossary"
  | "privacy"
  | "social";

export type DashboardFeatureKey = "m1" | "m2" | "m3" | "backtest";

export interface FooterTopicContent {
  title: string;
  badge: string;
  lead: string;
  items: Array<{ label: string; body: string }>;
  routeLabel?: string;
  routeTo?: string;
}

export interface Messages {
  nav: {
    primaryAriaLabel: string;
    footerAriaLabel: string;
    brandTag: string;
    dashboard: string;
    watcher: string;
    methodology: string;
    users: string;
    signIn: string;
    signOut: string;
    verified: string;
    unverified: string;
    profile: string;
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
    brandSubtitle: string;
    colInfoAriaLabel: string;
    colResourcesAriaLabel: string;
    socialAriaLabel: string;
    closeDialog: string;
    closeAriaLabel: string;
    links: {
      about: string;
      contact: string;
      help: string;
      terms: string;
      glossary: string;
      privacy: string;
      linkedinAriaLabel: string;
      instagramAriaLabel: string;
    };
    topics: Record<FooterTopicKey, FooterTopicContent>;
  };
  dashboard: {
    heroAriaLabel: string;
    heroTitlePrefix: string;
    heroTitleAccent: string;
    lead: string;
    openWatcher: string;
    readMethodology: string;
    signInGoogle: string;
    heroQuickLinksAriaLabel: string;
    heroQuickLinks: Array<{ label: string; to: string }>;
    heroProvenanceTitle: string;
    heroProvenanceItems: string[];
    heroPreview: {
      ariaLabel: string;
      headerTag: string;
      sampleTag: string;
      ticker: string;
      mic: string;
      tier: string;
      featured: string;
      range80Label: string;
      range80SampleValue: string;
      sampleNote: string;
      watchlistTitle: string;
      watchlistRows: Array<{ ticker: string; tier: string; tone: "verified" | "warning" }>;
      ctaLink: string;
    };
    worryAriaLabel: string;
    worryTitle: string;
    worryMetrics: Array<{ label: string; value: string; sub: string }>;
    worryNoteLabel: string;
    worryNoteText: string;
    worryHighlightTitle: string;
    worryHighlightDesc: string;
    worryVisual: {
      badge: string;
      horizon7Label: string;
      horizon7Desc: string;
      horizon30Label: string;
      horizon30Desc: string;
      windowLabel: string;
      auditLabel: string;
    };
    benefitsAriaLabel: string;
    benefitsTitle: string;
    benefits: Array<{
      badge: string;
      title: string;
      desc: string;
      primary: boolean;
    }>;
    warningAriaLabel: string;
    warningTitle: string;
    warningDesc: string;
    warningAction: string;
    warningShowcaseAriaLabel: string;
    warningShowcaseHeader: string;
    warningCards: Array<{
      ticker: string;
      status: string;
      tone: "warning" | "verified";
      title: string;
      detail: string;
    }>;
    featuresAriaLabel: string;
    featuresTitle: string;
    featuresListAriaLabel: string;
    features: Array<{
      id: DashboardFeatureKey;
      code: string;
      label: string;
      desc: string;
      previewTag: string;
      previewHeadline: string;
      previewPrimaryLabel: string;
      previewPrimaryValue: string;
      previewMetrics: Array<{ label: string; value: string }>;
    }>;
    featuresPreviewAriaLabel: string;
    featuresPreviewSampleBadge: string;
    featuresChartLegend: {
      actual: string;
      backtest: string;
      median: string;
      band80: string;
      band95: string;
    };
    ctaWatcherFinal: string;
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
  chartUi: ChartUiMessages;
  tickerSearch: TickerSearchMessages;
  dashboardChartHover: DashboardChartHoverMessages;
  authUi: AuthUiMessages;
  adminUsers: AdminUsersMessages;
}

const en: Messages = {
  nav: {
    primaryAriaLabel: "Primary navigation",
    footerAriaLabel: "Footer navigation",
    brandTag: "EOD RISK MONITOR",
    dashboard: "Dashboard",
    watcher: "Watcher",
    methodology: "Methodology",
    users: "Users",
    signIn: "Sign In",
    signOut: "Sign Out",
    verified: "VERIFIED",
    unverified: "UNVERIFIED",
    profile: "Profile",
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
    brandSubtitle: "CALIBRATED END-OF-DAY RISK MONITOR",
    colInfoAriaLabel: "Platform information",
    colResourcesAriaLabel: "Documentation and privacy",
    socialAriaLabel: "Social profiles",
    closeDialog: "Close",
    closeAriaLabel: "Close information dialog",
    links: {
      about: "About Me",
      contact: "Contact",
      help: "Help",
      terms: "Terms",
      glossary: "Stock Glossary",
      privacy: "Privacy",
      linkedinAriaLabel: "KAIROS LinkedIn profile information",
      instagramAriaLabel: "KAIROS Instagram profile information",
    },
    topics: {
      about: {
        title: "About Me and KAIROS",
        badge: "PROJECT PROFILE",
        lead: "KAIROS is built and maintained as an open, quantitative end-of-day equity risk monitor focused on Indonesian digital infrastructure stocks (IDX:TLKM, IDX:GOTO, IDX:DCII).",
        items: [
          {
            label: "Maintainer",
            body: "Developed by PanGami and KAIROS contributors under the MIT open-source license.",
          },
          {
            label: "Core Architecture",
            body: "Split-ready monorepo combining a React + TypeScript dashboard, Go REST gateway, Python gRPC ml-service, and nightly EOD ingestion pipeline.",
          },
          {
            label: "Design Mandate",
            body: "Quantify uncertainty and tail risk after market close instead of publishing price targets or buy and sell recommendations.",
          },
        ],
        routeLabel: "Read Full Methodology",
        routeTo: "/methodology",
      },
      contact: {
        title: "Contact and Feedback",
        badge: "MAINTAINER CHANNEL",
        lead: "Questions on statistical methodology, data audits, or bug reports can be directed through the project repository or maintainer contact channel.",
        items: [
          {
            label: "Repository Maintainer",
            body: "PanGami (KAIROS End-of-Day Risk Monitor).",
          },
          {
            label: "Direct Email",
            body: "[PLACEHOLDER: maintainer contact email not yet configured for public deployment]",
          },
          {
            label: "Issue Reporting",
            body: "Document the affected ticker, horizon (7D or 30D), and EOD snapshot date when reporting calibration anomalies.",
          },
        ],
      },
      help: {
        title: "How to Read KAIROS",
        badge: "USER GUIDE",
        lead: "Follow three steps inside Risk Watcher to read empirical price cones and volatility regimes without confusing them with trading signals.",
        items: [
          {
            label: "1. Select Emitter and Horizon",
            body: "Guest sessions display IDX:TLKM across 7-day and 30-day trading horizons. Sign in with Google to inspect IDX:GOTO and IDX:DCII.",
          },
          {
            label: "2. Inspect 80% and 95% Bands",
            body: "The dashed emerald 80% interval reflects typical trailing return dispersion, while the dotted amber 95% line marks historical tail bounds.",
          },
          {
            label: "3. Check Reliability Status",
            body: "Watch for LOW RELIABILITY or DEGRADED status banners on thin-liquidity equities where M2 falls back to constant long-run variance.",
          },
        ],
        routeLabel: "Open Risk Watcher",
        routeTo: "/watcher",
      },
      terms: {
        title: "Terms of Use",
        badge: "EDUCATIONAL USE ONLY",
        lead: "KAIROS outputs are provided strictly for statistical education and quantitative risk research under the MIT License.",
        items: [
          {
            label: "No Investment Advice",
            body: "KAIROS does not provide financial advice, personalized recommendations, or buy and sell signals for any security.",
          },
          {
            label: "Third-Party Data Attribution",
            body: "Historical daily closes rely on Yahoo Finance (yfinance) and audited Kaggle IDX snapshots. Neither source is re-licensed by KAIROS.",
          },
          {
            label: "Statistical Limitations",
            body: "Non-stationary market regimes, zero-volume days, and corporate actions such as dividends can affect empirical interval coverage.",
          },
        ],
      },
      glossary: {
        title: "Stock and Risk Glossary",
        badge: "QUANTITATIVE TERMS",
        lead: "Key statistical and IDX market terms displayed across the KAIROS Dashboard and Risk Watcher terminal.",
        items: [
          {
            label: "M1 Empirical Price Cone",
            body: "A flat random-walk midpoint anchored at the latest EOD close, surrounded by 80% and 95% return quantiles from trailing 750 trading days.",
          },
          {
            label: "M2 GARCH-t Volatility",
            body: "Conditional volatility model capturing fat-tailed daily dispersion and volatility clustering, evaluated via QLIKE.",
          },
          {
            label: "M3 Correction Probability",
            body: "Estimated likelihood that price drops past frozen drawdown threshold theta within 7D or 30D, compared with the 252-day rolling base rate.",
          },
          {
            label: "Walk-Forward Embargo",
            body: "Out-of-sample backtest protocol enforcing an h-day label-overlap embargo so future prices never leak into historical forecasts.",
          },
        ],
        routeLabel: "Inspect Full Specs",
        routeTo: "/methodology",
      },
      privacy: {
        title: "Privacy and Session Handling",
        badge: "DATA MINIMIZATION",
        lead: "Public risk views require no login. Authentication applies only when unlocking the full emitter watchlist.",
        items: [
          {
            label: "Guest Access",
            body: "Viewing the Dashboard, Methodology, and IDX:TLKM in Risk Watcher sets no tracking cookies and requires no personal data.",
          },
          {
            label: "Google Sign-In Sessions",
            body: "When signing in, KAIROS stores only your verified user identity and session token locally to authorize watchlist requests.",
          },
          {
            label: "Theme and Locale Preferences",
            body: "Light or dark mode and EN/ID language choices remain strictly inside your browser localStorage.",
          },
        ],
      },
      social: {
        title: "LinkedIn and Instagram Profiles",
        badge: "SOCIAL CHANNELS",
        lead: "Connect with the KAIROS maintainer through the official LinkedIn and Instagram profiles.",
        items: [
          {
            label: "LinkedIn",
            body: "https://www.linkedin.com/in/panca-nugraha-wicaksana/",
          },
          {
            label: "Instagram",
            body: "https://www.instagram.com/pangami_",
          },
          {
            label: "Platform Status",
            body: "You can verify all live risk models and methodology documentation directly inside the application.",
          },
        ],
      },
    },
  },
  dashboard: {
    heroAriaLabel: "KAIROS risk monitor overview",
    heroTitlePrefix: "Calibrated End-of-Day",
    heroTitleAccent: "Equity Risk Monitor",
    lead:
      "KAIROS helps you evaluate post-close price uncertainty intervals, conditional volatility regimes, and drawdown probabilities for IDX equities in one workspace without speculative buy or sell noise.",
    openWatcher: "Open Risk Watcher",
    readMethodology: "Read Methodology",
    signInGoogle: "Sign In with Google",
    heroQuickLinksAriaLabel: "Quick workspace views",
    heroQuickLinks: [
      { label: "7D EMPIRICAL CONE", to: "/watcher?horizon=7" },
      { label: "30D EMPIRICAL CONE", to: "/watcher?horizon=30" },
      { label: "WALK-FORWARD AUDIT", to: "/methodology" },
    ],
    heroProvenanceTitle: "Audited Methodology and Data Sources",
    heroProvenanceItems: [
      "IDX EOD SNAPSHOT",
      "LEAK-FREE WALK-FORWARD TEST",
      "YFINANCE AND KAGGLE AUDITED",
    ],
    heroPreview: {
      ariaLabel: "KAIROS Risk Watcher workspace preview",
      headerTag: "RISK WATCHER PREVIEW",
      sampleTag: "SAMPLE PREVIEW",
      ticker: "IDX:TLKM",
      mic: "XIDX",
      tier: "FULL TIER",
      featured: "FEATURED TODAY",
      range80Label: "80% EMPIRICAL RANGE (7D SAMPLE)",
      range80SampleValue: "2,680 to 2,940 IDR",
      sampleNote: "Illustrative range preview. Open Risk Watcher for live gateway EOD snapshots.",
      watchlistTitle: "EMITTER WATCHLIST",
      watchlistRows: [
        { ticker: "IDX:TLKM", tier: "FULL TIER", tone: "verified" },
        { ticker: "IDX:GOTO", tier: "LOW RELIABILITY", tone: "warning" },
        { ticker: "IDX:DCII", tier: "LOW RELIABILITY", tone: "warning" },
      ],
      ctaLink: "Inspect Live EOD Cone",
    },
    worryAriaLabel: "Post-close risk bounds overview",
    worryTitle: "Concerned About Post-Close Price Swings?",
    worryMetrics: [
      {
        label: "Core Empirical Band",
        value: "80%",
        sub: "Typical 7D and 30D dispersion interval",
      },
      {
        label: "Tail Risk Boundary",
        value: "95%",
        sub: "Historical extreme dispersion boundary",
      },
    ],
    worryNoteLabel: "Note:",
    worryNoteText:
      "Intervals are calibrated nightly after market close from trailing 750-trading-day return distributions, GARCH-t conditional volatility (M2), and 252-day rolling correction base rates.",
    worryHighlightTitle: "100% Open Guest Access for Featured Equities Without Sign-In",
    worryHighlightDesc:
      "Inspect interactive EOD price cones and historical walk-forward backtests for IDX:TLKM directly inside Risk Watcher. Sign in with Google anytime to unlock every emitter on the watchlist.",
    worryVisual: {
      badge: "NIGHTLY BATCH CALIBRATION",
      horizon7Label: "7D HORIZON",
      horizon7Desc: "Short-term post-close cone",
      horizon30Label: "30D HORIZON",
      horizon30Desc: "Monthly regime dispersion",
      windowLabel: "750D TRAILING QUANTILES",
      auditLabel: "H-DAY EMBARGO VERIFIED",
    },
    benefitsAriaLabel: "Advantages of monitoring risk with KAIROS",
    benefitsTitle: "Advantages of Monitoring Risk with KAIROS",
    benefits: [
      {
        badge: "750D EMPIRICAL QUANTILES",
        title: "More Objective",
        desc: "Ground your evaluation in observed return distributions and statistical calibration rather than market rumors or arbitrary price targets.",
        primary: true,
      },
      {
        badge: "H-DAY EMBARGO",
        title: "More Transparent",
        desc: "Every projection overlays out-of-sample walk-forward backtest medians and reliability status directly onto trailing closing prices.",
        primary: false,
      },
      {
        badge: "MODELS M1 / M2 / M3",
        title: "More Measured",
        desc: "Separate routine market dispersion (80% band) from tail correction risk (95% boundary and M3 threshold) before sizing portfolio exposure.",
        primary: false,
      },
    ],
    warningAriaLabel: "Smart Warning diagnostic system",
    warningTitle: "Smart Warning",
    warningDesc:
      "Works like an automated risk diagnostic that flags when conditional volatility shifts, drawdown probability climbs above its 252-day base rate, or thin liquidity degrades statistical reliability.",
    warningAction: "Inspect Active Alerts in Watcher",
    warningShowcaseAriaLabel: "Live diagnostic warning examples",
    warningShowcaseHeader: "NIGHTLY DIAGNOSTIC ENGINE",
    warningCards: [
      {
        ticker: "IDX:GOTO",
        status: "LOW RELIABILITY",
        tone: "warning",
        title: "95-Day Zero-Return Plateau Detected",
        detail: "Model M2 automatically falls back to constant long-run variance so stagnant closes do not distort volatility.",
      },
      {
        ticker: "IDX:TLKM",
        status: "FULL TIER",
        tone: "verified",
        title: "M3 Drawdown Probability Check (7D)",
        detail: "Compares correction likelihood past frozen threshold theta against the 252-day rolling historical base rate.",
      },
      {
        ticker: "IDX:DCII",
        status: "LOW RELIABILITY",
        tone: "warning",
        title: "15.3% Non-Traded Days Flagged",
        detail: "Retains zero-volume sessions with an is_traded flag so interval bounds remain auditable.",
      },
    ],
    featuresAriaLabel: "KAIROS Key Features",
    featuresTitle: "Key Features",
    featuresListAriaLabel: "Select a feature to preview",
    features: [
      {
        id: "m1",
        code: "M1",
        label: "EMPIRICAL PRICE CONE (M1)",
        desc: "Visualizes latest EOD close midpoints with trailing 80% and 95% empirical intervals across 7-day and 30-day horizons.",
        previewTag: "MODEL M1 ACTIVE",
        previewHeadline: "750-Day Trailing Empirical Quantiles",
        previewPrimaryLabel: "CALIBRATED BANDS",
        previewPrimaryValue: "80% Core / 95% Tail",
        previewMetrics: [
          { label: "Anchor", value: "Latest EOD Close" },
          { label: "Horizons", value: "7D and 30D" },
        ],
      },
      {
        id: "m2",
        code: "M2",
        label: "GARCH-T VOLATILITY REGIME (M2)",
        desc: "Tracks time-varying daily and annualized return dispersion validated via QLIKE, with automatic fallback on thin liquidity.",
        previewTag: "MODEL M2 ACTIVE",
        previewHeadline: "Conditional Volatility and Fallback Guard",
        previewPrimaryLabel: "TLKM QLIKE REL_CONST",
        previewPrimaryValue: "0.877 (7D) / 0.923 (30D)",
        previewMetrics: [
          { label: "Distribution", value: "Student-t GARCH" },
          { label: "Fallback", value: "Long-Run / EWMA" },
        ],
      },
      {
        id: "m3",
        code: "M3",
        label: "DRAWDOWN PROBABILITY MONITOR (M3)",
        desc: "Quantifies the likelihood of a correction crossing frozen threshold theta benchmarked against the 252-day rolling base rate.",
        previewTag: "MODEL M3 ACTIVE",
        previewHeadline: "Volatility-Implied Tail Risk",
        previewPrimaryLabel: "TLKM 7D SKILL (BSS)",
        previewPrimaryValue: "+0.043 vs Base Rate",
        previewMetrics: [
          { label: "Threshold Rule", value: "0.85 x sigma x sqrt(h)" },
          { label: "Benchmark", value: "252D Base Rate" },
        ],
      },
      {
        id: "backtest",
        code: "WF",
        label: "WALK-FORWARD BACKTEST AUDIT",
        desc: "Overlays historical out-of-sample medians directly over actual closing prices with an h-day embargo to verify zero leakage.",
        previewTag: "WALK-FORWARD VERIFIED",
        previewHeadline: "Leak-Free Out-of-Sample Check",
        previewPrimaryLabel: "EMBARGO POLICY",
        previewPrimaryValue: "h-Day Label Separation",
        previewMetrics: [
          { label: "30D Windows", value: "35 to 55 per ticker" },
          { label: "Permutation Check", value: "Matches Naive Baseline" },
        ],
      },
    ],
    featuresPreviewAriaLabel: "Interactive feature chart preview",
    featuresPreviewSampleBadge: "ILLUSTRATIVE CONE DIAGRAM",
    featuresChartLegend: {
      actual: "ACTUAL CLOSE",
      backtest: "WALK-FORWARD",
      median: "MEDIAN M1",
      band80: "80% BAND",
      band95: "95% TAIL",
    },
    ctaWatcherFinal: "Open Interactive Risk Watcher",
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
  chartUi: chartUiEn,
  tickerSearch: tickerSearchEn,
  dashboardChartHover: dashboardChartHoverEn,
  authUi: authUiEn,
  adminUsers: adminUsersEn,
};

const id: Messages = {
  nav: {
    primaryAriaLabel: "Navigasi utama",
    footerAriaLabel: "Navigasi footer",
    brandTag: "MONITOR RISIKO EOD",
    dashboard: "Dasbor",
    watcher: "Pemantau",
    methodology: "Metodologi",
    users: "Pengguna",
    signIn: "Masuk",
    signOut: "Keluar",
    verified: "TERVERIFIKASI",
    unverified: "BELUM TERVERIFIKASI",
    profile: "Profil",
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
    brandSubtitle: "MONITOR RISIKO AKHIR HARI TERKALIBRASI",
    colInfoAriaLabel: "Informasi platform",
    colResourcesAriaLabel: "Dokumentasi dan privasi",
    socialAriaLabel: "Profil media sosial",
    closeDialog: "Tutup",
    closeAriaLabel: "Tutup jendela informasi",
    links: {
      about: "Tentang Saya",
      contact: "Kontak",
      help: "Bantuan",
      terms: "Ketentuan",
      glossary: "Kamus Saham",
      privacy: "Privasi",
      linkedinAriaLabel: "Informasi profil LinkedIn KAIROS",
      instagramAriaLabel: "Informasi profil Instagram KAIROS",
    },
    topics: {
      about: {
        title: "Tentang Pengembang dan KAIROS",
        badge: "PROFIL PROYEK",
        lead: "KAIROS dibangun dan dikelola sebagai pemantau risiko ekuitas akhir hari berbasis statistik terbuka untuk saham infrastruktur digital BEI (IDX:TLKM, IDX:GOTO, IDX:DCII).",
        items: [
          {
            label: "Pengelola",
            body: "Dikembangkan oleh PanGami dan kontributor KAIROS di bawah lisensi sumber terbuka MIT.",
          },
          {
            label: "Arsitektur Inti",
            body: "Monorepo siap-pisah yang memadukan dasbor React + TypeScript, gateway REST Go, layanan gRPC ml-service Python, dan pipeline ingesti EOD malam.",
          },
          {
            label: "Mandat Desain",
            body: "Mengukur ketidakpastian dan risiko ekor setelah penutupan pasar, bukan menerbitkan target harga atau rekomendasi beli dan jual.",
          },
        ],
        routeLabel: "Baca Metodologi Lengkap",
        routeTo: "/methodology",
      },
      contact: {
        title: "Kontak dan Masukan",
        badge: "KANAL PENGELOLA",
        lead: "Pertanyaan mengenai metodologi statistik, audit data historis, atau laporan kendala teknis dapat disampaikan melalui kanal repositori maupun kontak pengelola.",
        items: [
          {
            label: "Pengelola Repositori",
            body: "PanGami (KAIROS End-of-Day Risk Monitor).",
          },
          {
            label: "Email Langsung",
            body: "[PLACEHOLDER: email kontak pengelola belum dikonfigurasi untuk rilis publik]",
          },
          {
            label: "Format Laporan Kendala",
            body: "Sertakan kode emiten, horizon (7H atau 30H), dan tanggal snapshot EOD saat melaporkan anomali kalibrasi.",
          },
        ],
      },
      help: {
        title: "Panduan Membaca KAIROS",
        badge: "PANDUAN PENGGUNA",
        lead: "Ikuti tiga langkah di Pemantau Risiko untuk membaca kerucut harga empiris dan rezim volatilitas secara tepat.",
        items: [
          {
            label: "1. Pilih Emiten dan Horizon",
            body: "Mode tamu menampilkan IDX:TLKM untuk horizon 7 hari dan 30 hari bursa. Masuk dengan Google untuk memeriksa IDX:GOTO dan IDX:DCII.",
          },
          {
            label: "2. Periksa Pita 80% dan 95%",
            body: "Garis putus-putus emerald 80% menunjukkan dispersi imbal hasil historis yang umum terjadi, sedangkan garis titik-titik amber 95% menandai batas risiko ekor.",
          },
          {
            label: "3. Cek Status Reliabilitas",
            body: "Perhatikan penanda RELIABILITAS RENDAH atau TERDEGRADASI pada saham berlikuiditas tipis saat M2 beralih ke varians jangka panjang konstan.",
          },
        ],
        routeLabel: "Buka Pemantau Risiko",
        routeTo: "/watcher",
      },
      terms: {
        title: "Ketentuan Penggunaan",
        badge: "EDUKASI DAN RISET",
        lead: "Seluruh keluaran KAIROS disediakan semata-mata untuk edukasi statistik dan riset risiko kuantitatif di bawah Lisensi MIT.",
        items: [
          {
            label: "Bukan Saran Investasi",
            body: "KAIROS tidak memberikan nasihat keuangan, rekomendasi pribadi, ataupun sinyal beli dan jual untuk efek apa pun.",
          },
          {
            label: "Atribusi Data Pihak Ketiga",
            body: "Data penutupan harian historis bersumber dari Yahoo Finance (yfinance) dan snapshot teraudit Kaggle BEI tanpa lisensi ulang oleh KAIROS.",
          },
          {
            label: "Batasan Statistik",
            body: "Perubahan rezim pasar non-stasioner, hari tanpa transaksi, dan aksi korporasi seperti dividen dapat memengaruhi cakupan interval empiris.",
          },
        ],
      },
      glossary: {
        title: "Kamus Saham dan Istilah Risiko",
        badge: "GLOSARIUM KUANTITATIF",
        lead: "Daftar istilah statistik dan pasar modal BEI yang ditampilkan pada Dasbor serta terminal Pemantau Risiko KAIROS.",
        items: [
          {
            label: "Kerucut Harga Empiris (M1)",
            body: "Titik tengah random-walk datar yang dijangkarkan pada penutupan EOD terbaru, diapit kuantil imbal hasil 80% dan 95% dari 750 hari bursa terakhir.",
          },
          {
            label: "Volatilitas GARCH-t (M2)",
            body: "Model volatilitas bersyarat untuk menangkap klastering volatilitas dan ekor distribusi tebal, teruji melalui metrik QLIKE.",
          },
          {
            label: "Probabilitas Koreksi (M3)",
            body: "Estimasi peluang penurunan harga menembus ambang drawdown beku theta dalam 7H atau 30H, dibandingkan terhadap tingkat dasar bergulir 252 hari.",
          },
          {
            label: "Embargo Walk-Forward",
            body: "Protokol uji historis di luar sampel dengan pemisahan label h-hari agar data masa depan tidak pernah bocor ke prediksi masa lalu.",
          },
        ],
        routeLabel: "Lihat Spesifikasi Model",
        routeTo: "/methodology",
      },
      privacy: {
        title: "Privasi dan Pengelolaan Sesi",
        badge: "MINIMALISASI DATA",
        lead: "Tampilan pemantau risiko publik dapat diakses tanpa login. Autentikasi hanya berlaku saat Anda membuka daftar pantau emiten lengkap.",
        items: [
          {
            label: "Akses Mode Tamu",
            body: "Membaca Dasbor, Metodologi, dan IDX:TLKM di Pemantau Risiko tidak memasang pelacak dan tidak memerlukan data pribadi.",
          },
          {
            label: "Sesi Masuk Google",
            body: "Saat Anda masuk, KAIROS hanya menyimpan identitas terverifikasi dan token sesi di peramban untuk mengotorisasi permintaan daftar pantau.",
          },
          {
            label: "Preferensi Tema dan Bahasa",
            body: "Pilihan mode gelap atau terang serta bahasa ID/EN disimpan sepenuhnya di localStorage peramban Anda.",
          },
        ],
      },
      social: {
        title: "Profil LinkedIn dan Instagram",
        badge: "KANAL SOSIAL",
        lead: "Terhubung dengan pengelola KAIROS melalui profil resmi LinkedIn dan Instagram.",
        items: [
          {
            label: "LinkedIn",
            body: "https://www.linkedin.com/in/panca-nugraha-wicaksana/",
          },
          {
            label: "Instagram",
            body: "https://www.instagram.com/pangami_",
          },
          {
            label: "Status Dokumentasi",
            body: "Anda dapat meninjau seluruh model risiko dan catatan keterbatasan statistik langsung di halaman Metodologi.",
          },
        ],
      },
    },
  },
  dashboard: {
    heroAriaLabel: "Ringkasan pemantau risiko KAIROS",
    heroTitlePrefix: "Pemantau Risiko",
    heroTitleAccent: "Saham Akhir Hari",
    lead:
      "KAIROS membantu Anda mengukur rentang ketidakpastian harga pasca-penutupan bursa, rezim volatilitas harian, dan peluang koreksi saham BEI dalam satu tempat tanpa kebisingan sinyal beli atau jual spekulatif.",
    openWatcher: "Mulai Pantau Risiko",
    readMethodology: "Pelajari Metodologi",
    signInGoogle: "Masuk dengan Google",
    heroQuickLinksAriaLabel: "Pintasan ruang kerja",
    heroQuickLinks: [
      { label: "KERUCUT 7H EMPIRIS", to: "/watcher?horizon=7" },
      { label: "KERUCUT 30H EMPIRIS", to: "/watcher?horizon=30" },
      { label: "AUDIT WALK-FORWARD", to: "/methodology" },
    ],
    heroProvenanceTitle: "Metodologi dan Sumber Data Teraudit",
    heroProvenanceItems: [
      "SNAPSHOT EOD BURSA EFEK INDONESIA",
      "UJI WALK-FORWARD BEBAS BOCOR DATA",
      "SUMBER YFINANCE DAN AUDIT KAGGLE",
    ],
    heroPreview: {
      ariaLabel: "Pratinjau ruang kerja KAIROS Pemantau Risiko",
      headerTag: "PRATINJAU PEMANTAU RISIKO",
      sampleTag: "CONTOH PRATINJAU",
      ticker: "IDX:TLKM",
      mic: "XIDX",
      tier: "TIER PENUH",
      featured: "UNGGULAN HARI INI",
      range80Label: "RENTANG EMPIRIS 80% (CONTOH 7H)",
      range80SampleValue: "2.680 hingga 2.940 IDR",
      sampleNote: "Ilustrasi struktur tampilan. Buka Pemantau Risiko untuk snapshot EOD langsung dari gateway.",
      watchlistTitle: "DAFTAR PANTAU EMITEN",
      watchlistRows: [
        { ticker: "IDX:TLKM", tier: "TIER PENUH", tone: "verified" },
        { ticker: "IDX:GOTO", tier: "RELIABILITAS RENDAH", tone: "warning" },
        { ticker: "IDX:DCII", tier: "RELIABILITAS RENDAH", tone: "warning" },
      ],
      ctaLink: "Periksa Kerucut EOD",
    },
    worryAriaLabel: "Ringkasan batas risiko pasca-penutupan",
    worryTitle: "Khawatir Saham Bergerak di Luar Ekspektasi?",
    worryMetrics: [
      {
        label: "Interval Empiris Utama",
        value: "80%",
        sub: "Rentang fluktuasi normal 7H dan 30H",
      },
      {
        label: "Batas Risiko Ekor",
        value: "95%",
        sub: "Batas guncangan ekstrem historis",
      },
    ],
    worryNoteLabel: "Keterangan:",
    worryNoteText:
      "Sudah mencakup kalibrasi kuantil empiris 750 hari bursa terakhir, estimasi volatilitas bersyarat GARCH-t (M2), dan pembandingan probabilitas koreksi terhadap tingkat dasar bergulir 252 hari.",
    worryHighlightTitle: "Akses Langsung 100% Terbuka untuk Saham Unggulan Tanpa Login",
    worryHighlightDesc:
      "Anda dapat langsung memeriksa kerucut harga EOD dan backtest historis IDX:TLKM secara terbuka di Pemantau Risiko. Masuk dengan akun Google kapan saja untuk membuka seluruh daftar pantau emiten.",
    worryVisual: {
      badge: "KALIBRASI BATCH MALAM",
      horizon7Label: "HORIZON 7H",
      horizon7Desc: "Kerucut jangka pendek EOD",
      horizon30Label: "HORIZON 30H",
      horizon30Desc: "Dispersi rezim bulanan",
      windowLabel: "KUANTIL 750H TERAKHIR",
      auditLabel: "TERVERIFIKASI EMBARGO H-HARI",
    },
    benefitsAriaLabel: "Keuntungan memantau risiko bersama KAIROS",
    benefitsTitle: "Keuntungan Memantau Risiko Bersama KAIROS",
    benefits: [
      {
        badge: "750H KUANTIL EMPIRIS",
        title: "Lebih Objektif",
        desc: "Dapatkan gambaran risiko yang jujur dari distribusi imbal hasil nyata dan uji statistik, bukan dari rumor pasar atau target harga spekulatif.",
        primary: true,
      },
      {
        badge: "EMBARGO H-HARI",
        title: "Lebih Transparan",
        desc: "Setiap proyeksi menampilkan jejak backtest walk-forward di luar sampel dan status reliabilitas data secara langsung di atas grafik penutupan.",
        primary: false,
      },
      {
        badge: "MODEL M1 / M2 / M3",
        title: "Lebih Terukur",
        desc: "Pisahkan fluktuasi harian wajar (interval 80%) dari potensi koreksi ekor (batas 95% dan ambang drawdown M3) sebelum mengevaluasi eksposur portofolio.",
        primary: false,
      },
    ],
    warningAriaLabel: "Sistem diagnostik Peringatan Cerdas",
    warningTitle: "Peringatan Cerdas",
    warningDesc:
      "Bagaikan memiliki asisten manajemen risiko yang memberi peringatan otomatis saat struktur volatilitas berubah, peluang koreksi melampaui tingkat dasar 252 hari, atau kualitas data menurun akibat likuiditas tipis.",
    warningAction: "Periksa Peringatan Aktif di Pemantau",
    warningShowcaseAriaLabel: "Contoh kartu diagnostik peringatan",
    warningShowcaseHeader: "MESIN DIAGNOSTIK MALAM",
    warningCards: [
      {
        ticker: "IDX:GOTO",
        status: "RELIABILITAS RENDAH",
        tone: "warning",
        title: "Deteksi Stagnasi Harga 95 Hari Bursa",
        detail: "Model M2 otomatis beralih ke fallback varians jangka panjang konstan agar penutupan stagnan tidak mendistorsi kuantil.",
      },
      {
        ticker: "IDX:TLKM",
        status: "TIER PENUH",
        tone: "verified",
        title: "Evaluasi Ambang Koreksi M3 (Horizon 7H)",
        detail: "Membandingkan peluang koreksi melewati ambang beku theta terhadap tingkat dasar historis 252 hari bursa.",
      },
      {
        ticker: "IDX:DCII",
        status: "RELIABILITAS RENDAH",
        tone: "warning",
        title: "Penanda 15,3% Hari Tanpa Transaksi",
        detail: "Mempertahankan hari bursa dengan volume nol melalui penanda is_traded agar pita risiko tetap teraudit.",
      },
    ],
    featuresAriaLabel: "Fitur Utama KAIROS",
    featuresTitle: "Fitur Utama",
    featuresListAriaLabel: "Pilih fitur untuk melihat pratinjau",
    features: [
      {
        id: "m1",
        code: "M1",
        label: "KERUCUT HARGA EMPIRIS (M1)",
        desc: "Memvisualisasikan titik tengah penutupan EOD terbaru beserta rentang empiris 80% dan 95% untuk horizon 7 dan 30 hari bursa.",
        previewTag: "MODEL M1 AKTIF",
        previewHeadline: "Kuantil Empiris 750 Hari Bursa Terakhir",
        previewPrimaryLabel: "PITA TERKALIBRASI",
        previewPrimaryValue: "80% Inti / 95% Ekor",
        previewMetrics: [
          { label: "Jangkar Tengah", value: "Penutupan EOD Terbaru" },
          { label: "Horizon Aktif", value: "7H dan 30H" },
        ],
      },
      {
        id: "m2",
        code: "M2",
        label: "DATA VOLATILITAS GARCH-T (M2)",
        desc: "Mengestimasi dispersi imbal hasil harian dan tahunan yang tervalidasi QLIKE, lengkap dengan fallback varians pada saham likuiditas tipis.",
        previewTag: "MODEL M2 AKTIF",
        previewHeadline: "Volatilitas Bersyarat dan Pengaman Fallback",
        previewPrimaryLabel: "QLIKE REL_CONST TLKM",
        previewPrimaryValue: "0,877 (7H) / 0,923 (30H)",
        previewMetrics: [
          { label: "Distribusi", value: "Student-t GARCH" },
          { label: "Fallback", value: "Varians Konstan / EWMA" },
        ],
      },
      {
        id: "m3",
        code: "M3",
        label: "PEMANTAU PROBABILITAS KOREKSI (M3)",
        desc: "Mengukur peluang koreksi menembus ambang beku theta yang dibandingkan terhadap tingkat dasar bergulir 252 hari.",
        previewTag: "MODEL M3 AKTIF",
        previewHeadline: "Risiko Ekor Tersirat Volatilitas",
        previewPrimaryLabel: "SKOR BSS TLKM 7H",
        previewPrimaryValue: "+0,043 vs Tingkat Dasar",
        previewMetrics: [
          { label: "Aturan Ambang", value: "0,85 x sigma x sqrt(h)" },
          { label: "Pembanding", value: "Tingkat Dasar 252H" },
        ],
      },
      {
        id: "backtest",
        code: "WF",
        label: "AUDIT BACKTEST WALK-FORWARD",
        desc: "Menampilkan jejak median prediksi di luar sampel langsung di atas harga penutupan aktual dengan embargo h-hari bebas kebocoran data.",
        previewTag: "WALK-FORWARD TERVERIFIKASI",
        previewHeadline: "Uji Out-of-Sample Bebas Kebocoran",
        previewPrimaryLabel: "ATURAN EMBARGO",
        previewPrimaryValue: "Pemisahan Label h-Hari",
        previewMetrics: [
          { label: "Jendela 30H", value: "35 hingga 55 per saham" },
          { label: "Uji Permutasi", value: "Runtuh ke Baseline Naif" },
        ],
      },
    ],
    featuresPreviewAriaLabel: "Pratinjau grafik fitur interaktif",
    featuresPreviewSampleBadge: "DIAGRAM ILUSTRATIF KERUCUT",
    featuresChartLegend: {
      actual: "PENUTUPAN AKTUAL",
      backtest: "WALK-FORWARD",
      median: "MEDIAN M1",
      band80: "PITA 80%",
      band95: "EKOR 95%",
    },
    ctaWatcherFinal: "Buka Pemantau Risiko Interaktif",
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
  chartUi: chartUiId,
  tickerSearch: tickerSearchId,
  dashboardChartHover: dashboardChartHoverId,
  authUi: authUiId,
  adminUsers: adminUsersId,
};

export const MESSAGES: Record<Locale, Messages> = { en, id };
