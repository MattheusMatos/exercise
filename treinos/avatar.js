/*
 * Avatares do app, desenhados em SVG: duas meninas e dois meninos.
 *
 *   força 0–5   sobe com a ofensiva: ombros, braços e pernas crescem (nas meninas,
 *               mais quadril e pernas, o foco do treino feminino)
 *   humor       animado e bem (treinou há pouco), triste e cabisbaixo, magro (perdeu
 *               músculo) e sedentário (barriga, celular na mão), conforme os dias sem treinar
 *
 * desenhar({ avatar, forca, humor }) devolve o SVG em texto; chama(estado) devolve o fogo
 * da ofensiva. No navegador fica em window.Avatar; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  const AVATARES = {
    'menina-1': { genero: 'f', pele: '#f2c4a0', cabelo: '#6b3a22', penteado: 'rabo', roupa: '#ff5d8f', roupa2: '#3a3f63', tenis: '#ffffff', detalhe: '#ffd166' },
    'menina-2': { genero: 'f', pele: '#8d5a3b', cabelo: '#1e130d', penteado: 'coque', roupa: '#2ec4b6', roupa2: '#2b2d42', tenis: '#ff6b35', detalhe: '#ff5d8f' },
    'menino-1': { genero: 'm', pele: '#e2b07c', cabelo: '#3a271b', penteado: 'curto', roupa: '#ff6b35', roupa2: '#2b2f3a', tenis: '#ffffff', detalhe: '#12141a' },
    'menino-2': { genero: 'm', pele: '#5e3b25', cabelo: '#120c08', penteado: 'crespo', roupa: '#4ea3ff', roupa2: '#1d2433', tenis: '#ffd166', detalhe: '#12141a' },
  };
  const TINTA = '#2a1a14';
  const n = (v) => Math.round(v * 10) / 10;

  function medidas(a, forca, humor) {
    const f = Math.max(0, Math.min(5, forca));
    const m = a.genero === 'm';
    let c = m
      ? { ombro: 19 + 3 * f, cintura: 14 + 0.8 * f, quadril: 15 + 0.6 * f, braco: 8 + 1.4 * f, perna: 10 + 1.2 * f, biceps: 4.5 + 1.5 * f, pescoco: 6.5 + 0.8 * f }
      : { ombro: 17 + 1.4 * f, cintura: 13 + 0.3 * f, quadril: 18 + 2.2 * f, braco: 7 + 0.6 * f, perna: 10.5 + 2 * f, biceps: 3.5 + 0.7 * f, pescoco: 6 + 0.3 * f };
    if (humor === 'magro') {
      c = { ombro: m ? 15.5 : 14.5, cintura: 12, quadril: m ? 12.5 : 14.5, braco: 5.5, perna: 7.5, biceps: 0, pescoco: 5 };
    } else if (humor === 'sedentario') {
      c = { ombro: m ? 20 : 17, cintura: m ? 20 : 18.5, quadril: m ? 18 : 20, braco: 8.5, perna: 11, biceps: 0, pescoco: 7, barriga: true };
    }
    return { ...c, f, m };
  }

  function pose(humor, forca) {
    if (humor === 'animado') return forca >= 1 ? 'flexionando' : 'acenando';
    if (humor === 'novo') return 'acenando';
    if (humor === 'bem') return 'cintura';
    if (humor === 'sedentario') return 'celular';
    return 'caido';
  }

  // Ombro, cotovelo e mão de um braço; lado -1 é o esquerdo da tela.
  function braco(lado, tipo, c, yOmbro, yCintura) {
    const sx = 60 + lado * (c.ombro - c.braco * 0.45);
    const sy = yOmbro + 4;
    const p = (dx, dy) => [sx + lado * dx, sy + dy];
    if (tipo === 'flexionando') return [[sx, sy], p(15 + c.f * 1.3, 1), p(12 + c.f, -19)];
    if (tipo === 'acenando') return [[sx, sy], p(15, -9), p(21, -26)];
    if (tipo === 'cintura') return [[sx, sy], p(12 + c.f * 0.8, 15), [60 + lado * (c.cintura + 3), yCintura - 5]];
    if (tipo === 'celular') return [[sx, sy], p(2, 18), [60 + lado * 4, sy + 24]];
    return [[sx, sy], p(2.5, 19), p(3.5, 37)];
  }

  function cabelo(a, atras) {
    const cor = a.cabelo;
    if (a.penteado === 'rabo') {
      return atras
        ? `<path d="M76 18c12-4 20 6 17 20-2 9-8 14-12 15 3-8 4-16 1-22z" fill="${cor}"/><circle cx="79" cy="18" r="3.2" fill="${a.detalhe}"/>`
        : `<path d="M37.5 37C35 18 46 11 60 11s25.5 7 22.5 26c-3-8-8-13-14-15-5 5-14 8-25 8-2 2-4 4-6 7z" fill="${cor}"/>`;
    }
    if (a.penteado === 'coque') {
      return atras
        ? `<circle cx="60" cy="8" r="10.5" fill="${cor}"/><circle cx="51.5" cy="12" r="5" fill="${cor}"/><circle cx="68.5" cy="12" r="5" fill="${cor}"/>`
        : `<path d="M37.5 38C35 19 45 12 60 12s25 7 22.5 26c-2-6-5-10-9-12-4 3-9 4-13.5 4s-9.5-1-13.5-4c-4 2-7 6-9 12z" fill="${cor}"/>`
          + [[41, 27], [45, 20], [52, 16], [60, 15], [68, 16], [75, 20], [79, 27]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="${cor}"/>`).join('');
    }
    if (a.penteado === 'crespo') {
      if (atras) return '';
      return `<path d="M38.5 33C37 15 47 9 60 9s23 6 21.5 24c-2-5-4.5-8-8-9.5-4 1.5-8.5 2-13.5 2s-9.5-.5-13.5-2c-3.5 1.5-6 4.5-8 9.5z" fill="${cor}"/>`
        + [[42, 22], [48, 15], [56, 12], [64, 12], [72, 15], [78, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="${cor}"/>`).join('');
    }
    if (atras) return '';
    return `<path d="M38 34C36 16 46 10 60 10s24 6 22 24c-2-6-6-10-11-11-6 3-15 4-23 3-4 1-8 4-10 8z" fill="${cor}"/><path d="M58 13c4-2 12-1 16 3" stroke="${cor}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  }

  function rosto(humor) {
    const blush = '<circle cx="47" cy="44" r="3.6" fill="#ff7a8a" opacity=".45"/><circle cx="73" cy="44" r="3.6" fill="#ff7a8a" opacity=".45"/>';
    const olho = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${TINTA}"/><circle cx="${n(x + r * 0.35)}" cy="${n(y - r * 0.4)}" r="${n(r * 0.35)}" fill="#fff"/>`;
    if (humor === 'animado') {
      return blush
        + `<path d="M47.5 38.5q4.5-5 9 0M63.5 38.5q4.5-5 9 0" stroke="${TINTA}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`
        + `<path d="M51 45h18q-1.5 9-9 9t-9-9z" fill="${TINTA}"/><path d="M55 50.5q5-3 10 0q-2 3.5-5 3.5t-5-3.5z" fill="#ff7a8a"/>`;
    }
    if (humor === 'bem' || humor === 'novo') {
      return blush + olho(52, 37.5, 2.8) + olho(68, 37.5, 2.8)
        + `<path d="M53.5 46q6.5 6 13 0" stroke="${TINTA}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
    }
    const sobrancelhas = `<path d="M46.5 31.5l8-3M73.5 31.5l-8-3" stroke="${TINTA}" stroke-width="2" stroke-linecap="round"/>`;
    if (humor === 'sedentario') {
      return `<path d="M48 38.5h8M64 38.5h8" stroke="${TINTA}" stroke-width="2.4" stroke-linecap="round"/>`
        + '<path d="M48.5 42q3.5 2 7 0M64.5 42q3.5 2 7 0" stroke="#000" stroke-opacity=".25" stroke-width="1.6" stroke-linecap="round" fill="none"/>'
        + `<path d="M53.5 49q3.2-2 6.5 0t6.5 0" stroke="${TINTA}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
    }
    const lagrima = humor === 'magro' ? '<path d="M49.5 42.5q-2.5 4 0 5.5t2.5-1.5q0-1.5-2.5-4z" fill="#7cc6ff"/>' : '';
    return sobrancelhas + olho(52, 39, 2.5) + olho(68, 39, 2.5) + lagrima
      + `<path d="M54 50q6-5 12 0" stroke="${TINTA}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
  }

  function estrela(x, y, r, cor) {
    return `<path d="M${x} ${n(y - r)}Q${n(x + r * 0.2)} ${n(y - r * 0.2)} ${n(x + r)} ${y}Q${n(x + r * 0.2)} ${n(y + r * 0.2)} ${x} ${n(y + r)}Q${n(x - r * 0.2)} ${n(y + r * 0.2)} ${n(x - r)} ${y}Q${n(x - r * 0.2)} ${n(y - r * 0.2)} ${x} ${n(y - r)}z" fill="${cor}"/>`;
  }

  function desenhar({ avatar, forca = 0, humor = 'bem' }) {
    const a = AVATARES[avatar] || AVATARES['menino-1'];
    const c = medidas(a, forca, humor);
    const cabisbaixo = ['triste', 'magro', 'sedentario'].includes(humor);
    const yOmbro = 66 + (cabisbaixo ? 3 : 0);
    const yCintura = 101;
    const yQuadril = 108;
    const yTornozelo = 141;
    const tipo = pose(humor, c.f);
    const partes = [];

    partes.push('<ellipse cx="60" cy="150" rx="31" ry="4.5" fill="#000" opacity=".28"/>');
    partes.push(cabelo(a, true));

    // Pernas e tênis.
    const afastamento = c.m ? Math.max(c.cintura * 0.55, c.perna * 0.62 + 1) : c.quadril * 0.5;
    const corPerna = c.m ? a.pele : a.roupa2;
    for (const lado of [-1, 1]) {
      const x = 60 + lado * afastamento;
      partes.push(`<path d="M${n(x)} ${yQuadril - 4}L${n(x + lado * 1.2)} ${yTornozelo}" stroke="${corPerna}" stroke-width="${n(c.perna)}" stroke-linecap="round"/>`);
      partes.push(`<ellipse cx="${n(x + lado * 2.8)}" cy="145.5" rx="${n(7.5 + c.perna * 0.12)}" ry="4.8" fill="${a.tenis}"/><path d="M${n(x + lado * 2.8 - 7)} 148h14" stroke="#000" stroke-opacity=".2" stroke-width="1.4"/>`);
    }
    if (c.m) {
      const w = afastamento + c.perna / 2 + 2;
      partes.push(`<path d="M${n(60 - c.cintura - 1)} ${yCintura - 3}H${n(60 + c.cintura + 1)}L${n(60 + w)} 121H62L60 113L58 121H${n(60 - w)}z" fill="${a.roupa2}"/>`);
    } else {
      const q = c.quadril;
      partes.push(`<path d="M${n(60 - c.cintura)} ${yCintura - 3}C${n(60 - q - 2)} ${yCintura + 3} ${n(60 - q)} ${yQuadril + 6} ${n(60 - q * 0.62)} 120H${n(60 + q * 0.62)}C${n(60 + q)} ${yQuadril + 6} ${n(60 + q + 2)} ${yCintura + 3} ${n(60 + c.cintura)} ${yCintura - 3}z" fill="${a.roupa2}"/>`);
    }

    // Pescoço, tronco e roupa.
    partes.push(`<rect x="${n(60 - c.pescoco)}" y="${yOmbro - 12}" width="${n(c.pescoco * 2)}" height="14" rx="3" fill="${a.pele}"/>`);
    const tronco = (inset, base) => `M${n(60 - c.ombro + inset)} ${yOmbro + 2}C${n(60 - c.ombro + inset - 1)} ${yOmbro + 16} ${n(60 - c.cintura - 2)} ${base - 14} ${n(60 - c.cintura)} ${base}H${n(60 + c.cintura)}C${n(60 + c.cintura + 2)} ${base - 14} ${n(60 + c.ombro - inset + 1)} ${yOmbro + 16} ${n(60 + c.ombro - inset)} ${yOmbro + 2}`;
    if (c.barriga) {
      const lado = (sinal) => `${n(60 + sinal * c.ombro)} ${yOmbro + 1}`;
      partes.push(`<path d="M${lado(-1)}C${n(60 - c.ombro - 3)} ${yOmbro + 18} ${n(60 - c.cintura - 10)} ${yCintura - 16} ${n(60 - c.cintura - 6)} ${yCintura - 1}Q60 ${yCintura + 8} ${n(60 + c.cintura + 6)} ${yCintura - 1}C${n(60 + c.cintura + 10)} ${yCintura - 16} ${n(60 + c.ombro + 3)} ${yOmbro + 18} ${lado(1)}Q${n(60 + c.ombro - 2)} ${yOmbro - 4} ${n(60 + c.pescoco + 1)} ${yOmbro - 4}Q60 ${yOmbro + 5} ${n(60 - c.pescoco - 1)} ${yOmbro - 4}Q${n(60 - c.ombro + 2)} ${yOmbro - 4} ${lado(-1)}z" fill="${a.roupa}"/>`);
      partes.push(`<path d="M${n(60 - c.cintura - 1)} ${yCintura - 21}Q60 ${yCintura - 15} ${n(60 + c.cintura + 1)} ${yCintura - 21}" stroke="#000" stroke-opacity=".14" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
    } else {
      partes.push(`<path d="${tronco(0, yCintura)}Q${n(60 + c.ombro - 3)} ${yOmbro - 4} ${n(60 + c.pescoco)} ${yOmbro - 5}H${n(60 - c.pescoco)}Q${n(60 - c.ombro + 3)} ${yOmbro - 4} ${n(60 - c.ombro)} ${yOmbro + 2}z" fill="${a.pele}"/>`);
      const fimRoupa = c.m ? yCintura + 1 : yOmbro + 25;
      if (c.m) {
        partes.push(`<path d="${tronco(4.5, fimRoupa)}L${n(60 + c.pescoco + 3)} ${yOmbro - 2}Q60 ${yOmbro + 9} ${n(60 - c.pescoco - 3)} ${yOmbro - 2}z" fill="${a.roupa}"/>`);
      } else {
        partes.push(`<path d="M${n(60 - c.ombro + 4.5)} ${yOmbro + 1}C${n(60 - c.ombro + 3.5)} ${yOmbro + 12} ${n(60 - c.cintura - 3)} ${fimRoupa - 8} ${n(60 - c.cintura - 1.5)} ${fimRoupa}H${n(60 + c.cintura + 1.5)}C${n(60 + c.cintura + 3)} ${fimRoupa - 8} ${n(60 + c.ombro - 3.5)} ${yOmbro + 12} ${n(60 + c.ombro - 4.5)} ${yOmbro + 1}L${n(60 + c.pescoco + 2)} ${yOmbro - 2}Q60 ${yOmbro + 8} ${n(60 - c.pescoco - 2)} ${yOmbro - 2}z" fill="${a.roupa}"/>`);
        if (c.f >= 3) partes.push(`<path d="M57.5 ${fimRoupa + 4}v5M62.5 ${fimRoupa + 4}v5" stroke="#000" stroke-opacity=".18" stroke-width="1.4" stroke-linecap="round"/>`);
      }
    }
    if (c.m && c.f >= 2 && !c.barriga) {
      const l = c.ombro * 0.55;
      partes.push(`<path d="M${n(60 - l)} ${yOmbro + 14}q${n(l * 0.6)} 7 ${n(l)} 2M${n(60 + l)} ${yOmbro + 14}q${n(-l * 0.6)} 7 ${n(-l)} 2" stroke="#000" stroke-opacity=".16" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
    }
    if (c.f >= 4 && !c.barriga && humor !== 'magro') {
      partes.push(`<path d="M60 ${yOmbro + 7}l-2.5 5h3l-2 5 5-6.5h-3l2-3.5z" fill="${a.detalhe}" opacity=".85"/>`);
    }

    // Braços.
    for (const lado of [-1, 1]) {
      const tipoBraco = tipo === 'acenando' && lado === -1 ? 'caido' : tipo === 'celular' && lado === 1 ? 'caido' : tipo;
      const [s, e, m] = braco(lado, tipoBraco, c, yOmbro, yCintura);
      if (c.m && c.f >= 3 && !c.barriga) partes.push(`<circle cx="${n(s[0])}" cy="${n(s[1] - 1)}" r="${n(c.braco * 0.66)}" fill="${a.pele}"/>`);
      partes.push(`<path d="M${n(s[0])} ${n(s[1])}L${n(e[0])} ${n(e[1])}L${n(m[0])} ${n(m[1])}" stroke="${a.pele}" stroke-width="${n(c.braco)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`);
      if (tipoBraco === 'flexionando' && c.biceps) {
        partes.push(`<circle cx="${n((s[0] + e[0]) / 2 + lado * 1.5)}" cy="${n((s[1] + e[1]) / 2 - c.braco * 0.42)}" r="${n(c.biceps)}" fill="${a.pele}"/>`);
        partes.push(`<path d="M${n((s[0] + e[0]) / 2 - lado * 2)} ${n((s[1] + e[1]) / 2 - c.braco * 0.4 - c.biceps * 0.55)}q${n(lado * 3)} -2 ${n(lado * 6)} 0" stroke="#000" stroke-opacity=".15" stroke-width="1.3" fill="none" stroke-linecap="round"/>`);
      }
      partes.push(`<circle cx="${n(m[0])}" cy="${n(m[1])}" r="${n(c.braco * 0.62)}" fill="${a.pele}"/>`);
      if (tipoBraco === 'celular') {
        partes.push(`<rect x="${n(m[0] - 5)}" y="${n(m[1] - 12)}" width="10" height="15" rx="2.2" fill="#22252c"/><rect x="${n(m[0] - 3.6)}" y="${n(m[1] - 10.5)}" width="7.2" height="11" rx="1.2" fill="#7cc6ff" opacity=".8"/>`);
        partes.push(`<circle cx="${n(m[0])}" cy="${n(m[1] + 1)}" r="${n(c.braco * 0.62)}" fill="${a.pele}"/>`);
      }
    }

    // Cabeça: cai e inclina quando o avatar está triste.
    const giro = humor === 'magro' ? 11 : cabisbaixo ? 8 : 0;
    const desce = humor === 'magro' ? 6 : cabisbaixo ? 4 : 0;
    partes.push(`<g transform="translate(0 ${desce}) rotate(${giro} 60 58)">`);
    partes.push(`<circle cx="38.5" cy="39" r="4.2" fill="${a.pele}"/><circle cx="81.5" cy="39" r="4.2" fill="${a.pele}"/>`);
    partes.push(`<circle cx="60" cy="37" r="22" fill="${a.pele}"/>`);
    partes.push(`<g transform="translate(0 ${cabisbaixo ? 2.5 : 0})">${rosto(humor)}</g>`);
    partes.push(cabelo(a, false));
    if (c.m && a.penteado === 'crespo' && humor !== 'magro') partes.push(`<path d="M44 46q2 12 16 12t16-12q-4 7-16 7t-16-7z" fill="${a.cabelo}" opacity=".9"/>`);
    partes.push('</g>');

    // Detalhes de clima.
    if (humor === 'animado' && c.f >= 3) partes.push(estrela(18, 34, 5, '#ffd166') + estrela(102, 26, 4, '#ffd166') + estrela(105, 74, 3, '#ffd166'));
    if (humor === 'sedentario') partes.push(`<text x="86" y="22" font-family="system-ui, sans-serif" font-weight="700" fill="#9aa1ad"><tspan font-size="9">z</tspan><tspan font-size="12" dx="2" dy="-5">Z</tspan></text>`);

    return `<svg class="avatar-svg" viewBox="0 -8 120 164" xmlns="http://www.w3.org/2000/svg" role="img">${partes.join('')}</svg>`;
  }

  // Fogo da ofensiva: "acesa", "risco" (precisa treinar hoje) ou "apagada".
  function chama(estado) {
    const id = `chama-${estado}`;
    const cores = estado === 'apagada' ? ['#5a606c', '#3d424c'] : ['#ffd166', '#ff5a1f'];
    return `<svg class="chama ${estado}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`
      + `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cores[0]}"/><stop offset="1" stop-color="${cores[1]}"/></linearGradient></defs>`
      + `<path d="M12 1.5c.6 3.1-1.2 4.9-2.9 6.8C7.3 10.3 5.5 12.4 5.5 15.4 5.5 19 8.4 22 12 22s6.5-3 6.5-6.6c0-2.6-1.2-4.6-2.6-6.3-.3 1.4-1 2.5-2.1 3.1.4-3.9-.8-7.6-1.8-10.7z" fill="url(#${id})"/>`
      + (estado === 'apagada' ? '' : '<path d="M12 12.2c-1.6 1.6-2.9 3-2.9 4.9A2.9 2.9 0 0 0 12 20a2.9 2.9 0 0 0 2.9-2.9c0-1.3-.7-2.4-1.5-3.3-.2.7-.6 1.2-1.1 1.5.1-1.1 0-2.1-.3-3.1z" fill="#fff3c4"/>')
      + '</svg>';
  }

  const generoDe = (avatar) => (AVATARES[avatar] || AVATARES['menino-1']).genero;
  const api = { desenhar, chama, generoDe, AVATARES: Object.keys(AVATARES) };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Avatar = api;
})(typeof window !== 'undefined' ? window : globalThis);
