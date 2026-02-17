---
name: gwirian-cli
description: Runs and composes commands for the Gwirian CLI (gwirian) to interact with the Gwirian API from the terminal—list/show/create/update/delete projects, features, scenarios, and scenario executions; configure auth and base URL. Use when the user wants to call the Gwirian API via CLI, list or manage projects/features/scenarios from the terminal, set or check gwirian auth/config, or automate Gwirian operations with shell commands.
---

# Use the Gwirian CLI

Run the **gwirian** CLI to talk to the Gwirian API from the terminal. Use this skill when the user wants to query or change Gwirian data via the command line, configure authentication, or script API operations.

## When to use

- User asks to list projects, features, scenarios, or scenario executions from the terminal
- User wants to create/update/delete a feature, scenario, or scenario execution via CLI
- User wants to set or check the API token or base URL for the CLI
- User says "with the gwirian CLI", "via gwirian", "gwirian command", or similar
- You need to automate Gwirian API calls in a script and the CLI is available

## How to run

- **If `gwirian` is on PATH** (after `npm link` or `npm install -g .` from gwirian-cli): run `gwirian <command> ...` in the terminal.
- **Otherwise** from the gwirian-cli project root: `node dist/cli.js <command> ...` (after `npm run build`) or `npm run dev -- -- <args>` for dev (e.g. `npm run dev -- projects list`).
- **Non-interactive** (no TUI): always pass a subcommand (e.g. `projects list`). Without a subcommand and without a TTY, the CLI prints help.

## Auth and config

- Token and base URL are stored in `~/.config/gwirian-cli/config.json` (or `$XDG_CONFIG_HOME/gwirian-cli/config.json`). Do not log or echo the token.
- First-time or missing token: user can run `gwirian auth` (prompt) or launch `gwirian` for the TUI setup.
- Commands that call the API require a configured token; otherwise the CLI prints "No token configured. Run \"gwirian auth\" to set your API token."

| Command | Description |
|--------|-------------|
| `gwirian auth` | Prompt for token and save it; use `-t` or `--test` to validate with GET projects |
| `gwirian logout` | Clear stored token |
| `gwirian config get` | Print base URL and whether a token is set |
| `gwirian config set base-url <url>` | Set API base URL (default https://www.gwirian.com) |

## Projects

| Command | Description |
|--------|-------------|
| `gwirian projects list` | List projects |
| `gwirian projects show <project-id>` | Show one project |

## Features

| Command | Description |
|--------|-------------|
| `gwirian features list <project-id>` | List features |
| `gwirian features show <project-id> <feature-id>` | Show one feature |
| `gwirian features create <project-id> [--title] [--description] [--tag-list]` | Create feature |
| `gwirian features update <project-id> <feature-id> [--title] [--description] [--tag-list]` | Update feature |
| `gwirian features delete <project-id> <feature-id>` | Delete feature |

## Scenarios

| Command | Description |
|--------|-------------|
| `gwirian scenarios list <project-id> <feature-id>` | List scenarios |
| `gwirian scenarios show <project-id> <feature-id> <scenario-id>` | Show one scenario |
| `gwirian scenarios create <project-id> <feature-id> [--title] [--given] [--when] [--then] [--position]` | Create scenario |
| `gwirian scenarios update <project-id> <feature-id> <scenario-id> [...]` | Update scenario |
| `gwirian scenarios delete <project-id> <feature-id> <scenario-id>` | Delete scenario |

## Scenario executions

| Command | Description |
|--------|-------------|
| `gwirian scenario-executions list <project-id> <feature-id> <scenario-id>` | List executions |
| `gwirian scenario-executions show <project-id> <feature-id> <scenario-id> <execution-id>` | Show one execution |
| `gwirian scenario-executions create <project-id> <feature-id> <scenario-id> [--status] [--notes] [--executed-at]` | Create execution |
| `gwirian scenario-executions update/delete ...` | Update or delete execution (same IDs as show) |

## Global options

- `--base-url <url>`: override base URL for that run (does not change saved config).
- `--json`: print raw JSON instead of a formatted table for list/show.

Example: `gwirian --json projects list`, `gwirian --base-url https://staging.example.com features list 1`.

## Executing from the agent

- Prefer running the CLI in the terminal (e.g. `gwirian projects list`) and parsing the output. Use `--json` when you need structured data.
- If the workspace includes **gwirian-cli**, run from its root or ensure `gwirian` is on PATH; if not, use `node dist/cli.js` after build.
- Do not prompt for the token in chat; point the user to `gwirian auth` or the TUI (`gwirian` with no args in a TTY).

## Reference

- Full command list and usage: see **gwirian-cli** project `README.md`.
- Implementation and file layout: see **gwirian-cli** project `AGENTS.md`.
