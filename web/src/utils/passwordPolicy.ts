export interface AvatarOption {
  key: string;
  src: string;
  labelId: string;
  labelEn: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: "avatar-1", src: "/avatars/avatar-1.png", labelId: "Banteng Hijau", labelEn: "Green Bull" },
  { key: "avatar-2", src: "/avatars/avatar-2.png", labelId: "Laptop Grafik", labelEn: "Chart Laptop" },
  { key: "avatar-3", src: "/avatars/avatar-3.png", labelId: "Burung Hantu", labelEn: "Scholar Owl" },
  { key: "avatar-4", src: "/avatars/avatar-4.png", labelId: "Beruang Merah", labelEn: "Red Bear" },
  { key: "avatar-5", src: "/avatars/avatar-5.png", labelId: "Kurva Volatilitas", labelEn: "Volatility Curve" },
  { key: "avatar-6", src: "/avatars/avatar-6.png", labelId: "Lumba-lumba", labelEn: "Dolphin" },
  { key: "avatar-7", src: "/avatars/avatar-7.png", labelId: "Gurita Biru", labelEn: "Teal Octopus" },
  { key: "avatar-8", src: "/avatars/avatar-8.png", labelId: "Cakrawala Kota", labelEn: "City Skyline" },
  { key: "avatar-9", src: "/avatars/avatar-9.png", labelId: "Kaca Pembesar", labelEn: "Magnifier Chart" },
];

export function resolveAvatarSrc(avatarKey?: string, fallbackUrl?: string): string {
  const match = AVATAR_OPTIONS.find((item) => item.key === avatarKey);
  if (match) return match.src;
  if (fallbackUrl && fallbackUrl.startsWith("/avatars/")) return fallbackUrl;
  return AVATAR_OPTIONS[0].src;
}

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password1!",
  "password123",
  "password123!",
  "password@123",
  "p@ssword",
  "p@ssw0rd",
  "passw0rd!",
  "qwerty",
  "qwerty123",
  "qwerty123!",
  "qwerty@123",
  "12345678",
  "123456789",
  "12345678!",
  "admin123",
  "admin123!",
  "admin@123",
  "welcome123!",
  "letmein123!",
  "changeme1!",
  "changeme123!",
  "kairos123",
  "kairos123!",
  "indonesia123!",
  "jakarta123!",
  "rahasia123!",
  "bismillah123!",
  "test1234!",
  "demo1234!",
  "1qaz2wsx!",
  "q1w2e3r4!",
  "abcd1234!",
]);

export interface PasswordCheckResult {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
  noPersonalInfo: boolean;
  notCommon: boolean;
  allPassed: boolean;
  strength: "weak" | "fair" | "strong";
}

export function evaluatePasswordPolicy(password: string, email: string, name: string): PasswordCheckResult {
  const minLength = password.length >= 8 && password.length <= 128;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(password);

  const lowerPw = password.toLowerCase();
  const normEmail = email.trim().toLowerCase();
  let containsPersonal = false;

  if (normEmail) {
    if (lowerPw.includes(normEmail)) {
      containsPersonal = true;
    } else {
      const local = normEmail.split("@")[0] ?? "";
      if (local.length >= 3 && lowerPw.includes(local)) {
        containsPersonal = true;
      }
    }
  }
  if (!containsPersonal && name.trim()) {
    const tokens = name.toLowerCase().trim().split(/\s+/);
    for (const tok of tokens) {
      if (tok.length >= 3 && lowerPw.includes(tok)) {
        containsPersonal = true;
        break;
      }
    }
  }

  const noPersonalInfo = password.length > 0 && !containsPersonal;
  const notCommon = password.length > 0 && !COMMON_PASSWORDS.has(lowerPw.trim());

  const checksPassed = [minLength, hasUpper, hasLower, hasDigit, hasSymbol, noPersonalInfo, notCommon].filter(Boolean).length;
  const allPassed = checksPassed === 7;

  let strength: "weak" | "fair" | "strong" = "weak";
  if (allPassed && password.length >= 12) {
    strength = "strong";
  } else if (checksPassed >= 5 && minLength) {
    strength = "fair";
  }

  return {
    minLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSymbol,
    noPersonalInfo,
    notCommon,
    allPassed,
    strength,
  };
}

export function normalizeDisplayName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function isValidDisplayName(raw: string): boolean {
  for (let i = 0; i < raw.length; i += 1) {
    const code = raw.charCodeAt(i);
    if (code < 32 || code === 127 || raw[i] === "<" || raw[i] === ">") {
      return false;
    }
  }
  const cleaned = normalizeDisplayName(raw);
  return cleaned.length >= 2 && cleaned.length <= 50;
}
