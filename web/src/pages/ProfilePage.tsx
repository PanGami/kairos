import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { ProfileAvatarModal } from "../components/auth/ProfileAvatarModal";
import { ProfilePasswordModal } from "../components/auth/ProfilePasswordModal";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { ApiError } from "../services/api.client";
import * as authService from "../services/auth.service";
import {
  isValidDisplayName,
  normalizeDisplayName,
  resolveAvatarSrc,
} from "../utils/passwordPolicy";

function EditPencilIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

export function ProfilePage() {
  const { user, config, updateProfile, linkGoogleWithToken } = useAuth();
  const { t } = useLocale();
  const copy = t.authUi.profilePage;
  const common = t.authUi.common;
  const nameInputId = useId();

  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [showGoogleActivate, setShowGoogleActivate] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setNameInput(user.name);
    if (user.google_linked) {
      setShowGoogleActivate(false);
    }
  }, [user]);

  const handleLinkCredential = useCallback(
    async (idToken: string, state: string) => {
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        await linkGoogleWithToken(idToken, state);
        setShowGoogleActivate(false);
        setStatusMessage(copy.googleLinkedBanner);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.code === "GOOGLE_EMAIL_MISMATCH") {
          setErrorMessage(copy.googleMismatchError);
          return;
        }
        setErrorMessage(err instanceof Error ? err.message : copy.googleMismatchError);
      }
    },
    [copy.googleLinkedBanner, copy.googleMismatchError, linkGoogleWithToken],
  );

  if (!user) return null;

  async function handleSaveName(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setStatusMessage(null);
    setErrorMessage(null);

    if (!isValidDisplayName(nameInput)) {
      setErrorMessage(copy.nameInvalidError);
      return;
    }

    const cleanName = normalizeDisplayName(nameInput);
    setSavingName(true);
    try {
      await updateProfile(cleanName, user.avatar_key || "avatar-1");
      setStatusMessage(copy.nameSavedBanner);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : copy.nameInvalidError);
    } finally {
      setSavingName(false);
    }
  }

  async function handleActivateGoogleClick() {
    if (!user) return;
    setErrorMessage(null);
    setStatusMessage(null);

    if (!config?.google_client_id && config?.dev_login_enabled) {
      setLinkingGoogle(true);
      try {
        const state = await authService.getGoogleState();
        await handleLinkCredential(`dev:${user.email}:${user.name}`, state);
      } finally {
        setLinkingGoogle(false);
      }
      return;
    }

    setShowGoogleActivate((prev) => !prev);
  }

  const avatarSrc = resolveAvatarSrc(user.avatar_key, user.picture_url);
  const normalizedNameLength = normalizeDisplayName(nameInput).length;
  const roleLabel = (user.role || "user").toUpperCase();
  const canActivateGoogle = !user.google_linked && Boolean(config?.google_client_id || config?.dev_login_enabled);

  return (
    <div className="profile-screen">
      <header className="profile-header">
        <span className="pill pill-cyan">{copy.badge}</span>
        <h1 className="profile-title">{copy.title}</h1>
        <p className="profile-lead">{copy.subtitle}</p>
      </header>

      {statusMessage && (
        <div className="banner banner-verified" role="status">
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="banner banner-error" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="profile-grid">
        <section className="terminal-widget profile-overview-widget" aria-label={copy.overviewTitle}>
          <div className="widget-header">
            <span className="widget-title">{copy.overviewTitle}</span>
          </div>

          <div className="profile-overview-body">
            <div className="profile-identity-row">
              <button
                type="button"
                className="profile-avatar-trigger"
                aria-label={copy.avatarTriggerAriaLabel}
                title={copy.avatarTriggerAriaLabel}
                onClick={() => setAvatarModalOpen(true)}
              >
                <img
                  src={avatarSrc}
                  alt={user.name}
                  width={72}
                  height={72}
                  className="profile-avatar-lg"
                />
                <span className="profile-avatar-overlay" aria-hidden="true">
                  <EditPencilIcon />
                </span>
              </button>
              <div className="profile-identity-copy">
                <h2 className="profile-user-name">{user.name}</h2>
                <div className="profile-email-row">
                  <span className="mono profile-email-text">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="keystats-table">
              <div className="keystats-row">
                <span className="keystats-label">{copy.googleLabel}</span>
                <div className="keystats-inline-group">
                  <span className={`pill ${user.google_linked ? "pill-verified" : "pill-muted"}`}>
                    {user.google_linked ? copy.googleConnected : copy.googleNotConnected}
                  </span>
                  {canActivateGoogle && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={linkingGoogle}
                      aria-expanded={showGoogleActivate}
                      onClick={() => void handleActivateGoogleClick()}
                    >
                      {showGoogleActivate ? copy.googleCancelButton : copy.googleActivateButton}
                    </button>
                  )}
                </div>
              </div>

              {showGoogleActivate && canActivateGoogle && config?.google_client_id && (
                <div className="google-link-inline">
                  <span className="muted google-link-hint">
                    {copy.googleLinkHint} <span className="mono">{user.email}</span>
                  </span>
                  <div className="google-link-actions">
                    <GoogleAuthButton
                      buttonSize="medium"
                      hideUnavailableBanner
                      devToken={`dev:${user.email}:${user.name}`}
                      onError={setErrorMessage}
                      onCredential={handleLinkCredential}
                    />
                  </div>
                </div>
              )}

              <div className="keystats-row">
                <span className="keystats-label">{copy.passwordLabel}</span>
                <span className={`pill ${user.has_password ? "pill-verified" : "pill-warning"}`}>
                  {user.has_password ? copy.passwordConfigured : copy.passwordNotSet}
                </span>
              </div>
              <div className="keystats-row">
                <span className="keystats-label">{copy.roleLabel}</span>
                <span className="pill pill-cyan">{roleLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="profile-edit-col">
          <section className="terminal-widget" aria-label={copy.nameWidgetTitle}>
            <div className="widget-header">
              <span className="widget-title">{copy.nameWidgetTitle}</span>
            </div>

            <form className="profile-widget-body auth-form" onSubmit={(e) => void handleSaveName(e)} noValidate>
              <div className="form-field">
                <div className="form-label-row">
                  <label htmlFor={nameInputId} className="form-label">
                    {common.nameLabel}
                  </label>
                  <span className="mono auth-char-count">{normalizedNameLength}/50</span>
                </div>
                <input
                  id={nameInputId}
                  type="text"
                  maxLength={50}
                  className="form-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                />
              </div>

              <p className="muted auth-field-hint">{copy.nameRulesHint}</p>

              <div className="profile-widget-actions">
                <button type="submit" className="btn btn-primary" disabled={savingName}>
                  {savingName ? common.saving : copy.nameSaveButton}
                </button>
              </div>
            </form>
          </section>

          <section className="terminal-widget" aria-label={copy.securityWidgetTitle}>
            <div className="widget-header">
              <span className="widget-title">{copy.securityWidgetTitle}</span>
            </div>

            <div className="profile-widget-body">
              <p className="muted auth-security-desc">
                {user.has_password ? copy.changePasswordDesc : copy.createPasswordDesc}
              </p>

              <div className="profile-widget-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPasswordModalOpen(true)}
                >
                  {user.has_password ? copy.changePasswordButton : copy.createPasswordButton}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ProfileAvatarModal
        open={avatarModalOpen}
        user={user}
        onClose={() => setAvatarModalOpen(false)}
        onSuccess={(msg) => {
          setErrorMessage(null);
          setStatusMessage(msg);
        }}
      />

      <ProfilePasswordModal
        open={passwordModalOpen}
        user={user}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={(msg) => {
          setErrorMessage(null);
          setStatusMessage(msg);
        }}
      />
    </div>
  );
}
