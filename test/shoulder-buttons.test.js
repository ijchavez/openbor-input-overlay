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
  assert.match(settings, /id="showShoulders"/);
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
  assert.match(styles, /\.shoulder-left \{ left:72px; justify-content:flex-start; \}/);
  assert.match(styles, /\.shoulder-right \{ right:72px; justify-content:flex-end; \}/);
  assert.match(styles, /\.dpad,.analog-stick,.face \{ z-index:1; \}/);
  assert.match(styles, /\.controls \{ position:relative; height:182px;/);
  assert.match(styles, /\.shoulder-key \{ position:absolute; z-index:1; top:5px;/);
  assert.match(styles, /\.hide-shoulders \.shoulder-key \{ display:none; \}/);
});

test('shoulder visibility is persisted and applied without changing input mapping', () => {
  const config = JSON.parse(read('config.json'));
  const main = read('main.js');
  const app = read('renderer/app.js');
  const settings = read('renderer/settings.js');

  assert.equal(config.showShoulders, true);
  assert.match(main, /value\.showShoulders !== undefined/);
  assert.match(main, /showShoulders: config\.showShoulders !== false/);
  assert.match(app, /classList\.toggle\('hide-shoulders', config\.showShoulders === false\)/);
  assert.match(settings, /showShoulders: document\.querySelector\('#showShoulders'\)\.checked/);
});
