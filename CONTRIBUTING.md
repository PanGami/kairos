# Contributing

Solo project + AI agents. Rules in `AGENTS.md` are binding.

## Workflow
1. Update contracts first (`api/proto`, `api/openapi`) when needed, then implement.
2. Short-lived branches off `main`; PRs; green CI is mandatory.
3. Conventional Commits scoped per service: `feat(gateway): ...`, `fix(ml-service): ...`, `docs: ...`.

## Local Development
```bash
cp .env.example .env
docker compose up --build
curl http://localhost:8080/healthz
curl http://localhost:8080/v1/instruments
```

## Don'ts
- Do not import across service folders.
- Do not commit `.env`, `data/`, model artifacts, or generated proto stubs.
- Do not add REST to ml-service (ADR-010) or make "real-time"/"enterprise" claims.
