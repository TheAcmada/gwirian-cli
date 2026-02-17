# Gwirian CLI

CLI pour l’API [Gwirian](https://www.gwirian.com), avec une interface TUI (terminal) moderne.

## Prérequis

- Node.js >= 18

## Installation

```bash
cd gwirian-cli
npm install
npm run build
```

Lancer le binaire :

```bash
npm start
# ou
node dist/cli.js
```

En développement (sans build) :

```bash
npm run dev
```

### Utiliser la commande `gwirian` partout

Pour appeler le CLI avec `gwirian` (sans préfixer par `node` ou `npm start`) :

**En développement (lien global)**  
Depuis la racine du projet :

```bash
npm run build
npm link
```

Après ça, la commande `gwirian` est disponible dans tout le terminal. Pour retirer le lien : `npm unlink -g gwirian-cli`.

**Installation globale (binaire définitif)**  
Depuis la racine du projet :

```bash
npm run build
npm install -g .
```

La commande `gwirian` est alors installée globalement (ex. dans le même prefix que ton `node`).

## Configuration

- **Token** : généré dans Gwirian (workspace member → API token). À saisir une fois via la TUI ou la commande `gwirian auth`.
- **Base URL** : par défaut `https://www.gwirian.com`. Modifiable dans la TUI de configuration ou avec `gwirian config set base-url <url>`.

Le fichier de configuration est stocké dans :

- `$XDG_CONFIG_HOME/gwirian-cli/config.json` si `XDG_CONFIG_HOME` est défini ;
- sinon `~/.config/gwirian-cli/config.json`.

Le token n’est jamais affiché (y compris dans `config get`).

## Utilisation

### Sans argument (TUI)

En terminal interactif :

```bash
gwirian
```

- Si aucun token n’est configuré : formulaire de configuration (token + base URL).
- Sinon : navigation projets → features → scénarios.

### Commandes en ligne de commande

**Auth et configuration**

| Commande | Description |
|----------|-------------|
| `gwirian auth` | Saisie du token (option `-t` / `--test` pour tester la connexion) |
| `gwirian logout` | Efface le token |
| `gwirian config get` | Affiche la base URL et si un token est défini |
| `gwirian config set base-url <url>` | Définit l’URL de base de l’API |

**Projets**

- `gwirian projects list`
- `gwirian projects show <project-id>`

**Features**

- `gwirian features list <project-id>`
- `gwirian features show <project-id> <feature-id>`
- `gwirian features create <project-id> [--title] [--description] [--tag-list]`
- `gwirian features update <project-id> <feature-id> [--title] [--description] [--tag-list]`
- `gwirian features delete <project-id> <feature-id>`

**Scénarios**

- `gwirian scenarios list <project-id> <feature-id>`
- `gwirian scenarios show <project-id> <feature-id> <scenario-id>`
- `gwirian scenarios create <project-id> <feature-id> [--title] [--given] [--when] [--then] [--position]`
- `gwirian scenarios update <project-id> <feature-id> <scenario-id> [...]`
- `gwirian scenarios delete <project-id> <feature-id> <scenario-id>`

**Exécutions de scénarios**

- `gwirian scenario-executions list <project-id> <feature-id> <scenario-id>`
- `gwirian scenario-executions show <project-id> <feature-id> <scenario-id> <execution-id>`
- `gwirian scenario-executions create <project-id> <feature-id> <scenario-id> [--status] [--notes] [--executed-at]`
- `gwirian scenario-executions update ...`
- `gwirian scenario-executions delete ...`

**Options globales**

- `--base-url <url>` : override de l’URL de base pour la commande.
- `--json` : sortie brute JSON (au lieu du tableau formaté pour les listes/détails).

Exemples :

```bash
gwirian --help
gwirian --json projects list
gwirian --base-url https://staging.gwirian.com projects list
```

## Licence

MIT.
