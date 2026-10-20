/* ================= ABERTURA NUTRIFIT =================
   O B e o P começam gordos, ganham braços, pegam a barra e fazem 3 levantamentos terra.
   A cada subida emagrecem, até voltarem à forma exata da logo. Enquanto isso, o nome
   (BRUNO PERSONAL / NUTRIFIT / DIETA & NUTRIÇÃO) cresce de 0 a 100%.
   No fim os braços recolhem e a imagem vira a própria logo original, pixel a pixel.

   As camadas (letras, halter, textos) são recortes da logo original feitos por
   video/gerar-camadas.py. O app e o vídeo (pasta video/, Remotion) usam este mesmo arquivo:
     const anim = NFAbertura.montar(elemento, {base: 'abertura/', ext: 'webp'});
     await anim.pronto; anim.pintar(segundos);                                      */
(function (root) {
  const DUR = 3.1;
  const T = {
    entra: [0, 0.4],
    bracos: [0.22, 0.6],
    sobe: [[0.62, 1.04], [1.42, 1.84], [2.22, 2.64]],   // 3 subidas do levantamento terra
    desce: [[1.04, 1.4], [1.84, 2.2]],
    nome: [0.45, 2.92],                                 // nome cresce de 0 a 100%
    recolhe: [2.66, 2.92],                              // braços somem
    original: [2.86, 3.06],                             // troca para a logo original
  };
  // posições na logo original (1600 × 1322 px), vindas de abertura/camadas.json
  const C = { logo: [1600, 1322], letras: [379, 77, 1135, 833], halter: [210, 562, 1293, 858], textos: [175, 858, 1425, 1282], escalaMapa: 260 };
  const BARRA_Y = 703, QUEDA = 150;                      // centro da barra e quanto ela desce no chão
  const BASE_LETRAS = 833, CENTRO_X = 757;

  /* ---------- curvas (nada linear) ---------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const expoOut = p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const cubicInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const quintInOut = p => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2);
  const backOut = p => { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const trecho = (t, [a, b], e = expoOut) => e(clamp((t - a) / (b - a)));
  const n = v => Math.round(v * 10) / 10;

  /* ---------- estado no instante t ---------- */
  function estado(t) {
    // postura: 0 = agachado com a barra no chão, 1 = em pé com a barra na altura da logo
    let pose = 0;
    T.sobe.forEach(f => { pose += trecho(t, f, quintInOut); });
    T.desce.forEach(f => { pose -= trecho(t, f, cubicInOut); });
    // gordura: 1 = bem gordo, 0 = forma da logo. Perde 1/3 em cada subida
    const gordo = 1 - T.sobe.reduce((s, f) => s + trecho(t, f, cubicInOut) / 3, 0);
    const entra = trecho(t, T.entra, backOut);
    const bracos = trecho(t, T.bracos, expoOut) * (1 - trecho(t, T.recolhe, cubicInOut));
    const nome = trecho(t, T.nome, cubicInOut);                  // termina exatamente em 1
    const original = trecho(t, T.original, cubicInOut);
    // "puxada": no início de cada subida as letras fazem força (achatam um pouco)
    let forca = 0;
    T.sobe.forEach(([a, b]) => { const p = clamp((t - a) / (b - a)); forca = Math.max(forca, Math.sin(Math.PI * p) * (p < 1 ? 1 : 0)); });
    return { t, pose: clamp(pose), gordo: clamp(gordo), entra, bracos, nome, original, forca };
  }

  /* ---------- braço com cotovelo (cinemática inversa de 2 segmentos) ---------- */
  function braco(ombro, mao, L1, L2, lado) {
    const dx = mao[0] - ombro[0], dy = mao[1] - ombro[1];
    const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.5);
    const a = Math.atan2(dy, dx);
    const b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const ang = a + b * lado;                                     // cotovelo para fora do corpo
    const cot = [ombro[0] + Math.cos(ang) * L1, ombro[1] + Math.sin(ang) * L1];
    const seg = (p, q) => `M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}`;
    return { cot, braco: seg(ombro, cot), antebraco: seg(cot, mao) };
  }

  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, pai) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }
  const img = (src, box, pai, extra = {}) => el('image', { href: src, x: box[0], y: box[1], width: box[2] - box[0], height: box[3] - box[1], preserveAspectRatio: 'none', ...extra }, pai);
  const carrega = src => new Promise(res => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = src; if (i.decode) i.decode().then(res, res); });

  /* ---------- montagem ---------- */
  function montar(alvo, o = {}) {
    const base = o.base || 'abertura/', ext = o.ext || 'png', id = o.id || 'nfab';
    const url = nome => `${base}${nome}.${ext}`;
    alvo.innerHTML = '';
    const svg = el('svg', { viewBox: '0 40 1600 1262', width: '100%', height: '100%', role: 'img', 'aria-label': 'Bruno Personal · NutriFit' }, alvo);
    svg.style.overflow = 'visible';
    const defs = el('defs', {}, svg);
    // letras gordas: deslocamento que "incha" os arcos do B e do P (escala 0 = imagem intacta)
    const [lx0, ly0, lx1, ly1] = C.letras, M = 120;
    const filtro = el('filter', { id: `${id}Gordo`, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse',
      x: lx0 - M, y: ly0 - M, width: lx1 - lx0 + 2 * M, height: ly1 - ly0 + 2 * M, 'color-interpolation-filters': 'sRGB' }, defs);
    // fora do mapa o deslocamento é zero (cinza médio)
    el('feFlood', { 'flood-color': 'rgb(128,128,128)', result: 'neutro' }, filtro);
    el('feImage', { href: `${base}mapa.png`, x: lx0, y: ly0, width: lx1 - lx0, height: ly1 - ly0, preserveAspectRatio: 'none', result: 'img' }, filtro);
    el('feComposite', { in: 'img', in2: 'neutro', operator: 'over', result: 'mapa' }, filtro);
    const desloca = el('feDisplacementMap', { in: 'SourceGraphic', in2: 'mapa', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G' }, filtro);
    // barra (desenhada igual à da logo: tubo azul com contorno branco)
    const grad = el('linearGradient', { id: `${id}Barra`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    [['0', '#1F8BFF'], ['0.28', '#47B4FC'], ['0.5', '#0B5FD0'], ['1', '#00205A']].forEach(([of, c]) => el('stop', { offset: of, 'stop-color': c }, grad));
    const pele = { B: ['#1A5CF0', '#6FA6FF'], P: ['#0E1118', '#2F6BFF'] };   // cor do braço e do reflexo (B azul, P preto)

    const cena = el('g', {}, svg);
    const textos = el('g', {}, cena); img(url('textos'), C.textos, textos);
    const tubo = (pai, x0, x1) => {
      const g = el('g', {}, pai);
      el('rect', { x: x0, y: BARRA_Y - 21, width: x1 - x0, height: 42, rx: 21, fill: '#F4F6FF' }, g);
      el('rect', { x: x0 + 3, y: BARRA_Y - 17, width: x1 - x0 - 6, height: 34, rx: 17, fill: '#030406' }, g);
      el('rect', { x: x0 + 6, y: BARRA_Y - 13, width: x1 - x0 - 12, height: 26, rx: 13, fill: `url(#${id}Barra)` }, g);
      return g;
    };
    const barraAtras = el('g', {}, cena); tubo(barraAtras, 440, 1060);
    const letras = el('g', {}, cena);
    const letrasImg = img(url('letras'), C.letras, letras, { filter: `url(#${id}Gordo)` });
    const halter = el('g', {}, cena);
    tubo(halter, 440, 668); tubo(halter, 858, 1056);             // trechos da barra que ficam na frente
    img(url('halter'), C.halter, halter);
    // braços
    const mkBraco = lado => {
      const g = el('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, cena);
      return {
        g,
        // ordem: contornos brancos atrás, depois a cor (assim o contorno não corta o cotovelo)
        c1: el('path', { stroke: '#F4F6FF' }, g), c2: el('path', { stroke: '#F4F6FF' }, g),
        cb: el('ellipse', { fill: '#F4F6FF' }, g),
        b1: el('path', { stroke: pele[lado][0] }, g), b2: el('path', { stroke: pele[lado][0] }, g),
        biceps: el('ellipse', { fill: pele[lado][0] }, g),
        brilho: el('path', { stroke: pele[lado][1], 'stroke-width': 6, opacity: 0.8 }, g),
        linha: el('path', { stroke: pele[lado][1], 'stroke-width': 4, opacity: 0 }, g),
        mao: el('circle', { fill: pele[lado][0], stroke: '#F4F6FF', 'stroke-width': 7 }, g),
        dedos: el('path', { stroke: pele[lado][1], 'stroke-width': 3.5, opacity: 0.9 }, g),
      };
    };
    const BB = mkBraco('B'), BP = mkBraco('P');
    const final = img(url('logo'), [0, 0, 1600, 1322], svg, { opacity: 0 });

    function pintar(t) {
      const s = estado(t), g = s.gordo, baixo = 1 - s.pose;
      // corpo das letras: agacha (desce e achata) quando a barra está no chão; mais largo quando gordo
      const geleia = g * Math.sin(t * 13) * 0.025;
      const sx = (1 + 0.14 * g + geleia + s.forca * 0.03 * g) * lerp(0.7, 1, s.entra);
      const sy = (1 - 0.1 * baixo - geleia - s.forca * 0.04) * lerp(0.7, 1, s.entra);
      const dy = 66 * baixo + (1 - s.entra) * 60;
      const tLetras = `translate(${CENTRO_X} ${n(BASE_LETRAS + dy)}) scale(${(sx).toFixed(4)} ${(sy).toFixed(4)}) translate(${-CENTRO_X} ${-BASE_LETRAS})`;
      letras.setAttribute('transform', tLetras);
      letras.setAttribute('opacity', clamp(s.entra * 1.5).toFixed(3));
      desloca.setAttribute('scale', n(C.escalaMapa * g));
      if (g <= 0.001) letrasImg.removeAttribute('filter'); else if (!letrasImg.getAttribute('filter')) letrasImg.setAttribute('filter', `url(#${id}Gordo)`);
      // halter: no chão quando agachado, sobe junto com as mãos
      const by = QUEDA * baixo;
      halter.setAttribute('transform', `translate(0 ${n(by)})`);
      barraAtras.setAttribute('transform', `translate(0 ${n(by)})`);
      halter.setAttribute('opacity', clamp(s.entra * 2).toFixed(3));
      barraAtras.setAttribute('opacity', clamp(s.entra * 2).toFixed(3));
      // braços: saem do lado do B e do lado do P e seguram a barra
      const ponto = (x, y) => [CENTRO_X + (x - CENTRO_X) * sx, BASE_LETRAS + dy + (y - BASE_LETRAS) * sy];
      const grossura = lerp(44, 74, g);
      [[BB, ponto(405, 500), [486, BARRA_Y + by], 1], [BP, ponto(1112, 500), [1034, BARRA_Y + by], -1]].forEach(([b, ombro, mao, lado]) => {
        const k = s.bracos;
        b.g.setAttribute('opacity', clamp(k * 3).toFixed(3));
        if (k <= 0.001) { b.g.setAttribute('display', 'none'); return; }
        b.g.removeAttribute('display');
        const L = 160 * lerp(0.35, 1, k);
        const alvoMao = [lerp(ombro[0], mao[0], k), lerp(ombro[1], mao[1], k)];
        const r = braco(ombro, alvoMao, L, L, lado), cot = r.cot;
        const W1 = grossura * k, W2 = grossura * 0.78 * k;
        [b.c1, b.b1].forEach(p => p.setAttribute('d', r.braco)); [b.c2, b.b2].forEach(p => p.setAttribute('d', r.antebraco));
        b.c1.setAttribute('stroke-width', n(W1 + 14)); b.b1.setAttribute('stroke-width', n(W1));
        b.c2.setAttribute('stroke-width', n(W2 + 14)); b.b2.setAttribute('stroke-width', n(W2));
        b.brilho.setAttribute('d', r.braco);
        b.brilho.setAttribute('transform', `translate(${n(lado * -W1 * 0.24)} ${n(-W1 * 0.2)})`);
        // músculo do braço: "pelanca" caída quando gordo → bíceps marcado quando forte
        const forte = clamp((1 - g) * 1.3);
        const mx = lerp(ombro[0], cot[0], 0.5), my = lerp(ombro[1], cot[1], 0.5);
        const ang = Math.atan2(cot[1] - ombro[1], cot[0] - ombro[0]) * 180 / Math.PI;
        const lado_m = -lado * lerp(-0.45, 0.42, forte);              // gordo: pende para baixo; forte: sobe como bíceps
        const rx = W1 * lerp(0.95, 0.8, forte), ry = W1 * lerp(0.62, 0.62, forte);
        const tr = `translate(${n(mx)} ${n(my)}) rotate(${n(ang)}) translate(0 ${n(lado_m * W1)})`;
        [b.cb, b.biceps].forEach(e => e.setAttribute('transform', tr));
        b.cb.setAttribute('rx', n(rx + 7)); b.cb.setAttribute('ry', n(ry + 7));
        b.biceps.setAttribute('rx', n(rx)); b.biceps.setAttribute('ry', n(ry));
        b.linha.setAttribute('d', `M${n(-rx * 0.5)} ${n(-lado * ry * 0.1)}Q0 ${n(lado * ry * 0.55)} ${n(rx * 0.55)} ${n(-lado * ry * 0.05)}`);
        b.linha.setAttribute('transform', tr); b.linha.setAttribute('opacity', (forte * 0.9).toFixed(3));
        const R = lerp(28, 36, g) * k;
        b.mao.setAttribute('cx', n(alvoMao[0])); b.mao.setAttribute('cy', n(alvoMao[1])); b.mao.setAttribute('r', n(R));
        b.dedos.setAttribute('d', [-0.45, 0, 0.45].map(f => `M${n(alvoMao[0] + f * R)} ${n(alvoMao[1] - R * 0.75)}V${n(alvoMao[1] + R * 0.1)}`).join(''));
      });
      // nome: cresce de 0 a 100% (termina exatamente no tamanho da logo)
      const z = s.nome, [tx0, ty0, tx1, ty1] = C.textos, cx = (tx0 + tx1) / 2, cy = (ty0 + ty1) / 2;
      textos.setAttribute('transform', z >= 1 ? '' : `translate(${cx} ${cy}) scale(${z.toFixed(4)}) translate(${-cx} ${-cy})`);
      textos.setAttribute('opacity', clamp(z * 4).toFixed(3));
      // final: a própria logo original por cima
      final.setAttribute('opacity', s.original.toFixed(3));
      cena.setAttribute('opacity', s.original >= 1 ? '0' : '1');
    }
    const pronto = Promise.all([...['letras', 'halter', 'textos', 'logo'].map(nm => carrega(url(nm))), carrega(`${base}mapa.png`)]);
    return { svg, pintar, pronto };
  }

  const api = { montar, estado, DUR, T, C };
  root.NFAbertura = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
