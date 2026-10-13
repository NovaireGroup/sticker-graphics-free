// Chapter card: tarjeta de capítulo con número grande en contorno, título, subtítulo en cursiva
// serif y una regla fina de progreso que se dibuja de izquierda a derecha. Sale hacia abajo.
import { Grafico, Ease, clamp, tramo, salida, texto, MARGEN } from './nucleo.mjs';

export default class ChapterCard extends Grafico {
  static defaults = { number: '02', title: 'Build the foundation', subtitle: 'Where every good idea starts', position: 'left' };
  static opciones = { position: ['left', 'center', 'right'] };
  static entrada = 1050;

  plantilla() {
    return `
      <div data-r="pos" style="position:absolute;top:50%;">
        <div data-r="caja" style="position:relative;display:flex;align-items:center;gap:3.2cqh;max-width:74cqw;box-sizing:border-box;
          background:var(--superficie);border:var(--borde) solid var(--tinta);border-radius:var(--radio);box-shadow:var(--sombra);
          padding:3cqh 4.4cqh 4.6cqh 3.6cqh;">
          <div data-r="num" style="flex:none;color:transparent;-webkit-text-stroke:1cqh var(--acento);
            font:900 17cqh/0.82 'PackTitulo',sans-serif;font-stretch:122%;letter-spacing:-0.02em;"></div>
          <div style="min-width:0;">
            <div data-r="titulo" style="color:var(--tinta);font:900 5.6cqh/1 'PackTitulo',sans-serif;font-stretch:112%;
              letter-spacing:-0.015em;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;"></div>
            <div data-r="sub" style="margin-top:0.8cqh;color:var(--acento);font:italic 500 4.1cqh/1.08 'PackSerif',serif;
              overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;"></div>
          </div>
          <div style="position:absolute;left:3.6cqh;right:4.4cqh;bottom:2.1cqh;height:0.55cqh;border-radius:0.3cqh;background:var(--tinta);opacity:0.14;"></div>
          <div data-r="regla" style="position:absolute;left:3.6cqh;right:4.4cqh;bottom:2.1cqh;height:0.55cqh;border-radius:0.3cqh;
            background:var(--acento);transform-origin:0 50%;"></div>
        </div>
      </div>`;
  }

  pintar(t, { data, dentro, fuera }) {
    const r = this.r;
    const num = String(data.number ?? '').trim(), sub = String(data.subtitle ?? '').trim();
    texto(r.num, num);
    r.num.style.display = num ? 'block' : 'none';
    texto(r.titulo, String(data.title ?? ''));
    texto(r.sub, sub);
    r.sub.style.display = sub ? '-webkit-box' : 'none';
    const a = data.position;
    Object.assign(r.pos.style, {
      left: a === 'left' ? MARGEN.x : a === 'right' ? 'auto' : '50%',
      right: a === 'right' ? MARGEN.x : 'auto',
      transform: a === 'center' ? 'translate(-50%,-50%)' : 'translateY(-50%)',
    });
    r.caja.style.transformOrigin = a === 'right' ? '100% 50%' : a === 'center' ? '50% 50%' : '0 50%';
    if (dentro === null) return;
    const e = tramo(dentro, 0, 700, (x) => Ease.outBack(x, 1.4));
    const sal = salida(fuera);
    r.caja.style.opacity = String(clamp(e * 3) * sal.o);
    r.caja.style.transform = `translateY(${(1 - e) * 6 + sal.y}cqh) scale(${(0.92 + 0.08 * Math.min(e, 1.04)) * sal.k}) rotate(calc(var(--giro) * ${this.giroDe(r.caja) * (1 - fuera)}))`;
    // el número llega con la tarjeta, el título se escribe pegado a él y el subtítulo cierra
    const n = tramo(dentro, 0, 550, (x) => Ease.outBack(x, 1.6));
    r.num.style.opacity = String(clamp(n * 4));
    r.num.style.transform = `translateY(${(1 - n) * 5}cqh)`;
    const w = tramo(dentro, 80, 450, Ease.outCubic);
    r.titulo.style.clipPath = `inset(-10% ${(1 - w) * 100}% -10% -5%)`;
    r.titulo.style.opacity = w > 0 ? '1' : '0';
    const u = tramo(dentro, 100, 400, Ease.outCubic);
    r.sub.style.opacity = String(u);
    r.sub.style.transform = `translateY(${(1 - u) * 1.5}cqh)`;
    r.regla.style.transform = `scaleX(${tramo(dentro, 150, 900, Ease.inOutCubic)})`;
  }
}
