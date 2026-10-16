# Français A2 · Ejercicios

Web estática (HTML + CSS + JS, sin dependencias ni build) con ejercicios de francés basados en los contenidos de *Édito A2* (ed. 2022).

## Verla en local
Abre `index.html` en el navegador, o sirve la carpeta: `python3 -m http.server` y entra en http://localhost:8000.

## Estructura
- `index.html`: página única; las rutas van por `#/unidad/1/<serie>`.
- `css/styles.css`: diseño (claro/oscuro).
- `js/app.js`: motor de ejercicios, corrección inmediata y progreso (localStorage).
- `data/units.js`: índice de las 12 unidades.
- `data/u01.js`: ejercicios de la unidad 1.

## Añadir una unidad
1. Copia `data/u01.js` como `data/u02.js` y cambia `window.UNIT_DATA[1]` por `window.UNIT_DATA[2]`.
2. En `data/units.js`, añade `file: 'data/u02.js'` a la unidad 2.

Tipos de ejercicio: `choice`, `fill`, `write`, `order`, `match`, `listen`, `dictation`, `open` (ver comentario al principio de `data/u01.js`).
