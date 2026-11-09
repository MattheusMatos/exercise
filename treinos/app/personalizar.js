// Coisas da loja para personalizar o app: temas de cor, títulos abaixo do nome (comprados ou ganhos
// por conquista) e a comemoração do fim do treino. O que foi comprado fica em estado.compras
// (tipo "tema:noite", "titulo:lenda-supino"...); o que está em uso, em estado.tema, estado.titulo
// e estado.comemoracao.
'use strict';

// ---------- personalizar ----------

const PRECO_TEMA = 80;
const PRECO_TITULO = 60;
const PRECO_COMEMORACAO = 50;

// Cada tema troca a cor de destaque e tinge o fundo. O laranja é o de sempre, grátis.
const TEMAS = {
  laranja: { nome: 'Laranja', cores: {} , amostra: ['#ff6b35', '#1a1d24'] },
  noite: { nome: 'Noite', cores: { '--laranja': '#5b8cff', '--fundo': '#0b1020', '--superficie': '#141a2e', '--superficie-2': '#1e2640', '--linha': '#2c3656' }, amostra: ['#5b8cff', '#141a2e'] },
  neon: { nome: 'Neon', cores: { '--laranja': '#b6f23d', '--fundo': '#0b120d', '--superficie': '#141c17', '--superficie-2': '#1d2921', '--linha': '#2b3a30' }, amostra: ['#b6f23d', '#141c17'] },
  rosa: { nome: 'Rosa', cores: { '--laranja': '#ff5fa2', '--fundo': '#140c12', '--superficie': '#1f141c', '--superficie-2': '#2a1c27', '--linha': '#3d2a38' }, amostra: ['#ff5fa2', '#1f141c'] },
  dourado: { nome: 'Dourado', cores: { '--laranja': '#f5c542', '--fundo': '#12100a', '--superficie': '#1c1910', '--superficie-2': '#27231a', '--linha': '#3a3426' }, amostra: ['#f5c542', '#1c1910'] },
  roxo: { nome: 'Roxo', cores: { '--laranja': '#a77bff', '--fundo': '#100c18', '--superficie': '#191326', '--superficie-2': '#241c35', '--linha': '#362b4d' }, amostra: ['#a77bff', '#191326'] },
};

// Títulos: os de conquista vêm de graça quando a meta é batida; os outros se compram.
const TITULOS = [
  { id: 'primeiro-passo', nome: 'Primeiro Passo', conquista: 'Fazer o primeiro treino', ganhou: (s) => s.treinos >= 1 },
  { id: 'constante', nome: 'Constante', conquista: 'Chegar a 15 dias de ofensiva', ganhou: (s) => s.recorde >= 15 },
  { id: 'recordista', nome: 'Recordista', conquista: 'Subir a carga 10 vezes', ganhou: (s) => s.aumentos >= 10 },
  { id: 'fera-do-cardio', nome: 'Fera do Cardio', conquista: 'Somar 300 minutos de aeróbico ou esporte', ganhou: (s) => s.aerobico >= 300 },
  { id: 'centenario', nome: 'Centenário', conquista: 'Fazer 100 treinos', ganhou: (s) => s.treinos >= 100 },
  { id: 'monstro-da-segunda', nome: 'Monstro da Segunda' },
  { id: 'lenda-do-supino', nome: 'Lenda do Supino' },
  { id: 'pernas-de-aco', nome: 'Pernas de Aço' },
  { id: 'sem-desculpas', nome: 'Sem Desculpas' },
  { id: 'foco-total', nome: 'Foco Total' },
  { id: 'rato-de-academia', nome: 'Rato de Academia' },
];

// Comemorações do fim do treino. Confete é a de sempre, grátis; "nenhuma" desliga.
const COMEMORACOES = {
  confete: { nome: 'Confete', icone: '🎊' },
  fogos: { nome: 'Fogos', icone: '🎆' },
  anilhas: { nome: 'Chuva de anilhas', icone: '🏋️' },
  fogo: { nome: 'Pegando fogo', icone: '🔥' },
  estrelas: { nome: 'Estrelas', icone: '⭐' },
  nenhuma: { nome: 'Nenhuma', icone: '🚫' },
};
const COMEMORACOES_GRATIS = ['confete', 'nenhuma'];

const comprou = (tipo, id) => estado.compras.some((c) => c.tipo === `${tipo}:${id}`);

// ---------- temas ----------

