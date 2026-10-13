// Callout: tarjeta con etiqueta que señala un punto del cuadro. Una flecha se dibuja desde la
// tarjeta hasta el objetivo (stroke-dashoffset), remata en una punta rellena con borde de tinta y
// acaba en un anillo que late en bucle. Al salir, la flecha se recoge hacia la tarjeta y el anillo
// se encoge. Todo es función pura de t. La tarjeta se coloca a un lado del objetivo y se mantiene
// dentro de los márgenes.
import { Grafico, Ease, clamp, tramo, salida, num, texto, MARGEN } from './nucleo.mjs';

const pop = (x) => Ease.outBack(x, 1.6);
// el SVG ocupa el cuadro con viewBox 1600×900: 16 unidades por cqw, 9 por cqh
const UX = 16, UY = 9;
const R_ANILLO = 24, GAP_CARTA = 10, L_PUNTA = 36, A_PUNTA = 17;
const MX = parseFloat(MARGEN.x), MY = parseFloat(MARGEN.y);
const trazo = (n, ancho, color) => `<path data-r="${n}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1"/>`;

export default class Callout extends Grafico {
  static defaults = { text: 'Check this setting', sub: 'It changes everything', targetX: 62, targetY: 38, position: 'left', ring: 'yes' };
  static opciones = { position: ['left', 'right'], ring: ['yes', 'no'] };
  static entrada = 1100;

  plantilla() {
    return `
      <svg data-r="svg" viewBox="0 0 1600 900" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:100cqw;height:100cqh;overflow:visible;">
        ${trazo('lineaT', 12, 'var(--tinta)')}${trazo('linea', 5.5, 'var(--acento)')}
        <path data-r="punta" fill="var(--acento)" stroke="var(--tinta)" stroke-width="6" stroke-linejoin="round"/>
        <circle data-r="pulso" fill="none" stroke="var(--acento)" stroke-width="3.5"/>
        <circle data-r="anilloT" fill="none" stroke="var(--tinta)" stroke-width="11"/>
        <circle data-r="anillo" fill="none" stroke="var(--acento)" stroke-width="5"/>
        <circle data-r="punto" fill="var(--acento)" stroke="var(--tinta)" stroke-width="3"/>
      </svg>
      <div data-r="caja" style="position:absolute;left:0;top:0;width:max-content;max-width:34cqw;background:var(--superficie);
        border:var(--borde) solid var(--tinta);border-radius:var(--radio);box-shadow:var(--sombra);
        padding:1.7cqh 2.3cqh 1.9cqh;box-sizing:border-box;transform-origin:50% 50%;">
        <div data-r="texto" style="color:var(--tinta);font:850 4.4cqh/1.05 'PackTitulo',sans-serif;font-stretch:110%;letter-spacing:-0.02em;
          overflow-wrap:anywhere;text-wrap:balance;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;"></div>
        <div data-r="sub" style="margin-top:0.6cqh;color:var(--acento);font:italic 500 3.4cqh/1.1 'PackSerif',serif;
          overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;"></div>
      </div>`;
  }

