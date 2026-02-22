# Gwirian CLI – Guide for agents

This file describes the **gwirian-cli** project for assistants and agents that modify the codebase.

## Project role

Node.js CLI that talks to the Gwirian REST API (`/api/v1/`). It provides:

- A **TUI** (Ink + React + @inkjs/ui) to configure token/base URL and browse projects → features → scenarios.
- **Commands** (Commander) for auth, config, skill install, and CRUD:
  - **Projects**: list, show, search (no create/update/delete).
  - **Features, scenarios, scenario_executions**: full CRUD.

## Stack

- **Runtime**: Node.js >= 18, ESM (`"type": "module"`).
- **Language**: TypeScript, compiled to `dist/` with `tsc` (see `tsconfig.json`: `rootDir` `src`, `outDir` `dist`).
- **CLI**: Commander; global options `--base-url <url>`, `--json` (passed via hook to subcommands).
- **TUI**: Ink, React, @inkjs/ui (PasswordInput, TextInput, Select, Spinner).
- **Output**: chalk, cli-table3 (in `format.ts`).

## File structure

| File | Role |
|------|------|
| `src/cli.ts` | Entry point: parses args; if no args and TTY runs TUI, else Commander. Defines `requireToken()`, `getBaseUrlAndToken()`, `output()`, `handleApiError()`, `printError()`, `ask()`. All commands and their actions. |
| `src/config.ts` | Config dir: `$XDG_CONFIG_HOME/gwirian-cli` or `~/.config/gwirian-cli`; file `config.json`. `getConfig()`, `setToken()`, `setBaseUrl()`, `clearToken()`, `hasToken()`. Default base URL `https://app.gwirian.com`. Writes with mode `0o600`, directory `0o700`. |
| `src/api.ts` | API client: `createApiClient(baseUrl, token)`. Types: `Project`, `SearchResult`, `Feature`, `Scenario`, `ScenarioExecution`, `CreateFeatureBody`, `UpdateFeatureBody`, `CreateScenarioBody`, `UpdateScenarioBody`, `CreateScenarioExecutionBody`, `UpdateScenarioExecutionBody`. Errors: `TokenInvalidOrExpiredError`, `ApiError` (statusCode, body). Methods: getProjects, getProject, searchProject; getFeatures, getFeature, createFeature, updateFeature, deleteFeature; getScenarios, getScenario, createScenario, updateScenario, deleteScenario; getScenarioExecutions, getScenarioExecution, createScenarioExecution, updateScenarioExecution, deleteScenarioExecution. |
| `src/format.ts` | `formatJson()`, `formatList()`, `formatRichTable()` (options: `wordWrap`, `colWidths`), `formatError(message, { title?, statusCode? })`. Uses chalk and cli-table3. |
| `src/runTui.ts` | Reads config; if no token renders `SetupApp`, else renders `MainApp` with `baseUrl` and `token`. |
| `src/tui/Setup.tsx` | Setup: PasswordInput (token) → TextInput (base URL) → save token and base URL, test `getProjects()`, exit on success or show error. |
| `src/tui/Main.tsx` | Main TUI: view `projects` → Select project → `features` → Select feature → `scenarios` (list with title, given, when, then). Uses `createApiClient(baseUrl, token)`. |
| `bin/gwirian.js` | Shebang `#!/usr/bin/env node`; imports `../dist/cli.js`. |

Binary: `bin/gwirian.js` (package.json `bin.gwirian`). After `npm run build`, `dist/cli.js` is the main module. Dev: `npm run dev` (tsx on `src/cli.ts`).

## Skills directory

In `skills/gwirian-cli/` you will find the documents intended for agents. They must be updated when the behavior of the cli changes.

- **`reference.md`** — CLI reference (commands, options, API, project structure).
- **`SKILL.md`** — Task-oriented guide with usage examples and concrete scenarios.

## Commands overview

