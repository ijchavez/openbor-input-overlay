const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');
const toast = document.querySelector('[data-toast]');
const t = (value) => window.siteI18n?.t(value) || value;

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopQuery = window.matchMedia('(min-width: 761px)');
const parallaxLayers = [...document.querySelectorAll('[data-parallax]')];
const visibleLayers = new Set();
let frameRequested = false;

const resetParallax = () => {
  visibleLayers.clear();
  parallaxLayers.forEach((layer) => { layer.style.transform = ''; });
};

const updateFrame = () => {
  frameRequested = false;
  header?.classList.toggle('scrolled', window.scrollY > 16);
  if (motionQuery.matches || !desktopQuery.matches) return;
  const viewportCenter = window.innerHeight / 2;
  visibleLayers.forEach((layer) => {
    const rect = layer.parentElement.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - viewportCenter) / (viewportCenter + rect.height / 2)));
    layer.style.transform = `translate3d(0, ${(progress * Number(layer.dataset.parallax)).toFixed(2)}px, 0)`;
  });
};

const requestFrame = () => {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(updateFrame);
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) visibleLayers.add(target.querySelector('[data-parallax]'));
    else visibleLayers.delete(target.querySelector('[data-parallax]'));
  });
  requestFrame();
});
parallaxLayers.forEach((layer) => observer.observe(layer.parentElement));
const handleMotionChange = () => { resetParallax(); requestFrame(); };
motionQuery.addEventListener('change', handleMotionChange);
desktopQuery.addEventListener('change', handleMotionChange);
window.addEventListener('scroll', requestFrame, { passive: true });
window.addEventListener('resize', requestFrame, { passive: true });
requestFrame();

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
let controllerTimer;
const syncControllerMotion = () => {
  window.clearInterval(controllerTimer);
  if (!motionQuery.matches) controllerTimer = window.setInterval(animateController, 1300);
};
motionQuery.addEventListener('change', syncControllerMotion);
syncControllerMotion();
