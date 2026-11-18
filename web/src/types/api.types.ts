// Mirrors the gateway JSON responses (api/openapi/kairos.v1.yaml).
export type ReliabilityTier = "full" | "low" | "insufficient";
export type RunStatus = "ok" | "degraded" | "failed";
export type Horizon = 7 | 30;
export type OTPPurpose = "register_verify" | "reset_password" | "set_password";

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture_url: string;
  avatar_key: string;
  role: string;
  email_verified: boolean;
  google_linked: boolean;
  has_password: boolean;
  suspended: boolean;
  created_at?: string;
  last_login_at?: string;
  active_sessions?: number;
}

export interface AdminRefreshItem {
  instrument_id: string;
  run_id: string;
  status: string;
  message: string;
}

export interface AuthConfig {
  google_client_id: string;
  dev_login_enabled: boolean;
}

export interface SignInResponse {
  user: User;
  session_token: string;
  expires_at: string;
}

export interface RegisterResponse {
  email: string;
  resend_after_seconds: number;
  expires_in_seconds: number;
}

export interface OtpSentResponse {
  resend_after_seconds: number;
  expires_in_seconds: number;
}

export interface ForgotPasswordResponse {
  accepted: boolean;
  message: string;
  resend_after_seconds: number;
}

export interface Instrument {
  instrument_id: string;
  symbol: string;
  mic: string;
  currency: string;
  timezone: string;
  status: string;
  reliability_tier: ReliabilityTier;
}

export interface ForecastPathPoint {
  step: number;
  median: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
}

export interface Forecast {
  instrument_id: string;
  horizon_days: number;
  as_of_date: string;
  status: RunStatus;
  reliability_tier: ReliabilityTier;
  last_price: number;
  median: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
  volatility: { daily: number; annualized: number; lower: number; upper: number };
  correction: { theta: number; probability: number; rolling_base_rate: number };
  path: ForecastPathPoint[];
  last_successful_update: string;
}

export interface ActualPoint {
  date: string;
  /** Adjusted close. */
  close: number;
  /** Open, high and low are scaled by adj_close / close (continuous with `close`). */
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface BacktestPoint {
  as_of_date: string;
  horizon_days: number;
  median: number;
  lower80: number;
  upper80: number;
}

export interface History {
  instrument_id: string;
  actual: ActualPoint[];
  backtest: BacktestPoint[];
}
