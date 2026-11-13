# Security Policy

## Pelaporan
Laporkan kerentanan lewat GitHub Security Advisory (private) pada repo ini. Mohon tidak membuka
issue publik untuk kerentanan.

## Praktik di repo ini
- Secret scanning + push protection aktif; gitleaks pre-commit & CI.
- `.env`, `data/`, dan artefak model tidak pernah di-commit (lihat `.gitignore`).
- Dependabot & CodeQL aktif; Trivy memindai image.
- Branch protection pada `main` (PR + CI hijau wajib).
- Actions pihak ketiga dipin ke SHA; permission minimal; tanpa `pull_request_target`.
- Tanpa IP/subscription ID/nama resource Azure di repo.

## Catatan produk
KAIROS adalah proyek edukasi/portofolio, bukan nasihat investasi. Dashboard publik baca-saja;
hanya endpoint admin yang memakai API key. Rate limit per IP + cache; mitigasi DDoS terdistribusi
(CDN/WAF) adalah roadmap V2.
