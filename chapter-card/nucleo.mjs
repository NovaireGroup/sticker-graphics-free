// Núcleo común de los gráficos OGraf del pack (EBU v1). Cada gráfico es una subclase que solo
// declara su HTML (`plantilla`) y cómo se pinta en el instante t (`pintar`); todo lo del estándar
// vive aquí: acciones, agenda, tiempo real y diferido, fuentes y colores de marca.
//
// Regla de oro: el pintado es FUNCIÓN PURA del tiempo. En postproducción (Resolve) el renderizador
// llama a setActionsSchedule() y goToTime(t) en cualquier orden, también hacia atrás; el mismo t
// tiene que dar el mismo fotograma. Nada de estado acumulado entre fotogramas ni de Math.random.
// En directo, el mismo pintado lo mueve requestAnimationFrame.
//
// Unidades: cqw/cqh (el host es `container-type:size`), nunca px ni vw/vh: así el gráfico escala
// con el cuadro que le dé el renderizador.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const Ease = {
  lineal: (x) => x,
  outCubic: (x) => 1 - (1 - x) ** 3,
  inCubic: (x) => x * x * x,
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  outExpo: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
  outBack: (x, s = 1.4) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2,
};
// Salida común del pack a partir de `fuera` (0→1): la tarjeta se encoge hacia su origen como una
// pegatina que se despega y solo se apaga al final. Un fundido largo deja una tarjeta gris
// translúcida flotando, que es lo que se veía antes. y en cqh, k escala, o opacidad.
export const salida = (fuera) => ({
  y: 1.5 * Ease.inCubic(fuera),
  k: 1 - 0.75 * Ease.inOutCubic(fuera),
  o: 1 - clamp((fuera - 0.55) / 0.45),
});
// progreso 0→1 de un tramo que empieza en `desde` ms y dura `dura` ms, con curva
export const tramo = (t, desde, dura, curva = Ease.lineal) => curva(clamp((t - desde) / dura));
// número escrito a mano en el Inspector: acepta "2,4" y "2.4"; si no es número, el valor por defecto
export const num = (v, def = 0) => { const n = Number(String(v ?? '').trim().replace(',', '.')); return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : def; };
// escribe el texto solo si cambia (reescribirlo cada fotograma fuerza un layout por fotograma)
export const texto = (el, s) => { s = String(s ?? ''); if (el.textContent !== s) el.textContent = s; };
// Piezas compartidas para que los 14 sean familia: la pastilla de etiqueta y los márgenes seguros
export const PILL = `display:inline-block;background:var(--tinta);color:var(--superficie);font:700 2cqh/1.2 'PackMono',monospace;
  letter-spacing:0.08em;text-transform:uppercase;padding:0.45cqh 1cqh;border-radius:0.5cqh;white-space:nowrap;`;
export const MARGEN = { x: '5.5cqw', y: '8cqh' };

// Identidad del pack: Archivo ancha y gruesa para titulares, Fraunces
// cursiva para remates y JetBrains Mono para etiquetas. Todas OFL (ver fuentes/OFL.txt).
const FUENTES = [
  ['PackTitulo', 'archivo-latin-wdth-normal.woff2', { weight: '100 900', stretch: '62% 125%' }],
  ['PackSerif', 'fraunces-latin-wght-italic.woff2', { style: 'italic', weight: '100 900' }],
  ['PackMono', 'jetbrains-mono-latin-700-normal.woff2', { weight: '700' }],
];
// Campos de marca que comparten todos los gráficos (cada manifiesto los repite en su schema)
export const MARCA = { acento: '#2e5bff', tinta: '#141414', superficie: '#fffaf0', look: 'sticker' };
// Acabados: la tarjeta de cada gráfico usa var(--borde), var(--sombra) (o --sombra-s si es pequeña),
// var(--radio) y gira calc(var(--giro) * k). Así un solo campo cambia el carácter de todo el pack.
const LOOKS = {
  // la sombra dura va en el más oscuro de tinta y tarjeta: con tarjeta oscura y tinta clara, una
  // sombra del color de la tinta sería una losa crema que parece un fallo de impresión
  sticker: { borde: '0.28cqh', sombra: '0.7cqh 0.85cqh 0 var(--sombra-c)', sombraS: '0.5cqh 0.6cqh 0 var(--sombra-c)', radio: '1.6cqh', giro: '-1.2deg' },
  flat: { borde: '0.28cqh', sombra: 'none', sombraS: 'none', radio: '0.8cqh', giro: '0deg' },
  soft: { borde: '0cqh', sombra: '0 1.4cqh 3.6cqh rgba(0,0,0,0.28)', sombraS: '0 0.8cqh 2cqh rgba(0,0,0,0.25)', radio: '2.2cqh', giro: '0deg' },
};

