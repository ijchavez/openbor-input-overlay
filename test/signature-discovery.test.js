const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const {
  SIGNATURE_LANDING_URL,
  isAllowedSignatureUrl,
  createSignatureOpener
} = require('../src/signature-discovery');

test('Signature preview is the approved packaged asset', () => {
  const preview = path.join(root, 'renderer/assets/signature/inpulsar-signature-preview.png');
  assert.equal(fs.existsSync(preview), true);
  assert.equal(
    crypto.createHash('sha256').update(fs.readFileSync(preview)).digest('hex'),
    'e2442090d381f613abb0e99f2e720b6d0a4e54133e21312721c9605a25b4aae7'
  );
});

test('Signature URL validation accepts only the exact configured HTTPS URL', () => {
  const official = 'https://example.com/inpulsar-signature';
  assert.equal(isAllowedSignatureUrl(official, official), true);
  for (const candidate of [
    'http://example.com/inpulsar-signature',
    'https://example.com/inpulsar-signature/',
    'https://example.com/inpulsar-signature?ref=basic',
    'https://example.com/inpulsar-signature#basic',
    'https://example.com.evil.test/inpulsar-signature',
    'https://example.com@evil.test/inpulsar-signature',
    'javascript:alert(1)'
  ]) {
    assert.equal(isAllowedSignatureUrl(candidate, official), false, candidate);
  }
});

test('only the approved Signature URL reaches shell.openExternal', async () => {
  const official = 'https://example.com/inpulsar-signature';
  const opened = [];
  const openSignatureLanding = createSignatureOpener(async (url) => opened.push(url), official);

  assert.equal(await openSignatureLanding(official), true);
  assert.equal(await openSignatureLanding('https://evil.test/'), false);
  assert.equal(await openSignatureLanding('file:///tmp/signature.html'), false);
  assert.deepEqual(opened, [official]);
});

test('official public URL enables the shared Signature opener', async () => {
  const opened = [];
  const openSignatureLanding = createSignatureOpener(async (url) => opened.push(url));
  assert.equal(SIGNATURE_LANDING_URL, 'https://inpulsar.vercel.app/');
  assert.equal(await openSignatureLanding(), true);
  assert.deepEqual(opened, ['https://inpulsar.vercel.app/']);
});

test('main process denies new windows and reuses the guarded helper in the tray', () => {
  const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
  assert.match(main, /setWindowOpenHandler\(\(\{ url \}\) => \{/);
  assert.match(main, /openSignatureLanding\(url\)/);
  assert.match(main, /return \{ action: 'deny' \}/);
  assert.match(main, /webContents\.on\('will-navigate'/);
  assert.match(main, /label: 'Conocer Inpulsar Signature…'[\s\S]*click: openSignatureLanding/);
});

test('Signature discovery adds no promotional persistence or preload API', () => {
  const preload = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
  const discovery = fs.readFileSync(path.join(root, 'src/signature-discovery.js'), 'utf8');
  assert.doesNotMatch(preload, /signature/i);
  assert.doesNotMatch(discovery, /config|persist|storage|ipc/i);
});
