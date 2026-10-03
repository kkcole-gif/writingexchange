/* ==========================================================================
   The Writing Program Exchange · shared behavior
   Loaded by every page, after search-index.js.

   Handles: site search, the phone menu, expandable panels, print buttons,
   and the back-to-top button. Search entries live in search-index.js.
   ========================================================================== */
(function () {
  'use strict';

  var INDEX = window.WPX_INDEX || [];
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function highlight(text, terms) {
    var out = esc(text);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      out = out.replace(new RegExp('(' + escapeRe(esc(t)) + ')', 'gi'), '<mark>$1</mark>');
    });
    return out;
  }
  function snippet(text, terms) {
    var lower = text.toLowerCase(), pos = -1;
    terms.some(function (t) { pos = lower.indexOf(t); return pos > -1; });
    if (pos < 0 || text.length <= 150) return text.slice(0, 150) + (text.length > 150 ? '…' : '');
    var start = Math.max(0, pos - 50);
    return (start > 0 ? '…' : '') + text.slice(start, start + 150) + (start + 150 < text.length ? '…' : '');
  }

  /* ---------- entry count on the home page ---------- */
  var count = $('entryCount');
  if (count) count.textContent = INDEX.length;

  /* ---------- search ---------- */
  var toggle = $('searchToggle'), wrap = $('searchInputWrap'), input = $('searchInput'), results = $('searchResults');
  var burger = $('navHamburger'), menu = $('mobileNav');

  function search(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return INDEX.map(function (e) {
      var title = e.title.toLowerCase(), text = (e.text || '').toLowerCase(), group = e.group.toLowerCase();
      var score = 0, all = true;
      terms.forEach(function (t) {
        var hit = false;
        if (title.indexOf(t) > -1) { score += 6; hit = true; }
        if (group.indexOf(t) > -1) { score += 2; hit = true; }
        if (text.indexOf(t) > -1) { score += 1; hit = true; }
        if (!hit) all = false;
      });
      return { e: e, score: all ? score : 0 };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 14)
      .map(function (r) { return r.e; });
  }

  function render(items, q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!q.trim()) { results.classList.remove('open'); results.innerHTML = ''; return; }
    if (!items.length) {
      results.innerHTML = '<div class="sr-empty">No entries match “' + esc(q) + '.” Try a broader term such as caps, DFW, assessment, or transfer.</div>';
      results.classList.add('open');
      return;
    }
    var groups = {}, order = [];
    items.forEach(function (e) {
      if (!groups[e.group]) { groups[e.group] = []; order.push(e.group); }
      groups[e.group].push(e);
    });
    var html = '<p class="sr-only">' + items.length + ' results</p>';
    order.forEach(function (g) {
      html += '<div class="sr-group-label">' + esc(g) + '</div>';
      groups[g].forEach(function (e) {
        html += '<a class="sr-item" href="' + esc(e.url) + '">' +
          '<div class="sr-title">' + highlight(e.title, terms) + '</div>' +
          '<div class="sr-snippet">' + highlight(snippet(e.text || '', terms), terms) + '</div></a>';
      });
    });
    results.innerHTML = html;
    results.classList.add('open');
  }

  function openSearch() {
    closeMenu();
    wrap.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    setTimeout(function () { input.focus(); }, 60);
  }
  function closeSearch(returnFocus) {
    wrap.classList.remove('open');
    results.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }

  if (toggle && wrap && input && results) {
    toggle.addEventListener('click', function () {
      if (wrap.classList.contains('open')) closeSearch(false); else openSearch();
    });
    input.addEventListener('input', function () { render(search(input.value), input.value); });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') {
        var first = results.querySelector('.sr-item');
        if (first) { ev.preventDefault(); first.focus(); }
      }
    });
    results.addEventListener('keydown', function (ev) {
      var items = Array.prototype.slice.call(results.querySelectorAll('.sr-item'));
      var i = items.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown' && i > -1 && items[i + 1]) { ev.preventDefault(); items[i + 1].focus(); }
      if (ev.key === 'ArrowUp' && i > -1) { ev.preventDefault(); (items[i - 1] || input).focus(); }
    });
    results.addEventListener('click', function (ev) {
      if (ev.target.closest('.sr-item')) closeSearch(false);
    });
    document.addEventListener('click', function (ev) {
      var nav = $('navSearch');
      if (nav && !nav.contains(ev.target)) closeSearch(false);
    });
  }

  /* ---------- phone menu ---------- */
  function openMenu() {
    if (!menu) return;
    if (wrap) closeSearch(false);
    menu.hidden = false;
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { if (menu.hidden) openMenu(); else closeMenu(); });
    menu.addEventListener('click', function (ev) { if (ev.target.tagName === 'A') closeMenu(); });
    if (window.matchMedia) {
      var mq = window.matchMedia('(min-width: 961px)');
      var onChange = function (e) { if (e.matches) closeMenu(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
    }
  }
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (wrap && wrap.classList.contains('open')) closeSearch(true);
    if (menu && !menu.hidden) { closeMenu(); burger.focus(); }
  });

  /* ---------- expandable panels ----------
     Markup: <button class="acc-btn" aria-expanded="false" aria-controls="ID"> … </button>
             <div class="acc-panel" id="ID" hidden> … </div>                              */
  function setPanel(btn, open) {
    var panel = $(btn.getAttribute('aria-controls'));
    if (!panel) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
  }
  Array.prototype.forEach.call(document.querySelectorAll('.acc-btn'), function (btn) {
    btn.addEventListener('click', function () {
      setPanel(btn, btn.getAttribute('aria-expanded') !== 'true');
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-acc-all]'), function (ctrl) {
    ctrl.addEventListener('click', function () {
      var scope = $(ctrl.getAttribute('data-scope')) || document;
      var open = ctrl.getAttribute('data-acc-all') === 'open';
      Array.prototype.forEach.call(scope.querySelectorAll('.acc-btn'), function (b) { setPanel(b, open); });
    });
  });
  /* A link or search result pointing at a closed panel opens it. */
  function openFromHash() {
    if (!location.hash) return;
    var target;
    try { target = document.querySelector(location.hash); } catch (e) { return; }
    if (!target) return;
    var btn = target.classList.contains('acc') ? target.querySelector('.acc-btn') : null;
    if (btn) { setPanel(btn, true); target.scrollIntoView(); }
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  /* ---------- print buttons ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-print]'), function (b) {
    b.addEventListener('click', function () { window.print(); });
  });

  /* ---------- back to top ---------- */
  var top = $('toTop');
  if (top) {
    window.addEventListener('scroll', function () {
      top.classList.toggle('show', window.scrollY > 700);
    }, { passive: true });
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0 });
      var main = $('main');
      if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
    });
  }
})();
