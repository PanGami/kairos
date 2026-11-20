# Security Policy

## Reporting a Vulnerability
Please report vulnerabilities privately via GitHub Security Advisories on this repository. Do not open public issues for security vulnerabilities.

## Practices in This Repository
- Secret scanning + push protection enabled; gitleaks in pre-commit & CI.
- `.env`, `data/`, and model artifacts are never committed (see `.gitignore`).
- Dependabot & CodeQL enabled; Trivy scans container images.
- Branch protection on `main` (PR + green CI required).
- Third-party Actions pinned to commit SHAs; minimal permissions; no `pull_request_target`.
- No Azure IPs, subscription IDs, or resource names in the repository.

## Product Note
KAIROS is an educational/portfolio project, not investment advice. The public dashboard is read-only; only the admin endpoint uses an API key. Per-IP rate limiting + caching are enforced; distributed DDoS mitigation (CDN/WAF) is on the V2 roadmap.
