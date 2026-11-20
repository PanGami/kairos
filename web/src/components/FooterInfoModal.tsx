import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../hooks/useLocale";
import type { FooterTopicKey } from "../i18n/messages";

const INLINE_LINKS: Array<{ label: string; href: string }> = [
  {
    label: "Panca Nugraha Wicaksana",
    href: "https://www.linkedin.com/in/panca-nugraha-wicaksana/",
  },
  {
    label: "PanGami",
    href: "https://github.com/PanGami",
  },
];

const INLINE_LINK_PATTERN = new RegExp(
  `(${INLINE_LINKS.map((item) => item.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g",
);

function renderLinkedText(text: string): ReactNode {
  const parts = text.split(INLINE_LINK_PATTERN);
  return parts.map((part, index) => {
    const match = INLINE_LINKS.find((item) => item.label === part);
    if (!match) {
      return <Fragment key={index}>{part}</Fragment>;
    }
    return (
      <a
        key={`${match.label}-${index}`}
        href={match.href}
        target="_blank"
        rel="noopener noreferrer"
        className="footer-inline-link"
      >
        {match.label}
      </a>
    );
  });
}

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
                <p className="ledger-desc">{renderLinkedText(item.body)}</p>
              </dd>
            </div>
          ))}
        </dl>

        {content.routeTo && content.routeLabel && (
          <div className="footer-modal-actions">
            <Link to={content.routeTo} className="btn btn-primary" onClick={onClose}>
              {content.routeLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
