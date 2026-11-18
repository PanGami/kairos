-- Initial KAIROS schema. Strict per-service table ownership (AGENTS.md / ADR-007).
-- Hello-world stage: creates minimal schema + registry to verify connectivity.

-- ---- ingestion: instruments (registry), prices_daily, ingestion_runs ----
CREATE TABLE IF NOT EXISTS instruments (
  instrument_id     TEXT PRIMARY KEY,          -- e.g. 'IDX:TLKM'
  symbol            TEXT NOT NULL,
  mic               TEXT NOT NULL DEFAULT 'XIDX',
  currency          TEXT NOT NULL DEFAULT 'IDR',
  timezone          TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  provider_symbol   TEXT NOT NULL,             -- e.g. 'TLKM.JK' (yfinance)
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paused','insufficient_data','delisted')),
  reliability_tier  TEXT NOT NULL DEFAULT 'full'
                      CHECK (reliability_tier IN ('full','low','insufficient')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prices_daily (
  instrument_id TEXT NOT NULL REFERENCES instruments(instrument_id),
  trade_date    DATE NOT NULL,
  open          DOUBLE PRECISION,
  high          DOUBLE PRECISION,
  low           DOUBLE PRECISION,
  close         DOUBLE PRECISION,
  adj_close     DOUBLE PRECISION,
  volume        BIGINT,
  currency      TEXT NOT NULL DEFAULT 'IDR',
  source        TEXT NOT NULL CHECK (source IN ('yfinance','kaggle_repair')),
  is_traded     BOOLEAN NOT NULL,
  adj_factor    DOUBLE PRECISION,
  PRIMARY KEY (instrument_id, trade_date)
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id            BIGSERIAL PRIMARY KEY,
  as_of_date    DATE NOT NULL,
  status        TEXT NOT NULL,
  rows_written  INTEGER NOT NULL DEFAULT 0,
  repairs       INTEGER NOT NULL DEFAULT 0,
  warnings      JSONB,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms   INTEGER
);

-- ---- ml-service: model_specs, forecast_runs, forecasts ----
CREATE TABLE IF NOT EXISTS model_specs (
  instrument_id TEXT NOT NULL REFERENCES instruments(instrument_id),
  target        TEXT NOT NULL,               -- 'M1'|'M2'|'M3'
  horizon       INTEGER NOT NULL,            -- 7|30
  spec_version  TEXT NOT NULL,
  theta         DOUBLE PRECISION,            -- M3 (0.85*initial_sigma*sqrt(h), frozen)
  burn_in       INTEGER NOT NULL DEFAULT 0,
  reliability   TEXT NOT NULL DEFAULT 'full',
  wf_metrics    JSONB,                       -- walk-forward metrics
  PRIMARY KEY (instrument_id, target, horizon, spec_version)
);

CREATE TABLE IF NOT EXISTS forecast_runs (
  id            BIGSERIAL PRIMARY KEY,
  instrument_id TEXT NOT NULL REFERENCES instruments(instrument_id),
  as_of_date    DATE NOT NULL,
  spec_version  TEXT NOT NULL,
  git_sha       TEXT,
  data_window   TEXT,
  status        TEXT NOT NULL CHECK (status IN ('ok','degraded','failed')),
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instrument_id, as_of_date, spec_version)
);

CREATE TABLE IF NOT EXISTS forecasts (
  run_id          BIGINT NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
  instrument_id   TEXT NOT NULL REFERENCES instruments(instrument_id),
  as_of_date      DATE NOT NULL,
  horizon         INTEGER NOT NULL,
  median          DOUBLE PRECISION,
  lower80         DOUBLE PRECISION,
  upper80         DOUBLE PRECISION,
  lower95         DOUBLE PRECISION,
  upper95         DOUBLE PRECISION,
  vol_daily       DOUBLE PRECISION,
  vol_annual      DOUBLE PRECISION,
  prob_correction DOUBLE PRECISION,
  garch_params    JSONB,                      -- omega, alpha, beta, nu
  empirical_q     JSONB,                      -- empirical quantiles used
  path            JSONB,                      -- quantile path k=1..h
  PRIMARY KEY (instrument_id, as_of_date, horizon)
);

-- ---- gateway: api_keys (admin only) ----
CREATE TABLE IF NOT EXISTS api_keys (
  id          BIGSERIAL PRIMARY KEY,
  key_hash    TEXT NOT NULL,
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- auth-service: users, user_sessions, user_otps, auth_audit_logs ----
CREATE TABLE IF NOT EXISTS users (
  user_id        TEXT PRIMARY KEY,
  google_sub     TEXT UNIQUE,
  email          TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  picture_url    TEXT NOT NULL DEFAULT '/avatars/avatar-1.png',
  avatar_key     TEXT NOT NULL DEFAULT 'avatar-1',
  password_hash  TEXT NOT NULL DEFAULT '',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  google_linked  BOOLEAN NOT NULL DEFAULT FALSE,
  role           TEXT NOT NULL DEFAULT 'user',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_otps (
  id           BIGSERIAL PRIMARY KEY,
  email        TEXT NOT NULL,
  purpose      TEXT NOT NULL CHECK (purpose IN ('register_verify', 'reset_password', 'set_password')),
  code_hash    TEXT NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_otps_email_purpose ON user_otps (email, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT,
  email      TEXT,
  event_type TEXT NOT NULL,
  detail     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed registry with 3 MVP tickers (idempotent).
INSERT INTO instruments (instrument_id, symbol, provider_symbol, reliability_tier) VALUES
  ('IDX:TLKM', 'TLKM', 'TLKM.JK', 'full'),
  ('IDX:GOTO', 'GOTO', 'GOTO.JK', 'low'),
  ('IDX:DCII', 'DCII', 'DCII.JK', 'low')
ON CONFLICT (instrument_id) DO NOTHING;

-- Seed frozen model specifications from walk-forward evaluation (ADR-014, spec_version = 'v1').
INSERT INTO model_specs (instrument_id, target, horizon, spec_version, theta, burn_in, reliability, wf_metrics) VALUES
  ('IDX:TLKM', 'M1',  7, 'v1', NULL, 0,   'full', '{"interval":"naive+empirical","coverage80":0.7652,"width":0.1039}'::jsonb),
  ('IDX:TLKM', 'M1', 30, 'v1', NULL, 0,   'full', '{"interval":"naive+empirical","coverage80":0.7522,"width":0.1985}'::jsonb),
  ('IDX:TLKM', 'M2',  7, 'v1', NULL, 0,   'full', '{"model":"GARCH","qlike":0.5671,"rel_const":0.8774,"years_won":"5/5"}'::jsonb),
  ('IDX:TLKM', 'M2', 30, 'v1', NULL, 0,   'full', '{"model":"GARCH","qlike":0.2974,"rel_const":0.9231,"years_won":"2/5"}'::jsonb),
  ('IDX:TLKM', 'M3',  7, 'v1', 0.05, 0,   'full', '{"model":"vol_implied","brier":0.1601,"bss":0.0427,"auc":0.6177}'::jsonb),
  ('IDX:TLKM', 'M3', 30, 'v1', 0.10, 0,   'full', '{"model":"vol_implied","brier":0.1946,"bss":0.0373,"auc":0.5107}'::jsonb),
  ('IDX:GOTO', 'M1',  7, 'v1', NULL, 120, 'low',  '{"interval":"naive+empirical","coverage80":0.8936,"width":0.2339}'::jsonb),
  ('IDX:GOTO', 'M1', 30, 'v1', NULL, 120, 'low',  '{"interval":"naive+empirical","coverage80":0.8889,"width":0.4693}'::jsonb),
  ('IDX:GOTO', 'M2',  7, 'v1', NULL, 120, 'low',  '{"model":"const_var","qlike":1.7547,"rel_const":1.0000,"years_won":"3/3"}'::jsonb),
  ('IDX:GOTO', 'M2', 30, 'v1', NULL, 120, 'low',  '{"model":"const_var","qlike":1.2322,"rel_const":1.0000,"years_won":"2/3"}'::jsonb),
  ('IDX:GOTO', 'M3',  7, 'v1', 0.10, 120, 'low',  '{"model":"vol_implied","brier":0.1208,"bss":0.0695,"auc":0.6304}'::jsonb),
  ('IDX:GOTO', 'M3', 30, 'v1', 0.20, 120, 'low',  '{"model":"vol_implied","brier":0.1678,"bss":-0.2528,"auc":0.4209}'::jsonb),
  ('IDX:DCII', 'M1',  7, 'v1', NULL, 120, 'low',  '{"interval":"naive+empirical","coverage80":0.7692,"width":0.1280}'::jsonb),
  ('IDX:DCII', 'M1', 30, 'v1', NULL, 120, 'low',  '{"interval":"naive+empirical","coverage80":0.7763,"width":0.3412}'::jsonb),
  ('IDX:DCII', 'M2',  7, 'v1', NULL, 120, 'low',  '{"model":"const_var","qlike":2.3700,"rel_const":1.0000,"years_won":"4/4"}'::jsonb),
  ('IDX:DCII', 'M2', 30, 'v1', NULL, 120, 'low',  '{"model":"const_var","qlike":1.3646,"rel_const":1.0000,"years_won":"3/4"}'::jsonb),
  ('IDX:DCII', 'M3',  7, 'v1', 0.05, 120, 'low',  '{"model":"vol_implied","brier":0.2352,"bss":-0.1936,"auc":0.5362}'::jsonb),
  ('IDX:DCII', 'M3', 30, 'v1', 0.10, 120, 'low',  '{"model":"vol_implied","brier":0.2649,"bss":-0.2590,"auc":0.5034}'::jsonb)
ON CONFLICT (instrument_id, target, horizon, spec_version) DO NOTHING;
