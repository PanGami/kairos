export interface AuthUiMessages {
  common: {
    emailLabel: string;
    emailPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    showPassword: string;
    hidePassword: string;
    otpLabel: string;
    otpPlaceholder: string;
    orDivider: string;
    backAction: string;
    closeAction: string;
    saving: string;
  };
  passwordPolicy: {
    title: string;
    hint: string;
    strengthLabel: string;
    strengthWeak: string;
    strengthFair: string;
    strengthStrong: string;
    statusPass: string;
    statusNeeded: string;
    rules: {
      minLength: string;
      upper: string;
      lower: string;
      digit: string;
      symbol: string;
      noPersonal: string;
      notCommon: string;
    };
    mismatchError: string;
    policyError: string;
  };
  otp: {
    titleRegister: string;
    titleVerifyLogin: string;
    description: (email: string) => string;
    validityNote: string;
    verifyButton: string;
    verifying: string;
    resendButton: string;
    resendCountdown: (seconds: number) => string;
    resentBanner: string;
    invalidCodeError: string;
  };
  loginPage: {
    badge: string;
    title: string;
    description: string;
    emailPlaceholder: string;
    submitButton: string;
    submitting: string;
    forgotLink: string;
    registerPrompt: string;
    registerLink: string;
    goToForgotFromGoogleOnly: string;
    resetSuccessBanner: string;
    invalidCredentials: string;
    googleOnlyMessage: string;
    unverifiedBanner: string;
  };
  registerPage: {
    badge: string;
    title: string;
    description: string;
    submitButton: string;
    submitting: string;
    loginPrompt: string;
    loginLink: string;
    goToLoginButton: string;
    duplicateEmail: string;
    duplicateGoogleEmail: string;
    invalidNameError: string;
  };
  forgotPage: {
    badge: string;
    title: string;
    step1Desc: string;
    sendCodeButton: string;
    sendingCode: string;
    uniformSentBanner: string;
    step2Desc: (email: string) => string;
    submitResetButton: string;
    resetting: string;
    backToLogin: string;
    backToEmailStep: string;
  };
  profilePage: {
    badge: string;
    title: string;
    subtitle: string;
    overviewTitle: string;
    overviewMeta: string;
    emailReadOnlyNote: string;
    googleLabel: string;
    googleConnected: string;
    googleNotConnected: string;
    googleActivateButton: string;
    googleCancelButton: string;
    googleLinkHint: string;
    googleLinkedBanner: string;
    googleMismatchError: string;
    passwordLabel: string;
    passwordConfigured: string;
    passwordNotSet: string;
    roleLabel: string;
    verifiedLabel: string;
    verifiedValue: string;
    unverifiedValue: string;
    nameWidgetTitle: string;
    nameWidgetMeta: string;
    nameRulesHint: string;
    nameSaveButton: string;
    nameSavedBanner: string;
    nameInvalidError: string;
    avatarWidgetTitle: string;
    avatarWidgetMeta: string;
    avatarTriggerAriaLabel: string;
    avatarSelectedPill: string;
    avatarSaveButton: string;
    avatarSavedBanner: string;
    securityWidgetTitle: string;
    securityWidgetMeta: string;
    changePasswordDesc: string;
    createPasswordDesc: string;
    changePasswordButton: string;
    createPasswordButton: string;
    passwordModalChangeTitle: string;
    passwordModalCreateTitle: string;
    passwordModalChangeLead: string;
    passwordModalCreateLead: (email: string) => string;
    sendSetOtpLoading: string;
    submitChangePassword: string;
    submitCreatePassword: string;
    passwordUpdatedBanner: string;
    passwordCreatedBanner: string;
  };
}

