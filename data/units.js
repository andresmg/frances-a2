// Índice de unidades (Édito A2, ed. 2022).
// Para añadir una unidad: crea data/uNN.js (copia la estructura de u01.js)
// y pon aquí su `file`. Las unidades sin `file` salen como "Próximamente".
window.UNITS = [
  { n: 1,  title: 'Nouvelles vies',               topic: 'Parcours de vie et loisirs',   file: 'data/u01.js' },
  { n: 2,  title: 'Je me souviens',               topic: 'Souvenirs, sens et paysages',  file: 'data/u02.js' },
  { n: 3,  title: 'Comme à la maison',            topic: 'Logement, quartier et comparaison', file: 'data/u03.js' },
  { n: 4,  title: 'Tous pareils, tous différents', topic: 'Physique, caractère et mode', file: 'data/u04.js' },
  { n: 5,  title: 'En route vers le futur !',     topic: 'Futur, technologie et innovations', file: 'data/u05.js' },
  { n: 6,  title: 'En cuisine',                   topic: 'Cuisine, quantités et restaurant', file: 'data/u06.js' },
  { n: 7,  title: 'À votre santé !',              topic: 'Corps, santé et conseils', file: 'data/u07.js' },
  { n: 8,  title: 'Dans les médias',              topic: 'Médias, information et opinion', file: 'data/u08.js' },
  { n: 9,  title: 'Consommer responsable',        topic: 'Achats, environnement, cause et conséquence', file: 'data/u09.js' },
  { n: 10, title: 'Envie d’ailleurs ?',           topic: 'Voyages, hébergement et but', file: 'data/u10.js' },
  { n: 11, title: 'De jolis parcours',            topic: 'Études, travail et parcours', file: 'data/u11.js' },
  { n: 12, title: 'Soif de nature',               topic: 'Nature, planète et hypothèses', file: 'data/u12.js' }
];

// Cada data/uNN.js se registra aquí.
window.UNIT_DATA = window.UNIT_DATA || {};
