// Lower third: tarjeta con etiqueta, nombre y cargo. Entra con rebote, el cargo se escribe de
// izquierda a derecha y sale hacia abajo.
import { Grafico, Ease, clamp, tramo, salida, texto, PILL, MARGEN } from './nucleo.mjs';

export default class LowerThird extends Grafico {
  static defaults = { label: 'Guest', name: 'Alex Morgan', role: 'Founder, Studio North', position: 'bottom-left' };
  static opciones = { position: ['bottom-left', 'bottom-right'] };
  static entrada = 1150;

  plantilla() {
    return `
      <div data-r="caja" style="position:absolute;bottom:${MARGEN.y};max-width:62cqw;background:var(--superficie);
        border:var(--borde) solid var(--tinta);border-radius:var(--radio);box-shadow:var(--sombra);
        padding:1.7cqh 2.4cqh 1.9cqh;box-sizing:border-box;">
        <div data-r="label" style="${PILL}margin-bottom:1cqh;"></div>
        <div data-r="name" style="color:var(--tinta);font:900 4.4cqh/1 'PackTitulo',sans-serif;
          font-stretch:112%;letter-spacing:-0.015em;overflow-wrap:anywhere;"></div>
        <div data-r="role" style="margin-top:0.4cqh;color:var(--acento);font:italic 500 4.5cqh/1.05 'PackSerif',serif;"></div>
      </div>`;
  }

  pintar(t, { data, dentro, fuera }) {
    const r = this.r;
    texto(r.label, data.label);
    r.label.style.display = data.label ? 'inline-block' : 'none';
    texto(r.name, data.name);
    texto(r.role, data.role);
    r.role.style.display = data.role ? 'block' : 'none';
    const der = data.position === 'bottom-right';
    Object.assign(r.caja.style, { left: der ? 'auto' : MARGEN.x, right: der ? MARGEN.x : 'auto', transformOrigin: der ? '100% 100%' : '0 100%' });
    if (dentro === null) return;
    const e = tramo(dentro, 0, 700, (x) => Ease.outBack(x, 1.4));
    const sal = salida(fuera);
    const w = tramo(dentro, 100, 450);
    r.caja.style.opacity = String(clamp(e * 3) * sal.o);
    r.caja.style.transform = `translateY(${(1 - e) * 6 + sal.y}cqh) scale(${(0.92 + 0.08 * Math.min(e, 1.04)) * sal.k}) rotate(calc(var(--giro) * ${this.giroDe(r.caja) * (1 - fuera)}))`;
    // el cargo se escribe de izquierda a derecha, como una mano
    r.role.style.clipPath = `inset(-20% ${(1 - w) * 100}% -20% -5%)`;
    r.role.style.opacity = w > 0 ? '1' : '0'; // sin esto el -5 % de la izquierda deja ver una astilla
  }
}
