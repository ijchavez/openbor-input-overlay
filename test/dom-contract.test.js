const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function idsReferencedBy(script) {
  return [...script.matchAll(/querySelector\(['"]#([A-Za-z][\w-]*)['"]\)/g)]
    .map((match) => match[1]);
}

test('renderer scripts only reference ids present in their document', () => {
  for (const [htmlPath, scriptPath] of [
    ['renderer/index.html', 'renderer/app.js'],
    ['renderer/settings.html', 'renderer/settings.js']
  ]) {
    const html = fs.readFileSync(path.join(root, htmlPath), 'utf8');
    const script = fs.readFileSync(path.join(root, scriptPath), 'utf8');
    const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
    const missing = [...new Set(idsReferencedBy(script))].filter((id) => !htmlIds.has(id));
    assert.deepEqual(missing, [], `${scriptPath} references missing ids`);
  }
});
