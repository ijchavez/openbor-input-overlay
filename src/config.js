const fs = require('node:fs');
const path = require('node:path');

const defaults = require('../config.json');

function merge(base, custom) {
  if (!custom || typeof custom !== 'object' || Array.isArray(custom)) return base;
  return Object.fromEntries(Object.keys(base).map((key) => [key,
    base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])
      ? merge(base[key], custom[key]) : (custom[key] ?? base[key])
  ]));
}

function loadConfig(app) {
  // Beside the executable is convenient for portable builds; userData works when installed.
  const candidates = [path.join(path.dirname(app.getPath('exe')), 'config.json'), path.join(__dirname, '..', 'config.json')];
  const file = candidates.find(fs.existsSync);
  try { return { ...merge(defaults, JSON.parse(fs.readFileSync(file, 'utf8'))), configPath: file }; }
  catch (error) { console.warn('Invalid config.json; using defaults:', error.message); return { ...defaults, configPath: file }; }
}

module.exports = { loadConfig };
