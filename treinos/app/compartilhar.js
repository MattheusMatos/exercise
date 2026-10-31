// A imagem do treino para postar (stories) e as cores do card.
'use strict';

// ---------- compartilhar ----------

// Cores do card, à escolha (todas grátis): fundo (três cores, de cima para baixo), texto, caixas e brilho.
// Na versão de uma academia, as cores dela vêm primeiro e já escolhidas.
const ESTILOS_CARD = {
  ...(ACADEMIA && ACADEMIA.card ? { academia: { nome: ACADEMIA.nome, ...ACADEMIA.card } } : {}),
  laranja: { nome: 'Laranja', fundo: ['#ffb37a', '#ff6b35', '#c93d12'], tinta: '#12141a', caixa: 'rgba(18, 20, 26, 0.14)', brilho: 'rgba(255, 240, 220, 0.55)' },
  noite: { nome: 'Noite', fundo: ['#2b3754', '#151b2b', '#07090f'], tinta: '#f0f2f5', caixa: 'rgba(255, 255, 255, 0.08)', brilho: 'rgba(255, 107, 53, 0.35)' },
  neon: { nome: 'Neon', fundo: ['#8dffbf', '#2fd27d', '#0b6b3c'], tinta: '#071a10', caixa: 'rgba(7, 26, 16, 0.14)', brilho: 'rgba(230, 255, 240, 0.55)' },
  rosa: { nome: 'Rosa', fundo: ['#ffc2e2', '#e5559e', '#6e1c5a'], tinta: '#1d0716', caixa: 'rgba(29, 7, 22, 0.14)', brilho: 'rgba(255, 235, 245, 0.55)' },
  ouro: { nome: 'Dourado', fundo: ['#fff3c2', '#e8b83d', '#7d520b'], tinta: '#1c1404', caixa: 'rgba(28, 20, 4, 0.14)', brilho: 'rgba(255, 250, 225, 0.6)' },
};

const carregarImagem = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// Card do treino em formato de story (1080 × 1920), para Instagram, WhatsApp e afins.
// No story, o Instagram e o WhatsApp põem a barra de progresso e o nome por cima do alto da imagem,
// e o campo de resposta por cima do pé. O conteúdo dos cards é desenhado um pouco menor, dentro da
// faixa que fica livre; o fundo e a moldura vão quase até as bordas (a moldura começa abaixo do nome).
const STORY_TOPO = 130;
const STORY_BASE = 60;
const STORY_MOLDURA = 165;
function areaSeguraStory(c, W, H) {
  const s = (H - STORY_TOPO - STORY_BASE) / H;
  c.translate((W - W * s) / 2, STORY_TOPO);
  c.scale(s, s);
}