export const authUiEn: AuthUiMessages = {
  common: {
    emailLabel: "Email Address",
    emailPlaceholder: "name@example.com",
    nameLabel: "Display Name",
    namePlaceholder: "Your Name",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm Password",
    currentPasswordLabel: "Current Password",
    newPasswordLabel: "New Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    otpLabel: "6-Digit Verification Code",
    otpPlaceholder: "000000",
    orDivider: "OR",
    backAction: "Back",
    closeAction: "Close",
    saving: "Saving...",
  },
  passwordPolicy: {
    title: "Password Security Requirements",
    hint: "Use a unique phrase that is easy to remember",
    strengthLabel: "Strength",
    strengthWeak: "WEAK",
    strengthFair: "FAIR",
    strengthStrong: "STRONG",
    statusPass: "PASS",
    statusNeeded: "NEEDED",
    rules: {
      minLength: "8 to 128 characters",
      upper: "At least one uppercase letter",
      lower: "At least one lowercase letter",
      digit: "At least one number",
      symbol: "At least one symbol",
      noPersonal: "Does not contain your email or name",
      notCommon: "Not a common leaked password",
    },
    mismatchError: "Password confirmation does not match.",
    policyError: "Password does not meet all security requirements.",
  },
  otp: {
    titleRegister: "Verify Your Email",
    titleVerifyLogin: "Email Verification Required",
    description: (email) => `Enter the 6-digit verification code sent to ${email}.`,
    validityNote: "This code expires in 10 minutes and can only be used once.",
    verifyButton: "Verify Code and Sign In",
    verifying: "Verifying...",
    resendButton: "Resend code",
    resendCountdown: (seconds) => `Resend code in ${seconds}s`,
    resentBanner: "A new verification code has been sent to your email.",
    invalidCodeError: "Invalid or expired code",
  },
  loginPage: {
    badge: "ACCOUNT ACCESS",
    title: "Sign In to KAIROS",
    description:
      "Sign in with email and password or Google to access calibrated risk intervals across all active tickers.",
    emailPlaceholder: "name@example.com",
    submitButton: "Sign In",
    submitting: "Signing in...",
    forgotLink: "Forgot password?",
    registerPrompt: "Do not have an account?",
    registerLink: "Create account",
    goToForgotFromGoogleOnly: "Create password via Forgot Password",
    resetSuccessBanner: "Your password was updated. All previous sessions were signed out. Sign in with your new password.",
    invalidCredentials: "Incorrect email or password",
    googleOnlyMessage:
      "This account is linked with Google. Sign in with Google, or create a password via Forgot Password.",
    unverifiedBanner: "Your email is not verified yet. Enter the new 6-digit code sent to your inbox.",
  },
  registerPage: {
    badge: "NEW ACCOUNT",
    title: "Create KAIROS Account",
    description:
      "Register with your name, email, and a strong password. We will send a 6-digit verification code to your inbox.",
    submitButton: "Create Account",
    submitting: "Creating account...",
    loginPrompt: "Already have an account?",
    loginLink: "Sign in",
    goToLoginButton: "Go to Sign In",
    duplicateEmail: "This email is already registered",
    duplicateGoogleEmail: "This email is already registered",
    invalidNameError: "Name must be 2 to 50 characters without HTML tags or control characters.",
  },
  forgotPage: {
    badge: "ACCOUNT RECOVERY",
    title: "Reset Password",
    step1Desc: "Enter your account email address to receive a 6-digit password reset code.",
    sendCodeButton: "Send Reset Code",
    sendingCode: "Sending code...",
    uniformSentBanner: "If this email is registered, we have sent a verification code.",
    step2Desc: (email) => `Enter the 6-digit code sent to ${email} and choose your new password.`,
    submitResetButton: "Reset Password",
    resetting: "Updating password...",
    backToLogin: "Back to Sign In",
    backToEmailStep: "Change email",
  },
  profilePage: {
    badge: "USER PROFILE",
    title: "Profile and Account Security",
    subtitle: "Manage your display name, avatar selection, and authentication credentials.",
    overviewTitle: "ACCOUNT STATUS",
    overviewMeta: "READ-ONLY IDENTITY",
    emailReadOnlyNote: "IMMUTABLE",
    googleLabel: "Login Via Google",
    googleConnected: "ACTIVATED",
    googleNotConnected: "NOT ACTIVATED",
    googleActivateButton: "Activate",
    googleCancelButton: "Cancel",
    googleLinkHint: "Select the Google account matching",
    googleLinkedBanner: "Login via Google is now activated.",
    googleMismatchError: "Google account email must match your account email.",
    passwordLabel: "Password Login",
    passwordConfigured: "CONFIGURED",
    passwordNotSet: "NOT SET",
    roleLabel: "Account Role",
    verifiedLabel: "Email Status",
    verifiedValue: "VERIFIED",
    unverifiedValue: "UNVERIFIED",
    nameWidgetTitle: "DISPLAY NAME",
    nameWidgetMeta: "2 TO 50 CHARS",
    nameRulesHint: "Leading and trailing spaces are trimmed and double spaces collapsed. HTML tags are rejected.",
    nameSaveButton: "Save Name",
    nameSavedBanner: "Display name updated.",
    nameInvalidError: "Name must be 2 to 50 characters without HTML tags or control characters.",
    avatarWidgetTitle: "STATIC AVATAR",
    avatarWidgetMeta: "9 PRESETS",
    avatarTriggerAriaLabel: "Change profile avatar",
    avatarSelectedPill: "SELECTED",
    avatarSaveButton: "Save Avatar",
    avatarSavedBanner: "Avatar updated.",
    securityWidgetTitle: "PASSWORD CREDENTIALS",
    securityWidgetMeta: "SESSION CONTROL",
    changePasswordDesc:
      "Updating your password signs out all other active devices while keeping your current session signed in.",
    createPasswordDesc:
      "This account currently signs in with Google only. Create a password via email OTP to enable email and password sign-in.",
    changePasswordButton: "Change Password",
    createPasswordButton: "Create Password",
    passwordModalChangeTitle: "Change Password",
    passwordModalCreateTitle: "Create Password",
    passwordModalChangeLead:
      "Enter your current password and choose a new password that meets all requirements.",
    passwordModalCreateLead: (email) =>
      `Enter the 6-digit verification code sent to ${email} and set your initial password.`,
    sendSetOtpLoading: "Sending verification code to your email...",
    submitChangePassword: "Save New Password",
    submitCreatePassword: "Create Password",
    passwordUpdatedBanner: "Password updated. Other active sessions were signed out.",
    passwordCreatedBanner: "Password created. You can now sign in with Google or email and password.",
  },
};

