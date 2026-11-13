# Contributing

Proyek solo + agen AI. Aturan di `AGENTS.md` mengikat.

## Alur
1. Ubah kontrak dulu (`api/proto`, `api/openapi`) bila perlu, lalu implementasi.
2. Branch pendek dari `main`; PR; CI hijau wajib.
3. Conventional Commits dengan scope per service: `feat(gateway): ...`, `fix(ml-service): ...`, `docs: ...`.

## Lokal
```bash
cp .env.example .env
docker compose up --build
curl http://localhost:8080/healthz
curl http://localhost:8080/v1/instruments
```

## Jangan
- Jangan import lintas folder service.
- Jangan commit `.env`, `data/`, artefak model, atau stub proto hasil generate.
- Jangan tambah REST ke ml-service (ADR-010) atau klaim "real-time"/"enterprise".
