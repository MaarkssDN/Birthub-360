/* Birthub 360° — Biblioteca de componentes V2.0 (RASCUNHO, NÃO HOMOLOGADO, PROTÓTIPO).
   JS vanilla, sem dependências, sem rede. Delegação de eventos: funciona igual nos painéis clonados (Dark | Light lado a lado).
   Todos os dados são fictícios e rotulados "EXEMPLO — dados fictícios". */
(function () {
  'use strict';
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var nf = new Intl.NumberFormat('pt-BR');
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  function icon(name, cls) { return '<svg class="bh-ico ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stageOf(el) { return el.closest('.demo-stage') || document.body; }
  function reducedMotion() { return root.getAttribute('data-reduce') === 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ================= Tema: Dark | Light | Lado a lado ================= */
  var ID_ATTRS = ['id', 'for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'data-open-modal', 'aria-owns'];
  function suffixIds(node, suf) {
    var all = [node].concat($$('*', node));
    all.forEach(function (el) {
      ID_ATTRS.forEach(function (a) {
        if (!el.hasAttribute || !el.hasAttribute(a)) return;
        el.setAttribute(a, el.getAttribute(a).split(/\s+/).map(function (v) { return v + suf; }).join(' '));
      });
    });
  }
  function initPanes() {
    $$('.demo-stage').forEach(function (stage) {
      var wrap = document.createElement('div'); wrap.className = 'demo-panes';
      stage.parentNode.insertBefore(wrap, stage); wrap.appendChild(stage);
    });
  }
  var theme = 'dark', split = false;
  function applyTheme() {
    root.setAttribute('data-theme', theme);
    root.toggleAttribute('data-split', split);
    $$('[data-lib-theme]').forEach(function (b) {
      var v = b.getAttribute('data-lib-theme');
      b.setAttribute('aria-pressed', String(split ? v === 'split' : v === theme));
    });
    $$('.demo-panes').forEach(function (wrap) {
      var first = wrap.firstElementChild, clone = wrap.querySelector('.demo-stage[data-clone]');
      if (split) {
        first.setAttribute('data-theme', 'dark'); first.setAttribute('data-label', 'Dark');
        if (!clone) {
          clone = first.cloneNode(true); clone.setAttribute('data-clone', ''); suffixIds(clone, '-l');
          $$('dialog[open]', clone).forEach(function (d) { d.removeAttribute('open'); });
          wrap.appendChild(clone);
        }
        clone.setAttribute('data-theme', 'light'); clone.setAttribute('data-label', 'Light');
      } else {
        if (clone) clone.remove();
        first.removeAttribute('data-theme'); first.removeAttribute('data-label');
      }
    });
    $$('.demo-stage').forEach(initStageDynamic);
    if (window._bhWatch) window._bhWatch();
  }
  function setMode(mode) {
    if (mode === 'split') split = true; else { split = false; theme = mode; }
    applyTheme();
  }

  /* ================= Toasts ================= */
  function toast(from, o) {
    var stage = stageOf(from), region = $('.bh-toast-region', stage) || $('.bh-toast-region');
    if (!region) return;
    while (region.children.length >= 3) region.firstElementChild.remove();
    var t = document.createElement('div');
    t.className = 'bh-toast'; t.setAttribute('data-tone', o.tone || 'info');
    t.setAttribute('role', o.tone === 'danger' ? 'alert' : 'status');
    var ic = { success: 'check-circle', danger: 'alert-circle', warn: 'alert-triangle', ai: 'sparkles', info: 'info' }[o.tone || 'info'];
    t.innerHTML = icon(ic) + '<div class="bh-toast__body"><span class="bh-toast__title">' + esc(o.title) + '</span>' + (o.text ? '<span class="bh-toast__text">' + esc(o.text) + '</span>' : '') + '</div>' +
      (o.action ? '<button type="button" class="bh-btn bh-btn--sm bh-btn--ghost" data-toast-action>' + esc(o.action) + '</button>' : '') +
      '<button type="button" class="bh-btn bh-btn--icon bh-btn--sm bh-btn--ghost" aria-label="Fechar notificação" data-toast-close>' + icon('x') + '</button>';
    region.appendChild(t);
    var timer, remaining = o.duration || 6000, start;
    function dismiss() { clearTimeout(timer); t.setAttribute('data-leaving', 'true'); setTimeout(function () { t.remove(); }, reducedMotion() ? 0 : 160); }
    function run() { start = Date.now(); timer = setTimeout(dismiss, remaining); }
    function pause() { clearTimeout(timer); remaining -= Date.now() - start; }
    t.addEventListener('mouseenter', pause); t.addEventListener('mouseleave', run);
    t.addEventListener('focusin', pause); t.addEventListener('focusout', function (e) { if (!t.contains(e.relatedTarget)) run(); });
    t._dismiss = dismiss; run();
  }

  /* ================= Validação de formulário ================= */
  var RULES = {
    required: function (v, f) { return v.trim() ? '' : 'Informe ' + f + '.'; },
    email: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'E-mail incompleto. Use o formato nome@empresa.com.br.'; },
    money: function (v) { var n = parseFloat(v.replace(/\./g, '').replace(',', '.')); return !v || (n > 0) ? '' : 'Informe um valor maior que zero, por exemplo 48000,00.'; },
    min3: function (v, f) { return !v || v.trim().length >= 3 ? '' : 'Use ao menos 3 caracteres em ' + f + '.'; }
  };
  function validateField(field) {
    var input = $('.bh-input, .bh-select, .bh-textarea', field); if (!input) return true;
    var label = (field.getAttribute('data-label') || 'este campo').toLowerCase();
    var rules = (field.getAttribute('data-rules') || '').split(',').filter(Boolean), msg = '';
    for (var i = 0; i < rules.length && !msg; i++) msg = RULES[rules[i]](input.value, label);
    var err = $('.bh-error', field);
    if (msg) {
      field.setAttribute('data-state', 'error'); input.setAttribute('aria-invalid', 'true');
      if (err) err.lastChild.textContent = msg;
    } else {
      input.removeAttribute('aria-invalid');
      field.setAttribute('data-state', input.value.trim() && rules.length ? 'success' : '');
      if (!field.getAttribute('data-state')) field.removeAttribute('data-state');
    }
    return !msg;
  }
  function submitForm(form) {
    var fields = $$('.bh-field[data-rules]', form), bad = [];
    fields.forEach(function (f) { if (!validateField(f)) bad.push(f); });
    var consent = $('input[type=checkbox][required]', form);
    if (consent && !consent.checked) { consent.setAttribute('aria-invalid', 'true'); bad.push(consent.closest('.bh-check')); } else if (consent) consent.removeAttribute('aria-invalid');
    var summary = $('.form-summary', form);
    if (bad.length) {
      summary.hidden = false;
      $('.form-summary__title', summary).textContent = bad.length + (bad.length === 1 ? ' campo precisa' : ' campos precisam') + ' de correção';
      $('ul', summary).innerHTML = bad.map(function (f) {
        var inp = $('input,select,textarea', f), lab = f.getAttribute('data-label') || 'Confirmação';
        return '<li><a href="#' + inp.id + '" data-focus-field="' + inp.id + '">' + esc(lab) + '</a></li>';
      }).join('');
      summary.focus();
      return;
    }
    summary.hidden = true;
    var btn = $('[type=submit]', form);
    btn.setAttribute('aria-busy', 'true'); btn.insertAdjacentHTML('afterbegin', '<svg class="bh-spinner" aria-hidden="true"><use href="#i-loader"/></svg>');
    $('.bh-btn__label', btn).textContent = 'Criando';
    setTimeout(function () {
      btn.removeAttribute('aria-busy'); $('.bh-spinner', btn).remove(); $('.bh-btn__label', btn).textContent = 'Criar oportunidade';
      toast(form, { tone: 'success', title: 'Oportunidade criada', text: 'Registro de EXEMPLO; nada foi gravado.' });
      form.reset(); $$('.bh-field', form).forEach(function (f) { f.removeAttribute('data-state'); $$('[aria-invalid]', f).forEach(function (i) { i.removeAttribute('aria-invalid'); }); });
    }, 1200);
  }

  /* ================= Modal ================= */
  function openModal(trigger) {
    var d = document.getElementById(trigger.getAttribute('data-open-modal')); if (!d) return;
    d._opener = trigger; d.showModal();
  }
  function trapTab(e) {
    var d = $('dialog[open]'); if (!d || e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', d).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (!d.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ================= Menu ================= */
  function menuItems(menu) { return $$('[role^=menuitem]:not([aria-disabled="true"])', menu); }
  function openMenu(wrap, focusIdx) {
    var trig = $('[data-menu-trigger]', wrap), menu = $('.bh-menu', wrap);
    $$('.bh-menu:not([hidden])').forEach(function (m) { if (m !== menu) closeMenu(m.closest('.bh-menu-wrap')); });
    menu.hidden = false; trig.setAttribute('aria-expanded', 'true');
    var items = menuItems(menu); if (items.length) items[focusIdx === 'last' ? items.length - 1 : 0].focus();
  }
  function closeMenu(wrap, refocus) {
    var trig = $('[data-menu-trigger]', wrap), menu = $('.bh-menu', wrap);
    if (menu.hidden) return;
    menu.hidden = true; trig.setAttribute('aria-expanded', 'false'); if (refocus) trig.focus();
  }
  var typeBuf = '', typeTimer;
  function menuKey(e, menu) {
    var items = menuItems(menu), i = items.indexOf(document.activeElement), wrap = menu.closest('.bh-menu-wrap');
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(wrap, true); }
    else if (e.key === 'Tab') { closeMenu(wrap, false); }
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      clearTimeout(typeTimer); typeBuf += e.key.toLowerCase(); typeTimer = setTimeout(function () { typeBuf = ''; }, 600);
      var hit = items.filter(function (el) { return el.textContent.trim().toLowerCase().indexOf(typeBuf) === 0; })[0];
      if (hit) hit.focus();
    }
  }
  function activateMenuItem(item) {
    var wrap = item.closest('.bh-menu-wrap'), out = $('.bh-readout', stageOf(wrap));
    if (item.getAttribute('role') === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
      if (out) out.textContent = 'Coluna "' + item.textContent.trim() + '": ' + (item.getAttribute('aria-checked') === 'true' ? 'visível' : 'oculta');
      return;
    }
    if (out) out.textContent = 'Última ação: ' + item.textContent.trim();
    closeMenu(wrap, true);
  }

  /* ================= Tabs ================= */
  function selectTab(tab, focus) {
    var list = tab.closest('[role=tablist]');
    $$('[role=tab]', list).forEach(function (t) {
      var on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
    });
    if (focus) tab.focus();
  }

  /* ================= Sidebar / shell ================= */
  var MODS = [
    ['p01', 'P01', 'Hub Comercial', 'layers'], ['p02', 'P02', 'Inteligência de Mercado', 'search'], ['p03', 'P03', 'Orquestração de Vendas', 'zap'],
    ['p04', 'P04', 'Performance', 'bar-chart'], ['p05', 'P05', 'Previsibilidade', 'trending'], ['p06', 'P06', 'Enxame de IA', 'bot'],
    ['p07', 'P07', 'Automação & Conectividade', 'link'], ['p08', 'P08', 'Voice & WhatsApp', 'phone'], ['m09', 'M09', 'Admin (Fundação / Governança)', 'shield'],
    ['m10', 'M10', 'Field Sales', 'map-pin'], ['m11', 'M11', 'Social Selling', 'users']
  ];
  function buildShells() {
    $$('[data-shell-nav]').forEach(function (nav) {
      nav.innerHTML = '<button type="button" class="bh-nav" data-set-module="hub" data-tip="Hub Central" data-tip-side="end">' + icon('orbit') + '<span class="bh-nav__label">Hub Central</span></button>' +
        '<div class="bh-sidebar__group">Módulos</div>' +
        MODS.map(function (m, i) {
          return '<button type="button" class="bh-nav" data-set-module="' + m[0] + '" data-tip="' + m[1] + ' ' + m[2] + '" data-tip-side="end"' + (i === 0 ? ' aria-current="page"' : '') + '>' + icon(m[3]) + '<span class="bh-nav__label">' + esc(m[2]) + '</span><span class="bh-nav__code">' + m[1] + '</span></button>';
        }).join('');
    });
    $$('.bh-shell').forEach(function (s) { if (!s.hasAttribute('data-collapsed-init')) { s.setAttribute('data-collapsed-init', ''); if (stageOf(s).clientWidth < 640) setCollapsed(s, true); } });
  }
  function setCollapsed(shell, c) {
    var sb = $('.bh-sidebar', shell), btn = $('[data-collapse-toggle]', shell);
    sb.setAttribute('data-collapsed', String(c)); btn.setAttribute('aria-expanded', String(!c));
    btn.setAttribute('aria-label', c ? 'Expandir navegação' : 'Recolher navegação');
    $$('.bh-nav', sb).forEach(function (n) { if (c) n.setAttribute('aria-label', (n.getAttribute('data-tip') || n.textContent).trim()); else n.removeAttribute('aria-label'); });
  }
  function setModule(btn) {
    var shell = btn.closest('[data-module-shell]') || btn.closest('.bh-shell'); var id = btn.getAttribute('data-set-module');
    $$('[data-set-module]', shell).forEach(function (n) { if (n === btn || n.getAttribute('data-set-module') === id) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current'); });
    var mod = MODS.filter(function (m) { return m[0] === id; })[0];
    shell.setAttribute('data-module', mod ? id : 'p01');
    var title = $('[data-shell-title]', shell), chip = $('[data-shell-chip]', shell), live = $('[data-shell-live]', shell);
    var name = mod ? mod[1] + ' ' + mod[2] : 'Hub Central';
    if (title) title.textContent = mod ? mod[2] : 'Hub Central';
    if (chip) { chip.textContent = mod ? mod[1] : '360'; }
    if (live) live.textContent = 'Workspace ativo: ' + name;
  }

  /* ================= Tabela ================= */
  var ROWS = [
    { id: 1, conta: 'Alfa Logística', resp: 'Marina Souza', etapa: 'Negociação', valor: 320000, data: '2026-11-28', status: 'info' },
    { id: 2, conta: 'Beta Energia', resp: 'Caio Nunes', etapa: 'Proposta', valor: 148500, data: '2026-12-05', status: 'warn' },
    { id: 3, conta: 'Gama Saúde', resp: 'Marina Souza', etapa: 'Fechado', valor: 92000, data: '2026-11-12', status: 'success' },
    { id: 4, conta: 'Delta Varejo', resp: 'Íris Campos', etapa: 'Qualificação', valor: 57800, data: '2026-12-19', status: 'info' },
    { id: 5, conta: 'Épsilon Agro', resp: 'Caio Nunes', etapa: 'Negociação', valor: 410250, data: '2026-11-30', status: 'warn' },
    { id: 6, conta: 'Zeta Educação', resp: 'Íris Campos', etapa: 'Proposta', valor: 76400, data: '2027-01-14', status: 'info' },
    { id: 7, conta: 'Eta Indústria', resp: 'Marina Souza', etapa: 'Perdido', valor: 215000, data: '2026-10-30', status: 'danger' },
    { id: 8, conta: 'Teta Seguros', resp: 'Caio Nunes', etapa: 'Qualificação', valor: 38900, data: '2027-01-30', status: 'info' }
  ];
  var STATUS = { info: ['info', 'info', 'Em andamento'], warn: ['warn', 'clock', 'Atenção'], success: ['success', 'check', 'Ganho'], danger: ['danger', 'x', 'Perdido'] };
  function fmtDate(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function renderTable(box) {
    var table = $('table', box), body = $('tbody', table), foot = $('[data-table-count]', box);
    var st = box.getAttribute('data-state') || 'ok', q = ($('[data-table-filter]', box) || {}).value || '';
    var key = box.getAttribute('data-sort-key') || 'valor', dir = box.getAttribute('data-sort-dir') || 'desc';
    var sel = JSON.parse(box.getAttribute('data-sel') || '[]');
    var cols = $('thead tr', table).children.length;
    table.setAttribute('data-density', box.getAttribute('data-density') || 'default');
    table.setAttribute('aria-busy', String(st === 'loading'));
    $$('thead th[data-col]', table).forEach(function (th) {
      var k = th.getAttribute('data-col');
      if (k === key) th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort');
      var ic = $('.bh-th-btn use', th); if (ic) ic.setAttribute('href', '#i-' + (k === key ? (dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrows-updown'));
    });
    var rows = ROWS.filter(function (r) { return !q || (r.conta + ' ' + r.resp + ' ' + r.etapa).toLowerCase().indexOf(q.toLowerCase()) >= 0; });
    rows.sort(function (a, b) { var x = a[key], y = b[key]; var c = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR'); return dir === 'asc' ? c : -c; });
    var html = '';
    if (st === 'loading') {
      for (var r = 0; r < 5; r++) { html += '<tr aria-hidden="true"><td class="is-check"><span class="bh-skel bh-skel--text" style="inline-size:16px"></span></td>'; for (var c2 = 1; c2 < cols; c2++) html += '<td><span class="bh-skel bh-skel--text" style="inline-size:' + (50 + ((r * 7 + c2 * 13) % 40)) + '%"></span></td>'; html += '</tr>'; }
    } else if (st === 'error') {
      html = '<tr><td colspan="' + cols + '"><div class="bh-alert" data-tone="danger" role="alert" style="margin:var(--space-3)">' + icon('alert-circle') + '<div class="bh-alert__body"><span class="bh-alert__title">Não foi possível carregar as oportunidades</span><span class="bh-alert__text">O serviço respondeu com erro 503 (EXEMPLO). Seus filtros foram mantidos.</span></div><button type="button" class="bh-btn bh-btn--sm" data-table-retry>Tentar novamente</button></div></td></tr>';
    } else if (st === 'empty' || !rows.length) {
      html = '<tr><td colspan="' + cols + '"><div class="bh-empty">' + icon('inbox') + '<h4>' + (q ? 'Nenhum resultado para "' + esc(q) + '"' : 'Nenhuma oportunidade ainda') + '</h4><p>' + (q ? 'Revise a busca ou limpe o filtro para ver todas as oportunidades.' : 'Crie a primeira oportunidade para começar a acompanhar o pipeline.') + '</p><div class="bh-empty__actions">' + (q ? '<button type="button" class="bh-btn bh-btn--sm" data-table-clear>Limpar busca</button>' : '<button type="button" class="bh-btn bh-btn--primary bh-btn--sm" data-table-demo-create>Criar oportunidade</button>') + '</div></div></td></tr>';
    } else {
      html = rows.map(function (r) {
        var s = STATUS[r.status], on = sel.indexOf(r.id) >= 0;
        return '<tr data-id="' + r.id + '"' + (on ? ' aria-selected="true"' : '') + '><td class="is-check"><label class="bh-check"><input type="checkbox" data-row-check aria-label="Selecionar ' + esc(r.conta) + '"' + (on ? ' checked' : '') + '></label></td>' +
          '<th scope="row">' + esc(r.conta) + '</th><td>' + esc(r.resp) + '</td><td>' + esc(r.etapa) + '</td><td class="is-num">' + brl.format(r.valor) + '</td><td class="is-num">' + fmtDate(r.data) + '</td>' +
          '<td><span class="bh-badge" data-tone="' + s[0] + '">' + icon(s[1]) + s[2] + '</span></td></tr>';
      }).join('');
    }
    body.innerHTML = html;
    var all = $('[data-select-all]', table), checks = $$('[data-row-check]', body), n = checks.filter(function (c) { return c.checked; }).length;
    if (all) { all.checked = checks.length > 0 && n === checks.length; all.indeterminate = n > 0 && n < checks.length; all.disabled = !checks.length; }
    if (foot) foot.textContent = (st === 'ok' || st === 'stale') && rows.length ? (n ? n + ' selecionada' + (n > 1 ? 's' : '') + ' de ' : '1–' + rows.length + ' de ') + rows.length : (st === 'loading' ? 'Carregando…' : '0 resultados');
    $$('[data-table-state]', box).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-table-state') === st)); });
    $$('[data-density-set]', box).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-density-set') === (box.getAttribute('data-density') || 'default'))); });
    var live = $('[data-table-live]', box); if (live && box._announce) { live.textContent = box._announce; box._announce = ''; }
  }

  /* ================= Gráficos (SVG) ================= */
  var MONTHS = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  var SERIES = [
    { name: 'Previsto', cls: 's-blue', dash: false, marker: 'circle', data: [210000, 240000, 262000, 301000, 338000, 372000] },
    { name: 'Realizado', cls: 's-pink', dash: true, marker: 'square', data: [190000, 228000, 241000, 296000, 311000, 329000] }
  ];
  function compact(n) { return n >= 1000 ? 'R$ ' + nf.format(Math.round(n / 1000)) + ' mil' : 'R$ ' + n; }
  function markerSvg(kind, x, y) {
    if (kind === 'square') return '<rect class="pt" x="' + (x - 4) + '" y="' + (y - 4) + '" width="8" height="8"/>';
    return '<circle class="pt" cx="' + x + '" cy="' + y + '" r="4.5"/>';
  }
  function renderLine(frame) {
    var w = Math.max(280, Math.round(frame.clientWidth || 600)), h = w < 480 ? 220 : 260, narrow = w < 480;
    var m = { l: narrow ? 50 : 62, r: narrow ? 14 : 92, t: 14, b: 30 }, iw = w - m.l - m.r, ih = h - m.t - m.b;
    var idx = +(frame.getAttribute('data-idx') || SERIES[0].data.length - 1), yMax = 400000, n = MONTHS.length;
    var X = function (i) { return m.l + (iw * i) / (n - 1); }, Y = function (v) { return m.t + ih - (ih * v) / yMax; };
    var s = '<svg class="bh-chart" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Previsto versus realizado, de julho a dezembro. Previsto sobe de 210 mil para 372 mil reais; realizado, de 190 mil para 329 mil.">';
    [0, 100000, 200000, 300000, 400000].forEach(function (v) {
      s += '<line class="' + (v === 0 ? 'axis' : 'grid') + '" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (m.l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + (v === 0 ? '0' : nf.format(v / 1000) + ' mil') + '</text>';
    });
    MONTHS.forEach(function (mo, i) { if (!narrow || i % 2 === 0 || i === n - 1) s += '<text x="' + X(i) + '" y="' + (h - 8) + '" text-anchor="middle"' + (i === idx ? ' class="label-strong"' : '') + '>' + mo + '</text>'; });
    s += '<line class="cursor" x1="' + X(idx) + '" x2="' + X(idx) + '" y1="' + m.t + '" y2="' + (m.t + ih) + '"/>';
    SERIES.forEach(function (se) {
      s += '<g class="' + se.cls + '"><path class="line' + (se.dash ? ' dash' : '') + '" d="' + se.data.map(function (v, i) { return (i ? 'L' : 'M') + X(i) + ' ' + Y(v); }).join(' ') + '"/>';
      se.data.forEach(function (v, i) { if (i === idx) s += markerSvg(se.marker, X(i), Y(v)); });
      if (!narrow) { var lx = X(n - 1) + 12, ly = Y(se.data[n - 1]) + 4; s += '<text class="label-strong" x="' + lx + '" y="' + ly + '">' + se.name + '</text>'; }
      s += '</g>';
    });
    s += '</svg>';
    frame.innerHTML = s;
    var ro = $('[data-chart-readout]', frame.parentNode);
    if (ro) ro.textContent = MONTHS[idx] + ' · ' + SERIES.map(function (se) { return se.name + ' ' + brl.format(se.data[idx]); }).join(' · ');
  }
  var STAGES = [['Prospecção', 120], ['Qualificação', 84], ['Proposta', 51], ['Negociação', 33], ['Ganhos', 21]];
  function renderBars(frame) {
    var w = Math.max(280, Math.round(frame.clientWidth || 600)), rowH = 34, h = STAGES.length * rowH + 8, lab = w < 480 ? 96 : 120, max = 120, bw = w - lab - 54;
    var s = '<svg class="bh-chart" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Funil de oportunidades por etapa: prospecção 120, qualificação 84, proposta 51, negociação 33, ganhos 21.">';
    STAGES.forEach(function (st, i) {
      var y = 4 + i * rowH, len = Math.max(2, (bw * st[1]) / max), won = st[0] === 'Ganhos';
      s += '<text x="0" y="' + (y + 18) + '" class="label-strong">' + st[0] + '</text><g class="' + (won ? 's-gold' : 's-blue') + '"><rect class="bar" x="' + lab + '" y="' + (y + 4) + '" width="' + len + '" height="18" rx="4"/></g>' +
        '<text x="' + (lab + len + 8) + '" y="' + (y + 18) + '">' + st[1] + '</text>';
    });
    frame.innerHTML = s + '</svg>';
  }
  function chartKey(e, frame) {
    var n = MONTHS.length, i = +(frame.getAttribute('data-idx') || n - 1);
    if (e.key === 'ArrowRight') i = Math.min(n - 1, i + 1); else if (e.key === 'ArrowLeft') i = Math.max(0, i - 1); else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = n - 1; else return;
    e.preventDefault(); frame.setAttribute('data-idx', i); renderLine(frame);
  }

  /* ================= Dashboard ================= */
  function renderDash(panel) {
    var st = panel.getAttribute('data-state') || 'ok', body = $('[data-dash-body]', panel), live = $('[data-dash-live]', panel);
    panel.setAttribute('aria-busy', String(st === 'loading'));
    $$('[data-dash-state]', panel).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-dash-state') === st)); });
    var msg = { loading: 'Carregando painel…', empty: 'Painel vazio: sem dados no período.', error: 'Erro ao carregar o painel.', stale: 'Painel com dados desatualizados.', ok: 'Painel atualizado.' }[st];
    if (live) live.textContent = msg;
    if (st === 'loading') {
      body.innerHTML = '<div class="bh-ribbon" aria-hidden="true"><div class="bh-metric"><span class="bh-skel bh-skel--text" style="inline-size:50%"></span><span class="bh-skel" style="block-size:34px;inline-size:70%"></span></div><div class="bh-metric"><span class="bh-skel bh-skel--text" style="inline-size:60%"></span><span class="bh-skel" style="block-size:26px;inline-size:50%"></span></div><div class="bh-metric"><span class="bh-skel bh-skel--text" style="inline-size:60%"></span><span class="bh-skel" style="block-size:26px;inline-size:50%"></span></div></div><span class="bh-skel bh-skel--block" style="block-size:210px" aria-hidden="true"></span><span class="sr-only">Carregando</span>';
      return;
    }
    if (st === 'empty') {
      body.innerHTML = '<div class="bh-empty">' + icon('bar-chart') + '<h4>Sem previsão para este período</h4><p>Ainda não há oportunidades com data de fechamento entre julho e dezembro. Amplie o período ou crie uma oportunidade.</p><div class="bh-empty__actions"><button type="button" class="bh-btn bh-btn--primary bh-btn--sm" data-dash-set="ok">Ampliar período</button></div></div>';
      return;
    }
    if (st === 'error') {
      body.innerHTML = '<div class="bh-alert" data-tone="danger" role="alert">' + icon('alert-circle') + '<div class="bh-alert__body"><span class="bh-alert__title">Não foi possível carregar a previsão</span><span class="bh-alert__text">A API de forecast respondeu com erro 503 (EXEMPLO). Nenhum valor foi estimado no lugar do dado real.</span></div><button type="button" class="bh-btn bh-btn--sm" data-dash-retry>Tentar novamente</button></div>';
      return;
    }
    body.innerHTML = (st === 'stale' ? '<div class="bh-alert" data-tone="warn" role="status">' + icon('clock') + '<div class="bh-alert__body"><span class="bh-alert__title">Dados de 3 horas atrás</span><span class="bh-alert__text">Última sincronização às 09:42 (EXEMPLO). Os valores abaixo podem estar defasados.</span></div><button type="button" class="bh-btn bh-btn--sm" data-dash-retry>Atualizar</button></div>' : '') +
      '<div class="bh-ribbon"><div class="bh-metric bh-metric--lead"><span class="bh-metric__label">Receita prevista no trimestre</span><span class="bh-metric__value">R$ 1.450.000</span><span class="bh-metric__delta" data-dir="up">' + icon('arrow-up', 'bh-ico--sm') + '+8,2% vs. trimestre anterior</span></div>' +
      '<div class="bh-metric"><span class="bh-metric__label">Negócios em aberto</span><span class="bh-metric__value">128</span><span class="bh-metric__delta" data-dir="flat">' + icon('minus', 'bh-ico--sm') + 'sem variação</span></div>' +
      '<div class="bh-metric"><span class="bh-metric__label">Conversão</span><span class="bh-metric__value">24,3%</span><span class="bh-metric__delta" data-dir="down">' + icon('arrow-down', 'bh-ico--sm') + '-1,4 p.p.</span></div></div>' +
      '<div><div class="bh-chart-frame" tabindex="0" role="group" aria-label="Gráfico de linhas, previsto versus realizado. Use as setas esquerda e direita para ler cada mês." data-chart="line" data-dash-chart></div>' +
      '<ul class="bh-legend" style="margin-block-start:var(--space-2)"><li><svg viewBox="0 0 24 10" aria-hidden="true" style="color:var(--c-blue)"><path d="M0 5h24" stroke="currentColor" stroke-width="2.25"/></svg>Previsto</li><li><svg viewBox="0 0 24 10" aria-hidden="true" style="color:var(--c-pink)"><path d="M0 5h24" stroke="currentColor" stroke-width="2.25" stroke-dasharray="6 4"/></svg>Realizado</li></ul>' +
      '<p class="bh-readout" data-chart-readout aria-live="polite"></p></div>';
    var fr = $('[data-dash-chart]', body); if (fr) renderLine(fr);
  }

  /* ================= Contraste ao vivo ================= */
  function parseRGB(str) { var m = str.match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function over(fg, bg) { return { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 }; }
  function lum(c) { var f = function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function colorOf(stage, expr) {
    var p = document.createElement('span'); p.style.cssText = 'position:absolute;visibility:hidden;color:' + expr; stage.appendChild(p);
    var c = parseRGB(getComputedStyle(p).color); p.remove(); return c;
  }
  var PAIRS = [
    ['Texto principal sobre superfície', '--ink', '--surface', 4.5], ['Texto secundário sobre superfície', '--ink-muted', '--surface', 4.5], ['Texto secundário sobre superfície aninhada', '--ink-muted', '--surface-2', 4.5],
    ['Azul (texto/ícone) sobre superfície', '--c-blue', '--surface', 4.5], ['Rosa (texto/ícone) sobre superfície', '--c-pink', '--surface', 4.5], ['Dourado (texto/ícone) sobre superfície', '--c-gold', '--surface', 4.5], ['Íris (texto/ícone) sobre superfície', '--c-iris', '--surface', 4.5],
    ['Verde de status sobre superfície', '--c-success', '--surface', 4.5], ['Atenção (dourado) sobre superfície', '--c-warn', '--surface', 4.5], ['Info oficial (#3B82F6) sobre superfície', '--c-info', '--surface', 4.5], ['Vermelho de status sobre superfície', '--c-danger', '--surface', 4.5],
    ['--on-neon sobre fill rosa (botão primário)', '--on-neon', '--neon-pink', 4.5], ['--on-neon sobre fill azul', '--on-neon', '--neon-blue', 4.5], ['--on-neon sobre fill dourado', '--on-neon', '--neon-gold', 4.5], ['--on-neon sobre fill íris', '--on-neon', '--iris', 4.5], ['--on-neon sobre fill vermelho', '--on-neon', '--neon-danger', 4.5],
    ['Anel de foco sobre superfície (não-texto)', '--focus-ring-color', '--surface', 3], ['Anel de foco sobre canvas (não-texto)', '--focus-ring-color', '--bg', 3], ['Borda de campo sobre superfície (não-texto)', '--field-border', '--surface', 3]
  ];
  function renderContrast(stage) {
    var box = stage.hasAttribute('data-contrast') ? stage : $('[data-contrast]', stage); if (!box) return;
    var rows = PAIRS.map(function (p) {
      var bg = colorOf(stage, 'var(' + p[2] + ')'), fg = over(colorOf(stage, 'var(' + p[1] + ')'), bg), r = ratio(fg, bg), ok = r >= p[3];
      return '<tr><th scope="row">' + esc(p[0]) + '</th><td><code>' + p[1] + '</code> / <code>' + p[2] + '</code></td><td class="is-num">' + r.toFixed(2) + ':1</td><td class="is-num">' + p[3] + ':1</td><td><span class="bh-badge" data-tone="' + (ok ? 'success' : 'danger') + '">' + icon(ok ? 'check' : 'x') + (ok ? 'Passa' : 'Não passa') + '</span></td></tr>';
    }).join('');
    $('tbody', box).innerHTML = rows;
  }

  /* ================= Estado dinâmico por painel ================= */
  function initStageDynamic(stage) {
    if (stage.hasAttribute && stage.hasAttribute('data-table')) renderTable(stage);
    $$('[data-table]', stage).forEach(renderTable);
    $$('[data-dash]', stage).forEach(renderDash);
    $$('[data-chart="line"]:not([data-dash-chart])', stage).forEach(renderLine);
    $$('[data-chart="bars"]', stage).forEach(renderBars);
    renderContrast(stage);
  }

  /* ================= Eventos ================= */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var b;
    if ((b = t.closest('[data-lib-theme]'))) { setMode(b.getAttribute('data-lib-theme')); return; }
    if ((b = t.closest('[data-toast]'))) {
      var tone = b.getAttribute('data-toast'), txt = { success: ['Proposta enviada', 'Registrada na linha do tempo da conta (EXEMPLO).'], info: ['Importação iniciada', 'Você pode continuar trabalhando; avisaremos ao concluir.'], warn: ['Meta próxima do limite', '92% do orçamento de IA do mês foi consumido.'], danger: ['Falha ao sincronizar', 'O CRM não respondeu. Tente novamente em instantes.'], ai: ['Sugestão do copiloto', 'Priorize 3 contas com reunião esta semana.'] }[tone];
      toast(b, { tone: tone, title: txt[0], text: txt[1], action: tone === 'success' ? 'Desfazer' : (tone === 'danger' ? 'Tentar de novo' : null) }); return;
    }
    if ((b = t.closest('[data-toast-close]'))) { b.closest('.bh-toast')._dismiss(); return; }
    if ((b = t.closest('[data-toast-action]'))) { var tt = b.closest('.bh-toast'); toast(b, { tone: 'info', title: 'Ação desfeita', duration: 3000 }); tt._dismiss(); return; }
    if ((b = t.closest('[data-demo-loading]'))) {
      var lab = $('.bh-btn__label', b), orig = lab.textContent;
      b.setAttribute('aria-busy', 'true'); b.insertAdjacentHTML('afterbegin', '<svg class="bh-spinner" aria-hidden="true"><use href="#i-loader"/></svg>'); lab.textContent = 'Salvando';
      setTimeout(function () { b.removeAttribute('aria-busy'); $('.bh-spinner', b).remove(); b.setAttribute('data-state', 'success'); lab.textContent = 'Salvo'; b.insertAdjacentHTML('afterbegin', '<svg class="bh-ico" aria-hidden="true" data-tmp><use href="#i-check"/></svg>'); }, 1500);
      setTimeout(function () { b.removeAttribute('data-state'); lab.textContent = orig; var tmp = $('[data-tmp]', b); if (tmp) tmp.remove(); }, 3200); return;
    }
    if ((b = t.closest('[data-toggle-pw]'))) { var inp = $('input', b.closest('.bh-control')), show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); $('use', b).setAttribute('href', '#i-' + (show ? 'eye-off' : 'eye')); return; }
    if ((b = t.closest('[role=switch]'))) { if (!b.disabled) b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true')); return; }
    if ((b = t.closest('[data-pressed-toggle]'))) { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); b.closest('.bh-card').setAttribute('data-selected', String(on)); return; }
    if ((b = t.closest('[data-group-pick]'))) { $$('[data-group-pick]', b.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); return; }
    if ((b = t.closest('[data-focus-field]'))) { e.preventDefault(); document.getElementById(b.getAttribute('data-focus-field')).focus(); return; }
    if ((b = t.closest('[data-reset-form]'))) { var f = b.closest('form'); f.reset(); $('.form-summary', f).hidden = true; $$('.bh-field', f).forEach(function (x) { x.removeAttribute('data-state'); $$('[aria-invalid]', x).forEach(function (i) { i.removeAttribute('aria-invalid'); }); }); return; }
    if ((b = t.closest('[data-open-modal]'))) { openModal(b); return; }
    if ((b = t.closest('[data-close-modal]'))) { b.closest('dialog').close(b.getAttribute('data-close-modal') || ''); return; }
    if (t.matches && t.matches('dialog.bh-modal[open]')) { var r = t.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) t.close('backdrop'); return; }
    if ((b = t.closest('[data-confirm-delete]'))) { var d = b.closest('dialog'); d.close('confirm'); toast(d._opener || d, { tone: 'success', title: 'Oportunidade excluída', text: 'EXEMPLO: nenhum dado real foi removido.', action: 'Desfazer' }); return; }
    if ((b = t.closest('[data-menu-trigger]'))) { var wrap = b.closest('.bh-menu-wrap'); if ($('.bh-menu', wrap).hidden) openMenu(wrap); else closeMenu(wrap, true); return; }
    if ((b = t.closest('.bh-menu [role^=menuitem]'))) { if (b.getAttribute('aria-disabled') !== 'true') activateMenuItem(b); return; }
    $$('.bh-menu:not([hidden])').forEach(function (m) { if (!m.closest('.bh-menu-wrap').contains(t)) closeMenu(m.closest('.bh-menu-wrap')); });
    if ((b = t.closest('[role=tab]'))) { if (!b.disabled) selectTab(b); return; }
    if ((b = t.closest('[data-collapse-toggle]'))) { var sh = b.closest('.bh-shell'); setCollapsed(sh, $('.bh-sidebar', sh).getAttribute('data-collapsed') !== 'true'); return; }
    if ((b = t.closest('[data-set-module]'))) { setModule(b); return; }
    // tabela
    if ((b = t.closest('.bh-th-btn[data-sort]'))) {
      var box = b.closest('[data-table]'), k = b.getAttribute('data-sort'), cur = box.getAttribute('data-sort-key'), dir = box.getAttribute('data-sort-dir') || 'desc';
      var nd = cur === k ? (dir === 'asc' ? 'desc' : 'asc') : (k === 'valor' || k === 'data' ? 'desc' : 'asc');
      box.setAttribute('data-sort-key', k); box.setAttribute('data-sort-dir', nd);
      box._announce = 'Tabela ordenada por ' + b.textContent.trim() + ', ordem ' + (nd === 'asc' ? 'crescente' : 'decrescente') + '.';
      renderTable(box); var nb = $('.bh-th-btn[data-sort="' + k + '"]', box); if (nb) nb.focus(); return;
    }
    if ((b = t.closest('[data-density-set]'))) { var bx = b.closest('[data-table]'); bx.setAttribute('data-density', b.getAttribute('data-density-set')); renderTable(bx); return; }
    if ((b = t.closest('[data-table-state]'))) { var bx2 = b.closest('[data-table]'); bx2.setAttribute('data-state', b.getAttribute('data-table-state')); renderTable(bx2); return; }
    if ((b = t.closest('[data-table-retry],[data-table-demo-create]'))) { var bx3 = b.closest('[data-table]'); bx3.setAttribute('data-state', 'loading'); renderTable(bx3); setTimeout(function () { bx3.setAttribute('data-state', 'ok'); renderTable(bx3); }, 900); return; }
    if ((b = t.closest('[data-table-clear]'))) { var bx4 = b.closest('[data-table]'); $('[data-table-filter]', bx4).value = ''; renderTable(bx4); $('[data-table-filter]', bx4).focus(); return; }
    // dashboard
    if ((b = t.closest('[data-dash-state]'))) { var p = b.closest('[data-dash]'); p.setAttribute('data-state', b.getAttribute('data-dash-state')); renderDash(p); return; }
    if ((b = t.closest('[data-dash-set]'))) { var p2 = b.closest('[data-dash]'); p2.setAttribute('data-state', b.getAttribute('data-dash-set')); renderDash(p2); return; }
    if ((b = t.closest('[data-dash-retry]'))) { var p3 = b.closest('[data-dash]'); p3.setAttribute('data-state', 'loading'); renderDash(p3); setTimeout(function () { p3.setAttribute('data-state', 'ok'); renderDash(p3); }, 1200); return; }
    // gráficos: tabela alternativa
    if ((b = t.closest('[data-chart-table-toggle]'))) { var tb = document.getElementById(b.getAttribute('aria-controls')); tb.hidden = !tb.hidden; b.setAttribute('aria-expanded', String(!tb.hidden)); return; }
    // loading demos
    if ((b = t.closest('[data-skel-demo]'))) {
      var area = b.closest('.demo-stage').querySelector('[data-skel-area]'); area.setAttribute('aria-busy', 'true'); area.setAttribute('data-loading', 'true'); b.disabled = true;
      setTimeout(function () { area.setAttribute('aria-busy', 'false'); area.removeAttribute('data-loading'); b.disabled = false; }, 2000); return;
    }
    if ((b = t.closest('[data-progress-demo]'))) {
      var bar = b.closest('.demo-stage').querySelector('[data-progress]'), v = 0; b.disabled = true;
      var iv = setInterval(function () { v = Math.min(100, v + 10); bar.style.setProperty('--_v', v + '%'); bar.setAttribute('aria-valuenow', v); if (v >= 100) { clearInterval(iv); b.disabled = false; } }, reducedMotion() ? 30 : 220); return;
    }
    if ((b = t.closest('[data-dismiss-alert]'))) { b.closest('.bh-alert').remove(); return; }
    if ((b = t.closest('[data-say]'))) { toast(b, { tone: 'info', title: b.getAttribute('data-say') }); return; }
  });

  document.addEventListener('input', function (e) {
    var f = e.target.closest('[data-table-filter]'); if (f) { var box = f.closest('[data-table]'); box._announce = ''; renderTable(box); var live = $('[data-table-live]', box); var n = $$('tbody tr[data-id]', box).length; live.textContent = n + (n === 1 ? ' resultado' : ' resultados'); return; }
    var fld = e.target.closest('.bh-field[data-rules]'); if (fld && fld.getAttribute('data-state') === 'error') validateField(fld);
  });
  document.addEventListener('focusout', function (e) { var fld = e.target.closest && e.target.closest('.bh-field[data-rules]'); if (fld && fld.closest('form')) validateField(fld); });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-select-all]')) { var box = t.closest('[data-table]'); var ids = t.checked ? ROWS.map(function (r) { return r.id; }) : []; box.setAttribute('data-sel', JSON.stringify(ids)); renderTable(box); return; }
    if (t.matches('[data-row-check]')) { var bx = t.closest('[data-table]'), sel = JSON.parse(bx.getAttribute('data-sel') || '[]'), id = +t.closest('tr').getAttribute('data-id'); sel = sel.filter(function (x) { return x !== id; }); if (t.checked) sel.push(id); bx.setAttribute('data-sel', JSON.stringify(sel)); renderTable(bx); var cb = $('tr[data-id="' + id + '"] [data-row-check]', bx); if (cb) cb.focus(); }
  });
  document.addEventListener('submit', function (e) { var f = e.target.closest('form[data-validate]'); if (f) { e.preventDefault(); submitForm(f); } });

  document.addEventListener('keydown', function (e) {
    var menu = e.target.closest('.bh-menu');
    if (menu) { menuKey(e, menu); return; }
    var trig = e.target.closest('[data-menu-trigger]');
    if (trig && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); openMenu(trig.closest('.bh-menu-wrap'), e.key === 'ArrowUp' ? 'last' : 0); return; }
    var tab = e.target.closest('[role=tab]');
    if (tab) {
      var tabs = $$('[role=tab]:not(:disabled)', tab.closest('[role=tablist]')), i = tabs.indexOf(tab), n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length]; else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length]; else if (e.key === 'Home') n = tabs[0]; else if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); } return;
    }
    var chart = e.target.closest('[data-chart="line"]'); if (chart) { chartKey(e, chart); return; }
    if (e.key === 'Tab') trapTab(e);
  });
  document.addEventListener('pointermove', function (e) {
    var fr = e.target.closest && e.target.closest('[data-chart="line"]'); if (!fr) return;
    var svg = $('svg', fr); if (!svg) return; var r = svg.getBoundingClientRect(), w = r.width, m = { l: w < 480 ? 50 : 62, r: w < 480 ? 14 : 92 };
    var i = Math.round(((e.clientX - r.left - m.l) / (w - m.l - m.r)) * (MONTHS.length - 1)); i = Math.max(0, Math.min(MONTHS.length - 1, i));
    if (+(fr.getAttribute('data-idx') || -1) !== i) { fr.setAttribute('data-idx', i); renderLine(fr); }
  });
  document.addEventListener('close', function (e) { var d = e.target; if (d.tagName === 'DIALOG' && d._opener && document.contains(d._opener)) d._opener.focus(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') root.setAttribute('data-tip-off', ''); });
  ['pointermove', 'focusin'].forEach(function (ev) { document.addEventListener(ev, function () { root.removeAttribute('data-tip-off'); }); });

  /* ================= Cabeçalho / navegação da página ================= */
  var mt = $('#motion-toggle');
  if (mt) mt.addEventListener('click', function () {
    var off = root.getAttribute('data-reduce') === 'true';
    if (off) root.removeAttribute('data-reduce'); else root.setAttribute('data-reduce', 'true');
    mt.setAttribute('aria-pressed', String(!off));
  });
  var nav = $('#toc'), links = nav ? $$('a[href^="#"]', nav) : [], map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting && map[en.target.id]) { links.forEach(function (l) { l.removeAttribute('aria-current'); }); map[en.target.id].setAttribute('aria-current', 'true'); } }); }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }
  var mq = window.matchMedia('(min-width: 1001px)');
  function syncNav() { if (nav) { if (mq.matches) nav.setAttribute('open', ''); else if (!nav.dataset.touched) nav.removeAttribute('open'); } }
  if (nav) { nav.querySelector('summary').addEventListener('click', function () { nav.dataset.touched = '1'; }); nav.addEventListener('click', function (e) { if (e.target.closest('a') && !mq.matches) nav.removeAttribute('open'); }); }
  mq.addEventListener('change', syncNav); syncNav();

  /* ResizeObserver: gráficos re-renderizam com a largura real para manter o texto em 12px */
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (en) { var el = en.target; if (el.getAttribute('data-chart') === 'line') renderLine(el); else if (el.getAttribute('data-chart') === 'bars') renderBars(el); }); });
    var watch = function () { $$('[data-chart]').forEach(function (el) { if (!el._ro) { el._ro = true; ro.observe(el); } }); };
    window._bhWatch = watch;
  }

  /* ================= Boot ================= */
  buildShells();
  initPanes();
  theme = params.get('theme') === 'light' ? 'light' : 'dark'; split = params.get('split') === '1';
  applyTheme();
  $$('.bh-shell').forEach(function (s) { setCollapsed(s, $('.bh-sidebar', s).getAttribute('data-collapsed') === 'true'); });
  if (window._bhWatch) window._bhWatch();
  window.__bhLibReady = true;
})();
