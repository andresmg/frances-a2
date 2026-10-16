(function () {
  'use strict';

  var app = document.getElementById('app');
  var STORE_KEY = 'fr-a2-progress-v1';

  // ---------- Progreso (localStorage, tolerante a fallos) ----------
  var progress = {};
  try { progress = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { progress = {}; }
  function saveProgress() { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) {} }
  function key(u, set, i) { return u + '/' + set + '/' + i; }
  function setStats(u, set) {
    var ok = 0, done = 0;
    set.items.forEach(function (_, i) {
      var v = progress[key(u, set.id, i)];
      if (v) done++;
      if (v === 'ok') ok++;
    });
    return { ok: ok, done: done, total: set.items.length };
  }

  // ---------- Utilidades ----------
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  // Normaliza para comparar: minúsculas, apóstrofos, espacios y puntuación final.
  function norm(s) {
    return String(s).normalize('NFC').toLowerCase()
      .replace(/[’‘`´]/g, "'").replace(/[«»"]/g, '')
      .replace(/\s*([?!.,;:'])\s*/g, '$1')
      .replace(/\s+/g, ' ').trim()
      .replace(/[.!?]+$/, '').trim();
  }
  function noAccents(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe'); }
  // 'ok' | 'accents' | 'ko'
  function compare(input, answers) {
    var n = norm(input);
    if (!n) return 'empty';
    for (var i = 0; i < answers.length; i++) if (norm(answers[i]) === n) return 'ok';
    for (var j = 0; j < answers.length; j++) if (noAccents(norm(answers[j])) === noAccents(n)) return 'accents';
    return 'ko';
  }

  // ---------- Voz (speechSynthesis) ----------
  var frVoice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    var vs = speechSynthesis.getVoices();
    frVoice = vs.filter(function (v) { return /^fr(-|_)FR/i.test(v.lang); })[0] || vs.filter(function (v) { return /^fr/i.test(v.lang); })[0] || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text, slow) {
    if (!('speechSynthesis' in window)) return false;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    if (frVoice) u.voice = frVoice;
    u.rate = slow ? 0.6 : 0.85;
    speechSynthesis.speak(u);
    return true;
  }
  function playButton(text) {
    var slow = false;
    var b = el('button', { class: 'play', type: 'button', 'aria-label': 'Escuchar', onclick: function () {
      if (!speak(text, slow)) { b.disabled = true; b.title = 'Tu navegador no tiene voz'; }
      slow = !slow; // alterna normal / lento
      b.classList.add('pulse'); setTimeout(function () { b.classList.remove('pulse'); }, 400);
    } }, []);
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5Z"/></svg>';
    return b;
  }

  // ---------- Barra de acentos (escritorio) ----------
  var accentBar = document.getElementById('accent-bar');
  var lastInput = null;
  'é è ê à â ç ù û ô î ï ë œ ’'.split(' ').forEach(function (ch) {
    accentBar.appendChild(el('button', { type: 'button', tabindex: '-1', text: ch,
      onmousedown: function (e) { e.preventDefault(); },
      onclick: function () {
        if (!lastInput) return;
        var s = lastInput.selectionStart, eIdx = lastInput.selectionEnd, v = lastInput.value;
        lastInput.value = v.slice(0, s) + ch + v.slice(eIdx);
        lastInput.selectionStart = lastInput.selectionEnd = s + ch.length;
        lastInput.dispatchEvent(new Event('input', { bubbles: true }));
        lastInput.focus();
      } }));
  });
  document.addEventListener('focusin', function (e) {
    if (e.target.matches && e.target.matches('input.txt, textarea.txt')) { lastInput = e.target; accentBar.classList.add('show'); }
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () { if (!document.activeElement || !document.activeElement.matches('input.txt, textarea.txt')) accentBar.classList.remove('show'); }, 50);
  });

  // ---------- Renderizado de ejercicios ----------
  // Cada renderer recibe (item, done) y llama done('ok' | 'ko') al resolverse.
  function feedback(box, kind, html) {
    box.className = 'feedback ' + kind;
    box.innerHTML = html;
  }

  var renderers = {
    choice: function (item, done) {
      var wrap = el('div', { class: 'choice' });
      var fb = el('div', { class: 'feedback' });
      var answered = false;
      item.options.forEach(function (opt, i) {
        var b = el('button', { class: 'opt', type: 'button', html: opt, onclick: function () {
          if (answered) return;
          answered = true;
          var right = i === item.answer;
          b.classList.add(right ? 'ok' : 'ko');
          wrap.children[item.answer].classList.add('ok');
          Array.prototype.forEach.call(wrap.children, function (c) { c.disabled = true; });
          feedback(fb, right ? 'ok' : 'ko', (right ? '¡Correcto!' : 'No exactamente.') + (item.explain ? ' ' + item.explain : ''));
          done(right ? 'ok' : 'ko');
        } });
        wrap.appendChild(b);
      });
      return [wrap, fb];
    },

    listen: function (item, done) {
      var nodes = renderers.choice(item, done);
      var row = el('div', { class: 'listen-row' }, [playButton(item.say), el('span', { class: 'muted small', text: 'Escucha y elige' })]);
      return [row].concat(nodes);
    },

    fill: function (item, done) {
      var p = el('p', { class: 'fill' });
      var fb = el('div', { class: 'feedback' });
      var gaps = [];
      var re = /\{([^}]+)\}/g, last = 0, m;
      while ((m = re.exec(item.text))) {
        p.appendChild(document.createTextNode(item.text.slice(last, m.index)));
        var answers = m[1].split('|');
        var longest = answers.reduce(function (a, b) { return b.length > a.length ? b : a; }, '');
        var inp = el('input', { class: 'txt gap', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Hueco' });
        inp.style.width = Math.max(4, longest.length + 2) + 'ch';
        gaps.push({ input: inp, answers: answers, state: null, tries: 0 });
        p.appendChild(inp);
        last = re.lastIndex;
      }
      p.appendChild(document.createTextNode(item.text.slice(last)));
      if (item.hint) p.appendChild(el('span', { class: 'hint', text: ' (' + item.hint + ')' }));

      function evaluate() {
        var all = gaps.every(function (g) { return g.state === 'ok'; });
        var anyWrong = gaps.some(function (g) { return g.state === 'ko'; });
        if (all) { feedback(fb, 'ok', '¡Correcto!'); done('ok'); }
        else if (anyWrong) done('ko');
      }
      gaps.forEach(function (g) {
        function check() {
          var r = compare(g.input.value, g.answers);
          if (r === 'empty') return;
          g.tries++;
          g.input.classList.remove('ok', 'ko', 'warn');
          if (r === 'ok') { g.state = 'ok'; g.input.classList.add('ok'); g.input.readOnly = true; }
          else if (r === 'accents') { g.state = 'ko'; g.input.classList.add('warn'); feedback(fb, 'warn', 'Casi: revisa los acentos.'); }
          else {
            g.state = 'ko'; g.input.classList.add('ko');
            if (g.tries >= 2) feedback(fb, 'ko', 'Respuesta: <b>' + g.answers[0] + '</b>');
            else feedback(fb, 'ko', 'Inténtalo otra vez.');
          }
          evaluate();
        }
        g.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
        g.input.addEventListener('change', check);
        g.input.addEventListener('input', function () { g.input.classList.remove('ko', 'warn'); });
      });
      return [p, fb];
    },

    write: function (item, done, opts) {
      var fb = el('div', { class: 'feedback' });
      var inp = el('textarea', { class: 'txt line', rows: '1', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', placeholder: (opts && opts.placeholder) || 'Escribe aquí…' });
      var tries = 0;
      var answers = item.answers || [item.say];
      function check() {
        var r = compare(inp.value, answers);
        if (r === 'empty') return;
        tries++;
        inp.classList.remove('ok', 'ko', 'warn');
        if (r === 'ok') {
          inp.classList.add('ok'); inp.readOnly = true; btn.disabled = true;
          feedback(fb, 'ok', '¡Correcto!' + (answers.length > 1 && norm(inp.value) !== norm(answers[0]) ? ' También: <i>' + answers[0] + '</i>' : ''));
          done('ok');
        } else {
          inp.classList.add(r === 'accents' ? 'warn' : 'ko');
          var msg = r === 'accents' ? 'Casi: revisa los acentos.' : 'No es correcto todavía.';
          if (item.hint && tries === 1) msg += ' <span class="muted">' + item.hint + '</span>';
          if (tries >= 2) msg += ' <button type="button" class="link reveal">Ver solución</button>';
          feedback(fb, r === 'accents' ? 'warn' : 'ko', msg);
          var rv = fb.querySelector('.reveal');
          if (rv) rv.onclick = function () { feedback(fb, 'ko', 'Solución: <b>' + answers[0] + '</b>'); };
          done('ko');
        }
      }
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      inp.addEventListener('input', function () { inp.classList.remove('ko', 'warn'); });
      var btn = el('button', { class: 'btn', type: 'button', text: 'Comprobar', onclick: check });
      return [el('div', { class: 'write-row' }, [inp, btn]), fb];
    },

    dictation: function (item, done) {
      var nodes = renderers.write(item, done, { placeholder: 'Escribe lo que oyes…' });
      var row = el('div', { class: 'listen-row' }, [playButton(item.say), el('span', { class: 'muted small', text: 'Pulsa otra vez para oírlo más lento' })]);
      return [row].concat(nodes);
    },

    order: function (item, done) {
      var target = el('div', { class: 'order-target', 'aria-label': 'Tu frase' });
      var pool = el('div', { class: 'order-pool' });
      var fb = el('div', { class: 'feedback' });
      var answer = joinTokens(item.tokens);
      var tokens = shuffle(item.tokens.map(function (t, i) { return { t: t, i: i }; }));
      if (tokens.every(function (t, i) { return t.i === i; })) tokens.reverse();
      var solved = false;

      function chip(tok) {
        var c = el('button', { class: 'chip', type: 'button', text: tok.t, onclick: function () {
          if (solved) return;
          (c.parentNode === pool ? target : pool).appendChild(c);
          target.classList.remove('ko');
          if (!pool.children.length) check();
        } });
        return c;
      }
      function check() {
        var built = joinTokens(Array.prototype.map.call(target.children, function (c) { return c.textContent; }));
        if (compare(built, [answer]) === 'ok') {
          solved = true; target.classList.add('ok'); feedback(fb, 'ok', '¡Correcto!'); done('ok');
        } else {
          target.classList.add('ko'); feedback(fb, 'ko', 'Casi. Toca una palabra para devolverla y prueba otra vez.'); done('ko');
        }
      }
      tokens.forEach(function (t) { pool.appendChild(chip(t)); });
      return [target, pool, fb];
    },

    match: function (item, done) {
      var grid = el('div', { class: 'match' });
      var left = el('div', { class: 'col' }), right = el('div', { class: 'col' });
      var fb = el('div', { class: 'feedback' });
      var sel = null, matched = 0, errors = 0;
      item.pairs.forEach(function (p, i) {
        left.appendChild(el('button', { class: 'chip wide', type: 'button', text: p[0], 'data-i': i, onclick: pick }));
      });
      shuffle(item.pairs.map(function (p, i) { return { t: p[1], i: i }; })).forEach(function (r) {
        right.appendChild(el('button', { class: 'chip wide', type: 'button', text: r.t, 'data-i': r.i, onclick: pick }));
      });
      function pick(e) {
        var b = e.currentTarget;
        if (b.classList.contains('ok')) return;
        if (!sel || sel.parentNode === b.parentNode) {
          if (sel) sel.classList.remove('sel');
          sel = b; b.classList.add('sel'); return;
        }
        var a = sel; sel = null; a.classList.remove('sel');
        if (a.dataset.i === b.dataset.i) {
          a.classList.add('ok'); b.classList.add('ok'); a.disabled = b.disabled = true;
          matched++;
          if (matched === item.pairs.length) {
            feedback(fb, errors ? 'warn' : 'ok', errors ? 'Completado con ' + errors + (errors === 1 ? ' error.' : ' errores.') : '¡Perfecto, sin errores!');
            done(errors <= 1 ? 'ok' : 'ko');
          }
        } else {
          errors++;
          [a, b].forEach(function (x) { x.classList.add('ko'); setTimeout(function () { x.classList.remove('ko'); }, 500); });
        }
      }
      grid.appendChild(left); grid.appendChild(right);
      return [grid, fb];
    },

    open: function (item, done) {
      var ta = el('textarea', { class: 'txt area', rows: '5', placeholder: 'Escribe en francés…', spellcheck: 'false' });
      var list = el('ul', { class: 'checks' });
      var model = el('div', { class: 'feedback model' });
      var finished = false;
      var lis = item.checks.map(function (c) { var li = el('li', { text: c.label }); list.appendChild(li); return li; });
      ta.addEventListener('input', function () {
        var t = ta.value, all = true;
        item.checks.forEach(function (c, i) {
          var pass = c.test ? c.test(t) : c.re.test(t);
          lis[i].classList.toggle('ok', pass);
          if (!pass) all = false;
        });
        if (all && !finished) { finished = true; done('ok'); feedback(model, 'ok', '¡Muy bien! Tu texto cumple todo. Ejemplo de referencia: <i>' + item.model + '</i>'); }
      });
      var btn = el('button', { class: 'link', type: 'button', text: 'Ver un ejemplo', onclick: function () { feedback(model, 'info', 'Ejemplo: <i>' + item.model + '</i>'); } });
      return [ta, list, btn, model];
    }
  };

  function joinTokens(arr) {
    return arr.join(' ').replace(/’ /g, '’').replace(/' /g, "'").replace(/ ([.,])/g, '$1');
  }

  // ---------- Vistas ----------
  function loadUnit(n, cb) {
    if (window.UNIT_DATA[n]) return cb(window.UNIT_DATA[n]);
    var meta = window.UNITS.filter(function (u) { return u.n === n; })[0];
    if (!meta || !meta.file) return cb(null);
    var s = document.createElement('script');
    s.src = meta.file;
    s.onload = function () { cb(window.UNIT_DATA[n] || null); };
    s.onerror = function () { cb(null); };
    document.body.appendChild(s);
  }

  function ring(pct) {
    var r = 16, c = 2 * Math.PI * r;
    return '<svg class="ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="' + r + '" class="ring-bg"/><circle cx="20" cy="20" r="' + r + '" class="ring-fg" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct)) + '"/></svg>';
  }

  function unitProgress(n) {
    var data = window.UNIT_DATA[n];
    if (!data) return null;
    var ok = 0, total = 0;
    data.sets.forEach(function (s) { var st = setStats(n, s); ok += st.ok; total += st.total; });
    return total ? ok / total : 0;
  }

  function viewHome() {
    document.title = 'Français A2 · Ejercicios';
    var hero = el('section', { class: 'hero' }, [
      el('p', { class: 'eyebrow', text: 'Édito A2 · Cuaderno interactivo' }),
      el('h1', { html: 'Ejercicios de francés,<br>unidad a unidad.' }),
      el('p', { class: 'lead', text: 'Responde y la web te corrige al momento. Las unidades se irán desbloqueando a medida que avances en el libro.' })
    ]);
    var list = el('ol', { class: 'units' });
    window.UNITS.forEach(function (u) {
      var available = !!u.file;
      var pct = unitProgress(u.n);
      var inner = [
        el('span', { class: 'unit-num', text: String(u.n).padStart(2, '0') }),
        el('span', { class: 'unit-body' }, [
          el('span', { class: 'unit-label', text: 'Ejercicios unidad ' + u.n }),
          el('span', { class: 'unit-title', text: u.title }),
          el('span', { class: 'unit-topic', text: u.topic })
        ]),
        available
          ? el('span', { class: 'unit-side', html: pct !== null ? ring(pct) + '<span class="pct">' + Math.round(pct * 100) + '%</span>' : '<span class="arrow">→</span>' })
          : el('span', { class: 'soon', text: 'Próximamente' })
      ];
      list.appendChild(el('li', null, [available
        ? el('a', { class: 'unit', href: '#/unidad/' + u.n }, inner)
        : el('div', { class: 'unit locked', 'aria-disabled': 'true' }, inner)]));
    });
    // Cargar datos de unidades disponibles para mostrar el progreso real.
    window.UNITS.forEach(function (u) { if (u.file && !window.UNIT_DATA[u.n]) loadUnit(u.n, function () { if (location.hash === '' || location.hash === '#/') render(); }); });
    return [hero, list];
  }

  function viewUnit(data) {
    document.title = 'Unidad ' + data.n + ' · ' + data.title;
    var head = el('section', { class: 'unit-head' }, [
      el('a', { class: 'back', href: '#/', text: '← Todas las unidades' }),
      el('p', { class: 'eyebrow', text: 'Ejercicios unidad ' + data.n }),
      el('h1', { text: data.title }),
      el('p', { class: 'lead', text: data.intro }),
      el('ul', { class: 'goals' }, data.goals.map(function (g) { return el('li', { text: g }); }))
    ]);
    var grid = el('div', { class: 'sets' });
    data.sets.forEach(function (s, idx) {
      var st = setStats(data.n, s);
      var pct = st.ok / st.total;
      grid.appendChild(el('a', { class: 'set' + (st.ok === st.total ? ' complete' : ''), href: '#/unidad/' + data.n + '/' + s.id }, [
        el('span', { class: 'set-top' }, [
          el('span', { class: 'tag tag-' + s.skill.toLowerCase().replace(/[^a-z]/g, ''), text: s.skill }),
          el('span', { class: 'set-count', text: st.ok + '/' + st.total })
        ]),
        el('span', { class: 'set-title', text: (idx + 1) + '. ' + s.title }),
        el('span', { class: 'set-sum', text: s.summary }),
        el('span', { class: 'bar' }, [el('span', { style: 'width:' + (pct * 100) + '%' })])
      ]));
    });
    return [head, grid];
  }

  function viewSet(data, set) {
    document.title = set.title + ' · Unidad ' + data.n;
    var idx = data.sets.indexOf(set);
    var next = data.sets[idx + 1];
    var st = setStats(data.n, set);

    var counter = el('span', { class: 'set-count' });
    var barFill = el('span');
    function refresh() {
      st = setStats(data.n, set);
      counter.textContent = st.ok + ' / ' + st.total + ' correctas';
      barFill.style.width = (st.done / st.total * 100) + '%';
      if (st.done === st.total) finale.classList.add('show');
      finaleScore.textContent = st.ok + ' de ' + st.total;
    }

    var sticky = el('div', { class: 'sticky' }, [
      el('a', { class: 'back', href: '#/unidad/' + data.n, text: '← Unidad ' + data.n }),
      counter,
      el('span', { class: 'bar thin' }, [barFill])
    ]);

    var head = el('section', { class: 'set-head' }, [
      el('span', { class: 'tag tag-' + set.skill.toLowerCase().replace(/[^a-z]/g, ''), text: set.skill }),
      el('h1', { text: set.title }),
      el('p', { class: 'lead', text: set.summary })
    ]);
    var tip = set.tip ? el('details', { class: 'tip', open: '' }, [el('summary', { text: 'Recuerda' }), el('div', { html: set.tip })]) : null;

    var list = el('ol', { class: 'items' });
    set.items.forEach(function (item, i) {
      var k = key(data.n, set.id, i);
      var li = el('li', { class: 'item' + (progress[k] ? ' was-' + progress[k] : '') });
      var q = item.q ? el('p', { class: 'q', html: item.q }) : null;
      var num = el('span', { class: 'num', text: String(i + 1) });
      var body = el('div', { class: 'item-body' }, [q]);
      var r = renderers[item.type];
      if (!r) { body.appendChild(el('p', { class: 'muted', text: 'Tipo de ejercicio desconocido: ' + item.type })); }
      else r(item, function (state) {
        // La primera respuesta correcta queda guardada; un fallo posterior no la borra.
        if (progress[k] === 'ok' && state === 'ko') return;
        progress[k] = state; saveProgress();
        li.className = 'item is-' + state;
        refresh();
      }).forEach(function (n) { body.appendChild(n); });
      li.appendChild(num); li.appendChild(body);
      list.appendChild(li);
    });

    var finaleScore = el('strong');
    var finale = el('section', { class: 'finale' }, [
      el('p', null, ['Has terminado esta serie: ', finaleScore, ' correctas.']),
      el('div', { class: 'finale-actions' }, [
        el('button', { class: 'btn ghost', type: 'button', text: 'Repetir', onclick: function () {
          set.items.forEach(function (_, i) { delete progress[key(data.n, set.id, i)]; });
          saveProgress(); render(); window.scrollTo(0, 0);
        } }),
        next ? el('a', { class: 'btn', href: '#/unidad/' + data.n + '/' + next.id, text: 'Siguiente: ' + next.title + ' →' })
             : el('a', { class: 'btn', href: '#/unidad/' + data.n, text: 'Volver a la unidad' })
      ])
    ]);
    refresh();
    return [sticky, head, tip, list, finale];
  }

  // ---------- Router ----------
  function mount(nodes) {
    app.innerHTML = '';
    nodes.forEach(function (n) { if (n) app.appendChild(n); });
  }
  function render() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (parts[0] === 'unidad' && parts[1]) {
      var n = parseInt(parts[1], 10);
      loadUnit(n, function (data) {
        if (!data) return mount([el('p', { class: 'empty', html: 'Esta unidad todavía no está disponible. <a href="#/">Volver</a>' })]);
        var set = parts[2] && data.sets.filter(function (s) { return s.id === parts[2]; })[0];
        mount(set ? viewSet(data, set) : viewUnit(data));
      });
    } else {
      mount(viewHome());
    }
  }
  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });
  render();

  // ---------- Tema ----------
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var root = document.documentElement;
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('fr-a2-theme', root.dataset.theme); } catch (e) {}
  });
})();
