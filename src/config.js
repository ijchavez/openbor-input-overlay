const fs = require('node:fs');
const path = require('node:path');

const defaults = require('../config.json');

function merge(base, custom) {
  if (!custom || typeof custom !== 'object' || Array.isArray(custom)) return base;
  const keys = new Set([...Object.keys(base), ...Object.keys(custom)]);
  return Object.fromEntries([...keys].map((key) => [key,
    base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])
      ? merge(base[key], custom[key]) : (custom[key] ?? base[key])
  ]));
}

function getRuntimeConfigPath(app) {
  if (!app.isPackaged) return path.join(__dirname, '..', 'config.user.json');
  const portablePath = path.join(path.dirname(app.getPath('exe')), 'config.json');
  return fs.existsSync(portablePath) ? portablePath : path.join(app.getPath('userData'), 'config.json');
}

function loadConfig(app) {
  const configPath = getRuntimeConfigPath(app);
  try {
    const custom = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    const loaded = merge(defaults, custom);
    if (custom.mapping) loaded.mapping = custom.mapping;
    if (custom.profiles) loaded.profiles = custom.profiles;
    return { ...loaded, configPath };
  } catch (error) {
    console.warn('Invalid runtime config; using defaults:', error.message);
    return { ...defaults, configPath };
  }
}

function writeConfig(configPath, stored) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const temporaryPath = `${configPath}.tmp`;
  const backupPath = `${configPath}.bak`;
  if (fs.existsSync(configPath)) fs.copyFileSync(configPath, backupPath);
  fs.writeFileSync(temporaryPath, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
  try {
    fs.renameSync(temporaryPath, configPath);
  } catch {
    fs.copyFileSync(temporaryPath, configPath);
    fs.unlinkSync(temporaryPath);
  }
}

function saveConfig(config) {
  const { configPath, ...stored } = config;
  writeConfig(configPath, stored);
}

function saveMapping(configPath, mapping) {
  const stored = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  stored.mapping = mapping;
  writeConfig(configPath, stored);
}

module.exports = { loadConfig, saveConfig, saveMapping };
