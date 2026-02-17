# Gwirian CLI – Guide pour agents

Ce fichier décrit le projet **gwirian-cli** pour les assistants et agents qui modifient le code.

## Rôle du projet

CLI Node.js qui parle à l’API REST Gwirian (`/api/v1/`). Il propose :

- Une **TUI** (Ink + React + @inkjs/ui) pour configurer token/base URL et naviguer dans projets → features → scénarios.
- Des **commandes** (Commander) pour auth, config, et tout le CRUD sur projects, features, scenarios, scenario_executions.

## Stack

- **Runtime** : Node.js >= 18, ESM (`"type": "module"`).
- **Langage** : TypeScript, compilé en `dist/` avec `tsc`.
- **CLI** : Commander (sous-commandes, options globales `--base-url`, `--json`).
- **TUI** : Ink, React, @inkjs/ui (TextInput, PasswordInput, Select, Spinner).

## Structure des fichiers

| Fichier | Rôle |
|---------|------|
| `src/cli.ts` | Point d’entrée : parse des args, lance la TUI (si aucun arg + TTY) ou Commander. Définition de toutes les commandes et actions. |
| `src/config.ts` | Config persistante : `getConfig()`, `setToken()`, `setBaseUrl()`, `clearToken()`, `hasToken()`. Fichier XDG `…/gwirian-cli/config.json`. |
| `src/api.ts` | Client API : `createApiClient(baseUrl, token)` avec toutes les méthodes (getProjects, getFeatures, createScenario, etc.). Erreurs dédiées : `TokenInvalidOrExpiredError`, `ApiError`. |
| `src/format.ts` | Sortie : `formatJson()`, `formatList()` pour tableaux en terminal ou JSON. |
| `src/runTui.ts` | Lancement de la TUI : lit la config, affiche Setup (pas de token) ou Main (liste projets/features/scénarios). |
| `src/tui/Setup.tsx` | Écran de configuration : PasswordInput (token) puis TextInput (base URL), sauvegarde + test GET projects, exit ou message d’erreur. |
| `src/tui/Main.tsx` | TUI principale : chargement projets → Select → features → Select → scénarios (affichage given/when/then). |

Binaire exposé : `dist/cli.js` (après `npm run build`). Script dev : `npm run dev` (tsx sur `src/cli.ts`).

## Conventions

- **Imports** : extensions `.js` pour les modules locaux (sortie ESM vers `dist/*.js`).
- **Config** : ne jamais logger ni afficher le token. Fichier config en `0o600`, répertoire parent en `0o700`.
- **API** : corps des requêtes POST/PATCH au format attendu par Rails (p.ex. `{ feature: { title, description } }`). Voir `src/api.ts`.
- **TUI** : utilisée uniquement quand `args.length === 0` et `process.stdin.isTTY` ; sinon affichage de l’aide.

## Où modifier quoi

- **Nouvelle commande ou sous-commande** : `src/cli.ts` (program / .command / .addCommand / .action). Utiliser `requireToken()` et `createApiClient()` pour les commandes qui appellent l’API.
- **Nouvel endpoint ou champ API** : `src/api.ts` (méthodes et types). Adapter les types et les wrappers (feature, scenario, scenario_execution) si le backend change.
- **Comportement de la config** : `src/config.ts` (chemins, champs du JSON, permissions).
- **Écrans TUI** : `src/tui/Setup.tsx`, `src/tui/Main.tsx`. Nouveaux écrans : les ajouter dans `runTui.ts` ou depuis `Main.tsx` (navigation par état).
- **Format d’affichage (listes, JSON)** : `src/format.ts` et les appels à `output()` dans les actions Commander.

## Tests et build

- `npm run build` : compile TypeScript → `dist/`.
- `npm start` : `node dist/cli.js`.
- Pas de suite de tests pour l’instant ; les commandes peuvent être testées à la main (p.ex. `gwirian config get`, `gwirian --help`).

## API Gwirian (rappel)

- Base : `GET/POST /api/v1/projects`, `GET /api/v1/projects/:id`, puis features et scenarios sous `projects/:id/features`, `.../scenarios`, `.../scenario_executions`.
- Auth : header `Authorization: Bearer <token>` (token du WorkspaceMember). 401 → token invalide ou expiré.
