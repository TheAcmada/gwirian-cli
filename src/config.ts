import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DEFAULT_BASE_URL = 'https://app.gwirian.com';

export interface ConfigData {
  token: string | null;
  baseUrl: string;
}

function getConfigDir(): string {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, 'gwirian-cli');
}

function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

export function getConfig(): ConfigData {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return { token: null, baseUrl: DEFAULT_BASE_URL };
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const data = JSON.parse(raw) as Partial<ConfigData>;
    return {
      token: data.token ?? null,
      baseUrl: data.baseUrl ?? DEFAULT_BASE_URL,
    };
  } catch {
    return { token: null, baseUrl: DEFAULT_BASE_URL };
  }
}

function writeConfig(data: ConfigData): void {
  ensureConfigDir();
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), { mode: 0o600 });
}

export function setToken(token: string): void {
  const config = getConfig();
  config.token = token;
  writeConfig(config);
}

export function setBaseUrl(url: string): void {
  const config = getConfig();
  config.baseUrl = url.replace(/\/$/, '');
  writeConfig(config);
}

export function clearToken(): void {
  const config = getConfig();
  config.token = null;
  writeConfig(config);
}

export function hasToken(): boolean {
  const token = getConfig().token;
  return typeof token === 'string' && token.length > 0;
}
