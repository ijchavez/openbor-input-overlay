const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { ABOUT_LINKS, isAllowedAboutUrl } = require('../src/about');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('About links are exact approved HTTPS destinations', () => {
  assert.deepEqual(ABOUT_LINKS, {
    repository: 'https://github.com/ijchavez/openbor-input-overlay',
    releases: 'https://github.com/ijchavez/openbor-input-overlay/releases',
    inpulsar: 'https://inpulsar.vercel.app/'
  });
  for (const url of Object.values(ABOUT_LINKS)) assert.equal(isAllowedAboutUrl(url), true);
  for (const url of ['http://inpulsar.vercel.app/', 'https://inpulsar.vercel.app.evil.test/', 'file:///tmp/test', 'javascript:alert(1)']) {
    assert.equal(isAllowedAboutUrl(url), false);
  }
});

test('About contains the required identity and the unchanged official logo', () => {
  const html = read('renderer/about.html');
  const renderer = read('renderer/about.js');
  const logo = fs.readFileSync(path.join(root, 'renderer/assets/brand/npl-logo-horizontal-color-master-v3.png'));
  assert.match(html, /OpenBOR Input Overlay[\s\S]*Open Source[\s\S]*MIT License[\s\S]*by Neon Pulsar Labs/);
  assert.match(html, /proyecto open source independiente[\s\S]*Inpulsar Community y Signature/);
  assert.match(html, /© 2026 Gerardo Chavez/);
  assert.match(html, /src="assets\/brand\/npl-logo-horizontal-color-master-v3\.png"/);
  assert.equal(crypto.createHash('sha256').update(logo).digest('hex'), '1d14bee7b0d3937ecf98477adf84cb5b6d1a2216463fe64a678a5dea50eb83b7');
  assert.equal(logo.readUInt32BE(16), 2688);
  assert.equal(logo.readUInt32BE(20), 736);
  for (const url of Object.values(ABOUT_LINKS)) assert.ok(html.includes(`href="${url}"`));
  assert.match(html, /id="closeAbout"/);
  assert.match(renderer, /window\.close\(\)/);
  assert.match(renderer, /URLSearchParams\(window\.location\.search\)/);
});

test('tray About is single-instance and denies unapproved navigation', () => {
  const main = read('main.js');
  assert.match(main, /label: 'Acerca de OpenBOR Input Overlay…', click: showAbout/);
  assert.match(main, /if \(aboutWindow && !aboutWindow\.isDestroyed\(\)\)[\s\S]*aboutWindow\.focus\(\)/);
  assert.match(main, /aboutUrl\.searchParams\.set\('version', app\.getVersion\(\)\)/);
  assert.match(main, /contextIsolation: true,[\s\S]*nodeIntegration: false,[\s\S]*sandbox: true/);
  assert.match(main, /setWindowOpenHandler\(\(\{ url \}\) => \{[\s\S]*isAllowedAboutUrl\(url\)[\s\S]*shell\.openExternal\(url\)[\s\S]*action: 'deny'/);
  assert.match(main, /about\.webContents\.on\('will-navigate'[\s\S]*event\.preventDefault\(\)/);
  assert.match(main, /about\.on\('closed'[\s\S]*aboutWindow = null/);
  assert.match(read('renderer/about.html'), /default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'/);
});
