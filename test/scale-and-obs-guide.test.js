const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('renderer scale is capped by the available window area', () => {
  const script = fs.readFileSync(path.join(root, 'renderer', 'app.js'), 'utf8');
  assert.match(script, /availableScale = Math\.min\(window\.innerWidth \/ 760, window\.innerHeight \/ 330\)/);
  assert.match(script, /Math\.min\(configuredScale, availableScale\)/);
});

test('main process grows and shrinks the window with the requested scale', () => {
  const script = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(script, /const MAX_WINDOW = \{ width: 950, height: 413 \}/);
  assert.match(script, /function resizeWindowForScale\(previousScale, nextScale\)/);
  assert.match(script, /resizeWindowForScale\(previousScale, nextScale\)/);
});

test('OBS move mode displays the final clean-overlay boundary', () => {
  const styles = fs.readFileSync(path.join(root, 'renderer', 'overlay-v12.css'), 'utf8');
  assert.match(styles, /\.stream-mode\.move-mode \.controller::before/);
  assert.match(styles, /AREA FINAL EN OBS/);
});
