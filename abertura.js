/* ================= ABERTURA NUTRIFIT =================
   A logo BP + halter começa "mole", faz 3 puxadas de treino, ganha definição
   (abdômen no B, bíceps nos arcos, peitoral no P, halter firme e brilhante)
   e aparece a frase de boas-vindas.

   frame(t, opcoes) é uma função pura: devolve o SVG do instante t (em segundos).
   A tela de abertura do app e o vídeo (pasta video/, Remotion) usam este mesmo arquivo,
   então os dois ficam sempre iguais. */
(function (root) {
  const DUR = 3.4;
  const T = {
    reps: [0.82, 1.14, 1.46],   // início de cada puxada
    rep: 0.3,                   // duração de uma puxada
    forte: 1.82,                // ficou forte: impacto + anel
    brilho: [1.9, 2.45],        // reflexo metálico atravessando
    texto: 2.12,                // frase de boas-vindas
    sai: 2.98,                  // saída
  };
  const CURTA = 1.62;           // versão curta começa daqui (logo já forte)

  /* ---------- curvas (nada linear) ---------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const expoOut = p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const quartIn = p => p * p * p * p;
  const quintInOut = p => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2);
  const backOut = p => { const c = 2.2; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  // mola amortecida: 0 → 1 com um leve balanço
  const mola = (t, freq = 9, amort = 0.42) => (t <= 0 ? 0 : 1 - Math.exp(-amort * freq * t) * Math.cos(freq * Math.sqrt(1 - amort * amort) * t));
  const trecho = (t, a, b, e = expoOut) => e(clamp((t - a) / (b - a)));
  const n = v => Math.round(v * 10) / 10;

  /* ---------- cores ---------- */
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const cor = (a, b, p) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})`; };
  const C = {
    azul: ['#56637E', '#2F6BFF'], azulClaro: ['#7D8AA6', '#8FB3FF'], azulEscuro: ['#2A3247', '#0F2D8A'],
    folha: ['#6D8A70', '#33C97A'], folhaEscura: ['#4B6350', '#1E8F55'], suor: '#9FD6FF',
    contorno: '#F4F6FF', preto: '#0B0D14',
  };

  /* ---------- estado no instante t ---------- */
  function estado(t, o) {
    // forma: 0 = mole, 1 = definido. Cada puxada ganha 1/3 na volta (com balanço)
    let f = 0, aperto = 0;
    T.reps.forEach(r => {
      f += backOut(clamp((t - r - T.rep * 0.45) / (T.rep * 0.55))) / 3;
      const p = clamp((t - r) / T.rep);
      aperto = Math.max(aperto, Math.sin(Math.PI * Math.min(1, p / 0.55)) * (p < 0.55 ? 1 : 0));
    });
    const fc = clamp(f);
    const entra = mola(t, 8, 0.5);
    const pulso = (() => { const p = clamp((t - T.forte) / 0.42); return Math.sin(Math.PI * p) * (1 - p); })();
    const sai = o.saida === false ? 0 : trecho(t, T.sai, DUR, quartIn);
    return { t, f, fc, aperto, entra, pulso, sai };
  }

  /* ---------- logo ---------- */
  function logo(s, id) {
    const { f, fc, t } = s, mole = 1 - fc;
    const W = lerp(60, 38, f);                 // espessura das letras
    const inch = mole * 34, cai = mole * 26;   // barriga e caimento
    const join = fc > 0.62 ? 'miter' : 'round';
    const azul = cor(C.azul[0], C.azul[1], fc), azulCl = cor(C.azulClaro[0], C.azulClaro[1], fc);
    const azulEsc = cor(C.azulEscuro[0], C.azulEscuro[1], fc);
    const top = 150 + mole * 8, base = 392 + cai * 0.45;

    // B (na frente) e P (atrás)
    const bMeio = 268 + cai * 0.3;
    const B = `M205 ${n(top)}V${n(base)}M205 ${n(top)}H262C${n(318 + inch)} ${n(top)} ${n(318 + inch)} ${n(bMeio)} 262 ${n(bMeio)}H205` +
      `M205 ${n(bMeio)}H270C${n(332 + inch * 1.3)} ${n(bMeio)} ${n(332 + inch * 1.3)} ${n(base + cai)} 270 ${n(base)}H205`;
    const pMeio = 282 + cai * 0.5;
    const P = `M362 ${n(base)}V${n(top)}H418C${n(478 + inch)} ${n(top)} ${n(478 + inch)} ${n(pMeio)} 418 ${n(pMeio)}H362`;

    // halter: a barra entorta para baixo nas pontas quando está "mole"
    const y0 = 352, d = mole * 36;
    const by = x => { const u = (x - 88) / 424; return (1 - u) ** 2 * (y0 + d) + 2 * u * (1 - u) * (y0 - d * 0.9) + u * u * (y0 + d); };
    const inclina = x => { const u = (x - 88) / 424; const dy = 2 * (1 - u) * (-1.9 * d) + 2 * u * (1.9 * d); return Math.atan2(dy, 424) * 180 / Math.PI; };
    const barra = `M88 ${n(y0 + d)}Q300 ${n(y0 - d * 0.9)} 512 ${n(y0 + d)}`;
    const discos = [[150, 15, 66], [126, 13, 54], [105, 11, 40], [89, 7, 16]];
    const disco = (x, w, h, lado) => {
      const cx = lado < 0 ? x : 600 - x, cy = by(cx), a = inclina(cx);
      const sx = lerp(1.35, 1, fc), sy = lerp(0.8, 1, fc);
      const ww = w * sx, hh = h * sy, r = lerp(ww, 7, fc);
      const aro = h > 20 ? `<rect x="${n(-ww + 5)}" y="${n(-hh + 7)}" width="${n(ww * 2 - 10)}" height="${n(hh * 2 - 14)}" rx="${n(Math.max(2, r - 4))}" fill="none" stroke="${azulCl}" stroke-width="3" opacity="${n(fc * 0.9 * 10) / 10}"/>` : '';
      return `<g transform="translate(${n(cx)} ${n(cy)}) rotate(${n(a)})">
        <rect x="${n(-ww - 3)}" y="${n(-hh - 3)}" width="${n(ww * 2 + 6)}" height="${n(hh * 2 + 6)}" rx="${n(r + 3)}" fill="${C.contorno}"/>
        <rect x="${n(-ww)}" y="${n(-hh)}" width="${n(ww * 2)}" height="${n(hh * 2)}" rx="${n(r)}" fill="url(#${id}Disco)"/>${aro}</g>`;
    };
    const halter = `<path d="${barra}" fill="none" stroke="${C.contorno}" stroke-width="${n(lerp(24, 20, fc))}" stroke-linecap="round"/>
      <path d="${barra}" fill="none" stroke="${azul}" stroke-width="${n(lerp(17, 13, fc))}" stroke-linecap="round"/>
      <path d="${barra}" fill="none" stroke="#DCE6FF" stroke-width="2.5" stroke-linecap="round" transform="translate(0 -3.5)" opacity="${n(fc * 0.8 * 10) / 10}"/>
      ${discos.map(([x, w, h]) => disco(x, w, h, -1) + disco(x, w, h, 1)).join('')}`;

    // folhas: murchas e caídas → abertas e verdes (acordam na 3ª puxada)
    const lf = backOut(clamp((t - T.reps[2] - T.rep * 0.4) / 0.45));
    const folhaCor = cor(C.folha[0], C.folha[1], lf), folhaEsc = cor(C.folhaEscura[0], C.folhaEscura[1], lf);
    const forma = 'M0 0C-24 -30 -20 -80 0 -104C20 -80 24 -30 0 0Z';
    const folha = (ang, esc, atraso) => {
      const a = ang + lerp(58, 0, clamp(lf - atraso * 0.1)) * (ang < 0 ? -1 : 1), k = esc * lerp(0.78, 1, lf);
      return `<g transform="rotate(${n(a)}) scale(${n(k * 100) / 100})">
        <path d="${forma}" fill="${C.contorno}" transform="scale(1.12)"/>
        <path d="${forma}" fill="${folhaCor}"/>
        <path d="M0 -6 L0 -90" stroke="${folhaEsc}" stroke-width="4" stroke-linecap="round"/>
        <path d="M-6 -60C-10 -70 -9 -84 0 -96" stroke="#E8FFF1" stroke-width="3" fill="none" stroke-linecap="round" opacity="${n(lf * 0.7 * 10) / 10}"/></g>`;
    };
    const folhas = `<g transform="translate(436 ${n(top + 4)})">${folha(-38, 0.86, 0)}${folha(8, 1, 1)}</g>`;

    // definição muscular: aparece no fim da 3ª puxada
    const m = trecho(t, T.reps[2] + 0.12, T.forte + 0.1);
    const linha = (d, atraso) => { const p = trecho(t, T.reps[2] + 0.12 + atraso, T.forte + 0.18 + atraso); return `<path d="${d}" fill="none" stroke="#DCE8FF" stroke-width="3.5" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${n((1 - p) * 10) / 10}" opacity="${n(p * 10) / 10}"/>`; };
    const abd = [0, 1, 2].map(i => [0, 1].map(j => {
      const p = trecho(t, T.reps[2] + 0.15 + (i * 2 + j) * 0.035, T.forte + 0.15 + (i * 2 + j) * 0.035, backOut);
      const x = 196 + j * 11, y = top + 128 + i * 26;
      return `<rect x="${x}" y="${n(y)}" width="8" height="18" rx="4" fill="#BFD4FF" opacity="${n(p * 0.85 * 100) / 100}" transform="translate(${x + 4} ${n(y + 9)}) scale(${n(p * 100) / 100}) translate(${-x - 4} ${n(-y - 9)})"/>`;
    }).join('')).join('');
    const musculos = m <= 0 ? '' : `<g>
      ${abd}
      ${linha(`M274 ${n(top - 8)}C300 ${n(top - 4)} 314 ${n(top + 22)} 312 ${n(top + 46)}`, 0)}
      ${linha(`M282 ${n(bMeio - 6)}C312 ${n(bMeio + 2)} 326 ${n(bMeio + 34)} 322 ${n(bMeio + 66)}`, 0.05)}
      ${linha(`M430 ${n(top - 8)}C456 ${n(top - 4)} 470 ${n(top + 22)} 468 ${n(top + 50)}`, 0.08)}
      ${linha(`M372 ${n(top + 8)}H${n(408)}`, 0.12)}</g>`;

    // reflexo metálico
    const bx = lerp(40, 640, trecho(t, T.brilho[0], T.brilho[1], quintInOut));
    const brilhoOn = t > T.brilho[0] && t < T.brilho[1];

    const letra = (d, corpo, interno) => `
      <path d="${d}" fill="none" stroke="${C.contorno}" stroke-width="${n(W + 11)}" stroke-linejoin="${join}" stroke-linecap="square"/>
      <path d="${d}" fill="none" stroke="${corpo}" stroke-width="${n(W)}" stroke-linejoin="${join}" stroke-linecap="square"/>
      ${interno}`;
    const brilho = d => brilhoOn ? `<path d="${d}" fill="none" stroke="url(#${id}Brilho)" stroke-width="${n(W)}" stroke-linejoin="${join}" stroke-linecap="square"/>` : '';

    return `
      <defs>
        <linearGradient id="${id}Disco" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${azulCl}"/><stop offset="0.45" stop-color="${azul}"/><stop offset="1" stop-color="${azulEsc}"/></linearGradient>
        <linearGradient id="${id}Letra" gradientUnits="userSpaceOnUse" x1="0" y1="${n(top - 30)}" x2="0" y2="${n(base + 30)}">
          <stop offset="0" stop-color="${azulCl}"/><stop offset="0.35" stop-color="${azul}"/><stop offset="1" stop-color="${azulEsc}"/></linearGradient>
        <linearGradient id="${id}Brilho" gradientUnits="userSpaceOnUse" x1="${n(bx - 80)}" y1="120" x2="${n(bx + 80)}" y2="420">
          <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      </defs>
      ${halter}
      ${brilhoOn ? `<path d="${barra}" fill="none" stroke="url(#${id}Brilho)" stroke-width="13" stroke-linecap="round"/>` : ''}
      ${folhas}
      ${letra(P, C.preto, `<path d="${P}" fill="none" stroke="${azul}" stroke-width="${n(W * 0.3)}" stroke-linejoin="${join}" stroke-linecap="square"/>`)}
      ${brilho(P)}
      ${letra(B, `url(#${id}Letra)`, '')}
      ${brilho(B)}
      ${musculos}`;
  }

  /* ---------- gotas de suor a cada puxada ---------- */
  function suor(s) {
    if (s.t > T.forte + 0.2) return '';
    const origens = [[180, 210, -1, -0.6], [330, 160, 0.2, -1], [470, 230, 1, -0.5], [120, 330, -1, 0.1]];
    return T.reps.map((r, i) => origens.map(([x, y, vx, vy], j) => {
      const p = clamp((s.t - r - T.rep * 0.4 - j * 0.02) / 0.45); if (p <= 0 || p >= 1) return '';
      const e = expoOut(p), dx = vx * 60 * e, dy = vy * 60 * e + 70 * p * p;
      const ang = Math.atan2(vy * 60 + 140 * p, vx * 60) * 180 / Math.PI - 90;
      return `<path d="M0 -9C5 -2 6 2 6 4A6 6 0 0 1 -6 4C-6 2 -5 -2 0 -9Z" fill="${C.suor}" opacity="${n((1 - p) * 0.9 * 100) / 100}"
        transform="translate(${n(x + dx + i * 6)} ${n(y + dy)}) rotate(${n(ang)}) scale(${n(lerp(1, 0.6, p) * 100) / 100})"/>`;
    }).join('')).join('');
  }

  /* ---------- frase ---------- */
  function texto(s, o) {
    const palavras = (o.titulo || 'Bem-vindo(a)!').split(' ');
    const sub = o.subtitulo == null ? 'DIETA & NUTRIÇÃO' : o.subtitulo;
    let antes = 0;
    const tit = '<text x="300" y="578" text-anchor="middle">' + palavras.map((w, i) => {
      const p = clamp(mola(s.t - T.texto - i * 0.08, 11, 0.55), 0, 1.2), dy = (1 - p) * 34, rel = dy - antes; antes = dy;
      return `<tspan dy="${n(rel)}" fill-opacity="${n(clamp(p) * 100) / 100}">${esc(w)}${i < palavras.length - 1 ? ' ' : ''}</tspan>`;
    }).join('') + '</text>';
    const ps = trecho(s.t, T.texto + 0.22, T.texto + 0.7);
    return `<g font-family="Oswald, 'Arial Narrow', sans-serif" font-weight="600" font-size="48" fill="#F4F4F5" letter-spacing="0.5">${tit}</g>
      ${sub ? `<g opacity="${n(ps * 100) / 100}" transform="translate(0 ${n((1 - ps) * 16)})">
        <line x1="${n(140 - 70 * ps)}" x2="140" y1="626" y2="626" stroke="#33C97A" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="460" x2="${n(460 + 70 * ps)}" y1="626" y2="626" stroke="#33C97A" stroke-width="2.5" stroke-linecap="round"/>
        <text x="300" y="633" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="20" letter-spacing="6" fill="#DDE3F0">${esc(sub)}</text></g>` : ''}`;
  }
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- anel de impacto ---------- */
  function anel(s) {
    const p = clamp((s.t - T.forte) / 0.55); if (p <= 0 || p >= 1) return '';
    const e = expoOut(p);
    return `<circle cx="300" cy="275" r="${n(lerp(150, 330, e))}" fill="none" stroke="#2F6BFF" stroke-width="${n(lerp(10, 1, e))}" opacity="${n((1 - p) * 0.55 * 100) / 100}"/>`;
  }

  /* ---------- quadro completo ---------- */
  function frame(t, o = {}) {
    const s = estado(t, o);
    // gelatina (só enquanto mole), agachada da puxada, impacto ao ficar forte, saída
    const geleia = (1 - s.fc) * Math.sin(t * 15) * 0.03;
    const sx = (0.6 + 0.4 * s.entra) * (1 + geleia + s.aperto * 0.07) * (1 + s.pulso * 0.08) * (1 + s.sai * 0.06);
    const sy = (0.6 + 0.4 * s.entra) * (1 - geleia - s.aperto * 0.1) * (1 + s.pulso * 0.08) * (1 + s.sai * 0.06);
    const ty = (1 - clamp(s.entra)) * 50 + s.aperto * 10 - s.sai * 14;
    const respira = s.t > T.forte + 0.4 ? Math.sin((s.t - T.forte) * 3) * 3 : 0;
    const op = clamp(s.entra * 1.6) * (1 - s.sai);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 660" width="100%" height="100%" role="img" aria-label="NutriFit">
      <g opacity="${n(op * 100) / 100}">
        ${anel(s)}
        <g transform="translate(300 ${n(400 + ty + respira)}) scale(${n(sx * 1000) / 1000} ${n(sy * 1000) / 1000}) translate(-300 -400)">${logo(s, o.id || 'nf')}</g>
        ${suor(s)}
        ${texto(s, o)}
      </g></svg>`;
  }

  const api = { frame, DUR, CURTA, T };
  root.NFAbertura = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