// color: acepta #RRGGBB, RRGGBB y #RGB en mayúsculas o minúsculas; lo demás, el de por defecto
const hex = (v, def) => {
  let h = String(v ?? '').trim().toLowerCase().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/.test(h)) h = [...h].map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/.test(h) ? '#' + h : def;
};
const luz = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => { const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

export class Grafico extends HTMLElement {
  static defaults = {};      // valores por defecto de los campos propios del gráfico
  // campos de lista: { campo: [valores] } o { campo: { lo_que_se_escribe: valor } }. Resolve 21.1 los
  // enseña como caja de texto, no como desplegable: se acepta lo escrito sin mayúsculas ni espacios y
  // si no casa se usa el valor por defecto
  static opciones = {};
  static salida = 450;       // ms que tarda en salir tras stopAction (para skipAnimation)
  static entrada = 900;      // ms que tarda en entrar (para skipAnimation)

  // ---- a implementar por cada gráfico
  plantilla() { return ''; } // HTML; los nodos que se pintan llevan data-r="nombre" → this.r.nombre
  pintar(t, e) {}            // e = { data, play, stop, dentro, fuera } (ver #estado)

  // ---- API OGraf
  async load({ data = {}, renderType = 'realtime' } = {}) {
    this.base = { ...MARCA, ...this.constructor.defaults, ...data };
    this.renderType = renderType;
    this.agenda = [];
    this.t = 0;
    await this.#fuentes();
    this.style.cssText = 'position:absolute;inset:0;pointer-events:none;container-type:size;overflow:hidden;';
    this.innerHTML = this.plantilla();
    this.r = {};
    for (const n of this.querySelectorAll('[data-r]')) this.r[n.dataset.r] = n;
    if (renderType === 'realtime') {
      this.reloj0 = performance.now();
      this.#pintar(0); // ya oculto antes del primer rAF (que el navegador puede retrasar)
    } else this.#pintar(0);
    return { statusCode: 200 };
  }
  async dispose() { cancelAnimationFrame(this.raf); this.raf = null; this.innerHTML = ''; return { statusCode: 200 }; }
  // en directo, el bucle solo corre mientras hay algo en pantalla; cada acción lo vuelve a arrancar
  #bucle() {
    if (this.raf) return;
    const tic = () => { this.raf = this.#pintar(performance.now() - this.reloj0) ? requestAnimationFrame(tic) : null; };
    this.raf = requestAnimationFrame(tic);
  }

  #ahora() { return this.renderType === 'realtime' ? performance.now() - this.reloj0 : this.t; }
  async playAction(params = {}) {
    // un solo paso (stepCount 1): el destino 0 es entrar; cualquier destino ≥ 1 es salir
    const destino = Number.isInteger(params.goto) && params.goto >= 0 ? params.goto : (this.paso ?? -1) + (params.delta ?? 1);
    if (destino >= 1) { await this.stopAction(params); return { statusCode: 200, currentStep: undefined }; }
    // skipAnimation NO adelanta la hora del evento (lo pondría por detrás de un stop anterior y
    // quedaría anulado): se guarda a su hora y #estado lo da por terminado
    this.agenda.push({ t: this.#ahora(), type: 'playAction', params });
    this.paso = 0;
    this.#repintar();
    return { statusCode: 200, currentStep: 0 };
  }
  async stopAction(params = {}) {
    this.paso = undefined;
    this.agenda.push({ t: this.#ahora(), type: 'stopAction', params });
    this.#repintar();
    // el último fotograma de la salida no puede depender del rAF, que el navegador frena o para si la
    // fuente no está a la vista: se repinta también con un temporizador al terminar la salida
    if (this.renderType === 'realtime') setTimeout(() => this.#pintar(this.#ahora()), params.skipAnimation ? 0 : this.constructor.salida + 30);
    return { statusCode: 200 };
  }
  async updateAction(params = {}) { this.agenda.push({ t: this.#ahora(), type: 'updateAction', params }); this.#repintar(); return { statusCode: 200 }; }
  // en directo, cada acción se pinta al momento y no espera al siguiente rAF
  #repintar() { if (this.renderType === 'realtime') { this.#pintar(this.#ahora()); this.#bucle(); } }
  async customAction() { return { statusCode: 400, statusMessage: 'Sin acciones propias' }; }

  async setActionsSchedule({ schedule = [] } = {}) {
    this.agenda = schedule.map((e) => ({ t: e.timestamp, type: e.action.type, params: e.action.params ?? {} }));
    this.#pintar(this.t);
    return { statusCode: 200 };
  }
  async goToTime({ timestamp = 0 } = {}) { this.t = timestamp; this.#pintar(timestamp); await document.fonts.ready; return { statusCode: 200 }; }

  // ---- estado en t: datos vigentes y cuándo entró/salió. dentro = ms desde la entrada (null si
  // aún no ha entrado), fuera = progreso 0→1 de la salida (0 mientras no ha salido)
  #estado(t) {
    let data = { ...this.base }, play = null, stop = null, saltaEntrada = false, saltaSalida = false;
    // orden estable: a igual hora manda el orden de llegada
    for (const e of this.agenda.map((e, i) => [e, i]).sort((a, b) => a[0].t - b[0].t || a[1] - b[1]).map(([e]) => e)) {
      if (e.t > t) break;
      if (e.type === 'updateAction') data = { ...data, ...(e.params.data ?? {}) };
      if (e.type === 'playAction') { play = e.t; stop = null; saltaEntrada = !!e.params.skipAnimation; }
      if (e.type === 'stopAction' && play !== null) { stop = e.t; saltaSalida = !!e.params.skipAnimation; }
    }
    data = this.#normalizar(data);
    const dentro = play === null ? null : t - play + (saltaEntrada ? this.constructor.entrada : 0);
    const fuera = stop === null ? 0 : saltaSalida ? 1 : clamp((t - stop) / this.constructor.salida);
    return { data, play, stop, dentro, fuera };
  }
  #normalizar(data) {
    const C = this.constructor, defs = { ...MARCA, ...C.defaults };
    for (const k of ['acento', 'tinta', 'superficie']) data[k] = hex(data[k], MARCA[k]);
    for (const [k, ops] of Object.entries({ look: Object.keys(LOOKS), ...C.opciones })) {
      const mapa = Array.isArray(ops) ? Object.fromEntries(ops.map((v) => [v, v])) : ops;
      const crudo = data[k], limpio = String(crudo ?? '').trim().toLowerCase();
      data[k] = crudo in mapa ? mapa[crudo] : limpio in mapa ? mapa[limpio] : defs[k];
    }
    return data;
  }
  // giro de la tarjeta según su anchura: -1,2° en una tarjeta de un tercio del cuadro es una pegatina;
  // en una barra de lado a lado es una barra torcida. Devuelve el factor para calc(var(--giro) * k)
  giroDe(el) { return Math.min(1, (0.3 * this.clientWidth) / Math.max(1, el.offsetWidth)); }

  #pintar(t) {
    const e = this.#estado(t), { acento, tinta, superficie } = e.data;
    this.style.setProperty('--acento', acento);
    this.style.setProperty('--tinta', tinta);
    this.style.setProperty('--superficie', superficie);
    this.style.setProperty('--sombra-c', luz(tinta) < luz(superficie) ? tinta : superficie);
    // texto e iconos SOBRE un relleno de acento: el que más contraste de tinta y tarjeta
    this.style.setProperty('--sobre-acento', contraste(tinta, acento) >= contraste(superficie, acento) ? tinta : superficie);
    const look = LOOKS[e.data.look] ?? LOOKS.sticker;
    this.style.setProperty('--borde', look.borde);
    this.style.setProperty('--sombra', look.sombra);
    this.style.setProperty('--sombra-s', look.sombraS);
    this.style.setProperty('--radio', look.radio);
    this.style.setProperty('--giro', look.giro);
    const visible = e.dentro !== null && e.fuera < 1;
    this.style.visibility = visible ? 'visible' : 'hidden';
    this.pintar(t, e);
    return visible;
  }

  async #fuentes() {
    const base = new URL('./fuentes/', import.meta.url);
    for (const [familia, fichero, desc] of FUENTES) {
      if ([...document.fonts].some((f) => f.family === familia)) continue;
      // si falta fuentes/ (carpeta mal copiada) el gráfico sale igual, con la fuente del sistema
      try { document.fonts.add(await new FontFace(familia, `url(${new URL(fichero, base)})`, desc).load()); }
      catch (err) { console.warn(`Sticker Graphics: no se pudo cargar ${fichero}`, err); }
    }
  }
}
