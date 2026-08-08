const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('settings distinguish round directions from right-side action buttons', () => {
  const html = fs.readFileSync(path.join(root, 'renderer/settings.html'), 'utf8');
  assert.match(html, /<option value="buttons">4 botones redondos \(flechas\)<\/option>/);
  assert.match(html, /Grupo izquierdo/);
  assert.match(html, /Grupo derecho/);
});

test('overlay applies the round directional button presentation', () => {
  const app = fs.readFileSync(path.join(root, 'renderer/app.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'renderer/styles.css'), 'utf8');
  assert.match(app, /use-direction-buttons', config\.directionControl === 'buttons'/);
  assert.match(styles, /\.use-direction-buttons \.dpad-key \{[^}]*border-radius:50%/);
  assert.match(styles, /\.use-direction-buttons \.dpad-core \{ display:none; \}/);
  assert.match(main, /\['stick', 'dpad', 'buttons'\]\.includes\(config\.directionControl\)/);
  assert.match(main, /\['stick', 'dpad', 'buttons'\]\.includes\(value\.directionControl\)/);
});
