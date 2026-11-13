-- Skema awal KAIROS. Kepemilikan tabel per service (AGENTS.md / ADR-007).
-- Tahap hello-world: cukup membuat skema + registry minimal agar koneksi terbukti.

-- ---- ingestion: instruments (registry), prices_daily, ingestion_runs ----
CREATE TABLE IF NOT EXISTS instruments (
  instrument_id     TEXT PRIMARY KEY,          -- mis. 'IDX:TLKM'
  symbol            TEXT NOT NULL,
  mic               TEXT NOT NULL DEFAULT 'XIDX',
  currency          TEXT NOT NULL DEFAULT 'IDR',
  timezone          TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  provider_symbol   TEXT NOT NULL,             -- mis. 'TLKM.JK' (yfinance)
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
  theta         DOUBLE PRECISION,            -- M3 (0.85*sigma_awal*sqrt(h), dibekukan)
  burn_in       INTEGER NOT NULL DEFAULT 0,
  reliability   TEXT NOT NULL DEFAULT 'full',
  wf_metrics    JSONB,                       -- metrik walk-forward
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
  run_id         BIGINT NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
  instrument_id  TEXT NOT NULL REFERENCES instruments(instrument_id),
  as_of_date     DATE NOT NULL,
  horizon        INTEGER NOT NULL,
  median         DOUBLE PRECISION,
  lower80        DOUBLE PRECISION,
  upper80        DOUBLE PRECISION,
  lower95        DOUBLE PRECISION,
  upper95        DOUBLE PRECISION,
  vol_daily      DOUBLE PRECISION,
  vol_annual     DOUBLE PRECISION,
  prob_correction DOUBLE PRECISION,
  garch_params   JSONB,                      -- omega, alpha, beta, nu
  empirical_q    JSONB,                      -- kuantil empiris yang dipakai
  path           JSONB,                      -- jalur kuantil k=1..h
  PRIMARY KEY (instrument_id, as_of_date, horizon)
);

-- ---- gateway: api_keys (admin saja) ----
CREATE TABLE IF NOT EXISTS api_keys (
  id          BIGSERIAL PRIMARY KEY,
  key_hash    TEXT NOT NULL,
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed registry 3 ticker MVP (idempoten).
INSERT INTO instruments (instrument_id, symbol, provider_symbol, reliability_tier) VALUES
  ('IDX:TLKM', 'TLKM', 'TLKM.JK', 'full'),
  ('IDX:GOTO', 'GOTO', 'GOTO.JK', 'low'),
  ('IDX:DCII', 'DCII', 'DCII.JK', 'low')
ON CONFLICT (instrument_id) DO NOTHING;
