"""Instrument registry queries for ml-service."""
from __future__ import annotations

from kairos_ml import db


def list_instruments(only_active: bool) -> list[tuple]:
    """Return configured instruments from the registry."""
    return db.fetch_instruments(only_active)
