import { useEffect, useRef } from "react";
import { useLocale } from "../../hooks/useLocale";
import type { User } from "../../types/api.types";

interface DeleteUserModalProps {
  open: boolean;
  target: User | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (user: User) => Promise<void>;
}

export function DeleteUserModal({ open, target, busy, onClose, onConfirm }: DeleteUserModalProps) {
  const { t } = useLocale();
  const copy = t.adminUsers;
  const common = t.authUi.common;
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeBtnRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, busy, onClose]);

  if (!open || !target) return null;

  return (
    <div
      className="footer-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        className="footer-modal auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-delete-user-title"
      >
        <div className="footer-modal-header">
          <span className="pill pill-danger">{copy.deleteModalMeta}</span>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn btn-ghost footer-modal-close"
            disabled={busy}
            onClick={onClose}
          >
            {common.closeAction}
          </button>
        </div>

        <h2 id="admin-delete-user-title" className="footer-modal-title">
          {copy.deleteModalTitle}
        </h2>

        <p className="footer-modal-lead">{copy.deleteModalWarning(target.name, target.email)}</p>

        <div className="modal-actions-end">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
            {copy.deleteModalCancel}
          </button>
          <button
            type="button"
            className="btn btn-danger-outline"
            disabled={busy}
            onClick={() => void onConfirm(target)}
          >
            {busy ? copy.deleteModalDeleting : copy.deleteModalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
