import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../hooks/useLocale";
import type { Instrument } from "../types/api.types";
import { matchesQuery, rankByConfidence } from "../utils/instrumentRanking";
import { getTierBadge } from "../utils/tierBadge";

interface Props {
  open: boolean;
  instruments: Instrument[];
  activeId: string | null;
  featuredId: string | null;
  isGuest: boolean;
  onSelect: (id: string) => void;
  onLockedClick: (instrument: Instrument) => void;
  onClose: () => void;
}

const FOCUSABLE = "button:not([disabled]), input:not([disabled]), a[href]";

export function TickerSearchDialog({
  open,
  instruments,
  activeId,
  featuredId,
  isGuest,
  onSelect,
  onLockedClick,
  onClose,
}: Props) {
  const { t } = useLocale();
  const s = t.tickerSearch;
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const ranked = useMemo(() => rankByConfidence(instruments, featuredId), [instruments, featuredId]);
  const results = useMemo(() => ranked.filter((i) => matchesQuery(i, query)), [ranked, query]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    return () => previousFocusRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const rows = () => Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("button.ticker-row") ?? []);

  function pick(inst: Instrument) {
    if (isGuest && inst.instrument_id !== featuredId) {
      onLockedClick(inst);
    } else {
      onSelect(inst.instrument_id);
    }
    onClose();
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      pick(results[0]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      rows()[0]?.focus();
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = rows();
    const index = items.findIndex((el) => el === document.activeElement);
    if (index === -1) return;
    event.preventDefault();
    if (event.key === "ArrowDown") {
      items[Math.min(index + 1, items.length - 1)]?.focus();
    } else if (index === 0) {
      inputRef.current?.focus();
    } else {
      items[index - 1]?.focus();
    }
  }

  return (
    <div
      className="ticker-search-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="ticker-search"
        role="dialog"
        aria-modal="true"
        aria-label={s.dialogAriaLabel}
        onKeyDown={onDialogKeyDown}
      >
        <div className="ticker-search-header">
          <span className="pill pill-cyan">{s.badge}</span>
          <button type="button" className="btn btn-ghost" aria-label={s.closeAriaLabel} onClick={onClose}>
            {s.close}
          </button>
        </div>

        <h2 className="ticker-search-title">{s.title}</h2>
        <p className="ticker-search-lead">{s.lead}</p>

        <label className="ticker-search-field">
          <span className="control-label">{s.searchLabel}</span>
          <input
            ref={inputRef}
            type="search"
            className="ticker-search-input"
            value={query}
            placeholder={s.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
        </label>

        {isGuest && (
          <div className="banner banner-info ticker-search-guest">
            <span>{s.guestNote(featuredId ?? "IDX:TLKM")}</span>
            <Link to="/login" className="btn btn-primary" onClick={onClose}>
              {s.guestSignIn}
            </Link>
          </div>
        )}

        <div className="ticker-search-meta">
          <span className="widget-meta">{s.sortedNote}</span>
          <span className="widget-meta" role="status">
            {s.resultsCount(results.length, instruments.length)}
          </span>
        </div>

        <div ref={listRef} className="ticker-search-list" role="group" onKeyDown={onListKeyDown}>
          {results.length === 0 ? (
            <p className="ticker-search-empty">{s.empty(query.trim())}</p>
          ) : (
            results.map((inst) => {
              const isFeatured = inst.instrument_id === featuredId;
              const isLocked = isGuest && !isFeatured;
              const isSelected = inst.instrument_id === activeId;
              const badge = getTierBadge(inst.reliability_tier, t);
              return (
                <button
                  key={inst.instrument_id}
                  type="button"
                  className={`ticker-row${isSelected ? " active" : ""}${isLocked ? " locked" : ""}`}
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => pick(inst)}
                >
                  <span className="ticker-row-main">
                    <span className="ticker-row-id">{inst.instrument_id}</span>
                    <span className="ticker-row-sub">
                      {inst.symbol} {inst.mic}
                    </span>
                  </span>
                  <span className="ticker-row-pills">
                    {isSelected && <span className="pill pill-cyan">{s.selected}</span>}
                    {isFeatured && <span className="pill pill-cyan">{t.watchlist.featuredToday}</span>}
                    {isLocked ? (
                      <span className="pill pill-muted">{t.watchlist.locked}</span>
                    ) : (
                      <span className={`pill ${badge.tone}`}>{badge.label}</span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
