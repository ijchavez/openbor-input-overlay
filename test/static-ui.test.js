const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('renderer documents do not contain duplicate ids', () => {
  for (const relativePath of ['renderer/index.html', 'renderer/settings.html']) {
    const html = fs.readFileSync(path.join(root, relativePath), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${relativePath} contains duplicate ids`);
  }
});

test('overlay exposes only the quick actions', () => {
  const html = fs.readFileSync(path.join(root, 'renderer/index.html'), 'utf8');
  for (const id of ['moveMode', 'streamMode', 'settingsMode', 'clickMode']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const removedPanel of ['mappingPanel', 'profilePanel', 'lightingPanel']) {
    assert.doesNotMatch(html, new RegExp(`id="${removedPanel}"`));
  }
});

test('settings window contains the five planned sections', () => {
  const html = fs.readFileSync(path.join(root, 'renderer/settings.html'), 'utf8');
  for (const tab of ['general', 'controls', 'appearance', 'profiles', 'shortcuts']) {
    assert.match(html, new RegExp(`data-panel="${tab}"`));
  }
});

test('Signature discovery exists only at the end of General settings', () => {
  const settings = fs.readFileSync(path.join(root, 'renderer/settings.html'), 'utf8');
  const overlay = [
    fs.readFileSync(path.join(root, 'renderer/index.html'), 'utf8'),
    fs.readFileSync(path.join(root, 'renderer/app.js'), 'utf8')
  ].join('\n');

  assert.match(settings, /data-panel="general"[\s\S]*class="settings-card signature-discovery-card"/);
  assert.match(settings, /Discover Inpulsar Signature/);
  assert.match(settings, /Discover Signature ↗/);
  assert.match(settings, /assets\/signature\/inpulsar-signature-preview\.png/);
  assert.doesNotMatch(overlay, /Inpulsar Signature|Discover Signature|signature-preview/i);
});
