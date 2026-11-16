import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../hooks/useLocale";
import type { FooterTopicKey } from "../i18n/messages";

interface FooterInfoModalProps {
  topic: FooterTopicKey | null;
  onClose: () => void;
}

export function FooterInfoModal({ topic, onClose }: FooterInfoModalProps) {
  const { t } = useLocale();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!topic) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeBtnRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [topic, onClose]);

  if (!topic) return null;

  const content = t.footer.topics[topic];

  return (
    <div
      className="footer-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="footer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="footer-modal-title"
      >
        <div className="footer-modal-header">
          <span className="pill pill-cyan">{content.badge}</span>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn btn-ghost footer-modal-close"
            aria-label={t.footer.closeAriaLabel}
            onClick={onClose}
          >
            {t.footer.closeDialog}
          </button>
        </div>

        <h2 id="footer-modal-title" className="footer-modal-title">
          {content.title}
        </h2>
        <p className="footer-modal-lead">{content.lead}</p>

        <dl className="model-ledger footer-modal-list">
          {content.items.map((item) => (
            <div key={item.label} className="model-ledger-row footer-modal-row">
              <dt>{item.label}</dt>
              <dd>
                <p className="ledger-desc">{item.body}</p>
              </dd>
            </div>
          ))}
        </dl>

        <div className="footer-modal-actions">
          {content.routeTo && content.routeLabel && (
            <Link to={content.routeTo} className="btn btn-primary" onClick={onClose}>
              {content.routeLabel}
            </Link>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t.footer.closeDialog}
          </button>
        </div>
      </div>
    </div>
  );
}
