// Índice de unidades (Édito A2, ed. 2022).
// Para añadir una unidad: crea data/uNN.js (copia la estructura de u01.js)
// y pon aquí su `file`. Las unidades sin `file` salen como "Próximamente".
window.UNITS = [
  { n: 1,  title: 'Nouvelles vies',               topic: 'Parcours de vie et loisirs',   file: 'data/u01.js' },
  { n: 2,  title: 'Je me souviens',               topic: 'Souvenirs et enfance' },
  { n: 3,  title: 'Comme à la maison',            topic: 'Logement et vie quotidienne' },
  { n: 4,  title: 'Tous pareils, tous différents', topic: 'Description et identité' },
  { n: 5,  title: 'En route vers le futur !',     topic: 'Projets et avenir' },
  { n: 6,  title: 'En cuisine',                   topic: 'Alimentation et recettes' },
  { n: 7,  title: 'À votre santé !',              topic: 'Santé et corps' },
  { n: 8,  title: 'Dans les médias',              topic: 'Information et médias' },
  { n: 9,  title: 'Consommer responsable',        topic: 'Consommation' },
  { n: 10, title: 'Envie d’ailleurs ?',           topic: 'Voyages' },
  { n: 11, title: 'De jolis parcours',            topic: 'Études et travail' },
  { n: 12, title: 'Soif de nature',               topic: 'Nature et environnement' }
];

// Cada data/uNN.js se registra aquí.
window.UNIT_DATA = window.UNIT_DATA || {};
