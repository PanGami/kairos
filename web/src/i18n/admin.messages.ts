export type AdminUserFilter = "all" | "admin" | "user" | "active" | "suspended";

export interface AdminUsersMessages {
  pageMeta: string;
  pageTitle: string;
  pageSubtitle: string;
  refreshWidgetMeta: string;
  refreshWidgetTitle: string;
  refreshWidgetDesc: string;
  refreshButton: string;
  refreshingButton: string;
  refreshSuccess: (count: number) => string;
  refreshTableTicker: string;
  refreshTableStatus: string;
  refreshTableDetail: string;
  directoryWidgetMeta: string;
  directoryWidgetTitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  clearSearch: string;
  filterAll: string;
  filterAdmin: string;
  filterUser: string;
  filterActive: string;
  filterSuspended: string;
  statTotalUsers: string;
  statAdmins: string;
  statSuspended: string;
  colIdentity: string;
  colRole: string;
  colStatus: string;
  colAuth: string;
  colSessions: string;
  colLastLogin: string;
  colActions: string;
  roleAdmin: string;
  roleUser: string;
  statusActive: string;
  statusSuspended: string;
  authGoogle: string;
  authPassword: string;
  authGoogleAndPassword: string;
  currentSessionTag: string;
  neverLoggedIn: string;
  actionForceLogout: string;
  actionSuspend: string;
  actionActivate: string;
  actionDelete: string;
  loadingUsers: string;
  emptyUsers: string;
  revokeSuccess: (email: string, count: number) => string;
  suspendSuccess: (email: string) => string;
  activateSuccess: (email: string) => string;
  deleteSuccess: (email: string) => string;
  deleteModalMeta: string;
  deleteModalTitle: string;
  deleteModalWarning: (name: string, email: string) => string;
  deleteModalCancel: string;
  deleteModalConfirm: string;
  deleteModalDeleting: string;
  paginationSummary: (start: number, end: number, total: number) => string;
  rowsPerPageLabel: string;
  prevPage: string;
  nextPage: string;
  pageAriaLabel: (page: number) => string;
}

export const adminUsersEn: AdminUsersMessages = {
  pageMeta: "ADMINISTRATION RBAC",
  pageTitle: "User Management and Watcher Control",
  pageSubtitle:
    "Manage registered accounts, active sessions, and trigger synchronous end-of-day risk data updates.",
  refreshWidgetMeta: "WATCHER ENGINE",
  refreshWidgetTitle: "Manual Watcher Refresh",
  refreshWidgetDesc:
    "Runs synchronous end-of-day price ingestion and risk model recomputation for all active instruments.",
  refreshButton: "Refresh Data Watcher",
  refreshingButton: "Refreshing Watcher...",
  refreshSuccess: (count) => `Watcher refresh completed across ${count} instruments.`,
  refreshTableTicker: "Instrument",
  refreshTableStatus: "Status",
  refreshTableDetail: "Summary",
  directoryWidgetMeta: "RBAC DIRECTORY",
  directoryWidgetTitle: "Registered Accounts",
  searchLabel: "Search users",
  searchPlaceholder: "Search by name or email...",
  clearSearch: "Clear",
  filterAll: "All",
  filterAdmin: "Admin",
  filterUser: "User",
  filterActive: "Active",
  filterSuspended: "Suspended",
  statTotalUsers: "TOTAL USERS",
  statAdmins: "ADMINS",
  statSuspended: "SUSPENDED",
  colIdentity: "Account",
  colRole: "Role",
  colStatus: "Status",
  colAuth: "Sign-In Method",
  colSessions: "Sessions",
  colLastLogin: "Last Login",
  colActions: "Actions",
  roleAdmin: "ADMIN",
  roleUser: "USER",
  statusActive: "ACTIVE",
  statusSuspended: "SUSPENDED",
  authGoogle: "GOOGLE",
  authPassword: "PASSWORD",
  authGoogleAndPassword: "GOOGLE + PASSWORD",
  currentSessionTag: "YOU",
  neverLoggedIn: "Never",
  actionForceLogout: "Force Logout",
  actionSuspend: "Suspend",
  actionActivate: "Activate",
  actionDelete: "Delete",
  loadingUsers: "Loading user directory...",
  emptyUsers: "No users match the current search or filter.",
  revokeSuccess: (email, count) => `Signed out ${count} active sessions for ${email}.`,
  suspendSuccess: (email) => `Suspended ${email} and revoked all active sessions.`,
  activateSuccess: (email) => `Reactivated account access for ${email}.`,
  deleteSuccess: (email) => `Permanently deleted user account ${email}.`,
  deleteModalMeta: "CONFIRM DELETION",
  deleteModalTitle: "Delete User Account",
  deleteModalWarning: (name, email) =>
    `Permanently delete ${name} (${email})? All active sessions and OTP history for this account will be removed immediately and cannot be undone.`,
  deleteModalCancel: "Cancel",
  deleteModalConfirm: "Delete Permanently",
  deleteModalDeleting: "Deleting...",
  paginationSummary: (start, end, total) => `Showing ${start} to ${end} of ${total}`,
  rowsPerPageLabel: "Rows",
  prevPage: "Previous",
  nextPage: "Next",
  pageAriaLabel: (page) => `Page ${page}`,
};