export const authUiId: AuthUiMessages = {
  common: {
    emailLabel: "Alamat Email",
    emailPlaceholder: "nama@example.com",
    nameLabel: "Nama Tampilan",
    namePlaceholder: "Nama Anda",
    passwordLabel: "Password",
    confirmPasswordLabel: "Konfirmasi Password",
    currentPasswordLabel: "Password Lama",
    newPasswordLabel: "Password Baru",
    showPassword: "Tampilkan password",
    hidePassword: "Sembunyikan password",
    otpLabel: "Kode Verifikasi 6 Digit",
    otpPlaceholder: "000000",
    orDivider: "ATAU",
    backAction: "Kembali",
    closeAction: "Tutup",
    saving: "Menyimpan...",
  },
  passwordPolicy: {
    title: "Syarat Keamanan Password",
    hint: "Gunakan frasa unik yang mudah diingat",
    strengthLabel: "Kekuatan",
    strengthWeak: "LEMAH",
    strengthFair: "CUKUP",
    strengthStrong: "KUAT",
    statusPass: "MEMENUHI",
    statusNeeded: "PERLU",
    rules: {
      minLength: "Minimal 8 hingga 128 karakter",
      upper: "Memuat huruf besar (A-Z)",
      lower: "Memuat huruf kecil (a-z)",
      digit: "Memuat angka (0-9)",
      symbol: "Memuat simbol (!@#$%)",
      noPersonal: "Tidak memuat email atau nama Anda",
      notCommon: "Bukan password umum yang mudah ditebak",
    },
    mismatchError: "Konfirmasi password tidak cocok.",
    policyError: "Password belum memenuhi seluruh syarat keamanan.",
  },
  otp: {
    titleRegister: "Verifikasi Email Anda",
    titleVerifyLogin: "Verifikasi Email Diperlukan",
    description: (email) => `Masukkan kode OTP 6 digit yang dikirim ke ${email}.`,
    validityNote: "Kode berlaku 10 menit dan hanya dapat digunakan satu kali.",
    verifyButton: "Verifikasi dan Masuk",
    verifying: "Memverifikasi...",
    resendButton: "Kirim ulang kode",
    resendCountdown: (seconds) => `Kirim ulang kode (${seconds} dtk)`,
    resentBanner: "Kode OTP baru telah dikirim ke email Anda.",
    invalidCodeError: "Kode salah atau sudah kedaluwarsa",
  },
  loginPage: {
    badge: "AKSES AKUN",
    title: "Masuk ke KAIROS",
    description:
      "Masuk dengan email dan password atau Google untuk mengakses seluruh emiten pada Pemantau Risiko.",
    emailPlaceholder: "nama@example.com",
    submitButton: "Masuk",
    submitting: "Sedang masuk...",
    forgotLink: "Lupa password?",
    registerPrompt: "Belum punya akun?",
    registerLink: "Daftar sekarang",
    goToForgotFromGoogleOnly: "Buat password lewat Lupa Password",
    resetSuccessBanner:
      "Password berhasil diperbarui dan semua sesi sebelumnya telah direset. Silakan masuk dengan password baru.",
    invalidCredentials: "Email atau password salah",
    googleOnlyMessage:
      "Akun ini terhubung dengan Google. Silakan masuk dengan Google, atau buat password lewat 'Lupa Password'.",
    unverifiedBanner:
      "Akun Anda belum terverifikasi. Kami telah mengirim kode OTP baru ke email Anda.",
  },
  registerPage: {
    badge: "PENDAFTARAN AKUN",
    title: "Daftar Akun KAIROS",
    description:
      "Isi nama, email, dan password yang memenuhi kebijakan keamanan. Kami akan mengirim kode OTP 6 digit ke inbox Anda.",
    submitButton: "Daftar dan Kirim Kode",
    submitting: "Mendaftarkan akun...",
    loginPrompt: "Sudah punya akun?",
    loginLink: "Masuk",
    goToLoginButton: "Ke Halaman Masuk",
    duplicateEmail: "Email ini sudah terdaftar",
    duplicateGoogleEmail: "Email ini sudah terdaftar",
    invalidNameError: "Nama harus 2 hingga 50 karakter dan tidak boleh memuat karakter kontrol atau tag HTML.",
  },
  forgotPage: {
    badge: "PEMULIHAN AKUN",
    title: "Lupa dan Reset Password",
    step1Desc: "Masukkan alamat email Anda untuk menerima kode OTP reset password.",
    sendCodeButton: "Kirim Kode Reset",
    sendingCode: "Mengirim kode...",
    uniformSentBanner: "Jika email terdaftar, kami telah mengirim kode.",
    step2Desc: (email) => `Masukkan kode 6 digit yang dikirim ke ${email}, lalu buat password baru Anda.`,
    submitResetButton: "Simpan Password Baru",
    resetting: "Menyimpan password...",
    backToLogin: "Kembali ke Halaman Masuk",
    backToEmailStep: "Ganti email",
  },
  profilePage: {
    badge: "PROFIL PENGGUNA",
    title: "Profil dan Keamanan Akun",
    subtitle: "Kelola nama tampilan, pilihan avatar, dan kredensial login akun KAIROS Anda.",
    overviewTitle: "RINGKASAN AKUN",
    overviewMeta: "IDENTITAS TETAP",
    emailReadOnlyNote: "TIDAK DAPAT DIUBAH",
    googleLabel: "Login Via Google",
    googleConnected: "ACTIVATED",
    googleNotConnected: "NOT ACTIVATED",
    googleActivateButton: "Aktifkan",
    googleCancelButton: "Batal",
    googleLinkHint: "Pilih akun Google dengan email",
    googleLinkedBanner: "Login via Google berhasil diaktifkan.",
    googleMismatchError: "Email akun Google harus sama dengan email akun ini.",
    passwordLabel: "Status Password",
    passwordConfigured: "SUDAH DIATUR",
    passwordNotSet: "BELUM DIATUR",
    roleLabel: "Role Akun",
    verifiedLabel: "Status Email",
    verifiedValue: "TERVERIFIKASI",
    unverifiedValue: "BELUM TERVERIFIKASI",
    nameWidgetTitle: "GANTI NAMA",
    nameWidgetMeta: "2 HINGGA 50 KARAKTER",
    nameRulesHint: "Spasi di ujung dipangkas dan spasi ganda dirapikan. Karakter kontrol dan tag HTML ditolak.",
    nameSaveButton: "Simpan Nama",
    nameSavedBanner: "Nama profil berhasil diperbarui.",
    nameInvalidError: "Nama harus 2 hingga 50 karakter dan tidak boleh memuat karakter kontrol atau tag HTML.",
    avatarWidgetTitle: "GANTI AVATAR",
    avatarWidgetMeta: "9 PILIHAN",
    avatarTriggerAriaLabel: "Ubah avatar profil",
    avatarSelectedPill: "DIPILIH",
    avatarSaveButton: "Simpan Avatar",
    avatarSavedBanner: "Avatar berhasil diperbarui.",
    securityWidgetTitle: "PENGATURAN PASSWORD",
    securityWidgetMeta: "MANAJEMEN SESI",
    changePasswordDesc:
      "Mengubah password akan mengeluarkan sesi di perangkat lain secara otomatis, sedangkan sesi saat ini tetap aktif.",
    createPasswordDesc:
      "Akun Anda saat ini masuk melalui Google dan belum memiliki password. Buat password agar Anda juga dapat masuk dengan email dan password.",
    changePasswordButton: "Ganti Password",
    createPasswordButton: "Buat Password",
    passwordModalChangeTitle: "Ganti Password",
    passwordModalCreateTitle: "Buat Password",
    passwordModalChangeLead:
      "Masukkan password lama Anda, lalu tentukan password baru yang memenuhi kebijakan keamanan.",
    passwordModalCreateLead: (email) =>
      `Masukkan kode OTP 6 digit yang dikirim ke ${email}, lalu atur password baru untuk akun Anda.`,
    sendSetOtpLoading: "Mengirim kode OTP ke email Anda...",
    submitChangePassword: "Simpan Password Baru",
    submitCreatePassword: "Buat Password",
    passwordUpdatedBanner: "Password berhasil diubah. Sesi pada perangkat lain telah dikeluarkan.",
    passwordCreatedBanner: "Password berhasil dibuat. Anda kini dapat masuk melalui Google maupun email dan password.",
  },
};
