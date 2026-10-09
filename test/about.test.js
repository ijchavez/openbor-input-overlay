const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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
  assert.match(html, /OpenBOR Input Overlay[\s\S]*Código abierto[\s\S]*Licencia MIT[\s\S]*por Neon Pulsar Labs/);
  assert.match(html, /proyecto de código abierto independiente[\s\S]*Inpulsar Community y Signature/);
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

test('About switches all interface copy and accessibility state without reloading', () => {
  const html = read('renderer/about.html');
  const renderer = read('renderer/about.js');
  const labels = ['eyebrow', 'openSource', 'license', 'publisher', 'description', 'nativeNotice', 'close'];
  const ariaLabels = ['languageLabel', 'navigationLabel'];
  for (const key of labels) assert.ok(html.includes(`data-i18n="${key}"`));
  for (const key of ariaLabels) assert.ok(html.includes(`data-i18n-aria-label="${key}"`));

  const element = (dataset = {}) => ({
    dataset,
    attributes: {},
    textContent: '',
    listeners: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, listener) { this.listeners[name] = listener; }
  });
  const copy = labels.map((key) => element({ i18n: key }));
  const accessible = ariaLabels.map((key) => element({ i18nAriaLabel: key }));
  const buttons = ['es', 'en', 'pt-BR'].map((language) => element({ lang: language }));
  const version = element();
  const close = copy.find((node) => node.dataset.i18n === 'close');
  const document = {
    documentElement: { lang: 'es' },
    title: 'Acerca de OpenBOR Input Overlay',
    querySelector(selector) { return selector === '#version' ? version : close; },
    querySelectorAll(selector) {
      return { '[data-lang]': buttons, '[data-i18n]': copy, '[data-i18n-aria-label]': accessible }[selector];
    }
  };
  let closed = false;
  const window = { location: { search: '?version=1.2.5' }, close() { closed = true; } };
  vm.runInNewContext(renderer, { URLSearchParams, document, window });

  assert.match(html, /<html lang="es">/);
  assert.deepEqual(buttons.map((button) => button.dataset.lang), ['es', 'en', 'pt-BR']);
  assert.match(html, /data-lang="es" aria-pressed="true"/);
  assert.match(html, /data-lang="en" aria-pressed="false"/);
  assert.match(html, /data-lang="pt-BR" aria-pressed="false"/);
  assert.equal(version.textContent, 'v1.2.5');

  const expected = {
    es: ['Acerca de OpenBOR Input Overlay', 'Código abierto', 'Licencia MIT', 'por Neon Pulsar Labs', 'Enlaces del proyecto', 'Cerrar', 'Inpulsar Community y Signature'],
    en: ['About OpenBOR Input Overlay', 'Open Source', 'MIT License', 'by Neon Pulsar Labs', 'Project links', 'Close', 'Inpulsar Community and Inpulsar Signature'],
    'pt-BR': ['Sobre o OpenBOR Input Overlay', 'Código aberto', 'Licença MIT', 'por Neon Pulsar Labs', 'Links do projeto', 'Fechar', 'Inpulsar Community e Inpulsar Signature']
  };
  for (const language of ['en', 'pt-BR', 'es']) {
    buttons.find((button) => button.dataset.lang === language).listeners.click();
    const [title, openSource, license, publisher, navigation, closeText, productNames] = expected[language];
    assert.equal(document.documentElement.lang, language);
    assert.equal(document.title, title);
    assert.equal(copy.find((node) => node.dataset.i18n === 'openSource').textContent, openSource);
    assert.equal(copy.find((node) => node.dataset.i18n === 'license').textContent, license);
    assert.equal(copy.find((node) => node.dataset.i18n === 'publisher').textContent, publisher);
    assert.equal(copy.find((node) => node.dataset.i18n === 'close').textContent, closeText);
    assert.equal(accessible.find((node) => node.dataset.i18nAriaLabel === 'navigationLabel').attributes['aria-label'], navigation);
    assert.ok(copy.find((node) => node.dataset.i18n === 'description').textContent.includes(productNames));
    assert.ok(copy.every((node) => node.textContent));
    assert.ok(accessible.every((node) => node.attributes['aria-label']));
    assert.deepEqual(buttons.map((button) => button.attributes['aria-pressed']), ['es', 'en', 'pt-BR'].map((code) => String(code === language)));
    assert.equal(version.textContent, 'v1.2.5');
  }
  assert.match(read('renderer/about.css'), /button:focus-visible/);
  close.listeners.click();
  assert.equal(closed, true);
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
