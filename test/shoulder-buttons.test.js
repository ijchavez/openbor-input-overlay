const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('overlay and settings expose both remappable shoulder buttons', () => {
  const overlay = read('renderer/index.html');
  const settings = read('renderer/settings.html');

  for (const action of ['leftShoulder', 'rightShoulder']) {
    assert.match(overlay, new RegExp(`data-button="${action}"`));
    assert.match(settings, new RegExp(`data-map-action="${action}"`));
  }
});

test('shoulder buttons support keyboard, gamepad and common highlighting', () => {
  const config = JSON.parse(read('config.json'));
  const main = read('main.js');
  const app = read('renderer/app.js');
  const styles = read('renderer/styles.css');

  assert.equal(config.mapping.KeyA, 'leftShoulder');
  assert.equal(config.mapping.KeyS, 'rightShoulder');
  assert.match(main, /'leftShoulder', 'rightShoulder'/);
  assert.match(app, /leftShoulder:\s*4/);
  assert.match(app, /rightShoulder:\s*5/);
  assert.match(styles, /\.shoulder-key\.pressed/);
});
