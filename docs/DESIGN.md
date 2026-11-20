# KAIROS: UI/UX & Frontend Design Specification

Document version: 1.6  
Status: Binding Reference for Frontend Development  
Companion documents: [AGENTS.md](../AGENTS.md), [ARCHITECTURE.md](./ARCHITECTURE.md)  
Layout, Color & Typography Reference: [Stockbit](https://stockbit.com/) & [Stockbit Desktop](https://stockbit.com/desktop) (5-Section Product Overview Dashboard, Docked 3-Pane Financial Terminal, Matte Carbon Palette, Signature Emerald Accent, and Geometric Sans + Monospace Typography adapted strictly for End-of-Day Risk Monitoring)

---

## 1. Design Direction, Dials & Product Positioning

KAIROS is an **end-of-day risk monitor** for equity markets (starting with IDX digital infrastructure equities), not a directional price predictor and not a source of buy/sell signals. Never introduce "real-time", "live trading signal", orderbooks, running trade feeds, or "enterprise" claims anywhere in UI copy or visual metaphors.

- **Design Read**: Reading this as a multi-section product overview dashboard (`/`) paired with a **Docked 3-Pane Quantitative Terminal Watcher (`/watcher`)** for IDX equity market participants, in a Stockbit-referenced `Matte Carbon` + `Signature Emerald` quantitative financial style, dial `ENERGY 2 / RHYTHM 3 / MOTION 2`.
- **Dial Declaration**:
  - `ENERGY 2` (Balanced): Direct quantitative authority with clear visual hierarchy above the fold and zero marketing theatrics.
  - `RHYTHM 3` (Asymmetric, mixed compositions on `/`): Overview `/` flows across 5 distinct section structures (`Pemantau Risiko` split hero + device frame, `Khawatir Saham?` centered callout + 2-column horizon card, `Keuntungan` asymmetric `1.15fr 1fr 1fr` ledger, `Smart Warning` asymmetric alert stack, and `Key Features` interactive 2-column chart tour); Watcher `/watcher` divides a compact left **Emitter Watchlist**, center **Quote + EOD Chart**, and right **Cone + KeyStats + Calibration**.
  - `MOTION 2` (Controlled entrance + interactive state transitions): Overview `/` uses subtle `stageReveal` entrances (`10px`, `420ms`, `0ms`/`90ms`/`180ms` stagger) plus interactive `Key Features` preview switching and `FooterInfoModal` transitions, disabled completely under `prefers-reduced-motion: reduce`.
- **Identity Motif**: Docked 3-pane `1px`-bordered terminal workspace (`44px` uppercase widget header bars, Watchlist left pane, Quote + EOD Cone Chart center pane, and KeyStats + Model Calibration right pane) displaying empirical risk ranges above the fold.
- **Themes**: **Dark Mode Default (*Stockbit Matte Carbon*)** (`#121212` canvas / `#181818` surface) for extended post-close analytical sessions, paired with a WCAG AA verified **Light Mode (*Stockbit Clean Daylight*)** (`#F4F6F8` canvas / `#FFFFFF` surface) toggle via a dedicated Sun/Moon icon control.

### One-Line Decision Log (`R-31`)
- **Palette (Stockbit Reference)**: Neutral Matte Carbon (`#121212` / `#181818` dark, `#F4F6F8` / `#FFFFFF` light) provides zero-glare workspace ergonomics so Stockbit Signature Emerald (`#00AB6B` dark / `#006B42` light) draws focus cleanly to active selections, M1 forward cones, and primary CTAs without red/green order-ticket noise.
- **Terminal Layout (Stockbit Desktop Reference)**: Moving the Watchlist (`M1/M2/M3` statuses) left, Quote + EOD Cone Chart center, and Empirical Cone + Key Risk Statistics + Calibration Specification right puts every risk metric and chart interaction above the fold with zero landing-page hero scrolling.
- **Typography (Stockbit Reference)**: Pairing geometric `'Plus Jakarta Sans'` (`600`/`700` headings, `400`/`500` UI copy) with `'JetBrains Mono'` (`tabular-nums`) keeps docked widget titles, KeyStats rows, and dense numeric tickers aligned like a native trading terminal.
- **Surface & Borders**: Flat `1px` hairlines (`#2A2A2A` dark / `#E0E4EA` light) and surface stepping replace shadows and glassmorphism blur, while `--border-control` (`#636A75` dark / `#647080` light) enforces `>= 3:1` non-text contrast on every interactive boundary.
- **Docked Widgets Over Repeated Marketing Cards**: Compact `44px` widget title bars paired with KeyStats hairline tables and a collapsible right-rail Calibration Specification avoid symmetrical multi-column promo grids.
- **Theme Icon Exception**: A geometric SVG Sun/Moon icon in a `44x44px` button gives instant dark/light recognition in the sticky topbar while keeping data surfaces free of decorative symbols.

---

## 2. Strict Zero-Symbol & Accessible Controls Rule (MANDATORY)

To preserve institutional clarity and WCAG 2.2 accessibility, **emoticons, emojis, decorative status dots, and standalone punctuation separators are strictly forbidden** across UI labels, badges, metrics, and headings.

### Forbidden Characters & Patterns in UI Surfaces
- **Emoticons / Emojis**: Zero emojis of any kind across headings, bullets, labels, or buttons.
- **Standalone Dashes & Decorative Glyphs**: Never use em dashes (`--` / Unicode em dash), en dashes, bullet dots, checkmarks, crosses, stars, or arrows inside UI copy or labels. Always use colons, commas, parentheses, or `"to"` for numeric ranges (`1,900 to 2,172 IDR`).
- **Decorative Status Dots**: Do not render colored dots beside non-live badges or headings.
- **Brand Mark & Icon Scope Exception**: Functional SVG icons are permitted exclusively for the compact Sun/Moon theme switcher inside the header and the LinkedIn/Instagram channel buttons in the footer (`aria-label` required, `svg` marked `aria-hidden="true"`). Official brand identity assets use the transparent geometric "K" trajectory mark in `web/public/logo.png` (`28x28` rendered inside `.brand-group`, `alt=""`, `aria-hidden="true"` beside the `KAIROS` wordmark), accompanied by browser/app icons (`/favicon.png`, `/favicon.ico`, and `/apple-touch-icon.png`).

### Approved Visual Replacements
1. **Pure Typographic Status Pills**: Bordered monospace uppercase pills only where carrying real state:
   - `VERIFIED` / `UNVERIFIED`
   - `LOCKED` / `FEATURED TODAY`
   - `FULL TIER` / `LOW RELIABILITY` / `DEGRADED` / `INSUFFICIENT DATA`
2. **Spatial & Structural Separation**: Use `gap`, padding, and `1px solid var(--border-subtle)` horizontal or vertical hairlines instead of text separators like bullets, pipes, or dashes.
3. **Interactive Affordances**: Every enabled button, link, and control must carry `cursor: pointer`, a visible `:focus-visible` indicator (`2px solid var(--core-cyan)`), distinct hover/active/disabled states, and minimum `44x44px` touch target dimensions on mobile and tablet widths.

---

## 3. Core Color Architecture (Stockbit-Referenced 60-30-10 Rule, WCAG Verified)

KAIROS adopts Stockbit's matte carbon and clean daylight neutral surfaces (`60%` foundation) paired with **Stockbit Signature Emerald** (`#00AB6B` dark / `#006B42` light) as the active workspace accent (`30%` active focus, M1 empirical median/80% bands, and primary CTA buttons) and **Financial Amber** (`#F59E0B` dark / `#92400E` light) strictly for warning states and 95% tail bounds (`10%` risk edge). Every foreground/background and interactive border pairing is verified against WCAG 2.2 AA (`>= 4.5:1` normal text, `>= 3.0:1` non-text UI boundaries).

### 3.1 Core Tokens

| Role | Proportion | Token Name | Dark Mode | Light Mode | Contrast Note | Usage Scope |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Neutral Ground (Canvas)** | **60%** | `--bg-canvas` | `#121212` | `#F4F6F8` | Base ground | App shell, inner watchlist buttons |
| **Neutral Surface (Widget)** | **60%** | `--bg-surface` | `#181818` | `#FFFFFF` | Elevated widget | Docked panels, chart frame, footer |
| **Neutral Elevated (Header/Hover)** | **60%** | `--bg-elevated` | `#222222` | `#ECEFF3` | Active bar | Widget title bars, active emitter row |
| **Structural Hairline** | **60%** | `--border-subtle` | `#2A2A2A` | `#E0E4EA` | Subtle grid | Non-interactive `1px` dividers and chart grid |
| **Control Boundary** | **60%** | `--border-control` | `#636A75` | `#647080` | `>= 3.25:1` dark, `4.65:1+` light | Interactive buttons, toggles, watchlist borders |
| **Text Primary** | **60%** | `--text-primary` | `#F3F4F6` | `#121212` | `14.4:1+` dark, `18.8:1+` light | Headlines, prices, KeyStats values, actual close |
| **Text Muted** | **60%** | `--text-muted` | `#9CA3AF` | `#525B68` | `6.27:1+` dark, `5.96:1+` light | Captions, axis labels, provenance metadata |
| **Brand Accent (Signature Emerald)** | **30%** | `--core-cyan` | `#00AB6B` | `#006B42` | `5.33:1+` dark, `5.40:1+` light | Active nav links, horizon toggle, M1 cone, 80% interval |
| **Brand Accent Tint** | **30%** | `--core-cyan-soft` | `rgba(0, 171, 107, 0.14)` | `rgba(0, 107, 66, 0.10)` | Low opacity | Active horizon fill (`5.29:1` dark, `5.40:1` light) |
| **Primary CTA Fill** | **10%** | `--cta-amber` | `#00AB6B` | `#006B42` | Primary CTA bg | Primary Action Buttons ONLY (`Sign In`, `Sign in to view all tickers`, submit) |
| **Primary CTA Hover** | **10%** | `--cta-amber-hover` | `#00C47A` | `#005735` | Hover state | Hover state (`8.19:1` dark, `8.70:1` light) |
| **Primary CTA Active** | **10%** | `--cta-amber-active` | `#009960` | `#004228` | Active state | Pressed state (`5.11:1` dark, `11.60:1` light) |
| **Primary CTA Ink** | **10%** | `--cta-amber-ink` | `#121212` | `#FFFFFF` | `6.28:1` dark, `6.60:1` light | Bold button label on `--cta-amber` fill |

> **Strict Contrast Note for Primary Emerald CTAs**: In Dark Mode, `--cta-amber` (`#00AB6B`) pairs with matte carbon ink (`#121212`, `6.28:1`) while Light Mode deepens to emerald (`#006B42`) with pure white ink (`#FFFFFF`, `6.60:1`) so Primary Actions clear WCAG AA comfortably in both themes.

### 3.2 Semantic Status Tokens (Strictly for Data & Account State)

| State | Token | Dark Mode | Light Mode | Contrast vs Surface | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Verified / Full Tier** | `--status-verified` | `#00AB6B` | `#006B42` | `5.95:1` dark, `6.60:1` light | `VERIFIED` badge, `FULL TIER` badge |
| **Warning / Tail 95%** | `--status-warning` | `#F59E0B` | `#92400E` | `8.27:1` dark, `7.09:1` light | `LOW RELIABILITY`, `DEGRADED`, 95% chart boundary line |
| **Danger / Drawdown** | `--status-danger` | `#F87171` | `#B91C1C` | `6.42:1` dark, `6.47:1` light | `INSUFFICIENT DATA`, error banners, destructive actions |

---

## 4. Typography System (Stockbit Fintech Sans + Monospace Pair)

Do NOT use generic system defaults (`Inter`, `Roboto`, `Arial`, `Segoe UI`, `system-ui`). KAIROS mirrors Stockbit Desktop's clean geometric financial hierarchy using two specialized typefaces without decorative serifs:

| Role | Font Family | Weights | Styling Rules | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Terminal Display Headings** | `'Plus Jakarta Sans'` | `600`, `700` | Tight display tracking (`-0.015em`), line-height `1.22` | Docked headings, chart question title, methodology headers |
| **UI & Body Sans** | `'Plus Jakarta Sans'` | `400`, `500`, `600` | Line-height `1.55` | Navigation, KeyStats labels, descriptions, buttons, status banners |
| **Quantitative Mono** | `'JetBrains Mono'` | `400`, `500`, `600` | Mandatory `font-variant-numeric: tabular-nums;` | Stock tickers (`IDX:TLKM`), IDR figures, percentages, `theta`, timestamps, status pills |

- **Reading Measure, Line Wrap & Heading Hierarchy**: All body paragraphs (`<p>`) enforce `text-wrap: pretty` and reading measures of `50ch` to `54ch` (`<80` rendered characters per line) to prevent horizontal eye-tracking strain and trailing single-word stragglers. Primary page `<h1>` headings maintain at least a `1.25:1` scale step above `16px` body text and sit above secondary `<h2>` widget headings.

---

## 5. Layout Grid, Breakpoints & Component Hierarchy

- **Container Max Width**: `1440px` centered terminal frame (`16px` horizontal padding) for Stockbit Desktop-grade multi-pane visibility above the fold.
- **Responsive Breakpoints (Three Explicit States)**:
  - `> 1024px` (Desktop Terminal): Docked 3-pane workspace grid (`240px minmax(0, 1fr) 320px`) separating the Left **Emitter Watchlist**, Center **Quote Toolbar + EOD Cone Chart**, and Right **Empirical Cone + Key Risk Statistics + Calibration Specification**.
  - `641px to 1024px` (Tablet): Workspace transitions cleanly to a stacked terminal flow: top horizontal **Emitter Watchlist** grid (`repeat(auto-fit, minmax(180px, 1fr))`), full-width **Quote Toolbar + EOD Cone Chart**, and a 2-column bottom grid pairing **Empirical Price Cone (M1)**, **Volatility Regime (M2)**, and **Drawdown Risk (M3)** above full-width **Calibration Specification**; `.methodology-grid` collapses to a single column.
  - `<= 640px` (Mobile): Single-column stacked widgets with compact typography (`clamp()`), full-width watchlist rows, stacked quote toolbar, visible wrapping navigation links, minimum `44x44px` touch targets, and zero horizontal scroll (`min-width: 0` on all flex/grid children).
- **Border Radius Scale**: Crisp architectural geometry (`4px` badges/pills, `6px` interactive controls/buttons, `8px` docked widgets/panels, `12px` modal containers).
- **Button Hierarchy**:
  - **Primary CTA**: Solid `--cta-amber` fill (`#00AB6B` dark / `#006B42` light) with `--cta-amber-ink` (`#121212` dark / `#FFFFFF` light) bold text (`>= 44px` min-height). One dominant primary CTA per viewport context.
  - **Secondary Active Toggle**: Transparent or `--core-cyan-soft` fill with `1px solid var(--core-cyan)` border and `--core-cyan` ink (active horizon `7D` / `30D`, selected watchlist emitter).
  - **Ghost Control**: `--bg-surface` fill with `1px solid var(--border-control)` border and `--text-primary` ink (theme toggle icon, `Collapse` / `Expand` calibration toggle, `Sign Out`, `Dismiss`).

---

## 6. Page-by-Page Architecture & User Flows

### 6.1 Entry Flow Overview
Visitors land directly on the **Overview Dashboard (`/`)** without hitting a login wall. In a single viewport above the fold, `/` explains KAIROS's post-close uncertainty mandate and `M1/M2/M3` models from top to bottom, culminating in primary calls to launch **Risk Watcher (`/watcher`)**. Guest visitors can inspect `IDX:TLKM` (`FEATURED TODAY`) across 7-day and 30-day horizons inside `/watcher`, while remaining tickers stay visible with `LOCKED` indicators inviting sign-in.

---

### 6.2 Page 1: Overview Dashboard (`/`)

Structured as a **5-Section Stockbit-Referenced Overview Flow (`max-width: 1200px`)** defaulting to Indonesian (`id`) with full `EN | ID` switching via the topbar toggle:

1. **Sticky Terminal Navigation Bar (`min-height: 56px`, wrapping cleanly on mobile)**:
   - **Left**: `28x28` KAIROS "K" brand mark (`/logo.png`) paired with `KAIROS` wordmark + monospace tag `MONITOR RISIKO EOD` (`EOD RISK MONITOR`) + live links (`Dasbor`/`Dashboard` `/`, `Pemantau`/`Watcher` `/watcher`, `Metodologi`/`Methodology` `/methodology`) visible across desktop, tablet, and mobile.
   - **Right (Guest)**: `EN | ID` locale toggle + Sun/Moon SVG theme icon button (`44x44px`, accessible label) + single Primary Emerald CTA `Masuk` (`Sign In`, `/login`).
   - **Right (Authenticated)**: `EN | ID` locale toggle + Sun/Moon SVG theme icon button + `VERIFIED` / `TERVERIFIKASI` status badge + user identity + Ghost `Keluar` (`Sign Out`) button.
2. **Section 1 (`Pemantau Risiko` / Hero `.dash-hero-section`)**:
   - **Left (`1.08fr`)**: Headline `<h1>` (`Pemantau Risiko Saham Akhir Hari`), concise lead paragraph (`max-width: 52ch`), Primary CTA `Mulai Pantau Risiko` (`/watcher`), Ghost `Pelajari Metodologi` (`/methodology`), guest Secondary `Masuk dengan Google` (`/login`), quick-access horizon pills (`/watcher?horizon=7`, `/watcher?horizon=30`, `/methodology`), and audited data provenance strip (`SNAPSHOT EOD BURSA EFEK INDONESIA`, `UJI WALK-FORWARD BEBAS BOCOR DATA`, `SUMBER YFINANCE DAN AUDIT KAGGLE`).
   - **Right (`0.92fr`)**: `<HeroWatcherPreview />` showing an upright terminal device preview (`IDX:TLKM`, `CONTOH PREVIEW`, SVG EOD cone mini-chart, illustrative `80%` range readout, and clickable emitter rows).
3. **Section 2 (`Khawatir Saham?` `.dash-worry-section`)**:
   - **Top Centered Callout**: `<h2>` (`Khawatir Saham Bergerak di Luar Ekspektasi?`), two giant monospace figures (`80%` and `95%`), and a `Keterangan:` / `Note:` explanation covering 750 trailing days, GARCH-t, and 252D base rate.
   - **Bottom Split (`0.95fr 1.05fr`)**: Left `<WorryHorizonVisual />` (`7H` vs `30H` geometric cone matrix); Right `Akses Langsung 100% Terbuka untuk Saham Unggulan Tanpa Login` with actions to `/watcher` and `/login`.
4. **Section 3 (`Keuntungan` `.dash-benefits-section`)**:
   - Centered `<h2>` (`Keuntungan Memantau Risiko Bersama KAIROS`) above an asymmetric 3-column quantitative ledger (`1.15fr 1fr 1fr`) pairing `750H KUANTIL EMPIRIS` (`Lebih Objektif`, `2px solid var(--core-cyan)` primary top bar), `EMBARGO H-HARI` (`Lebih Transparan`), and `MODEL M1 / M2 / M3` (`Lebih Terukur`).
5. **Section 4 (`Smart Warning` `.dash-warning-section`)**:
   - **Left (`0.88fr`)**: `<h2>` `Smart Warning`, explanation of automated volatility, drawdown, and liquidity anomaly flagging, and link to `/watcher`.
   - **Right (`1.12fr`)**: `<SmartWarningShowcase />` stacking three interactive diagnostic cards (`IDX:GOTO` 95-day zero-return plateau, `IDX:TLKM` M3 drawdown check, `IDX:DCII` 15.3% non-traded day filter) linking to `/watcher?ticker=...`.
6. **Section 5 (`Key Features` `.dash-features-section`)**:
   - **Left (`1.18fr`)**: `<KeyFeatureChartPreview />` displaying an interactive SVG uncertainty cone chart (`ACTUAL CLOSE`, `WALK-FORWARD`, `MEDIAN M1`, `80% BAND`, `95% TAIL`) and live quantitative telemetry strip.
   - **Right (`0.82fr`)**: `<h2>` `Key Features` and 4 selectable buttons (`M1`, `M2`, `M3`, `Walk-Forward Audit`) that update the left preview in place, followed by Primary CTA `Buka Pemantau Risiko Interaktif` (`/watcher`).

---

### 6.3 Page 2: Risk Watcher (`/watcher`)

Structured as a compact **Docked 3-Pane Quantitative Terminal Workspace** modeled on Stockbit Desktop so the watchlist, chart, empirical price cone, and chunked risk statistics sit cleanly above the fold. Syncs both `?ticker=<instrument_id>` and `?horizon=<7|30>` query parameters via `useSearchParams` (`replace: true`), and automatically surfaces `lockedPrompt` if a guest deep-links to a restricted ticker:

1. **Left Pane (`240px`): Docked `EMITTER WATCHLIST` Widget**:
   - Compact header displaying `EMITTER WATCHLIST` on the left and `{count} TICKERS` on the right.
   - Interactive watchlist buttons (`min-height: 56px`) showing ticker (`IDX:TLKM`), live EOD Last Close price on the active/unlocked ticker (`LAST CLOSE` currency figure), plus `inst.mic` (`XIDX`) pinned consistently inside `.emitter-pills` beside `FEATURED TODAY`, active tier badge (`FULL TIER`, `LOW RELIABILITY`, `INSUFFICIENT DATA`), or `LOCKED` so selecting an emitter never shifts pill alignment.
   - Clicking a `LOCKED` ticker (or opening `/watcher?ticker=IDX:GOTO` as a guest) opens a keyboard-accessible prompt (`Escape` or `Dismiss` closes it) inside the center workspace inviting the user to `Sign in to view all tickers`.

2. **Center Pane (`minmax(0, 1fr)`): Quote Toolbar + EOD Uncertainty Chart + Provenance**:
   - **Instrument Quote & Horizon Toolbar (`.terminal-quote-bar`)**:
     - **Left (`.quote-summary`)**: Active `instrument_id`, exchange `mic`, functional reliability/run status pills (`FULL TIER`, `LOW RELIABILITY`, `INSUFFICIENT DATA`, `DEGRADED`, `FAILED`), `LAST CLOSE <last_price> <currency>`, and `AS OF <as_of_date>`.
     - **Right (`.horizon-control`)**: `HORIZON` label paired with the `7D` / `30D` horizon switcher (`min-height: 44px`).
   - **Explicit Data States (`R-27`)**:
     - Loading state explicitly names what is being fetched (`Loading active instrument universe from gateway...`, `Loading 7-day forecast cone and trailing closes for IDX:TLKM...`). Switching between `7D` and `30D` keeps `<PriceChart />` mounted in-place with an `UPDATING {horizon}D...` status pill (and initial load reserves the `420px` chart height via `.chart-skeleton`) so horizon changes never collapse the center column.
     - Error and empty states explain cause and recovery action (for example `"Reload page"`).
     - Calibration banners surface `INSUFFICIENT DATA`, `LOW RELIABILITY`, and `DEGRADED` run status cleanly above the chart.
   - **Chartbit-Style EOD Uncertainty Chart (`PriceChart`)**:
     - Primary page heading (`<h1 className="chart-title">`, `clamp(1.25rem, 1.85vw, 1.45rem)`): `"IDX:TLKM: Where does the 7-day empirical cone sit against trailing closes?"`
     - Crisp horizontal legend distinguishing `ACTUAL CLOSE`, `WALK-FORWARD BACKTEST`, `FORWARD MEDIAN`, `80% INTERVAL`, and `95% INTERVAL` using `16px x 2px` CSS geometric indicators.
     - `lightweight-charts` canvas rendered in the active Dark or Light theme inside a `role="img"` container with a descriptive `aria-label`, displaying right-axis last-value tags (`lastValueVisible: true`) for `Forecast median`, `80% upper`, and `80% lower`.
   - **Snapshot Provenance Strip**: `DATA AS OF <as_of_date>`, `LAST SUCCESSFUL UPDATE <YYYY-MM-DD HH:MM UTC>`, `HORIZON <horizon_days>D`.

3. **Right Pane (`320px`): Four Chunked Quantitative Widgets**:
   - **Widget 1 (`EMPIRICAL PRICE CONE (M1)`)**: `80% EMPIRICAL PRICE RANGE` (`<lower80> to <upper80> IDR`), `95% Tail Interval`, and `Forward Median (M1)`.
   - **Widget 2 (`VOLATILITY REGIME (M2)`)**: 3 hairline rows (`Annualized Vol (M2)`, `Daily Vol (M2)`, `Volatility Band (M2)`).
   - **Widget 3 (`DRAWDOWN RISK (M3)`)**: 3 hairline rows (`Correction Prob (M3)`, `Drawdown Threshold`, `252D Base Rate`) without duplicating `Last Close (EOD)` from the quote toolbar.
   - **Widget 4 (`CALIBRATION SPECIFICATION`)**: Docked `.terminal-widget.calibration-widget` housing an `<h2>` `.calibration-headline` and `<dl className="model-ledger">` for `M1`, `M2`, and `M3`, with a working `Collapse` / `Expand` toggle available to both guest (expanded by default) and authenticated sessions (collapsed by default).

4. **Shared Footer**:
   - **Row 1 (System Provenance)**: `DATA AS OF EOD SNAPSHOT`, `LAST SUCCESSFUL UPDATE NIGHTLY BATCH`, `SOURCE YFINANCE AND KAGGLE AUDITED REPAIR`, `END-OF-DAY BATCH PIPELINE` separated by `1px` borders.
   - **Row 2 (Mandatory Risk Disclaimer)**: Clear statement that KAIROS is an educational/statistical end-of-day risk monitor, not investment advice or trading signals.
   - **Row 3 (Stockbit-Referenced Footer Grid `.footer-main`)**: Left `KAIROS` mark and subtitle; Center 3 navigation columns (`About Me`, `Contact`, `Help`, `Terms` and `Kamus Saham`, `Privacy` opening `<FooterInfoModal />` with `Escape` support, plus direct route links `Dashboard`, `Watcher`, `Methodology`, and `Sign In` when guest); Right `LinkedIn` and `Instagram` accessible external profile links. Zero dead links.

---

### 6.4 Page 3: Methodology (`/methodology`)

Rendered inside `.methodology-screen` (`max-width: 1120px`) using the same terminal widget grammar and zero-symbol discipline as `/watcher`:

- **Header (`.methodology-header`)**: `<h1 className="methodology-title">Methodology and Calibration Limitations</h1>` paired with `.methodology-lead` (`max-width: 54ch`, `text-wrap: pretty`).
- **2-Column Terminal Widget Grid (`.methodology-grid`, collapsing to `1fr` at `<= 1024px`)**:
  1. `CALIBRATED RISK MODELS` (`M1 / M2 / M3`): `<dl className="model-ledger">` detailing `MODEL M1`, `MODEL M2`, `MODEL M3`, and `LEAK-FREE` embargo verification (`max-width: 50ch` descriptions).
  2. `READING THE CHART` (`5 SERIES`): Hairline guide rows pairing geometric `.legend-swatch` indicators (`swatch-actual`, `swatch-backtest`, `swatch-forecast`, `swatch-80`, `swatch-95`) with accurate copy (`"Solid emerald median (flat random walk)"`, `"Dashed emerald 80% empirical interval"`, `"Dotted amber 95% tail interval"`).
  3. `KNOWN STATISTICAL LIMITATIONS` (`SAMPLE AND REGIME`): 4 hairline rows summarizing effective sample size, non-stationary base rates, `IDX:GOTO` plateau behavior, and `IDX:DCII` thin liquidity.
  4. `DATA PROVENANCE AND BENCHMARKS` (`EOD PIPELINE`): 3 hairline rows covering Yahoo Finance ingestion (`yfinance`), audited Kaggle repairs, and market-calendar / dividend caveats.

---

### 6.5 Page 4: Authentication & Account Management Routes

All auth and account routes live inside `<Layout />` (`web/src/routes/auth.routes.tsx`) so the sticky topbar, `EN | ID` switch, Dark/Light toggle, and disclaimer footer remain accessible:

- **`/login` (`LoginPage`)**: Centers `.login-card` inside `.login-shell` with `role="alert"` on error banners, user-safe copy when Google Sign-In is disabled (no `.env` leaks), Google OAuth (`GoogleAuthButton`), local email/password login (`PasswordInput`), Cloudflare Turnstile challenge (`TurnstileWidget`), and a `Continue as Guest in Risk Watcher` (`/watcher`) ghost action.
- **`/register` (`RegisterPage`) & `/forgot-password` (`ForgotPasswordPage`)**: Local account registration and password recovery flows featuring an inline password policy checklist (`PasswordChecklist`), 6-digit email OTP verification (`OtpVerificationView`), and Turnstile challenge.
- **`/profile` (`ProfilePage`, wrapped in `<ProtectedRoute>`)**: Authenticated user profile management displaying `VERIFIED` / `UNVERIFIED` status badge, avatar selection modal (`ProfileAvatarModal`), password change/set flow (`ProfilePasswordModal` with OTP verification for OAuth-only accounts), and Google account linking.
- **`/users` (`AdminUsersPage`, wrapped in `<AdminRoute>`)**: Admin-only user directory table supporting search, suspension toggling, active session revocation, and account deletion confirmation (`DeleteUserModal`).

---

## 7. Frontend Code Architecture Alignment

All implementations inside `web/` must comply with [AGENTS.md](../AGENTS.md):
- Keep routing (`src/routes/`), API services (`src/services/*.service.ts`), hooks (`src/hooks/`), translations (`src/i18n/`), and presentational components (`src/components/`) strictly separated by domain.
- Centralize CSS design tokens in `web/src/styles/tokens.css` and base affordance/layout rules in `web/src/styles/global.css`.
- Keep all UI abstractions exchange-neutral (ADR-004).
