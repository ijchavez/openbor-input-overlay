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

function loadConfig(app) {
  const candidates = [path.join(path.dirname(app.getPath('exe')), 'config.json'), path.join(app.getPath('userData'), 'config.json'), path.join(__dirname, '..', 'config.json')];
  const file = candidates.find(fs.existsSync);
  try {
    const custom = JSON.parse(fs.readFileSync(file, 'utf8'));
    const loaded = merge(defaults, custom);
    if (custom.mapping) loaded.mapping = custom.mapping;
    if (custom.profiles) loaded.profiles = custom.profiles;
    return { ...loaded, configPath: file };
  }
  catch (error) { console.warn('Invalid config.json; using defaults:', error.message); return { ...defaults, configPath: file }; }
}

function saveConfig(config) {
  const { configPath, ...stored } = config;
  fs.writeFileSync(configPath, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
}

function saveMapping(configPath, mapping) {
  const stored = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  stored.mapping = mapping;
  fs.writeFileSync(configPath, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
}

module.exports = { loadConfig, saveConfig, saveMapping };