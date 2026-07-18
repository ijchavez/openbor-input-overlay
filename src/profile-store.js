const fs = require('node:fs');
const path = require('node:path');

function safeFileName(name) {
  const cleaned = String(name || '').trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 80);
  return cleaned || 'perfil';
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  try {
    fs.renameSync(temporaryPath, filePath);
  } catch {
    fs.copyFileSync(temporaryPath, filePath);
    fs.unlinkSync(temporaryPath);
  }
}

class ProfileStore {
  constructor(directory) { this.setDirectory(directory); }

  setDirectory(directory) {
    this.directory = path.resolve(directory);
    fs.mkdirSync(this.directory, { recursive: true });
  }

  getDirectory() { return this.directory; }

  readEntries() {
    fs.mkdirSync(this.directory, { recursive: true });
    const entries = [];
    for (const fileName of fs.readdirSync(this.directory)) {
      if (path.extname(fileName).toLowerCase() !== '.json') continue;
      const filePath = path.join(this.directory, fileName);
      try {
        const profile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!profile || typeof profile !== 'object') continue;
        const name = String(profile.name || path.basename(fileName, '.json')).trim();
        if (name) entries.push({ name, filePath, profile });
      } catch (error) {
        console.warn(`Perfil inválido ignorado (${fileName}):`, error.message);
      }
    }
    return entries.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }

  list() { return this.readEntries().map(({ name }) => name); }

  find(name) {
    const wanted = String(name || '').trim();
    return this.readEntries().find((entry) => entry.name.localeCompare(wanted, 'es', { sensitivity: 'base' }) === 0);
  }

  save(name, values) {
    const normalizedName = String(name || '').trim().slice(0, 40);
    if (!normalizedName) throw new Error('Escribí un nombre para el perfil');
    const existing = this.find(normalizedName);
    let filePath = existing?.filePath;
    if (!filePath) {
      const baseName = safeFileName(normalizedName);
      const usedNames = new Set(this.readEntries().map((entry) => path.basename(entry.filePath).toLowerCase()));
      let fileName = `${baseName}.json`;
      let suffix = 2;
      while (usedNames.has(fileName.toLowerCase())) fileName = `${baseName}-${suffix++}.json`;
      filePath = path.join(this.directory, fileName);
    }
    writeJsonAtomic(filePath, { version: 1, name: normalizedName, ...values });
    return normalizedName;
  }

  load(name) {
    const entry = this.find(name);
    if (!entry) throw new Error('Perfil no encontrado');
    return entry.profile;
  }

  delete(name) {
    const entry = this.find(name);
    if (!entry) throw new Error('Perfil no encontrado');
    fs.unlinkSync(entry.filePath);
  }

  migrate(legacyProfiles) {
    for (const [name, profile] of Object.entries(legacyProfiles || {})) {
      if (!this.find(name)) this.save(name, profile);
    }
  }
}

module.exports = { ProfileStore, safeFileName };