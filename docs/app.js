const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');
const toast = document.querySelector('[data-toast]');
const t = (value) => window.siteI18n?.t(value) || value;

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopQuery = window.matchMedia('(min-width: 761px)');
const parallaxLayers = [...document.querySelectorAll('[data-parallax]')];
const parallaxSections = [...new Set(parallaxLayers.map((layer) => layer.parentElement))];
const visibleSections = new Set();
let frameRequested = false;

const resetParallax = () => {
  parallaxLayers.forEach((layer) => { layer.style.transform = ''; });
};

const updateFrame = () => {
  frameRequested = false;
  header?.classList.toggle('scrolled', window.scrollY > 16);
  if (motionQuery.matches || !desktopQuery.matches) return;
  const viewportCenter = window.innerHeight / 2;
  visibleSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - viewportCenter) / (viewportCenter + rect.height / 2)));
    section.querySelectorAll('[data-parallax]').forEach((layer) => {
      layer.style.transform = `translate3d(0, ${(progress * Number(layer.dataset.parallax)).toFixed(2)}px, 0)`;
    });
  });
};

const requestFrame = () => {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(updateFrame);
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) visibleSections.add(target);
    else visibleSections.delete(target);
    target.classList.toggle('parallax-active', isIntersecting);
  });
  requestFrame();
});
parallaxSections.forEach((section) => observer.observe(section));

// Geometry changes only while a section is fully outside the viewport.
const svgNamespace = 'http://www.w3.org/2000/svg';
const circuitStates = [...document.querySelectorAll('[data-living-circuits]')].map((section) => {
  const svg = section.querySelector('[data-living-pattern]');
  return { section, svg, fallback: svg.innerHTML, seed: Math.floor(Math.random() * 0xffffffff), inside: false, generated: false };
});
const circuitsEnabled = () => !motionQuery.matches && desktopQuery.matches;
let circuitResizeUntil = 0;

const seededRandom = (initialSeed) => {
  let seed = initialSeed;
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const buildCircuitGeometry = (seed, height) => {
  const random = seededRandom(seed);
  const routeCount = 3 + Math.floor(random() * 2);
  const routes = [];
  const branches = [];
  const nodes = [];
  for (let index = 0; index < routeCount; index++) {
    const lane = height * (index + 1) / (routeCount + 1);
    const startY = Math.round(lane + (random() - .5) * 20);
    const rise = (random() < .5 ? -1 : 1) * (46 + Math.round(random() * 9));
    const middleY = startY + rise;
    const endY = startY + Math.round((random() - .5) * 20);
    const startX = 45 + Math.round(random() * 45);
    const turnX = 185 + Math.round(random() * 85);
    const middleX = 510 + Math.round(random() * 115);
    const points = [
      [startX, startY], [turnX, startY],
      [turnX + 76 + Math.round(random() * 8), middleY], [middleX, middleY],
      [middleX + 76 + Math.round(random() * 8), endY],
      [1110 + Math.round(random() * 45), endY]
    ];
    routes.push({ points, tone: Math.floor(random() * 3) });
  }
  nodes.push(routes[0].points[5], routes[routeCount - 1].points[5]);
  const branchCount = 1 + Math.floor(random() * 3);
  const branchOffset = Math.floor(random() * routeCount);
  for (let index = 0; index < branchCount; index++) {
    const route = routes[(branchOffset + index) % routeCount];
    const [middleX, middleY] = route.points[3];
    const towardLane = Math.sign(route.points[0][1] - middleY) * (34 + Math.round(random() * 8));
    const branchEnd = [middleX - 5, middleY + towardLane];
    branches.push({
      points: [[middleX - 110, middleY], [middleX - 75, middleY], [middleX - 30, branchEnd[1]], branchEnd],
      tone: (route.tone + 1) % 3
    });
    nodes.push(branchEnd);
  }
  return { routes, branches, nodes };
};

const renderCircuit = (state) => {
  const height = Number(state.svg.viewBox.baseVal.height);
  const geometry = buildCircuitGeometry(state.seed, height);
  const fragment = document.createDocumentFragment();
  const colors = ['#c7ff38', '#e3ed63', '#a4d53d'];
  [...geometry.routes, ...geometry.branches].forEach(({ points, tone }, index) => {
    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute('class', 'living-path');
    path.setAttribute('d', points.map(([x, y], pointIndex) => `${pointIndex ? 'L' : 'M'}${x} ${y}`).join(' '));
    path.style.setProperty('--living-color', colors[tone]);
    path.style.setProperty('--living-width', index < geometry.routes.length ? '2.7' : '1.6');
    path.style.setProperty('--living-opacity', index < geometry.routes.length ? '.75' : '.48');
    fragment.append(path);
  });
  geometry.nodes.forEach(([x, y]) => {
    const node = document.createElementNS(svgNamespace, 'circle');
    node.setAttribute('class', 'living-node');
    node.setAttribute('cx', x);
    node.setAttribute('cy', y);
    node.setAttribute('r', '4.5');
    fragment.append(node);
  });
  state.svg.replaceChildren(fragment);
  state.generated = true;
  state.seed = (state.seed + 0x9e3779b9) >>> 0;
};

const syncLivingCircuits = () => {
  circuitStates.forEach((state) => {
    if (!circuitsEnabled()) {
      if (state.generated) state.svg.innerHTML = state.fallback;
      state.generated = false;
    } else if (state.inside && !state.generated) {
      renderCircuit(state);
    }
  });
};

const circuitObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    const state = circuitStates.find((item) => item.section === target);
    if (isIntersecting) {
      state.inside = true;
      if (circuitsEnabled() && !state.generated) renderCircuit(state);
    } else if (state.inside) {
      state.inside = false;
      if (circuitsEnabled() && state.generated && Date.now() > circuitResizeUntil) renderCircuit(state);
    }
  });
}, { rootMargin: '24px 0px' });
circuitStates.forEach(({ section }) => circuitObserver.observe(section));

