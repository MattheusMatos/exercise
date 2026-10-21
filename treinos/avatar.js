/*
 * Personagens que o usuário escolhe, cada um com 4 imagens em personagens/:
 * começando, no auge, afastado e de volta (a fase vem de Ofensiva.fase).
 * chama(estado) devolve o fogo da ofensiva em SVG.
 * No navegador fica em window.Avatar; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  const PERSONAGENS = [
    { id: 'brutus', nome: 'Brutus', genero: 'm' },
    { id: 'otto', nome: 'Otto', genero: 'm' },
    { id: 'capi', nome: 'Capi', genero: 'f' },
    { id: 'zeca', nome: 'Zeca', genero: 'm' },
    { id: 'duda', nome: 'Duda', genero: 'f' },
    { id: 'nina', nome: 'Nina', genero: 'f' },
    { id: 'ravi', nome: 'Ravi', genero: 'm' },
    { id: 'bento', nome: 'Bento', genero: 'm' },
    { id: 'bia', nome: 'Bia', genero: 'f' },
    { id: 'joca', nome: 'Joca', genero: 'm' },
    { id: 'nino', nome: 'Nino', genero: 'm' },
  ];
  const FASES = { comecando: 'Começando', auge: 'No auge', afastado: 'Afastado', volta: 'De volta' };
  const porId = new Map(PERSONAGENS.map((p) => [p.id, p]));
  const personagem = (id) => porId.get(id) || PERSONAGENS[0];

  const imagem = (id, fase) => `personagens/${personagem(id).id}-${FASES[fase] ? fase : 'comecando'}.webp`;
  const rotuloDaFase = (id, fase) => (fase === 'afastado' && personagem(id).genero === 'f' ? 'Afastada' : FASES[fase] || FASES.comecando);

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

  const api = { PERSONAGENS, FASES: Object.keys(FASES), personagem, imagem, rotuloDaFase, chama };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Avatar = api;
})(typeof window !== 'undefined' ? window : globalThis);
