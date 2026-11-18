import { useState } from "react";
import { useLocale } from "../../hooks/useLocale";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}

function EyeToggleSvg({ visible }: { visible: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`password-eye-icon${visible ? " is-visible" : ""}`}
      aria-hidden="true"
    >
      <path
        className="password-eye-outline"
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
      />
      <circle className="password-eye-pupil" cx="12" cy="12" r="3" />
      <line className="password-eye-slash" x1="3" y1="3" x2="21" y2="21" />
    </svg>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  required = true,
  disabled = false,
}: PasswordInputProps) {
  const { t } = useLocale();
  const common = t.authUi.common;
  const [visible, setVisible] = useState(false);

  const label = visible ? common.hidePassword : common.showPassword;

  return (
    <div className="password-input-wrap">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        className="form-input form-input-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-eye-btn"
        aria-label={label}
        aria-pressed={visible}
        title={label}
        disabled={disabled}
        onClick={() => setVisible((prev) => !prev)}
      >
        <EyeToggleSvg visible={visible} />
      </button>
    </div>
  );
}
