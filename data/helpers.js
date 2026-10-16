// Atajos para escribir ejercicios de forma compacta en data/uNN.js.
// En c() y l() la PRIMERA opción es la correcta; el orden se baraja al mostrarlas.
(function () {
  function split(s) { return Array.isArray(s) ? s : String(s).split(' | '); }
  window.X = {
    // selección simple: c('pregunta', ['correcta', 'otra', 'otra'], 'explicación')
    c: function (q, options, explain) { return { type: 'choice', q: q, options: options, answer: 0, shuffle: true, explain: explain }; },
    // rellenar: f('Il {est né} en 1990.', 'naître')
    f: function (text, hint) { return { type: 'fill', text: text, hint: hint }; },
    // escribir: w('pregunta', 'respuesta 1 | respuesta 2', 'pista')
    w: function (q, answers, hint) { return { type: 'write', q: q, answers: split(answers), hint: hint }; },
    // ordenar: o('Je / suis / arrivé / il y a / deux ans / .')
    o: function (tokens, q) { return { type: 'order', q: q || 'Ordena la frase.', tokens: tokens.split(' / ') }; },
    // emparejar: m('pregunta', ['avoir = eu', 'être = été'])
    m: function (q, pairs) { return { type: 'match', q: q, pairs: pairs.map(function (p) { return p.split(' = '); }) }; },
    // escuchar y elegir: l('lo que se oye', 'la otra opción')
    l: function (say, other) { return { type: 'listen', say: say, options: [say].concat(other), answer: 0, shuffle: true }; },
    // dictado: d('frase', 'variante aceptada | otra')
    d: function (say, alts) { return { type: 'dictation', say: say, answers: alts ? [say].concat(split(alts)) : undefined }; },
    // escritura libre con comprobaciones: open('pregunta', 'modelo', [{ label, re }])
    open: function (q, model, checks) { return { type: 'open', q: q, model: model, checks: checks }; },
    // comprobaciones frecuentes
    sentences: function (n) { return { label: 'Al menos ' + n + ' frases', test: function (t) { return (t.match(/[^.!?]+[.!?]/g) || []).length >= n; } }; }
  };
})();
