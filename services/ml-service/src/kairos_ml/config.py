"""Configuration and structured logging utilities for ml-service."""
from __future__ import annotations

import json
import os
import time
from typing import Any

import grpc

SPEC_VERSION = os.environ.get("MODEL_SPEC_VERSION", "v1")
GIT_SHA = os.environ.get("GIT_SHA", "local")
ML_SERVICE_PORT = os.environ.get("ML_SERVICE_PORT", "50051")


def log(level: str, msg: str, **kv: Any) -> None:
    """Log structured JSON to stdout (12-factor / AGENTS.md)."""
    rec = {"ts": time.time(), "level": level, "svc": "ml-service", "msg": msg, **kv}
    print(json.dumps(rec), flush=True)


def extract_request_id(context: grpc.ServicerContext) -> str:
    """Extract x-request-id from incoming gRPC invocation metadata."""
    try:
        for k, v in context.invocation_metadata() or ():
            if k.lower() == "x-request-id":
                return str(v)
    except Exception:
        pass
    return ""