function aplicarTema() {
  // Na versão de uma academia, as cores são as dela (academias/), sem temas.
  if (ACADEMIA) return;
  const raiz = document.documentElement;
  const todas = new Set(Object.values(TEMAS).flatMap((t) => Object.keys(t.cores)));
  for (const v of todas) raiz.style.removeProperty(v);
  const tema = TEMAS[estado.tema] || TEMAS.laranja;
  for (const [v, cor] of Object.entries(tema.cores)) raiz.style.setProperty(v, cor);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', tema.cores['--fundo'] || '#0f1115');
}

const temNoTema = (id) => id === 'laranja' || comprou('tema', id);

// ---------- títulos ----------

function estatisticasDosTitulos() {
  const porEx = new Map();
  let aumentos = 0;
  for (const r of [...estado.registroCargas].sort((a, b) => a.data.localeCompare(b.data))) {
    if (porEx.has(r.ex) && r.kg > porEx.get(r.ex)) aumentos += 1;
    porEx.set(r.ex, r.kg);
  }
  return {
    treinos: estado.historico.length,
    recorde: ofensivaAtual().recorde,
    aumentos,
    aerobico: estado.aerobicos.reduce((s, a) => s + a.minutos, 0),
  };
}

function titulosDisponiveis() {
  const s = estatisticasDosTitulos();
  return TITULOS.map((t) => ({ ...t, tem: t.ganhou ? t.ganhou(s) : comprou('titulo', t.id) }));
}

function tituloAtual() {
  const t = titulosDisponiveis().find((x) => x.id === estado.titulo);
  return t && t.tem ? t.nome : null;
}

// ---------- comemoração do fim do treino ----------

function soltarComemoracao(id) {
  const tipo = COMEMORACOES[id] ? id : 'confete';
  if (tipo === 'nenhuma' || semMovimento.matches) return;
  document.querySelector('.comemoracao')?.remove();
  const camada = h('div', { class: `comemoracao comemoracao-${tipo}`, 'aria-hidden': 'true' });
  const cores = ['#ff6b35', '#3fcf8e', '#4ea3ff', '#f5c542', '#ff5fa2', '#a77bff'];
  const sorte = (a, b) => a + Math.random() * (b - a);
  const N = tipo === 'fogos' ? 48 : 40;
  for (let k = 0; k < N; k++) {
    const p = h('span', { class: 'particula' });
    if (tipo === 'fogos') {
      // Três explosões: as partículas saem do centro de cada uma em todas as direções.
      const centro = [[25, 30], [72, 22], [50, 45]][k % 3];
      const angulo = sorte(0, Math.PI * 2);
      const raio = sorte(60, 140);
      p.style.left = `${centro[0]}%`;
      p.style.top = `${centro[1]}%`;
      p.style.setProperty('--dx', `${Math.cos(angulo) * raio}px`);
      p.style.setProperty('--dy', `${Math.sin(angulo) * raio}px`);
      p.style.background = cores[k % cores.length];
      p.style.animationDelay = `${(k % 3) * 0.45}s`;
    } else {
      p.style.left = `${sorte(0, 100)}%`;
      p.style.animationDelay = `${sorte(0, 1.2)}s`;
      p.style.animationDuration = `${sorte(2.2, 3.6)}s`;
      p.style.setProperty('--giro', `${sorte(-540, 540)}deg`);
      if (tipo === 'confete') p.style.background = cores[k % cores.length];
      else p.textContent = { anilhas: k % 3 ? '🏋️' : '💪', fogo: '🔥', estrelas: k % 2 ? '⭐' : '✨' }[tipo];
    }
    camada.append(p);
  }
  document.body.append(camada);
  setTimeout(() => camada.remove(), 5200);
}

// ---------- na loja ----------

function opcaoLoja({ selecionado, amostra, nome, detalhe, preco, tem, aoUsar, aoComprar }) {
  const saldo = pontosAtuais();
  let botao;
  if (selecionado) botao = h('span', { class: 'em-uso' }, 'Em uso');
  else if (tem) botao = h('button', { class: 'botao secundario', onclick: aoUsar }, 'Usar');
  else if (preco) botao = h('button', { class: 'botao comprar-item', disabled: saldo < preco, onclick: aoComprar }, `${preco} pts`);
  else botao = h('span', { class: 'bloqueado' }, '🔒');
  return h('div', { class: `opcao-loja${selecionado ? ' selecionada' : ''}` }, amostra,
    h('div', null, h('strong', null, nome), detalhe ? h('span', null, detalhe) : null), botao);
}

