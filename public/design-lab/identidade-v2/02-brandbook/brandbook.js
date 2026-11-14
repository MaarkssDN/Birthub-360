/* Birthub 360° Brandbook V2.0 (RASCUNHO, NÃO HOMOLOGADO). Sem dependências externas. */
(function () {
  'use strict';

  /* ── P-01: ÚNICO ponto de troca da grafia (decisão PROVISÓRIA, pendente de decisão humana) ── */
  var BRAND_NAME = 'Birthub 360°';
  var BRAND_ALT = 'Birth Hub 360°';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Grafia: preenche todo [data-brand]; o texto do HTML é o mesmo valor (fallback sem JS). */
  function setBrand(name) {
    $$('[data-brand]').forEach(function (el) { el.textContent = name; });
    document.title = name + ' · Brandbook V2.0 (RASCUNHO, NÃO HOMOLOGADO)';
  }
  setBrand(BRAND_NAME);
  $$('[data-brand-sim]').forEach(function (b) {
    b.addEventListener('click', function () {
      var alt = b.getAttribute('data-brand-sim') === 'alt';
      setBrand(alt ? BRAND_ALT : BRAND_NAME);
      $$('[data-brand-sim]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var out = $('#brand-sim-out');
      if (out) out.textContent = 'Simulação local ativa: ' + (alt ? BRAND_ALT : BRAND_NAME) + '. Nada foi gravado.';
    });
  });

  /* Tema dark/light */
  var KEY = 'bb-v2-theme';
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var b = $('#theme-btn');
    if (b) {
      b.setAttribute('aria-pressed', String(t === 'light'));
      $('.lbl', b).textContent = t === 'light' ? 'Light' : 'Dark';
      $('.ico-sun', b).style.display = t === 'light' ? '' : 'none';
      $('.ico-moon', b).style.display = t === 'light' ? 'none' : '';
    }
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'light' ? '#F4F7FB' : '#0D0D0D');
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage indisponível */ }
  applyTheme(saved === 'light' ? 'light' : 'dark');
  var tb = $('#theme-btn');
  if (tb) tb.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem(KEY, next); } catch (e) { /* ignora */ }
  });

  /* Filtro de regras */
  var rules = $$('.rule');
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      $$('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      rules.forEach(function (r) { r.hidden = !(f === 'all' || r.getAttribute('data-status') === f); });
      var out = $('#filter-out');
      if (out) out.textContent = rules.filter(function (r) { return !r.hidden; }).length + ' de ' + rules.length + ' regras visíveis';
    });
  });

  /* Contagens vivas */
  function setText(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  var nC = rules.filter(function (r) { return r.getAttribute('data-status') === 'confirmada'; }).length;
  setText('cnt-all', rules.length); setText('cnt-c', nC); setText('cnt-p', rules.length - nC);

  /* Contraste WCAG: recalcula em tempo de execução e confere com o valor impresso pelo build */
  function lum(hex) {
    var h = hex.replace('#', '');
    var c = [0, 2, 4].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  var bad = 0;
  $$('[data-cr]').forEach(function (el) {
    var p = el.getAttribute('data-cr').split('|');
    var r = ratio(p[0], p[1]).toFixed(2).replace('.', ',');
    var shown = (el.textContent.match(/\d+,\d\d/) || [''])[0];
    if (shown !== r) { bad++; el.setAttribute('data-cr-mismatch', r); }
  });
  root.setAttribute('data-cr-check', bad === 0 ? 'ok' : 'mismatch:' + bad);

  /* Navegação: trilho, anel de progresso e scrollspy */
  var rail = $('#rail'), menuBtn = $('#menu-btn');
  function closeRail() { if (rail.classList.contains('open')) { rail.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } }
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = rail.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeRail(); } });
  $$('a', rail).forEach(function (a) { a.addEventListener('click', closeRail); });

  var chapters = $$('main section.ch');
  var links = {};
  $$('a[href^="#"]', rail).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var ring = $('.pr', rail), circ = 0;
  if (ring) { circ = 2 * Math.PI * ring.r.baseVal.value; ring.style.strokeDasharray = circ; }
  var pct = $('#rail-pct');
  var ticking = false;
  function spy() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (ring) ring.style.strokeDashoffset = circ * (1 - p);
    if (pct) pct.textContent = Math.round(p * 100) + '%';
    var line = 140, cur = chapters[0], sub = null;
    chapters.forEach(function (c) { if (c.getBoundingClientRect().top - line <= 0) cur = c; });
    $$('h3[id]', cur).forEach(function (h) { if (h.getBoundingClientRect().top - line <= 0) sub = h; });
    $$('a', rail).forEach(function (a) { a.removeAttribute('aria-current'); });
    $$('.rail>ol>li').forEach(function (li) { li.classList.remove('open'); });
    if (cur && links[cur.id]) {
      links[cur.id].setAttribute('aria-current', 'true');
      links[cur.id].parentNode.classList.add('open');
      root.style.setProperty('--accent-rail', '1');
      var cls = (cur.className.match(/ac-\w+/) || ['ac-blue'])[0];
      rail.className = rail.className.replace(/ac-\w+/g, '').trim() + ' ' + cls;
    }
    if (sub && links[sub.id]) links[sub.id].setAttribute('aria-current', 'true');
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  window.addEventListener('resize', spy);
  spy();

  /* Demonstração de movimento (C08): dois níveis. Respeita prefers-reduced-motion. */
  var playBtn = $('#mo-play');
  if (playBtn) playBtn.addEventListener('click', function () {
    var note = $('#mo-note');
    if (reduce.matches) { if (note) note.textContent = 'prefers-reduced-motion ativo: a demonstração não anima (comportamento exigido por BB-LING-17).'; return; }
    $$('.mo .play').forEach(function (t) {
      var w = t.clientWidth - 2.1 * parseFloat(getComputedStyle(t).fontSize) * 1.4 - 8;
      t.style.setProperty('--w', Math.max(40, t.clientWidth - 48) + 'px');
      t.classList.remove('go'); void t.offsetWidth;
      t.style.setProperty('--dur', t.getAttribute('data-dur')); t.style.setProperty('--ez', t.getAttribute('data-ez'));
      var d = $('.dotm', t); d.style.transition = 'none'; d.style.transform = 'translateX(0)'; void d.offsetWidth;
      d.style.transition = 'transform ' + t.getAttribute('data-dur') + ' ' + t.getAttribute('data-ez');
      d.style.transform = 'translateX(' + Math.max(40, t.clientWidth - 48) + 'px)';
      setTimeout(function () { d.style.transition = 'none'; d.style.transform = 'translateX(0)'; }, 1600);
    });
    if (note) note.textContent = 'Reproduzido uma vez. Nível comercial 700 ms, nível operacional 160 ms.';
  });
})();
