const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');
const toast = document.querySelector('[data-toast]');
const t = (value) => window.siteI18n?.t(value) || value;

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 16);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('open', open);
});

nav?.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  menuButton?.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
});

let toastTimer;
document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = t('Copiado');
      toast?.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast?.classList.remove('show');
        button.textContent = t('Copiar');
      }, 1800);
    } catch {
      button.textContent = t('Seleccioná y copiá');
    }
  });
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();

const demoInputs = [
  ['.dpad-key.right', '.face.circle'],
  ['.dpad-key.down', '.face.cross'],
  ['.dpad-key.left', '.face.square'],
  ['.dpad-key.up', '.face.triangle']
];
let demoStep = 0;
const animateController = () => {
  document.querySelectorAll('.dpad-key, .face').forEach((item) => item.classList.remove('active'));
  demoInputs[demoStep].forEach((selector) => document.querySelector(selector)?.classList.add('active'));
  demoStep = (demoStep + 1) % demoInputs.length;
};
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.setInterval(animateController, 1300);
}