const handleMotionChange = () => { resetParallax(); syncLivingCircuits(); requestFrame(); };
motionQuery.addEventListener('change', handleMotionChange);
desktopQuery.addEventListener('change', handleMotionChange);
window.addEventListener('scroll', requestFrame, { passive: true });
window.addEventListener('resize', () => { circuitResizeUntil = Date.now() + 350; requestFrame(); }, { passive: true });
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

const controller = document.querySelector('[data-controller]');
const demoInputs = [
  ['.dpad-key.right', '.face.circle'],
  ['.dpad-key.down', '.face.cross'],
  ['.dpad-key.left', '.face.square'],
  ['.dpad-key.up', '.face.triangle']
];
let demoStep = 0;
const animateController = () => {
  controller?.querySelectorAll('.dpad-key, .face').forEach((item) => item.classList.remove('active'));
  demoInputs[demoStep].forEach((selector) => controller?.querySelector(selector)?.classList.add('active'));
  demoStep = (demoStep + 1) % demoInputs.length;
};

const stickPreview = document.querySelector('[data-stick-preview]');
const stickBase = stickPreview?.querySelector('.stick-base');
const stickKnob = stickPreview?.querySelector('[data-stick-knob]');
const stickButtons = [...(stickPreview?.querySelectorAll('[data-stick-button]') || [])];
const stickSequences = [
  [{ direction: 'down' }, { direction: 'down-right' }, { direction: 'right' }, { buttons: ['X'] }],
  [{ direction: 'left' }, { direction: 'right' }, { buttons: ['B'] }],
  [{ direction: 'up' }, { buttons: ['A'] }],
  [{ direction: 'down' }, { direction: 'down-right' }, { direction: 'right' }, { buttons: ['X', 'A'] }]
];
const stickPositions = {
  center: [0, 0], down: [0, 22], 'down-right': [16, 16], right: [22, 0], left: [-22, 0], up: [0, -22]
};
let previousSequence = -1;
let currentSequence = null;
let stickStep = 0;
let pauseTicks = 0;
let motionTick = 0;
let controllerTimer;

const showStickInput = ({ direction = 'center', buttons = [] } = {}) => {
  const [x, y] = stickPositions[direction];
  stickKnob?.style.setProperty('--stick-x', `${x}px`);
  stickKnob?.style.setProperty('--stick-y', `${y}px`);
  stickBase?.classList.toggle('is-moving', direction !== 'center');
  stickButtons.forEach((button) => button.classList.toggle('active', buttons.includes(button.dataset.stickButton)));
};

const advanceStickSequence = () => {
  if (pauseTicks > 0) { pauseTicks--; return; }
  if (!currentSequence) {
    const choices = stickSequences.map((_, index) => index).filter((index) => index !== previousSequence);
    previousSequence = choices[Math.floor(Math.random() * choices.length)];
    currentSequence = stickSequences[previousSequence];
    stickStep = 0;
  }
  if (stickStep < currentSequence.length) {
    showStickInput(currentSequence[stickStep++]);
  } else {
    showStickInput();
    currentSequence = null;
    pauseTicks = 2;
  }
};

const syncControllerMotion = () => {
  window.clearInterval(controllerTimer);
  if (motionQuery.matches) {
    showStickInput({ buttons: ['A'] });
    return;
  }
  if (document.hidden) return;
  controllerTimer = window.setInterval(() => {
    if (motionTick++ % 4 === 0) animateController();
    advanceStickSequence();
  }, 300);
};
motionQuery.addEventListener('change', syncControllerMotion);
document.addEventListener('visibilitychange', syncControllerMotion);
syncControllerMotion();
