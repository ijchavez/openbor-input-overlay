const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('trail sliders use explicit pointer capture', () => {
  const script = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'settings.js'), 'utf8');
  assert.match(script, /function installPointerRange\(input\)/);
  assert.match(script, /input\.setPointerCapture\(event\.pointerId\)/);
  assert.match(script, /\['#trailDuration', '#trailIntensity'\]/);
  assert.match(script, /input\.dispatchEvent\(new Event\('change'/);
});
