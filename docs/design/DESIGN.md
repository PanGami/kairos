# KAIROS: UI/UX & Frontend Design Specification

Document version: 1.0  
Status: Binding Reference for Frontend Development  
Companion documents: [AGENTS.md](../../AGENTS.md), [PRD.md](../prd/PRD.md), [ADR.md](../adr/ADR.md)

---

## 1. Design Philosophy & Product Positioning

KAIROS is an **end-of-day risk monitor** for equity markets (starting with IDX digital infrastructure equities), not a directional price predictor and not a source of buy/sell signals. Never introduce "real-time", "live trading signal", or "enterprise" claims anywhere in UI copy or visual metaphors.

### Aesthetic Direction: Swiss Quantitative Editorial
The visual system combines institutional financial clarity with editorial precision:
- **Authoritative restraint**: Generous structured spacing, sharp `1px` hairline borders, high signal-to-noise data density, and zero decorative clutter.
- **Dark Mode Default (*Obsidian Quantitative*)** with a first-class **Light Mode (*Editorial Paper*)** toggle.
- **Data Integrity First**: Actual historical series, out-of-sample walk-forward backtests, and forward uncertainty cones must always be visually distinct.

---

## 2. Strict Zero-Symbol & No-Emoticon Rule (MANDATORY)

To preserve institutional credibility and avoid visual noise, **emoticons, emojis, and decorative text symbols are strictly forbidden** across all UI copy, labels, badges, buttons, navigation items, tooltips, and placeholders.

### Forbidden Characters in UI Surfaces
- **Emoticons / Emojis**: Zero emojis of any kind (no lock, star, warning triangle, chart, check, fire, rocket, etc.).
- **Decorative Punctuation & Unicode Glyphs**: Do NOT use standalone dashes (`-`, `—`, `–`), bullet dots (`•`), checkmarks (`✓`, `✔`), crosses (`✕`, `✖`), stars (`★`), arrows (`→`, `↗`), or warning symbols (`⚠`) inside labels, buttons, status pills, or metric titles.

### Approved Visual Replacements
1. **Pure Typographic Status Pills**: Use concise, uppercase tracked labels inside bordered containers:
   - `VERIFIED` / `UNVERIFIED`
   - `LOCKED` / `UNLOCKED`
   - `FEATURED TODAY`
   - `FULL TIER` / `LOW RELIABILITY` / `DEGRADED` / `INSUFFICIENT DATA`
   - `GOOGLE LINKED` / `EMAIL ONLY`
2. **Spatial & Structural Separation**: Use `gap`, padding, vertical dividers (`1px solid var(--border)`), or subtle grid alignment instead of text separators like `-`, `|`, or `•`.
3. **Pure Geometric Indicators**: If a minimal status dot is used (for example beside an active session or legend swatch), render it using a pure CSS geometric element (`6px` circle or `16px x 2px` line) — never a Unicode character.

---

## 3. Core Color Architecture (60-30-10 Rule)

KAIROS uses a deliberate **Split-Analogous + Complementary Accent** palette tailored for equity risk analysis: **two connected cool main colors** that establish calm analytical authority, paired with **one opposite warm secondary color** reserved exclusively for interactive Primary Action Buttons (CTAs) so user actions command immediate visual attention.

### Color Wheel Rationale for Stock Market Analysis
- Equity risk interfaces naturally involve dense price charts, volatility bands, and numerical tables. If buttons share the same blue/cyan palette as the chart, interactive CTAs disappear into the analytical workspace.
- By pairing **Deep Institutional Slate Navy** (~215° hue) with its cool spectrum neighbor **Quantitative Maritime Cyan-Blue** (~198° hue), 90% of the interface creates a cohesive, low-fatigue analytical environment.
- Placing **Sovereign Signal Amber** (~38° hue, directly opposite ~215° on the color wheel) strictly on **Primary Buttons** creates maximum figure-ground separation without interfering with red/green market risk semantics.

### 3.1 Core Tokens

