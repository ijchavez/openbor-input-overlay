const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const docs = path.join(root, 'docs');
const html = fs.readFileSync(path.join(docs, 'index.html'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('official site ships every local asset it references', () => {
  const localAssets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map((match) => match[1])
    .filter((value) => !/^(?:https?:|mailto:|tel:|\?)/.test(value));

  assert.deepEqual(localAssets.sort(), ['app.js', 'i18n.js', 'styles.css']);
  for (const asset of localAssets) {
    assert.equal(fs.existsSync(path.join(docs, asset)), true, `${asset} is missing`);
  }
  assert.equal(fs.existsSync(path.join(docs, 'og.png')), true, 'og.png is missing');
});

test('official site hash links point to unique sections', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate HTML ids found');

  const targets = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  for (const target of targets) {
    assert.equal(ids.includes(target), true, `missing #${target} target`);
  }
});

test('download links match the current package version', () => {
  const version = packageJson.version;
  assert.match(html, new RegExp(`Versión ${version}`));
  assert.match(html, new RegExp(`releases/download/v${version}/OpenBOR\\.Input\\.Overlay-Setup-${version}-x64\\.exe`));
  assert.match(html, new RegExp(`releases/download/v${version}/OpenBOR\\.Input\\.Overlay-Portable-${version}-x64\\.exe`));
});

test('official site includes sharing and accessibility essentials', () => {
  assert.match(html, /<html lang="es">/);
  assert.match(html, /<meta name="description"/);
  assert.match(html, /<meta property="og:image"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-label=/);
});

test('official site offers complete English and Brazilian Portuguese locales', () => {
  const i18n = fs.readFileSync(path.join(docs, 'i18n.js'), 'utf8');
  assert.match(html, /data-lang-option="es"/);
  assert.match(html, /data-lang-option="en"/);
  assert.match(html, /data-lang-option="pt-br"/);
  assert.match(i18n, /'Your controls\.'/);
  assert.match(i18n, /'Seus controles\.'/);
  assert.match(i18n, /document\.documentElement\.lang/);
  assert.match(i18n, /meta\[name="description"\]/);
});

test('official site presents the Signature edition without diminishing Basic', () => {
  const i18n = fs.readFileSync(path.join(docs, 'i18n.js'), 'utf8');
  const signatureUrls = [...html.matchAll(/https:\/\/inpulsar\.vercel\.app\//g)];

  assert.equal(signatureUrls.length, 1, 'Signature should have one discreet site CTA');
  assert.match(html, /href="https:\/\/inpulsar\.vercel\.app\/" target="_blank" rel="noreferrer"/);
  assert.match(html, /Inpulsar Basic sigue siendo gratuito, completo y configurable\./);
  assert.match(i18n, /'One brand\. Two editions\.'/);
  assert.match(i18n, /'Inpulsar Basic remains free, complete, and configurable\.'/);
  assert.match(i18n, /'Uma marca\. Duas edições\.'/);
  assert.match(i18n, /'O Inpulsar Basic continua gratuito, completo e configurável\.'/);
});
