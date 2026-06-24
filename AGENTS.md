# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Vite React frontend and an Express backend.

- `src/`: frontend source. `App.tsx` owns shell state and routing, `pages/` contains views, `api.ts` wraps API calls, `i18n.ts` stores Korean/English copy, and `styles.css` contains global styling.
- `server/`: backend API. `index.ts` handles article fetching, extraction, summarization, static `dist` serving, and environment loading.
- `dist/`: generated frontend build output. Do not edit by hand.
- `server/.env`: local secrets such as `ANTHROPIC_API_KEY`; keep this uncommitted.
- Product notes live in Markdown files such as `requirements.md`, `screen-design.md`, and `tech-stack-decision.md`.

## Build, Test, and Development Commands

Run frontend commands from the repository root:

- `npm install`: install frontend dependencies.
- `npm run dev`: start Vite at `http://localhost:5173`.
- `npm run build`: run TypeScript project build and produce `dist/`.
- `npm run preview`: preview the built frontend.

Run backend commands from `server/`:

- `npm install`: install backend dependencies.
- `npm run dev`: start Express with `nodemon`/`tsx` at `http://localhost:3001`.
- `npm run start`: start the backend without file watching.

In development, Vite proxies `/api/*` to the backend. In production, run `npm run build` first, then start the server so Express can serve `dist`.

## Coding Style & Naming Conventions

Use TypeScript for application code. Follow the existing React functional component style, with PascalCase component files under `src/pages/` and camelCase functions, variables, and handlers. Keep UI copy in `src/i18n.ts` instead of hardcoding visible strings. Prefer Mantine components and CSS tokens in `src/styles.css`.

## Testing Guidelines

There is currently no committed automated test suite. Before handing off changes, run `npm run build` from the root to catch TypeScript and Vite errors. For backend behavior, manually verify key API flows, especially article URL analysis and fallback summarization. If adding tests, use colocated `*.test.ts` or `*.test.tsx` files and document the command in `package.json`.

## Commit & Pull Request Guidelines

This directory has no Git history, so use clear Conventional Commit-style messages, for example `feat: add reader volume control` or `fix: improve article extraction fallback`. Pull requests should include a summary, testing notes, linked issue or requirement when available, and screenshots for UI changes.

## Security & Configuration Tips

Never commit `.env` files or API keys. Keep Anthropic settings in `server/.env`, for example `ANTHROPIC_API_KEY=...` and optionally `ANTHROPIC_MODEL=...`. Avoid logging tokens, request headers, or full third-party API responses.
