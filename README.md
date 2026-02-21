# Gwirian CLI

[Gwirian](https://www.gwirian.com) is a platform for managing BDD scenarios and feature tests. This CLI lets you use the Gwirian API from the terminal with a modern TUI (projects, features, scenarios, and scenario executions).

## Prerequisites

- Node.js >= 18

## Quick start (install from npm)

Install the CLI globally:

```bash
npm install -g @acmada/gwirian-cli
```

Configure your API token (get it from Gwirian: workspace → API token):

```bash
gwirian auth
```

Optionally test the connection:

```bash
gwirian auth --test
```

Then run the TUI or any command:

```bash
gwirian
# or
gwirian projects list
gwirian --help
```

### Installing skills

Cursor and Claude Code can use the gwirian-cli skill so the agent knows how to run the CLI and manage features/scenarios. Install the skill with:

```bash
gwirian install --skills
```

This copies the skill into `.cursor/skills/gwirian-cli` and `.claude/skills/gwirian-cli` in the current directory. Options:

- `--target cursor` — install only for Cursor (`.cursor/skills/gwirian-cli`)
- `--target claude` — install only for Claude (`.claude/skills/gwirian-cli`)
- `--target both` — install for both (default)
- `--global` (or `-g`) — install in your home directory (`~/.cursor/skills/gwirian-cli` and/or `~/.claude/skills/gwirian-cli`)

Examples:

```bash
gwirian install --skills --target cursor
gwirian install --skills --global
```

## Installation (from source)

```bash
cd gwirian-cli
npm install
npm run build
```

Run the binary:

```bash
npm start
# or
node dist/cli.js
```

During development (no build step):

```bash
npm run dev
```

### Using the `gwirian` command everywhere

To run the CLI as `gwirian` (without prefixing with `node` or `npm start`):

**Development (global link)**  
From the project root:

```bash
npm run build
npm link
```

After that, the `gwirian` command is available in your terminal. To remove the link: `npm unlink -g @acmada/gwirian-cli`.

**Global install (permanent binary)**  
From the project root:

```bash
npm run build
npm install -g .
```

The `gwirian` command is then installed globally (e.g. in the same prefix as your `node`).

## Configuration

- **Token**: Generated in Gwirian (workspace member → API token). Enter it once via the TUI or the `gwirian auth` command.
- **Base URL**: Default `https://app.gwirian.com`. Can be changed in the TUI setup or with `gwirian config set base-url <url>`.

The config file is stored at:

- `$XDG_CONFIG_HOME/gwirian-cli/config.json` if `XDG_CONFIG_HOME` is set;
- otherwise `~/.config/gwirian-cli/config.json`.

The token is never displayed (including in `config get`).

## Usage

### No arguments (TUI)

In an interactive terminal:

```bash
gwirian
```

- If no token is configured: setup form (token + base URL).
- Otherwise: browse projects → features → scenarios.

### Command-line commands

**Auth and configuration**

| Command | Description |
|---------|-------------|
| `gwirian auth` | Prompt for token (use `-t` / `--test` to verify connection) |
| `gwirian logout` | Clear stored token |
| `gwirian config get` | Show base URL and whether a token is set |
| `gwirian config set base-url <url>` | Set API base URL |

**Install**

| Command | Description |
|---------|-------------|
| `gwirian install --skills` | Install gwirian-cli skill for Cursor and/or Claude (use `--target cursor|claude|both`, `--global`) |

**Projects**

- `gwirian projects list`
- `gwirian projects show <project-id>`

**Features**

- `gwirian features list <project-id>`
- `gwirian features show <project-id> <feature-id>`
- `gwirian features create <project-id> [--title] [--description] [--tag-list]`
- `gwirian features update <project-id> <feature-id> [--title] [--description] [--tag-list]`
- `gwirian features delete <project-id> <feature-id>`

**Scenarios**

- `gwirian scenarios list <project-id> <feature-id>`
- `gwirian scenarios show <project-id> <feature-id> <scenario-id>`
- `gwirian scenarios create <project-id> <feature-id> [--title] [--given] [--when] [--then] [--position]`
- `gwirian scenarios update <project-id> <feature-id> <scenario-id> [...]`
- `gwirian scenarios delete <project-id> <feature-id> <scenario-id>`

**Scenario executions**

- `gwirian scenario-executions list <project-id> <feature-id> <scenario-id>`
- `gwirian scenario-executions show <project-id> <feature-id> <scenario-id> <execution-id>`
- `gwirian scenario-executions create <project-id> <feature-id> <scenario-id> [--status] [--notes] [--executed-at]`
- `gwirian scenario-executions update ...`
- `gwirian scenario-executions delete ...`

**Global options**

- `--base-url <url>`: Override base URL for the command.
- `--json`: Raw JSON output (instead of formatted tables for list/show).

Examples:

```bash
gwirian --help
gwirian --json projects list
gwirian --base-url https://staging.gwirian.com projects list
```

## License

MIT.
