const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('renderer scale is capped by the available window area', () => {
  const script = fs.readFileSync(path.join(root, 'renderer', 'app.js'), 'utf8');
  assert.match(script, /availableScale = Math\.min\(window\.innerWidth \/ 760, window\.innerHeight \/ 354\)/);
  assert.match(script, /Math\.min\(configuredScale, availableScale\)/);
});

test('main process grows and shrinks the window with the requested scale', () => {
  const script = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(script, /const MAX_WINDOW = \{ width: 950, height: 443 \}/);
  assert.match(script, /function resizeWindowForScale\(previousScale, nextScale\)/);
  assert.match(script, /resizeWindowForScale\(previousScale, nextScale\)/);
});

test('OBS move mode displays a shoulder-aware final overlay boundary', () => {
  const styles = fs.readFileSync(path.join(root, 'renderer', 'overlay-v12.css'), 'utf8');
  assert.match(styles, /\.stream-mode\.move-mode #overlay::before/);
  assert.match(styles, /AREA FINAL EN OBS/);
  assert.match(styles, /--obs-guide-height, 228px/);
  assert.match(styles, /\.hide-shoulders #overlay/);
  assert.match(styles, /--obs-guide-height: 208px/);
  assert.doesNotMatch(styles, /\.controller::before/);
});
