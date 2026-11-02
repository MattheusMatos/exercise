/*
 * Feriados nacionais do Brasil, em que muitas academias fecham: os de data fixa e a Sexta-feira
 * Santa (Paixão de Cristo), que depende da Páscoa. Carnaval e Corpus Christi são ponto facultativo,
 * não feriado nacional, e ficam de fora. Em dia de treino planejado, o app protege a ofensiva sem
 * gastar bloqueio.
 * No navegador fica em window.Feriados; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  const dois = (n) => String(n).padStart(2, '0');
  const chave = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;

  const FIXOS = [
    ['01-01', 'Ano-Novo'], ['04-21', 'Tiradentes'], ['05-01', 'Dia do Trabalho'], ['09-07', 'Independência'],
    ['10-12', 'Nossa Senhora Aparecida'], ['11-02', 'Finados'], ['11-15', 'Proclamação da República'],
    ['11-20', 'Dia da Consciência Negra'], ['12-25', 'Natal'],
  ];

  // Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano).
  function pascoa(ano) {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }

  const cache = new Map();
  // Map 'AAAA-MM-DD' → nome do feriado, para um ano.
  function doAno(ano) {
    if (cache.has(ano)) return cache.get(ano);
    const p = pascoa(ano);
    const mais = (n) => chave(new Date(p.getFullYear(), p.getMonth(), p.getDate() + n));
    const mapa = new Map([
      ...FIXOS.map(([md, nome]) => [`${ano}-${md}`, nome]),
      [mais(-2), 'Sexta-feira Santa'],
    ]);
    cache.set(ano, mapa);
    return mapa;
  }

  // Nome do feriado nesse dia ('AAAA-MM-DD'), ou null.
  const nome = (dia) => doAno(Number(dia.slice(0, 4))).get(dia) || null;

  const api = { pascoa, doAno, nome };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Feriados = api;
})(typeof window !== 'undefined' ? window : globalThis);
