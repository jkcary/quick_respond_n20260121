# AGENTS.md

Project: English AI Agent (EAA) — cross‑platform English vocabulary diagnostic tool (Vite + React + TypeScript).

## Quick Start
- Install deps: `npm install`
- Env: copy `.env.example` to `.env` and set `VITE_*` keys
- Dev server: `npm run dev` (Vite at http://localhost:5173)
- Electron dev: `npm run electron:dev`

## Build / Tests
- Primary validation: `npm run build` (runs `tsc` then `vite build`)
- There are no unit test scripts in `package.json`; treat a clean build as the test gate.

## Repo Map
- `src/components/`: React UI by feature (test/config/review/common)
- `src/core/`: framework‑agnostic business logic (LLM, speech, vocabulary, storage)
- `src/store/`: Zustand stores (app/test/error)
- `src/data/`: vocabulary JSONs + schemas
- `electron/`: Electron main process

## Code Standards (enforced by project memory)
- TypeScript strict mode; explicit return types; avoid `any`
- Core modules must stay framework‑agnostic (no React/DOM)
- Function components only; props interfaces required
- Keep business logic in `src/core/`, UI in `src/components/`, state in `src/store/`

## Notes
- LLM providers use a JSON‑only response contract in prompts; preserve that format.
- For config, prefer `VITE_*` env variables; never commit real API keys.
