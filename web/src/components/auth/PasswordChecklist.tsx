import { useLocale } from "../../hooks/useLocale";
import { evaluatePasswordPolicy } from "../../utils/passwordPolicy";

interface PasswordChecklistProps {
  password: string;
  email: string;
  name: string;
}

export function PasswordChecklist({ password, email, name }: PasswordChecklistProps) {
  const { t } = useLocale();
  const copy = t.authUi.passwordPolicy;
  const result = evaluatePasswordPolicy(password, email, name);

  const items: Array<{ key: string; label: string; ok: boolean }> = [
    { key: "len", label: copy.rules.minLength, ok: result.minLength },
    { key: "upper", label: copy.rules.upper, ok: result.hasUpper },
    { key: "lower", label: copy.rules.lower, ok: result.hasLower },
    { key: "digit", label: copy.rules.digit, ok: result.hasDigit },
    { key: "symbol", label: copy.rules.symbol, ok: result.hasSymbol },
    { key: "personal", label: copy.rules.noPersonal, ok: result.noPersonalInfo },
    { key: "common", label: copy.rules.notCommon, ok: result.notCommon },
  ];

  const strengthText =
    result.strength === "strong"
      ? copy.strengthStrong
      : result.strength === "fair"
        ? copy.strengthFair
        : copy.strengthWeak;

  const strengthPillClass =
    result.strength === "strong"
      ? "pill pill-verified"
      : result.strength === "fair"
        ? "pill pill-warning"
        : "pill pill-muted";

  const meterWidth =
    password.length === 0
      ? "0%"
      : result.strength === "strong"
        ? "100%"
        : result.strength === "fair"
          ? "64%"
          : "28%";

  return (
    <div className="password-policy-box" aria-live="polite">
      <div className="password-strength-head">
        <span className="password-policy-title">{copy.title}</span>
        <span className={strengthPillClass}>
          {copy.strengthLabel}: {strengthText}
        </span>
      </div>

      <div className="password-meter-track" aria-hidden="true">
        <div
          className={`password-meter-fill strength-${result.strength}`}
          style={{ width: meterWidth }}
        />
      </div>

      <p className="password-hint">{copy.hint}</p>

      <ul className="password-checklist">
        {items.map((item) => (
          <li key={item.key} className={`password-check-item${item.ok ? " is-ok" : ""}`}>
            <span className={`pill ${item.ok ? "pill-verified" : "pill-muted"}`}>
              {item.ok ? copy.statusPass : copy.statusNeeded}
            </span>
            <span className="password-check-label">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
