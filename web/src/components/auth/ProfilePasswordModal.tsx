import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../hooks/useLocale";
import { ApiError } from "../../services/api.client";
import * as authService from "../../services/auth.service";
import type { User } from "../../types/api.types";
import { evaluatePasswordPolicy } from "../../utils/passwordPolicy";
import { PasswordChecklist } from "./PasswordChecklist";
import { PasswordInput } from "./PasswordInput";

interface ProfilePasswordModalProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ProfilePasswordModal({ open, user, onClose, onSuccess }: ProfilePasswordModalProps) {
  const { setUserState } = useAuth();
  const { t } = useLocale();
  const copy = t.authUi;
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const currentPwId = useId();
  const otpId = useId();
  const newPwId = useId();
  const confirmPwId = useId();

  const [currentPassword, setCurrentPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeBtnRef.current?.focus();

    setCurrentPassword("");
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setOtpSent(false);
    setCountdown(0);

    if (!user.has_password) {
      setRequestingOtp(true);
      void authService
        .requestSetPasswordOtp()
        .then((res) => {
          setOtpSent(true);
          setCountdown(res.resend_after_seconds || 60);
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.retryAfterSeconds) {
            setOtpSent(true);
            setCountdown(err.retryAfterSeconds);
          }
          setError(err instanceof Error ? err.message : copy.otp.invalidCodeError);
        })
        .finally(() => {
          setRequestingOtp(false);
        });
    }

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
  }, [open, user.has_password, onClose, copy.otp.invalidCodeError]);

  useEffect(() => {
    if (!open || countdown <= 0) return;
    const id = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, countdown]);

  if (!open) return null;

  const policy = evaluatePasswordPolicy(newPassword, user.email, user.name);

  async function handleResendSetOtp() {
    if (countdown > 0 || requestingOtp) return;
    setRequestingOtp(true);
    setError(null);
    try {
      const res = await authService.requestSetPasswordOtp();
      setOtpSent(true);
      setCountdown(res.resend_after_seconds || 60);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.retryAfterSeconds) {
        setCountdown(err.retryAfterSeconds);
      }
      setError(err instanceof Error ? err.message : copy.otp.invalidCodeError);
    } finally {
      setRequestingOtp(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(copy.passwordPolicy.mismatchError);
      return;
    }
    if (!policy.allPassed) {
      setError(copy.passwordPolicy.policyError);
      return;
    }

    setSubmitting(true);
    try {
      if (user.has_password) {
        await authService.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
          password_confirmation: confirmPassword,
        });
        onSuccess(copy.profilePage.passwordUpdatedBanner);
      } else {
        const cleanedOtp = otpCode.replace(/\D/g, "").slice(0, 6);
        if (cleanedOtp.length !== 6) {
          setError(copy.otp.invalidCodeError);
          setSubmitting(false);
          return;
        }
        const updatedUser = await authService.setInitialPassword({
          code: cleanedOtp,
          new_password: newPassword,
          password_confirmation: confirmPassword,
        });
        setUserState(updatedUser);
        onSuccess(copy.profilePage.passwordCreatedBanner);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.passwordPolicy.policyError);
    } finally {
      setSubmitting(false);
    }
  }

  const title = user.has_password ? copy.profilePage.passwordModalChangeTitle : copy.profilePage.passwordModalCreateTitle;
  const lead = user.has_password
    ? copy.profilePage.passwordModalChangeLead
    : copy.profilePage.passwordModalCreateLead(user.email);

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
        className="footer-modal auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-password-modal-title"
      >
        <div className="footer-modal-header">
          <span className="pill pill-cyan">{copy.profilePage.securityWidgetMeta}</span>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn btn-ghost footer-modal-close"
            onClick={onClose}
          >
            {copy.common.closeAction}
          </button>
        </div>

        <h2 id="profile-password-modal-title" className="footer-modal-title">
          {title}
        </h2>
        <p className="footer-modal-lead">{lead}</p>

        {!user.has_password && requestingOtp && !otpSent && (
          <div className="banner banner-info" role="status">
            {copy.profilePage.sendSetOtpLoading}
          </div>
        )}

        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          {user.has_password ? (
            <div className="form-field">
              <label htmlFor={currentPwId} className="form-label">
                {copy.common.currentPasswordLabel}
              </label>
              <PasswordInput
                id={currentPwId}
                autoComplete="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
            </div>
          ) : (
            <div className="form-field">
              <div className="form-label-row">
                <label htmlFor={otpId} className="form-label">
                  {copy.common.otpLabel}
                </label>
                <button
                  type="button"
                  className="btn-inline-toggle"
                  disabled={countdown > 0 || requestingOtp}
                  onClick={() => void handleResendSetOtp()}
                >
                  {countdown > 0 ? copy.otp.resendCountdown(countdown) : copy.otp.resendButton}
                </button>
              </div>
              <input
                id={otpId}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="form-input form-input-otp mono"
                placeholder={copy.common.otpPlaceholder}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor={newPwId} className="form-label">
              {copy.common.newPasswordLabel}
            </label>
            <PasswordInput
              id={newPwId}
              autoComplete="new-password"
              value={newPassword}
              onChange={setNewPassword}
            />
          </div>

          <div className="form-field">
            <label htmlFor={confirmPwId} className="form-label">
              {copy.common.confirmPasswordLabel}
            </label>
            <PasswordInput
              id={confirmPwId}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </div>

          <PasswordChecklist password={newPassword} email={user.email} name={user.name} />

          <div className="footer-modal-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? copy.common.saving
                : user.has_password
                  ? copy.profilePage.submitChangePassword
                  : copy.profilePage.submitCreatePassword}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
