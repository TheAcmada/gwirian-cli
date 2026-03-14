---
name: gwirian-cli
description: >-
  Runs gwirian CLI commands to manage projects, features, scenarios,
  and scenario executions via the Gwirian API. Use when the user wants
  to list projects, create or update features/scenarios, execute
  scenarios (e.g. with Playwright), record test results, search project
  data, or configure gwirian auth/base-url from the terminal.
---

# Gwirian CLI skill

## Rules

1. **Project context before executing scenarios.** Before running any scenario (e.g. with Playwright), run `gwirian projects show <project-id> --json`, read the **`context`** attribute (environments, URLs, accounts, logins), and use it to run the tests. Do not execute scenarios without having fetched and applied project context. If context is missing, ask the user for environment URL and test account details or note that context was missing.
2. **Use `--json` when parsing output** (e.g. to get IDs or `context`).
3. **Never prompt for the token in chat.** Point the user to `gwirian auth` or to launching `gwirian` with no args in a TTY for the setup TUI.

## How to run the CLI

- Prefer `gwirian` on PATH (after `npm link` or `npm install -g .`). Otherwise from gwirian-cli root: `node dist/cli.js <command> ...` or `npm run dev -- -- <args>`.
- Non-interactive: always pass a subcommand (e.g. `projects list`). Without a subcommand and without a TTY, the CLI prints help.
- Install this skill: `gwirian install --skills` (options: `--target cursor|claude|both`, `--global`). See [reference.md](reference.md).

## Workflows

### 1. First-time setup

1. Run `gwirian auth` (or `gwirian auth -t` to set token and test with GET projects).
2. Optionally set base URL: `gwirian config set base-url <url>`.
3. Verify: `gwirian config get`; list projects: `gwirian projects list`.

```bash
gwirian auth -t
gwirian config get
gwirian projects list
```

### 2. Explore a project

Use this to resolve IDs and to get project context before executing scenarios.

1. List projects (use `--json` to parse): `gwirian --json projects list`.
2. Show one project (includes `context`): `gwirian --json projects show <project-id>`.
3. List features: `gwirian features list <project-id>` (or `--json` to parse).
4. List scenarios: `gwirian scenarios list <project-id> <feature-id>`.
5. Search within a project: `gwirian projects search <project-id> <query>` (optional `--limit <n>`).

```bash
# Resolve project and feature IDs, then list scenarios
gwirian --json projects list
gwirian --json projects show 1
gwirian --json features list 1
gwirian scenarios list 1 2
gwirian projects search 1 "login" --limit 10
```

### 3. Create a feature with scenarios

1. Create the feature: `gwirian features create <project-id> --title "..." [--description "..."] [--tag-list "tags"]`.
2. If you need the new feature ID in a script, use `--json` on create (or list features and parse).
3. Create each scenario: `gwirian scenarios create <project-id> <feature-id> --title "..." --given "..." --when "..." --then "..." [--position <n>]`.

```bash
# Create feature then add scenarios (feature-id 2 used from prior list)
gwirian features create 1 --title "Login" --description "User can sign in" --tag-list "auth, login"
gwirian scenarios create 1 2 --title "Successful login" \
  --given "user has an account" --when "user submits valid credentials" \
  --then "user is redirected to dashboard"
gwirian scenarios create 1 2 --title "Invalid password" \
  --given "user has an account" --when "user submits wrong password" \
  --then "user sees error message"
```

### 4. Execute scenarios and record results

When the user wants to execute one or more scenarios (e.g. with Playwright):

1. **Fetch and use project context.** Run `gwirian projects show <project-id> --json` and read `context` (environments/URLs, accounts). Use it for navigation and logins. Do not run tests without it.
2. Resolve features and scenarios with the CLI (`features list`, `scenarios list`). Use context to choose environment and accounts.
3. Run the actual tests with the other tool (Playwright etc.): use URLs and accounts from context; perform steps from each scenario's title/given/when/then.
4. Record each execution: `gwirian scenario-executions create <project-id> <feature-id> <scenario-id> --status passed|failed|pending [--notes "..."] [--tag-list "e2e, v1.2.3"]`. Use `--notes` when status is **failed** to capture the failure reason. Omit `--executed-at` to use current time.

Tags: use `--tag-list` for test type (e2e, smoke), version, or other labels.

```bash
# 1) Get context (required)
gwirian --json projects show 1

# 2) After running Playwright (or similar), record results
gwirian scenario-executions create 1 2 3 --status passed --notes "Playwright E2E" --tag-list "e2e, smoke"
gwirian scenario-executions create 1 2 4 --status failed --notes "AssertionError: expected 'Dashboard' in title" --tag-list "e2e"
```

### 5. Search and update existing data

1. Search: `gwirian projects search <project-id> <query>` to find features/scenarios by text.
2. Show the target resource to confirm IDs: `gwirian features show ...` or `gwirian scenarios show ...`.
3. Update: `gwirian features update ...` or `gwirian scenarios update ...` or `gwirian scenario-executions update ...` with the desired options. Delete with the corresponding `delete` command.

```bash
# Find then rename a scenario
gwirian projects search 1 "login"
gwirian scenarios show 1 2 3
gwirian scenarios update 1 2 3 --title "Successful login with email"

# Add tags to an execution
gwirian scenario-executions update 1 2 3 5 --tag-list "e2e, v1.2.3, smoke"
```

## Reference

Full command and option reference: [reference.md](reference.md) in this skill folder.
