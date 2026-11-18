import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../hooks/useLocale";
import type { User } from "../../types/api.types";
import { AVATAR_OPTIONS } from "../../utils/passwordPolicy";

interface ProfileAvatarModalProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ProfileAvatarModal({ open, user, onClose, onSuccess }: ProfileAvatarModalProps) {
  const { updateProfile } = useAuth();
  const { locale, t } = useLocale();
  const copy = t.authUi.profilePage;
  const common = t.authUi.common;
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar_key || "avatar-1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedAvatar(user.avatar_key || "avatar-1");
    setError(null);
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
  }, [open, user.avatar_key, onClose]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(user.name, selectedAvatar);
      onSuccess(copy.avatarSavedBanner);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update avatar");
    } finally {
      setSaving(false);
    }
  }

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
        className="footer-modal avatar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-avatar-modal-title"
      >
        <div className="footer-modal-header">
          <span className="pill pill-cyan">{copy.avatarWidgetMeta}</span>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn btn-ghost footer-modal-close"
            onClick={onClose}
          >
            {common.closeAction}
          </button>
        </div>

        <h2 id="profile-avatar-modal-title" className="footer-modal-title">
          {copy.avatarWidgetTitle}
        </h2>

        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}

        <div className="avatar-picker-grid" role="group" aria-label={copy.avatarWidgetTitle}>
          {AVATAR_OPTIONS.map((opt) => {
            const isSelected = selectedAvatar === opt.key;
            const label = locale === "id" ? opt.labelId : opt.labelEn;
            return (
              <button
                key={opt.key}
                type="button"
                className={`avatar-tile${isSelected ? " is-selected" : ""}`}
                aria-pressed={isSelected}
                aria-label={label}
                onClick={() => setSelectedAvatar(opt.key)}
              >
                <img
                  src={opt.src}
                  alt={label}
                  width={64}
                  height={64}
                  className="avatar-tile-img"
                />
                <span className="avatar-tile-label">{label}</span>
                {isSelected && <span className="pill pill-cyan">{copy.avatarSelectedPill}</span>}
              </button>
            );
          })}
        </div>

        <div className="footer-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {common.closeAction}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || selectedAvatar === user.avatar_key}
            onClick={() => void handleSave()}
          >
            {saving ? common.saving : copy.avatarSaveButton}
          </button>
        </div>
      </div>
    </div>
  );
}
