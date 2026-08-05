/* cv.js — CV-only interactivity (index.html)
   Self-contained bundle: theme cycling, matrix rain canvas,
   typing hero, scrollspy, scroll progress, and drawer toggle. */

/* === Theme switcher === */
function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const themes = ['light', 'dark', 'brutalist', 'terminal'];
  const icons = {
    light: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    dark: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    brutalist: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/></svg>',
    terminal: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19h8M4 17l6-6-6-6"/></svg>'
  };
  const order = { light: 'dark', dark: 'brutalist', brutalist: 'terminal', terminal: 'light' };
  const STORAGE = 'theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = (function(){ try { return localStorage.getItem(STORAGE) || (prefersDark ? 'dark' : 'light'); } catch(_) { return prefersDark ? 'dark' : 'light'; } })();

  function setTheme(t) {
    if (t === 'light') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    btn.innerHTML = icons[t] || icons.light;
    btn.setAttribute('aria-label', 'Switch to ' + (order[t] || 'light') + ' theme');
    const colors = { light: '#ffffff', dark: '#09090b', brutalist: '#fffff0', terminal: '#0c0c0c' };
    const c = colors[t] || colors.light;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', c); });
  }
  setTheme(initial);
  btn.addEventListener('click', function () {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const idx = themes.indexOf(cur);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next);
    try { localStorage.setItem(STORAGE, next); } catch(_) {}
  });
}

/* === Typing hero === */
function initTypedHero() {
  const el = document.querySelector('[data-typed-hero]');
  if (!el) return;
  const raw = el.getAttribute('data-typed');
  if (!raw) return;
  const phrases = raw.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
  if (phrases.length === 0) return;
  el.classList.add('typed-caret');
  const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null, i = 0, j = 0, deleting = false;
  function showStatic() {
    if (timer) { clearTimeout(timer); timer = null; }
    deleting = false;
    el.textContent = phrases[0];
    el.classList.remove('typed-caret');
  }
  function tick() {
    const word = phrases[i];
    if (!deleting) {
      j++;
      el.textContent = word.slice(0, j);
      if (j === word.length) { deleting = true; timer = setTimeout(tick, 1400); return; }
      timer = setTimeout(tick, 70 + Math.random() * 60);
    } else {
      j--;
      el.textContent = word.slice(0, j);
      if (j === 0) { deleting = false; i = (i + 1) % phrases.length; timer = setTimeout(tick, 320); return; }
      timer = setTimeout(tick, 32);
    }
  }
  function startTyping() { if (timer) return; el.classList.add('typed-caret'); timer = setTimeout(tick, 400); }
  if (reducedMQ.matches) showStatic(); else startTyping();
  const onReduced = function () { if (reducedMQ.matches) showStatic(); else startTyping(); };
  if (reducedMQ.addEventListener) reducedMQ.addEventListener('change', onReduced);
  else if (reducedMQ.addListener) reducedMQ.addListener(onReduced);
}

/* === ScrollSpy (topbar + drawer) === */
function initScrollSpy() {
  const links = document.querySelectorAll('.cv-topbar-link[href^="#"], .cv-drawer-link[href^="#"]');
  if (!links.length) return;
  const targetIds = Array.from(new Set(Array.from(links).map(function (a) { return a.getAttribute('href').slice(1); })));
  const targets = targetIds
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if (!targets.length) return;
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      links.forEach(function (l) { l.classList.remove('active'); });
      document.querySelectorAll('.cv-topbar-link[href="#' + id + '"], .cv-drawer-link[href="#' + id + '"]')
        .forEach(function (l) { l.classList.add('active'); });
    });
  }, { rootMargin: '-30% 0px -55% 0px', threshold: 0.01 });
  targets.forEach(function (t) { observer.observe(t); });
}

/* === Scroll progress indicator (topbar bottom edge) === */
function initScrollProgress() {
  const fill = document.getElementById('cv-progress-fill');
  if (!fill) return;
  let pending = false;
  function recompute() {
    pending = false;
    const doc = document.documentElement;
    const max = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    const r = Math.round(pct);
    fill.style.width = r + '%';
  }
  function onScroll() {
    if (!pending) { pending = true; requestAnimationFrame(recompute); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  recompute();
}

/* === Drawer toggle (mobile hamburger) === */
function initDrawer() {
  const toggle = document.getElementById('cvMenuToggle');
  const drawer = document.getElementById('cvDrawer');
  const backdrop = document.getElementById('cvDrawerBackdrop');
  if (!toggle || !drawer || !backdrop) return;
  let isOpen = false;
  function setOpen(open) {
    isOpen = open;
    drawer.setAttribute('data-open', open ? 'true' : 'false');
    backdrop.setAttribute('data-open', open ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('drawer-open', open);
  }
  toggle.addEventListener('click', function (e) { e.preventDefault(); setOpen(!isOpen); });
  backdrop.addEventListener('click', function (e) { e.preventDefault(); setOpen(false); });
  // Close on link click so the selected section is reached without manual dismiss
  drawer.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  // Esc closes
  document.addEventListener('keydown', function (e) {
    if (isOpen && (e.key === 'Escape' || e.keyCode === 27)) {
      e.preventDefault();
      setOpen(false);
      toggle.focus();
    }
  });
  // Sync state if user resizes across the breakpoint (drawer belongs to mobile only)
  const mq = window.matchMedia('(min-width: 769px)');
  function syncOnResize() { if (mq.matches && isOpen) setOpen(false); }
  if (mq.addEventListener) mq.addEventListener('change', syncOnResize);
  else if (mq.addListener) mq.addListener(syncOnResize);
}

/* === Boot === */
document.addEventListener('DOMContentLoaded', function () {
  initTypedHero();
  initTheme();
  initScrollSpy();
  initScrollProgress();
  initDrawer();
});

