/* Documentação do DS V2.0 — comportamento mínimo (tema, motion, módulos, TOC). */
(function () {
  'use strict';
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    document.querySelectorAll('[data-set-theme]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-theme') === t)); });
  }
  setTheme(params.get('theme') === 'light' ? 'light' : 'dark');
  document.querySelectorAll('[data-set-theme]').forEach(function (b) { b.addEventListener('click', function () { setTheme(b.getAttribute('data-set-theme')); }); });

  var mt = document.getElementById('motion-toggle');
  if (mt) mt.addEventListener('click', function () {
    var off = root.getAttribute('data-reduce') === 'true';
    if (off) root.removeAttribute('data-reduce'); else root.setAttribute('data-reduce', 'true');
    mt.setAttribute('aria-pressed', String(!off));
  });

  /* Módulo ativo: UM token (--module-accent) sobre um único DS */
  var scopes = document.querySelectorAll('[data-module-scope]');
  var live = document.getElementById('module-live');
  function pick(id) {
    var name = '';
    scopes.forEach(function (s) { s.setAttribute('data-module', id); });
    document.querySelectorAll('[data-pick-module]').forEach(function (b) {
      var on = b.getAttribute('data-pick-module') === id;
      b.setAttribute('aria-pressed', String(on));
      if (on) name = b.querySelector('.module-code').textContent + ' ' + b.querySelector('.module-name').textContent;
    });
    document.querySelectorAll('[data-module-name]').forEach(function (el) { el.textContent = name; });
    document.querySelectorAll('[data-module-code]').forEach(function (el) { el.textContent = name.split(' ')[0]; });
    if (live) live.textContent = 'Módulo ativo: ' + name;
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-pick-module]'); if (b) pick(b.getAttribute('data-pick-module')); });
  pick(params.get('module') || 'p01');

  /* TOC: scrollspy + navegação recolhível no mobile */
  var nav = document.getElementById('toc');
  var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          map[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }
  var mq = window.matchMedia('(min-width: 1001px)');
  function syncNav() { if (nav) { if (mq.matches) nav.setAttribute('open', ''); else if (!nav.dataset.touched) nav.removeAttribute('open'); } }
  if (nav) { nav.querySelector('summary').addEventListener('click', function () { nav.dataset.touched = '1'; }); nav.addEventListener('click', function (e) { if (e.target.closest('a') && !mq.matches) nav.removeAttribute('open'); }); }
  mq.addEventListener('change', syncNav); syncNav();

  /* Tooltip: Esc dispensa (WCAG 1.4.13) */
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') root.setAttribute('data-tip-off', ''); });
  ['pointermove', 'focusin'].forEach(function (ev) { document.addEventListener(ev, function () { root.removeAttribute('data-tip-off'); }); });
})();