export const adminUsersId: AdminUsersMessages = {
  pageMeta: "ADMINISTRASI RBAC",
  pageTitle: "Manajemen Pengguna dan Kontrol Watcher",
  pageSubtitle:
    "Kelola akun terdaftar, sesi aktif, serta jalankan pembaruan data risiko akhir hari secara langsung.",
  refreshWidgetMeta: "MESIN WATCHER",
  refreshWidgetTitle: "Pembaruan Manual Watcher",
  refreshWidgetDesc:
    "Menjalankan ingestion harga akhir hari dan perhitungan ulang model risiko secara sinkron untuk semua emiten aktif.",
  refreshButton: "Perbarui Data Watcher",
  refreshingButton: "Memperbarui Watcher...",
  refreshSuccess: (count) => `Pembaruan Watcher selesai untuk ${count} instrumen.`,
  refreshTableTicker: "Instrumen",
  refreshTableStatus: "Status",
  refreshTableDetail: "Ringkasan",
  directoryWidgetMeta: "DIREKTORI RBAC",
  directoryWidgetTitle: "Daftar Akun Terdaftar",
  searchLabel: "Cari pengguna",
  searchPlaceholder: "Cari nama atau email...",
  clearSearch: "Reset",
  filterAll: "Semua",
  filterAdmin: "Admin",
  filterUser: "User",
  filterActive: "Aktif",
  filterSuspended: "Nonaktif",
  statTotalUsers: "TOTAL AKUN",
  statAdmins: "ADMIN",
  statSuspended: "NONAKTIF",
  colIdentity: "Akun",
  colRole: "Role",
  colStatus: "Status",
  colAuth: "Metode Masuk",
  colSessions: "Sesi",
  colLastLogin: "Login Terakhir",
  colActions: "Aksi",
  roleAdmin: "ADMIN",
  roleUser: "USER",
  statusActive: "AKTIF",
  statusSuspended: "NONAKTIF",
  authGoogle: "GOOGLE",
  authPassword: "PASSWORD",
  authGoogleAndPassword: "GOOGLE + PASSWORD",
  currentSessionTag: "ANDA",
  neverLoggedIn: "Belum pernah",
  actionForceLogout: "Paksa Keluar",
  actionSuspend: "Nonaktifkan",
  actionActivate: "Aktifkan",
  actionDelete: "Hapus",
  loadingUsers: "Memuat daftar pengguna...",
  emptyUsers: "Tidak ada pengguna yang sesuai dengan pencarian atau filter saat ini.",
  revokeSuccess: (email, count) => `Menghapus ${count} sesi aktif untuk ${email}.`,
  suspendSuccess: (email) => `Akun ${email} dinonaktifkan dan seluruh sesinya telah dihapus.`,
  activateSuccess: (email) => `Akses akun ${email} telah diaktifkan kembali.`,
  deleteSuccess: (email) => `Akun pengguna ${email} telah dihapus permanen.`,
  deleteModalMeta: "KONFIRMASI PENGHAPUSAN",
  deleteModalTitle: "Hapus Akun Pengguna",
  deleteModalWarning: (name, email) =>
    `Hapus permanen akun ${name} (${email})? Seluruh sesi aktif dan riwayat OTP akun ini akan langsung dihapus dan tidak dapat dikembalikan.`,
  deleteModalCancel: "Batal",
  deleteModalConfirm: "Hapus Permanen",
  deleteModalDeleting: "Menghapus...",
  paginationSummary: (start, end, total) => `Menampilkan ${start} sampai ${end} dari ${total}`,
  rowsPerPageLabel: "Baris",
  prevPage: "Sebelumnya",
  nextPage: "Berikutnya",
  pageAriaLabel: (page) => `Halaman ${page}`,
};
