# Gwirian CLI – Guide for agents

This file describes the **gwirian-cli** project for assistants and agents that modify the codebase.

## Project role

Node.js CLI that talks to the Gwirian REST API (`/api/v1/`). It provides:

- A **TUI** (Ink + React + @inkjs/ui) to configure token/base URL and browse projects → features → scenarios.
- **Commands** (Commander) for auth, config, and full CRUD on projects, features, scenarios, and scenario_executions.

## Stack

- **Runtime**: Node.js >= 18, ESM (`"type": "module"`).
- **Language**: TypeScript, compiled to `dist/` with `tsc`.
- **CLI**: Commander (subcommands, global options `--base-url`, `--json`).
- **TUI**: Ink, React, @inkjs/ui (TextInput, PasswordInput, Select, Spinner).

## File structure

| File | Role |
|------|------|
| `src/cli.ts` | Entry point: parses args, runs TUI (when no args + TTY) or Commander. Defines all commands and actions. |
| `src/config.ts` | Persistent config: `getConfig()`, `setToken()`, `setBaseUrl()`, `clearToken()`, `hasToken()`. XDG file `…/gwirian-cli/config.json`. |
| `src/api.ts` | API client: `createApiClient(baseUrl, token)` with all methods (getProjects, getFeatures, createScenario, etc.). Custom errors: `TokenInvalidOrExpiredError`, `ApiError`. |
| `src/format.ts` | Output: `formatJson()`, `formatList()`, `formatRichTable()`, `formatError()` for terminal tables, JSON, and styled errors. |
| `src/runTui.ts` | TUI launcher: reads config, shows Setup (no token) or Main (projects/features/scenarios list). |
| `src/tui/Setup.tsx` | Setup screen: PasswordInput (token) then TextInput (base URL), save + test GET projects, exit or error message. |
| `src/tui/Main.tsx` | Main TUI: load projects → Select → features → Select → scenarios (show given/when/then). |

Exposed binary: `dist/cli.js` (after `npm run build`). Dev script: `npm run dev` (tsx on `src/cli.ts`).

## Conventions

- **Imports**: Use `.js` extensions for local modules (ESM output to `dist/*.js`).
- **Config**: Never log or display the token. Config file mode `0o600`, parent directory `0o700`.
- **API**: POST/PATCH bodies in the format expected by Rails (e.g. `{ feature: { title, description } }`). See `src/api.ts`.
- **TUI**: Only used when `args.length === 0` and `process.stdin.isTTY`; otherwise help is shown.

## Where to change what

- **New command or subcommand**: `src/cli.ts` (program / .command / .addCommand / .action). Use `requireToken()` and `createApiClient()` for commands that call the API.
- **New API endpoint or field**: `src/api.ts` (methods and types). Update types and wrappers (feature, scenario, scenario_execution) if the backend changes.
- **Config behaviour**: `src/config.ts` (paths, JSON fields, permissions).
- **TUI screens**: `src/tui/Setup.tsx`, `src/tui/Main.tsx`. New screens: add them in `runTui.ts` or from `Main.tsx` (state-based navigation).
- **Output format (lists, JSON, errors)**: `src/format.ts` and calls to `output()` in Commander actions.

## Tests and build

- `npm run build`: Compile TypeScript → `dist/`.
- `npm start`: `node dist/cli.js`.
- No test suite yet; commands can be tested manually (e.g. `gwirian config get`, `gwirian --help`).

## Gwirian API (reminder)

- Base: `GET/POST /api/v1/projects`, `GET /api/v1/projects/:id`, then features and scenarios under `projects/:id/features`, `.../scenarios`, `.../scenario_executions`.
- Auth: `Authorization: Bearer <token>` header (WorkspaceMember token). 401 → token invalid or expired.