| Role | Proportion | Token Name | Dark Mode Value | Light Mode Value | Usage Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Main Color 1 (Base Canvas)** | **60%** | `--bg-canvas` | `#0A101D` | `#F3F6FA` | Page background, app shell |
| **Main Color 1 (Surface)** | **60%** | `--bg-surface` | `#111A2E` | `#FFFFFF` | Cards, panels, chart containers, auth modal |
| **Main Color 1 (Elevated)** | **60%** | `--bg-elevated` | `#16223B` | `#E9EFF7` | Hover surfaces, secondary headers, table headers |
| **Main Color 1 (Border)** | **60%** | `--border-subtle` | `#1E2D4A` | `#D8E1EE` | `1px` structural hairlines, dividers |
| **Main Color 1 (Text Primary)** | **60%** | `--text-primary` | `#EDF2F8` | `#0A101D` | Headlines, prices, primary values |
| **Main Color 1 (Text Muted)** | **60%** | `--text-muted` | `#8FA3C0` | `#4B5E7A` | Captions, labels, timestamps, footer copy |
| **Main Color 2 (Connected Core)** | **30%** | `--core-cyan` | `#0EA5E9` | `#0284C7` | Active nav links, active tabs, selected borders, M1 forecast line, 80% interval band |
| **Main Color 2 (Core Tint)** | **30%** | `--core-cyan-soft` | `rgba(14, 165, 233, 0.14)` | `rgba(2, 132, 199, 0.10)` | Active pill backgrounds, 80% chart area fill |
| **Secondary Color (CTA Only)** | **10%** | `--cta-amber` | `#F59E0B` | `#D97706` | **Strictly Primary Action Buttons ONLY** (`Sign In`, `Create Account`, `Unlock Full Access`, `Save Changes`, `Connect Google Account`) |
| **Secondary Color (CTA Hover)** | **10%** | `--cta-amber-hover` | `#D97706` | `#B45309` | Hover state for primary buttons |
| **Secondary Color (CTA Active)** | **10%** | `--cta-amber-active` | `#B45309` | `#92400E` | Pressed state for primary buttons |
| **Secondary Color (CTA Ink)** | **10%** | `--cta-amber-ink` | `#0A101D` | `#FFFFFF` | High-contrast label text inside primary buttons |

> **Strict Rule for Secondary Amber (`--cta-amber`)**: Never use `--cta-amber` for card backgrounds, hero banners, decorative badges, or navigation highlights. It is dedicated strictly to **Primary Buttons** so interactive actions remain unmistakable.

### 3.2 Semantic Status Tokens (Strictly for Data & Account State)

| State | Token | Dark Mode | Light Mode | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Verified / Full Tier** | `--status-verified` | `#10B981` | `#059669` | `VERIFIED` email badge, `FULL TIER` GARCH-t calibration badge |
| **Warning / Unverified** | `--status-warning` | `#EAB308` | `#CA8A04` | `UNVERIFIED` email badge, `LOW RELIABILITY`, `DEGRADED`, 95% chart boundary line |
| **Danger / Drawdown** | `--status-danger` | `#EF4444` | `#DC2626` | High drawdown threshold alerts, `INSUFFICIENT DATA`, `Delete Account` danger zone |

---

## 4. Typography System

Do NOT use generic system fonts (`Inter`, `Roboto`, `Arial`, `Segoe UI`, `system-ui`). Load and pair three purposeful typefaces:

| Role | Font Family | Weights | Styling Rules | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Editorial Display** | `'Instrument Serif'` | `400`, `400 italic` | Tight tracking (`-0.02em`), line-height `1.12` | Product hero headline, page headers, major section titles |
| **UI & Body Sans** | `'Plus Jakarta Sans'` | `400`, `500`, `600`, `700` | Clean legibility (`1.55` line-height) | Navigation, card descriptions, forms, methodology prose, buttons |
| **Quantitative Mono** | `'JetBrains Mono'` | `400`, `500`, `600` | Mandatory `font-variant-numeric: tabular-nums;` | Stock tickers (`IDX:TLKM`), prices (`IDR`), percentages, `θ`, timestamps, uppercase status pills |

---

## 5. Layout Grid, Spacing & Component Rules

- **Container Max Width**: `1200px` centered with `24px` horizontal padding on desktop, `16px` on mobile.
- **Border Radius Scale**: Crisp architectural geometry (`4px` badges/pills, `6px` inputs/buttons, `8px` cards/panels, `12px` auth modal).
- **Elevation**: Prefer `1px solid var(--border-subtle)` and surface stepping (`--bg-canvas` to `--bg-surface`) over heavy drop shadows.
- **Button Hierarchy**:
  - **Primary CTA**: Solid `--cta-amber` fill with `--cta-amber-ink` bold text. One dominant primary action per section.
  - **Secondary Action**: Transparent background, `1px solid var(--core-cyan)` border, `--core-cyan` text (e.g., `View Methodology`, `Horizon Toggle` active state).
  - **Neutral / Ghost Action**: `--bg-surface` with `1px solid var(--border-subtle)` border (e.g., `Theme Toggle`, `Sign Out`, `Cancel`).
  - **Destructive Action**: `1px solid var(--status-danger)` outline transitioning to solid `--status-danger` on confirmation (`Delete Account`).

