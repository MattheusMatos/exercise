/*
 * Personagens que o usuário escolhe, cada um com 4 imagens em personagens/:
 * começando, no auge, afastado e de volta (a fase vem de Ofensiva.fase), e uma descrição
 * que aparece na escolha do personagem.
 * chama(estado) devolve o fogo da ofensiva em SVG.
 * No navegador fica em window.Avatar; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  const PERSONAGENS = [
    { id: 'brutus', nome: 'Brutus', genero: 'm',
      descricao: 'Pit bull de coração mole. Vai com tudo no supino e comemora cada série como se fosse recorde.' },
    { id: 'otto', nome: 'Otto', genero: 'm',
      descricao: 'Urso grandão e bonachão. Treina sem pressa, mas não falta nunca, e sempre tem um abraço depois.' },
    { id: 'capi', nome: 'Capi', genero: 'f',
      descricao: 'Capivara tranquila e forte. Nada tira ela do sério, nem a última série de agachamento.' },
    { id: 'zeca', nome: 'Zeca', genero: 'm',
      descricao: 'Veterano de bigode e agasalho retrô. Prova que nunca é tarde para ganhar músculo.' },
    { id: 'duda', nome: 'Duda', genero: 'f',
      descricao: 'Pura energia: dança entre as séries e puxa a academia inteira junto.' },
    { id: 'nina', nome: 'Nina', genero: 'f',
      descricao: 'Fone no ouvido e foco total. Entra na playlist e só sai quando o treino acaba.' },
    { id: 'ravi', nome: 'Ravi', genero: 'm',
      descricao: 'Óculos, relógio e planilha: anota tudo e segue o descanso no segundo.' },
    { id: 'bento', nome: 'Bento', genero: 'm',
      descricao: 'Grandão de poucas palavras. Os halteres falam por ele.' },
    { id: 'bia', nome: 'Bia', genero: 'f',
      descricao: 'Sorriso aberto e step no pé. O dia favorito dela é o de perna.' },
    { id: 'joca', nome: 'Joca', genero: 'm',
      descricao: 'Jacaré brincalhão: bocão para rir alto e para pedir mais uma série.' },
    { id: 'nino', nome: 'Nino', genero: 'm',
      descricao: 'Gato descolado, de fone e passo leve. Parece relaxado, mas não perde um treino.' },
  ];
  const FASES = { comecando: 'Começando', auge: 'No auge', afastado: 'Afastado', volta: 'De volta' };
  const porId = new Map(PERSONAGENS.map((p) => [p.id, p]));
  const personagem = (id) => porId.get(id) || PERSONAGENS[0];

  const imagem = (id, fase) => `personagens/${personagem(id).id}-${FASES[fase] ? fase : 'comecando'}.webp`;
  // Imagens de momento, com fundo transparente: 'comemora', 'descanso-1' e 'descanso-2'.
  const imagemDoMomento = (id, momento) => `personagens/${personagem(id).id}-${momento}.webp`;
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

  const api = { PERSONAGENS, FASES: Object.keys(FASES), personagem, imagem, imagemDoMomento, rotuloDaFase, chama };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Avatar = api;
})(typeof window !== 'undefined' ? window : globalThis);