- **auth** — Set API token (prompted). Option: `-t, --test` to test with GET projects.
- **logout** — Clear stored token.
- **config get** — Show base URL and token status (set / not set).
- **config set base-url &lt;url&gt;** — Set API base URL.
- **install** — Requires `--skills`. Options: `-t, --target &lt;cursor|claude|both&gt;` (default `both`), `-g, --global` (install to `~/.cursor/skills` and/or `~/.claude/skills`). Copies `skills/gwirian-cli/` to target.
- **projects list** — List projects (columns: id, name, description).
- **projects show &lt;project-id&gt;** — Show one project.
- **projects search &lt;project-id&gt; &lt;query&gt;** — Search within a project for features and scenarios. Option: `--limit &lt;n&gt;` (default 20).
- **features list &lt;project-id&gt;** — List features (id, title, description).
- **features show &lt;project-id&gt; &lt;feature-id&gt;** — Show one feature.
- **features create &lt;project-id&gt;** — Options: `--title`, `--description`, `--tag-list`.
- **features update &lt;project-id&gt; &lt;feature-id&gt;** — Options: `--title`, `--description`, `--tag-list`.
- **features delete &lt;project-id&gt; &lt;feature-id&gt;** — Delete feature.
- **scenarios list &lt;project-id&gt; &lt;feature-id&gt;** — List scenarios (id, title, given, when, then; table with wordWrap).
- **scenarios show &lt;project-id&gt; &lt;feature-id&gt; &lt;scenario-id&gt;** — Show one scenario.
- **scenarios create &lt;project-id&gt; &lt;feature-id&gt;** — Options: `--title`, `--given`, `--when`, `--then`, `--position`.
- **scenarios update &lt;project-id&gt; &lt;feature-id&gt; &lt;scenario-id&gt;** — Same options as create.
- **scenarios delete &lt;project-id&gt; &lt;feature-id&gt; &lt;scenario-id&gt;** — Delete scenario.
- **scenario-executions list &lt;project-id&gt; &lt;feature-id&gt; &lt;scenario-id&gt;** — List executions (id, status, notes, executed_at).
- **scenario-executions show &lt;project-id&gt; &lt;feature-id&gt; &lt;scenario-id&gt; &lt;execution-id&gt;** — Show one execution.
- **scenario-executions create &lt;project-id&gt; &lt;feature-id&gt; &lt;scenario-id&gt;** — Options: `--status`, `--notes`, `--executed-at` (ISO; default now), `--tag-list` (comma-separated).
- **scenario-executions update &lt;project-id&gt; &lt;feature-id&gt; &lt;scenario-id&gt; &lt;execution-id&gt;** — Options: `--status`, `--notes`, `--executed-at`, `--tag-list`.
- **scenario-executions delete &lt;project-id&gt; &lt;feature-id&gt; &lt;scenario-id&gt; &lt;execution-id&gt;** — Delete execution.

All list/show/create/update commands respect global `--base-url` and `--json`. When `--json` is set, output is raw JSON; otherwise TTY gets tables (or formatted list), non-TTY gets list-style text.

## Conventions

- **Imports**: Use `.js` extensions for local modules (ESM; output in `dist/*.js`).
- **Config**: Never log or display the token. Config file mode `0o600`, parent directory `0o700`.
- **API**: POST/PATCH bodies in the format expected by Rails: `{ feature: { ... } }`, `{ scenario: { ... } }`, `{ scenario_execution: { ... } }`. See `src/api.ts`.
- **TUI**: Only used when `args.length === 0` and `process.stdin.isTTY`; otherwise `program.outputHelp()` is shown.
- **Errors**: Use `handleApiError(e)` in command actions; 401 → token message, 404/403/422 etc. via `printError()` then `process.exit(1)`.

## Where to change what

- **New command or subcommand**: `src/cli.ts` (program / `.command()` / `.addCommand()` / `.action()`). Use `requireToken()` and `createApiClient()` for commands that call the API; use `output()` for list/object results with `--json` and table columns.
- **New API endpoint or field**: `src/api.ts` (types and `request()` calls). Add or update methods and body types; keep Rails-style request bodies.
- **Config behaviour**: `src/config.ts` (paths, `ConfigData`, permissions).
- **TUI screens**: `src/tui/Setup.tsx`, `src/tui/Main.tsx`. New screens: add in `runTui.ts` or drive from `Main.tsx` via state.
- **Output format**: `src/format.ts`; use `formatJson`, `formatList`, `formatRichTable`, `formatError`. Commander actions call `output(data, useJson, listColumns?, tableOptions?)`.

## Build and run

- `npm run build` — Compile TypeScript to `dist/`.
- `npm start` — `node dist/cli.js`.
- `npm run dev` — Run with tsx: `tsx src/cli.ts`.
- No test suite; commands can be tested manually (e.g. `gwirian config get`, `gwirian --help`).

## Gwirian API (reminder)

- Base: `GET /api/v1/projects`, `GET /api/v1/projects/:id`, `GET /api/v1/projects/:id/search?q=...&limit=...` (optional limit); features at `projects/:id/features`; scenarios at `projects/:id/features/:fid/scenarios`; scenario_executions at `.../scenarios/:sid/scenario_executions`.
- Auth: `Authorization: Bearer <token>` header (WorkspaceMember token). 401 → token invalid or expired.