async function desenharCard(r, treino, estiloId) {
  const estilo = ESTILOS_CARD[estiloId] || ESTILOS_CARD.laranja;
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  await document.fonts.ready.catch(() => {});
  const titulo = (peso, tamanho) => `${peso} ${tamanho}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  const texto = (peso, tamanho) => `${peso} ${tamanho}px Barlow, system-ui, sans-serif`;
  const TINTA = estilo.tinta;

  const fundo = c.createLinearGradient(0, 0, 0, H);
  fundo.addColorStop(0, estilo.fundo[0]);
  fundo.addColorStop(0.45, estilo.fundo[1]);
  fundo.addColorStop(1, estilo.fundo[2]);
  c.fillStyle = fundo;
  c.fillRect(0, 0, W, H);
  areaSeguraStory(c, W, H);
  // Brilho atrás do personagem.
  const brilho = c.createRadialGradient(W / 2, 760, 40, W / 2, 760, 560);
  brilho.addColorStop(0, estilo.brilho);
  brilho.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = brilho;
  c.fillRect(0, 200, W, 1100);

  c.fillStyle = TINTA;
  c.textAlign = 'center';
  c.font = titulo(800, 44);
  c.fillText('TREINO FEITO', W / 2, 150);
  c.font = titulo(800, 150);
  c.fillText(treino.titulo, W / 2, 300, W - 120);
  c.font = texto(600, 40);
  c.fillText(treino.foco, W / 2, 360, W - 120);

  try {
    const p = window.Avatar.personagem(estado.perfil.personagem);
    const img = await carregarImagem(window.Avatar.imagemDoMomento(p.id, 'comemora'));
    const alto = 720;
    const largo = Math.min(W - 160, (img.width / img.height) * alto);
    const altura = (img.height / img.width) * largo;
    c.save();
    c.shadowColor = 'rgba(0, 0, 0, 0.3)';
    c.shadowBlur = 30;
    c.shadowOffsetY = 16;
    c.drawImage(img, (W - largo) / 2, 400 + (alto - altura), largo, altura);
    c.restore();
  } catch (e) {
    // Sem a imagem do personagem, o card sai só com os números.
  }

  c.fillStyle = TINTA;
  c.font = titulo(800, 200);
  c.fillText(r.segundos ? tempoLongo(r.segundos) : '—', W / 2, 1310);
  c.font = texto(600, 40);
  c.fillText('de treino', W / 2, 1365);

  // Três caixas: séries, exercícios e calorias.
  const kcal = caloriasDoTreino(r);
  const caixas = [['Séries', `${r.series}/${r.totalSeries}`], ['Exercícios', String(r.exercicios)], ['Calorias', kcal ? `~${kcal}` : '—']];
  const gap = 24;
  const cw = (W - 120 - gap * 2) / 3;
  caixas.forEach(([rotulo, valor], k) => {
    const x = 60 + k * (cw + gap);
    c.fillStyle = estilo.caixa;
    c.beginPath();
    c.roundRect(x, 1420, cw, 170, 32);
    c.fill();
    c.fillStyle = TINTA;
    c.font = texto(600, 34);
    c.fillText(rotulo, x + cw / 2, 1478);
    c.font = titulo(800, 76);
    c.fillText(valor, x + cw / 2, 1562, cw - 30);
  });

  // Ofensiva com o fogo.
  const of = ofensivaAtual();
  const linha = `${plural(of.dias, 'dia')} de ofensiva`;
  c.font = titulo(800, 64);
  const larguraLinha = c.measureText(linha).width;
  try {
    const svg = new Blob([window.Avatar.chama(of.dias ? 'acesa' : 'apagada')], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svg);
    const fogo = await carregarImagem(url);
    URL.revokeObjectURL(url);
    c.drawImage(fogo, (W - larguraLinha) / 2 - 80, 1632, 70, 70);
    c.fillText(linha, W / 2 + 40, 1690);
  } catch (e) {
    c.fillText(`🔥 ${linha}`, W / 2, 1690);
  }

  c.font = texto(600, 38);
  let assinou = false;
  if (ACADEMIA) {
    // Na versão de academia, o logo dela num selo branco no pé do card, e o nome da pessoa embaixo.
    try {
      const logo = await carregarImagem(ACADEMIA.logo);
      const alto = 96;
      const largo = Math.min(420, (logo.width / logo.height) * alto);
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.roundRect((W - largo) / 2 - 28, 1732, largo + 56, alto + 24, 24);
      c.fill();
      c.drawImage(logo, (W - largo) / 2, 1744, largo, alto);
      c.fillStyle = TINTA;
      if (estado.perfil.nome) c.fillText(estado.perfil.nome, W / 2, 1900, W - 120);
      assinou = true;
    } catch (e) {
      // Sem o logo, assina com o nome da academia.
    }
  }
  const assinatura = ACADEMIA ? ACADEMIA.nome : programa.titulo;
  if (!assinou) c.fillText(estado.perfil.nome ? `${estado.perfil.nome} · ${assinatura}` : assinatura, W / 2, 1810, W - 120);

  // Borda da ofensiva em volta do card, com o nome dela no alto.
  const borda = bordaDa(of.dias);
  if (borda) {
    const grad = c.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, borda.cores[0]);
    grad.addColorStop(0.5, borda.cores[1]);
    grad.addColorStop(1, borda.cores[2]);
    c.setTransform(1, 0, 0, 1, 0, 0); // a moldura é desenhada em tamanho real, fora da área reduzida
    c.strokeStyle = grad;
    c.lineWidth = 22;
    c.beginPath();
    c.roundRect(24, STORY_MOLDURA, W - 48, H - STORY_MOLDURA - 24, 56);
    c.stroke();
    const rotulo = `${borda.nome.toUpperCase()} · ${of.dias} DIAS`;
    c.font = titulo(800, 40);
    const lw = c.measureText(rotulo).width + 64;
    c.fillStyle = grad;
    c.beginPath();
    c.roundRect((W - lw) / 2, STORY_MOLDURA - 33, lw, 66, 33);
    c.fill();
    c.fillStyle = '#12141a';
    c.fillText(rotulo, W / 2, STORY_MOLDURA + 14);
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function abrirCompartilhar(r, treino) {
  let url = null;
  const fechar = () => {
    if (url) URL.revokeObjectURL(url);
    modal.remove();
  };
  const caixa = h('div', { class: 'modal-caixa folha compartilhar-folha' }, h('p', { class: 'carregando' }, 'Montando o card…'));
  const modal = h('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Compartilhar treino',
    onclick: (e) => {
      if (e.target === modal) fechar();
    },
  }, caixa);
  document.body.append(modal);
  // Desenha com o estilo escolhido; trocar de estilo desenha de novo.
  async function montar() {
    const blob = await desenharCard(r, treino, estado.estiloCard);
    if (!blob || !modal.isConnected) return;
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    const nomeArquivo = `treino-${treino.id}-${dataLocal(new Date())}.png`;
    const arquivo = new File([blob], nomeArquivo, { type: 'image/png' });
    const podeCompartilhar = Boolean(navigator.canShare && navigator.canShare({ files: [arquivo] }));
    caixa.replaceChildren(...[
      h('img', { class: 'card-previa', src: url, alt: `Card do ${treino.titulo} para compartilhar` }),
      h('p', { class: 'rotulo' }, 'Cor do card'),
      opcoesEstilo(montar),
      podeCompartilhar ? h('button', {
        class: 'botao primario', icone: 'compartilhar',
        onclick: async () => {
          try {
            await navigator.share({ files: [arquivo], text: `${treino.titulo} feito! 💪` });
          } catch (e) {
            // A pessoa fechou o menu de compartilhar.
          }
        },
      }, 'Compartilhar') : null,
      h('a', { class: podeCompartilhar ? 'botao secundario' : 'botao primario', href: url, download: nomeArquivo }, 'Salvar imagem'),
      h('p', { class: 'aviso' }, podeCompartilhar ? 'Compartilhar abre o menu do celular: Instagram, WhatsApp e outros.' : 'Salve a imagem e poste no Instagram, no status do WhatsApp ou onde quiser.'),
      h('button', { class: 'link', onclick: fechar }, 'Fechar'),
    ].filter(Boolean));
  }
  await montar();
  const botao = caixa.querySelector('.botao');
  if (botao) botao.focus();
}
