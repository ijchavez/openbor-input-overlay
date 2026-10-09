const version = new URLSearchParams(window.location.search).get('version');
if (version && /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version)) {
  document.querySelector('#version').textContent = `v${version}`;
}

document.querySelector('#closeAbout').addEventListener('click', () => window.close());