---

## 6. Page-by-Page Architecture & User Flows

### 6.1 Entry Flow Overview
Visitors land directly on the **Dashboard (`/`)** without hitting a login wall. Guest visitors experience the full analytical interface scoped to **1 Featured Emitter (Best Calibrated Today)**, while additional emitters remain visible in a locked state to demonstrate platform breadth and motivate sign-in.

---

### 6.2 Page 1: Dashboard (`/`)

Structured top-to-bottom as a vertical analytical narrative:

1. **Top Navigation Bar (Sticky, `64px` height)**:
   - **Left**: `KAIROS` wordmark + monospace tag `EOD RISK MONITOR` + links (`Dashboard`, `Methodology`).
   - **Right (Guest)**: Theme Toggle (`DARK` / `LIGHT`) + Ghost button `Sign In` + Primary Amber CTA `Unlock Full Access`.
   - **Right (Authenticated)**: Theme Toggle + Status Pill (`VERIFIED` or `UNVERIFIED`) + User Profile trigger (`Settings` / `Sign Out`).

2. **Section 1: Editorial Product Introduction (Adaptive)**:
   - **Guest State (Expanded)**:
     - **Display Headline**: *"Calibrated End-of-Day Equity Uncertainty & Tail-Risk Monitor."*
     - **Concise Value Statement**: Explains that KAIROS computes nightly post-close uncertainty ranges, conditional volatility, and correction probabilities rather than directional buy/sell predictions.
     - **Three Core Pillar Cards (Horizontal 3-column grid)**:
       1. `MODEL M1` / `Empirical Price Range`: Random walk midpoint surrounded by calibrated 80% and 95% trailing return intervals.
       2. `MODEL M2` / `GARCH-t Volatility`: Time-varying conditional volatility modeling fat-tailed equity shocks with automated constant-variance fallback.
       3. `MODEL M3` / `Correction Probability`: Volatility-implied drawdown probability benchmarked against the trailing 252-day base rate.
   - **Authenticated State (Collapsed)**:
     - Automatically compacts into a single-row workspace header showing active session summary and an optional `About KAIROS` toggle so daily returning users land immediately on the chart workspace.

3. **Section 2: Core Risk Workspace (Chart & Featured Emitter)**:
   - **Emitter Selection Strip**:
     - **Guest Mode**: Automatically selects the **1 Featured Emitter with Best Calibration Today** (for example `IDX:TLKM`, marked with typographic pills `FEATURED TODAY` and `FULL TIER`).
     - Other configured emitters (`IDX:GOTO`, `IDX:DCII`, etc.) remain visible in the selector rail with a crisp `LOCKED` pill. Clicking any locked emitter opens a focused prompt inviting the visitor to sign in for free full-universe access.
     - **Authenticated Mode**: All emitters are unlocked with instant switching, horizon selector (`7D` / `30D`), and dynamic instrument metadata from `GET /v1/instruments`.
   - **4 Quantitative Metric Cards (4-column Bento row above the chart)**:
     1. `LAST CLOSE (EOD)` with `as_of_date`.
     2. `UNCERTAINTY RANGE (80%)` with `95%` interval bounds shown below in muted monospace.
     3. `ANNUALIZED VOLATILITY` with daily volatility and uncertainty band bounds.
     4. `CORRECTION PROBABILITY` displaying threshold `θ` and `252D ROLLING BASE RATE`.
   - **Interactive Risk Chart (`PriceChart`)**:
     - Clean legend distinguishing `ACTUAL CLOSE`, `WALK-FORWARD BACKTEST` (out-of-sample), `FORWARD MEDIAN`, `80% INTERVAL`, and `95% INTERVAL`.
     - Explicit banner states for `INSUFFICIENT DATA`, `LOW RELIABILITY`, and `DEGRADED`.
   - **Teaser Preview Row (Guest Only)**:
     - Displays summary cards for locked emitters with masked/redacted volatility figures and an Amber CTA `Sign In to Unlock All Emitters`.

4. **Section 3: Comprehensive Footer**:
   - **Row 1 (System Provenance)**: `DATA AS OF YYYY-MM-DD`, `LAST SUCCESSFUL UPDATE`, `SOURCE: YFINANCE + KAGGLE AUDITED REPAIR`, `END-OF-DAY BATCH PIPELINE`.
   - **Row 2 (Mandatory Risk Disclaimer)**: Clear statement that KAIROS is an educational/statistical end-of-day risk monitor, not investment advice or trading signals.
   - **Row 3 (Navigation)**: Links to `Dashboard`, `Methodology`, `Account Settings`, and `Documentation`.

