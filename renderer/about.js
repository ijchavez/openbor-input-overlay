const version = new URLSearchParams(window.location.search).get('version');
if (version && /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version)) {
  document.querySelector('#version').textContent = `v${version}`;
}

const translations = {
  es: {
    title: 'Acerca de OpenBOR Input Overlay',
    eyebrow: 'ACERCA DE / CÓDIGO ABIERTO',
    languageLabel: 'Idioma',
    openSource: 'Código abierto',
    license: 'Licencia MIT',
    publisher: 'por Neon Pulsar Labs',
    description: 'OpenBOR Input Overlay es un proyecto de código abierto independiente para visualizar entradas de control en OpenBOR. Forma parte del ecosistema publicado por Neon Pulsar Labs y mantiene una línea propia, separada de Inpulsar Community y Signature.',
    navigationLabel: 'Enlaces del proyecto',
    nativeNotice: 'libuiohook © 2006–2023 Alexander Barker y colaboradores · LGPL-3.0-or-later · GPLv3 y LGPLv3: resources/legal/licenses/',
    close: 'Cerrar'
  },
  en: {
    title: 'About OpenBOR Input Overlay',
    eyebrow: 'ABOUT / OPEN SOURCE',
    languageLabel: 'Language',
    openSource: 'Open Source',
    license: 'MIT License',
    publisher: 'by Neon Pulsar Labs',
    description: 'OpenBOR Input Overlay is an independent open source project for displaying control inputs in OpenBOR. It is part of the ecosystem published by Neon Pulsar Labs and follows its own path, separate from Inpulsar Community and Inpulsar Signature.',
    navigationLabel: 'Project links',
    nativeNotice: 'libuiohook © 2006–2023 Alexander Barker and contributors · LGPL-3.0-or-later · GPLv3 and LGPLv3: resources/legal/licenses/',
    close: 'Close'
  },
  'pt-BR': {
    title: 'Sobre o OpenBOR Input Overlay',
    eyebrow: 'SOBRE / CÓDIGO ABERTO',
    languageLabel: 'Idioma',
    openSource: 'Código aberto',
    license: 'Licença MIT',
    publisher: 'por Neon Pulsar Labs',
    description: 'OpenBOR Input Overlay é um projeto independente de código aberto para visualizar entradas de controle no OpenBOR. Faz parte do ecossistema publicado por Neon Pulsar Labs e segue um caminho próprio, separado de Inpulsar Community e Inpulsar Signature.',
    navigationLabel: 'Links do projeto',
    nativeNotice: 'libuiohook © 2006–2023 Alexander Barker e colaboradores · LGPL-3.0-or-later · GPLv3 e LGPLv3: resources/legal/licenses/',
    close: 'Fechar'
  }
};

const languageButtons = document.querySelectorAll('[data-lang]');
function setLanguage(language) {
  const copy = translations[language];
  if (!copy) return;
  document.documentElement.lang = language;
  document.title = copy.title;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = copy[element.dataset.i18n];
  }
  for (const element of document.querySelectorAll('[data-i18n-aria-label]')) {
    element.setAttribute('aria-label', copy[element.dataset.i18nAriaLabel]);
  }
  for (const button of languageButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === language));
  }
}

for (const button of languageButtons) {
  button.addEventListener('click', () => setLanguage(button.dataset.lang));
}

document.querySelector('#closeAbout').addEventListener('click', () => window.close());