  pintar(t, { data, dentro, fuera }) {
    const r = this.r;
    const cuerpo = String(data.text ?? '').trim(), sub = String(data.sub ?? '').trim();
    texto(r.texto, cuerpo);
    r.texto.style.display = cuerpo ? '-webkit-box' : 'none';
    texto(r.sub, sub);
    r.sub.style.display = sub ? '-webkit-box' : 'none';
    r.caja.style.display = cuerpo || sub ? 'block' : 'none';

    // colocación de la tarjeta (en cqw/cqh): a un lado del objetivo, arriba o abajo según la mitad
    // del cuadro, y dentro de los márgenes. Si no cabe en su lado se pasa al otro.
    const W = this.offsetWidth || 1920, H = this.offsetHeight || 1080;
    const w = r.caja.offsetWidth / W * 100, h = r.caja.offsetHeight / H * 100;
    const tx = clamp(num(data.targetX, 62), 0, 100), ty = clamp(num(data.targetY, 38), 0, 100);
    const cabeIzq = tx - GAP_CARTA - w >= MX, cabeDer = tx + GAP_CARTA + w <= 100 - MX;
    let izq = data.position !== 'right';
    if (izq && !cabeIzq && cabeDer) izq = false; else if (!izq && !cabeDer && cabeIzq) izq = true;
    const x = clamp(izq ? tx - GAP_CARTA - w : tx + GAP_CARTA, MX, Math.max(MX, 100 - MX - w));
    const y = clamp(ty + (ty > 50 ? -15 : 15) - h / 2, MY, Math.max(MY, 100 - MY - h));
    r.caja.style.left = `${x}cqw`;
    r.caja.style.top = `${y}cqh`;

    // geometría de la flecha en unidades del SVG: del punto de la tarjeta más cercano al objetivo
    // hasta el borde del anillo; curva cuadrática con un arco suave. El trazo acaba bajo la punta.
    const con = data.ring !== 'no';
    const P = { x: tx * UX, y: ty * UY };
    const S = { x: clamp(P.x, x * UX, (x + w) * UX), y: clamp(P.y, y * UY, (y + h) * UY) };
    const len = Math.hypot(P.x - S.x, P.y - S.y), ux = (P.x - S.x) / (len || 1), uy = (P.y - S.y) / (len || 1);
    const rE = con ? R_ANILLO + 8 : 10;
    const hay = len > rE + L_PUNTA + 30 && !!(cuerpo || sub);
    const E = { x: P.x - ux * rE, y: P.y - uy * rE };
    const dist = Math.hypot(E.x - S.x, E.y - S.y), arco = 0.16 * dist * (izq ? 1 : -1);
    const C = { x: (S.x + E.x) / 2 - uy * arco, y: (S.y + E.y) / 2 + ux * arco };
    const tn = Math.hypot(E.x - C.x, E.y - C.y) || 1, tdx = (E.x - C.x) / tn, tdy = (E.y - C.y) / tn;
    const B = { x: E.x - tdx * L_PUNTA * 0.6, y: E.y - tdy * L_PUNTA * 0.6 };
    const d = `M${S.x},${S.y} Q${C.x},${C.y} ${B.x},${B.y}`;
    for (const n of ['lineaT', 'linea']) r[n].setAttribute('d', d);
    for (const n of ['pulso', 'anilloT', 'anillo', 'punto']) { r[n].setAttribute('cx', P.x); r[n].setAttribute('cy', P.y); }
    if (dentro === null) return;

    const e = tramo(dentro, 0, 700, (v) => Ease.outBack(v, 1.4));
    const sal = salida(fuera);
    r.caja.style.opacity = String(tramo(dentro, 0, 90) * sal.o);
    r.caja.style.transform = `translateY(${(1 - e) * 5 + sal.y}cqh) scale(${(0.92 + 0.08 * Math.min(e, 1.04)) * sal.k}) rotate(calc(var(--giro) * ${this.giroDe(r.caja) * (1 - fuera)}))`;

    // flecha: se dibuja tras la tarjeta, la punta salta al llegar y el anillo late en bucle. Al salir
    // se deshace en orden inverso: punta, trazo (hacia la tarjeta) y anillo, a la vez que la tarjeta.
    const pl = hay ? tramo(dentro, 250, 520, Ease.inOutCubic) * (1 - tramo(fuera, 0.1, 0.6, Ease.inOutCubic)) : 0;
    const pp = hay ? tramo(dentro, 700, 240, pop) * (1 - tramo(fuera, 0, 0.3)) : 0;
    for (const n of ['lineaT', 'linea']) {
      r[n].style.strokeDashoffset = String(1 - pl);
      r[n].style.display = pl > 0 ? 'inline' : 'none';
    }
    const k = Math.max(pp, 0), ala = (s) => `${E.x - tdx * L_PUNTA * k - tdy * A_PUNTA * k * s},${E.y - tdy * L_PUNTA * k + tdx * A_PUNTA * k * s}`;
    r.punta.setAttribute('d', `M${E.x},${E.y} L${ala(1)} L${ala(-1)} Z`);
    r.punta.style.display = k > 0.01 ? 'inline' : 'none';
    const ra = (con ? tramo(dentro, 700, 450, pop) : 0) * (1 - tramo(fuera, 0.2, 0.5, Ease.inOutCubic));
    const ciclo = dentro < 1150 ? 0 : ((dentro - 1150) % 1500) / 1500;
    r.anilloT.setAttribute('r', R_ANILLO * ra);
    r.anillo.setAttribute('r', R_ANILLO * ra);
    r.punto.setAttribute('r', 7 * ra);
    r.pulso.setAttribute('r', R_ANILLO + 26 * Ease.outCubic(ciclo));
    r.pulso.style.opacity = String(ra > 0 && dentro >= 1150 ? 0.9 * (1 - ciclo) * (1 - clamp(fuera * 3)) : 0);
    for (const n of ['anilloT', 'anillo', 'punto']) r[n].style.display = ra > 0 ? 'inline' : 'none';
  }
}