---

### 6.3 Page 2: Auth (`/login`)

Simple, frictionless Dual-Auth supporting both **Local Email + Password** and **Google OAuth**, backed by one unified account record (`users` table) that tracks Google linkage and verification status.

1. **Page Layout**:
   - Desktop: Two-column asymmetric split (`42%` left analytical context panel with clean KAIROS overview and data security note; `58%` right centered authentication card).
   - Mobile: Single centered authentication card.
2. **Mode Switcher (Top of Card)**:
   - Clean segmented tabs: `Sign In` and `Create Account`.
3. **Google OAuth Primary Option**:
   - Full-width Google Sign-In button (`Continue with Google`).
   - Behavior: If a user signs in with Google using an email already registered locally, the backend links the Google identity and marks email verification as `VERIFIED`.
4. **Divider**:
   - Pure hairline divider with centered uppercase muted label `OR CONTINUE WITH EMAIL`.
5. **Local Email & Password Form**:
   - **Sign In Tab**: `Email Address`, `Password` (with text toggle `SHOW` / `HIDE`), and Primary Amber CTA `Sign In`.
   - **Create Account Tab**: `Full Name`, `Email Address`, `Password`, and Primary Amber CTA `Create Account`.
6. **Gmail / Email Verification Awareness**:
   - Accounts created with local email/password start with status `UNVERIFIED` until verified via email confirmation link or linked with Google.
   - When signed in with an `UNVERIFIED` account, display a non-blocking amber-bordered notice in Dashboard and Settings guiding the user to verify via inbox or connect their Google account for instant verification.

---

### 6.4 Page 3: Settings (`/settings`)

Protected route (`/settings`) organized as a single centered `720px` column with four crisp, single-responsibility cards:

1. **Card 1: Profile Identity**:
   - Circular profile avatar preview (`72px`) with `Upload Photo` and `Remove Photo` actions (plus `Sync Google Photo` when Google is connected).
   - Editable `Display Name` input field.
   - Primary Amber CTA `Save Profile`.

2. **Card 2: Email & Connected Google Account**:
   - Displays `Primary Email` in monospace alongside a bordered status pill:
     - `VERIFIED` (`--status-verified`) when verified via email token or Google OAuth.
     - `UNVERIFIED` (`--status-warning`) accompanied by a `Resend Verification Email` secondary button.
   - **Google Account Link Panel**:
     - **When Not Linked**: Status pill `NOT CONNECTED` and Primary Amber CTA `Connect Google Account` explaining that linking enables one-click Google login and instant email verification.
     - **When Linked**: Displays connected Gmail address, link timestamp, status pill `GOOGLE LINKED`, and a neutral `Disconnect Google` button (guardrail: disabled with explanatory helper text if the user has not yet set a local password, preventing account lockout).

3. **Card 3: Password & Authentication Security**:
   - Displays active login methods (`EMAIL + PASSWORD`, `GOOGLE OAUTH`).
   - **Adaptive Form**:
     - If user already has a local password: `Current Password`, `New Password`, `Confirm New Password`, and CTA `Update Password`.
     - If user registered via Google and has no local password yet: `New Password`, `Confirm New Password`, and CTA `Set Local Password` so they can also log in via email and password.

4. **Card 4: Danger Zone (Account Deletion)**:
   - Bordered with `1px solid var(--status-danger)`.
   - Explains permanent deletion of profile, linked credentials, and active sessions (`users` and `user_sessions`).
   - `Delete Account` destructive button triggers a confirmation modal requiring explicit typed confirmation (`DELETE`) before submitting.

---

## 7. Frontend Code Architecture Alignment

All implementations of this specification inside `web/` must comply with [AGENTS.md](../../AGENTS.md):
- Never create monolithic page or service files. Keep routing (`src/routes/`), API services (`src/services/*.service.ts`), hooks (`src/hooks/`), and presentational components (`src/components/`) strictly separated by domain.
- Centralize CSS design tokens (`--bg-canvas`, `--core-cyan`, `--cta-amber`, semantic tokens, font families) in dedicated theme/token stylesheets under `web/src/styles/`.
- Keep all copy exchange-neutral in core abstractions (ADR-004) and strictly free of emoticons or decorative symbols.