function cartaoTemas(redesenhar) {
  if (ACADEMIA) return null;
  return h('div', { class: 'loja-item' },
    h('div', { class: 'loja-topo' }, h('p', { class: 'rotulo' }, '🎨 Temas do app'), h('span', { class: 'preco' }, `${PRECO_TEMA} pts`)),
    h('p', null, 'Muda a cor de destaque e o fundo do app inteiro.'),
    h('div', { class: 'opcoes-loja' }, Object.entries(TEMAS).map(([id, t]) => opcaoLoja({
      selecionado: (estado.tema || 'laranja') === id,
      amostra: h('span', { class: 'amostra-tema', style: `background: linear-gradient(135deg, ${t.amostra[0]} 0 50%, ${t.amostra[1]} 50% 100%)` }),
      nome: t.nome, detalhe: id === 'laranja' ? 'O de sempre' : null,
      tem: temNoTema(id), preco: id === 'laranja' ? 0 : PRECO_TEMA,
      aoUsar: () => usarTema(id, redesenhar),
      aoComprar: () => {
        if (!gastar(`tema:${id}`, PRECO_TEMA)) return;
        usarTema(id, redesenhar);
        avisar(`🎨 Tema ${t.nome} liberado`);
      },
    }))));
}

function usarTema(id, redesenhar) {
  estado.tema = id;
  salvar();
  aplicarTema();
  redesenhar();
  renderInicio();
}

function cartaoTitulos(redesenhar) {
  const lista = titulosDisponiveis();
  const usar = (id) => {
    estado.titulo = id;
    salvar();
    redesenhar();
    renderInicio();
  };
  return h('div', { class: 'loja-item' },
    h('div', { class: 'loja-topo' }, h('p', { class: 'rotulo' }, '🏷️ Títulos'), h('span', { class: 'preco' }, `${PRECO_TITULO} pts`)),
    h('p', null, 'Aparecem abaixo do seu nome e no card do story. Alguns se ganham com conquistas.'),
    h('div', { class: 'opcoes-loja' },
      opcaoLoja({ selecionado: !estado.titulo, amostra: h('span', { class: 'amostra-icone' }, '—'), nome: 'Sem título', tem: true, aoUsar: () => usar(null) }),
      lista.map((t) => opcaoLoja({
        selecionado: estado.titulo === t.id && t.tem,
        amostra: h('span', { class: 'amostra-icone' }, t.ganhou ? '🏆' : '🏷️'),
        nome: t.nome, detalhe: t.ganhou ? (t.tem ? 'Conquista' : `Conquista: ${t.conquista}`) : null,
        tem: t.tem, preco: t.ganhou ? 0 : PRECO_TITULO,
        aoUsar: () => usar(t.id),
        aoComprar: () => {
          if (!gastar(`titulo:${t.id}`, PRECO_TITULO)) return;
          usar(t.id);
          avisar(`🏷️ Título "${t.nome}" liberado`);
        },
      }))));
}

function cartaoComemoracoes(redesenhar) {
  const usar = (id) => {
    estado.comemoracao = id;
    salvar();
    redesenhar();
    soltarComemoracao(id);
  };
  return h('div', { class: 'loja-item' },
    h('div', { class: 'loja-topo' }, h('p', { class: 'rotulo' }, '🎉 Comemoração do fim do treino'), h('span', { class: 'preco' }, `${PRECO_COMEMORACAO} pts`)),
    h('p', null, 'O efeito que toma a tela quando você termina um treino. Toque em "Usar" para ver.'),
    h('div', { class: 'opcoes-loja' }, Object.entries(COMEMORACOES).map(([id, c]) => opcaoLoja({
      selecionado: (estado.comemoracao || 'confete') === id,
      amostra: h('span', { class: 'amostra-icone' }, c.icone),
      nome: c.nome, detalhe: id === 'confete' ? 'A de sempre' : null,
      tem: COMEMORACOES_GRATIS.includes(id) || comprou('comemoracao', id), preco: COMEMORACOES_GRATIS.includes(id) ? 0 : PRECO_COMEMORACAO,
      aoUsar: () => usar(id),
      aoComprar: () => {
        if (!gastar(`comemoracao:${id}`, PRECO_COMEMORACAO)) return;
        usar(id);
        avisar(`🎉 Comemoração liberada: ${c.nome}`);
      },
    }))));
}
