"""Configuration and structured logging utilities for ingestion."""
from __future__ import annotations

import json
import os
from pathlib import Path
import time
from typing import Any

TZ_NAME = os.environ.get("TZ", "Asia/Jakarta")
CANONICAL_PARQUET_PATH = Path(os.environ.get("CANONICAL_PARQUET_PATH", "data/canonical.parquet"))
SKIP_YFINANCE = os.environ.get("SKIP_YFINANCE", "false").lower() in ("1", "true", "yes")
FORCE_BACKFILL = os.environ.get("INGEST_BACKFILL", "false").lower() in ("1", "true", "yes")
ML_SERVICE_ADDR = f"{os.environ.get('ML_SERVICE_HOST', 'ml-service')}:{os.environ.get('ML_SERVICE_PORT', '50051')}"


def log(level: str, msg: str, **kv: Any) -> None:
    rec = {"ts": time.time(), "level": level, "svc": "ingestion", "msg": msg, **kv}
    print(json.dumps(rec), flush=True)
