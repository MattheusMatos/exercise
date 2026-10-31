// Ações durante o treino: começar, aquecimento, marcar séries, Feito/Depois, desfazer, terminar e arrastar o cartão.
'use strict';

// ---------- ações do treino ----------

// deHoje e ajuste: ao recomeçar, os extras só de hoje e o ajuste de carga e descanso continuam.
function comecar(i, deHoje, ajusteAnterior) {
  const treino = programa.treinos[i];
  // Extras fixos do treino e os que valem só para esta vez.
  const extras = [...(estado.extras[treino.id] || []), ...(estado.extrasProximo[treino.id] || []), ...(deHoje || [])].map((x) => ({ ...x, removido: undefined }));
  delete estado.extrasProximo[treino.id];
  estado.sessao = {
    treino: i,
    fila: [...Array(treino.exercicios.length + extras.length).keys()],
    feitos: [],
    series: {},
    historico: [],
    inicio: Date.now(),
    extras,
    aquecidos: {},
    cargas: {},
    // O ajuste pedido no fim da última vez vale para esta sessão e sai da fila de ajustes.
    ajuste: ajusteAnterior || estado.ajustes[treino.id] || { descanso: 0, carga: 0 },
    aquecer: null, // decidido na tela de aquecimento
  };
  delete estado.ajustes[treino.id];
  selecionado = i;
  pararDescanso();
  salvar();
  abrirTreino();
}

// Exercícios do treino de hoje que têm aquecimento antes (os do programa).
function exerciciosComAquecimento() {
  if (!estado.sessao || programa.mobilidade) return [];
  const treino = programa.treinos[estado.sessao.treino];
  return treino.exercicios.map((e, slot) => (e.aquecimento ? slot : -1)).filter((slot) => slot >= 0);
}

function decidirAquecimento(aquecer) {
  estado.sessao.aquecer = aquecer;
  estado.sessao.inicio = Date.now(); // o tempo de treino conta a partir daqui
  salvar();
  tela = 'treino';
  render();
}

// Antes do treino: o aquecimento de hoje, com a opção de pular.
function renderAquecimento() {
  const treino = programa.treinos[estado.sessao.treino];
  const lista = exerciciosComAquecimento();
  app.replaceChildren(h('section', { class: 'aquecimento-tela' },
    h('header', { class: 'barra' },
      h('button', { class: 'icone-botao', icone: 'voltar', 'aria-label': 'Voltar ao início', onclick: voltarInicio }),
      h('div', { class: 'barra-titulo' }, h('strong', null, treino.titulo), h('span', { class: 'contador' }, 'Antes de começar'))),
    h('h1', null, 'Aquecimento'),
    h('p', { class: 'grupo-descricao' }, 'Antes dos exercícios abaixo, 2 séries leves que não contam no treino: 6 repetições com 40% e 6 com 80% da carga. Elas deixam as primeiras repetições mais rápidas (Ribeiro et al., 2021). Os outros exercícios já pegam músculos aquecidos.'),
    h('ol', { class: 'exercicios-treino' }, lista.map((slot) => {
      const ex = exercicio(estado.sessao.treino, slot);
      const ultima = estado.cargas[ex.imagem];
      const kg = ultima ? (estado.sessao.ajuste.carga ? arredondarCarga(ultima.kg * (1 + estado.sessao.ajuste.carga / 100)) : ultima.kg) : null;
      return h('li', null,
        miniatura(ex),
        h('span', { class: 'ex-texto' },
          h('span', { class: 'ex-nome' }, ex.nome),
          h('span', { class: 'ex-meta' }, kg
            ? `6 × ${textoKg(arredondarCarga(kg * 0.4))} e 6 × ${textoKg(arredondarCarga(kg * 0.8))}`
            : '6 × 40% e 6 × 80% da carga (anote a carga no cartão)')));
    })),
    h('p', { class: 'aviso' }, 'No cartão de cada um, toque nas séries de aquecimento: cada uma dá 1 min de descanso. Quer soltar o corpo antes? 5 min de bicicleta leve ou a rotina de Mobilidade.'),
    h('button', { class: 'botao primario', onclick: () => decidirAquecimento(true) }, 'Começar com aquecimento'),
    h('button', { class: 'botao secundario', onclick: () => decidirAquecimento(false) }, 'Pular o aquecimento de hoje')));
  window.scrollTo(0, 0);
}

function abrirTreino() {
  tela = estado.sessao && estado.sessao.aquecer === null && exerciciosComAquecimento().length ? 'aquecimento' : 'treino';
  if (tela === 'treino' && estado.sessao && estado.sessao.aquecer === null) estado.sessao.aquecer = true;
  pedirTravaTela();
  render();
}

function voltarInicio() {
  tela = 'inicio';
  if (estado.sessao) selecionado = estado.sessao.treino;
  soltarTravaTela();
  render();
}

function marcarSerie(i, k) {
  prepararAudio();
  const sessao = estado.sessao;
  const ex = exercicioDaSessao(i);
  if (!ex) return;
  const antes = sessao.series[i] || 0;
  const agora = k < antes ? k : k + 1; // tocar num cronômetro já marcado desmarca dele em diante
  sessao.series[i] = agora;
  salvar();

  const topo = app.querySelector(`.cartao.topo[data-i="${i}"]`);
  if (topo) {
    topo.querySelectorAll('.anilha').forEach((botao, n) => {
      botao.classList.toggle('cheia', n < agora);
      botao.classList.toggle('proxima', n === agora);
      botao.setAttribute('aria-pressed', String(n < agora));
    });
    const dica = topo.querySelector('.arraste');
    dica.classList.toggle('pronto', agora >= ex.series);
    dica.textContent = agora >= ex.series ? 'Pronto! Arraste para a direita' : 'Terminou a série? Toque no cronômetro';
  }

  if (agora <= antes) return;
  // Bi-set, tri-set e pré-exaustão: entre os exercícios do grupo não há descanso; o app passa para o próximo.
  const membros = (membrosDoGrupo(i) || []).filter((j) => !sessao.feitos.includes(j));
  const pos = membros.indexOf(i);
  const pendente = (j) => (sessao.series[j] || 0) < seriesDaSessao(j);
  if (membros.length > 1 && pos >= 0) {
    const depois = membros.slice(pos + 1).find(pendente);
    if (depois !== undefined) {
      pararDescanso();
      trazerParaFrente(depois);
      avisar(`Sem descanso: agora ${exercicioDaSessao(depois).nome}`);
      return;
    }
    const primeiro = membros.find(pendente);
    if (primeiro !== undefined && primeiro !== i) {
      trazerParaFrente(primeiro);
      iniciarDescanso(segundosDescanso(ex.descanso), `rodada ${(sessao.series[primeiro] || 0) + 1} ${{ triset: 'do tri-set', preexaustao: 'da pré-exaustão' }[ex.tecnica.tipo] || 'do bi-set'}: ${exercicioDaSessao(primeiro).nome}`);
      return;
    }
  }
  const ultima = agora >= ex.series;
  const seguinte = sessao.fila.find((x) => x !== i);
  const proxima = !ultima ? `série ${agora + 1} de ${ex.series} de ${ex.nome}`
    : seguinte === undefined ? 'fim do treino' : exercicioDaSessao(seguinte).nome;
  iniciarDescanso(segundosDescanso(ex.descanso), proxima);
}

// Põe o exercício j no topo da pilha sem marcar nada; o atual fica logo atrás.
function trazerParaFrente(j) {
  const sessao = estado.sessao;
  if (!sessao.fila.includes(j) || sessao.fila[0] === j) return;
  sessao.fila = [j, ...sessao.fila.filter((x) => x !== j)];
  salvar();
  montarPilha(app.querySelector('.pilha'), false);
  atualizarCabecalho();
}

function acaoBotao(direcao) {
  const topo = app.querySelector('.cartao.topo');
  if (topo) voar(topo, direcao);
}

function voar(el, direcao) {
  if (el.dataset.saindo) return;
  el.dataset.saindo = '1';
  const sinal = direcao === 'feito' ? 1 : -1;
  el.style.setProperty(direcao === 'feito' ? '--feito' : '--depois', '1');
  if (semMovimento.matches) {
    concluir(direcao);
    return;
  }
  el.classList.remove('arrastando');
  el.classList.add('saindo');
  el.style.transform = `translateX(${sinal * (window.innerWidth + el.offsetWidth)}px) rotate(${sinal * 22}deg)`;
  setTimeout(() => concluir(direcao), 260);
}

function concluir(direcao) {
  const sessao = estado.sessao;
  const i = sessao.fila.shift();
  if (direcao === 'feito') {
    sessao.feitos.push(i);
    pararDescanso(); // exercício feito: o descanso dele não faz mais sentido
  }
  else sessao.fila.push(i);
  sessao.historico.push({ tipo: direcao, i });
  salvar();
  if (!sessao.fila.length) {
    terminar();
    return;
  }
  montarPilha(app.querySelector('.pilha'), !semMovimento.matches);
  atualizarCabecalho();
  mostrarDesfazer(i, direcao);
}

// Desfazer aparece por alguns segundos logo depois de marcar, em vez de um botão fixo
// entre Depois e Feito, fácil de tocar sem querer.
let esperaDesfazer = null;
function mostrarDesfazer(i, direcao) {
  const aviso = app.querySelector('.desfazer-aviso');
  if (!aviso) return;
  const ex = exercicioDaSessao(i);
  clearTimeout(esperaDesfazer);
  aviso.replaceChildren(
    h('span', null, `${ex ? ex.nome : 'Exercício'}: ${direcao === 'feito' ? 'feito' : 'para depois'}`),
    h('button', {
      class: 'link',
      onclick: () => {
        esconderDesfazer();
        desfazer();
      },
    }, 'Desfazer'));
  aviso.hidden = false;
  esperaDesfazer = setTimeout(esconderDesfazer, 6000);
}

function esconderDesfazer() {
  clearTimeout(esperaDesfazer);
  const aviso = app.querySelector('.desfazer-aviso');
  if (aviso) aviso.hidden = true;
}

function desfazer() {
  const sessao = estado.sessao;
  const ultimo = sessao.historico.pop();
  if (!ultimo) return;
  const lista = ultimo.tipo === 'feito' ? sessao.feitos : sessao.fila;
  const pos = lista.lastIndexOf(ultimo.i);
  if (pos >= 0) lista.splice(pos, 1);
  sessao.fila.unshift(ultimo.i);
  salvar();
  montarPilha(app.querySelector('.pilha'), false);
  atualizarCabecalho();
}

function terminar() {
  const sessao = estado.sessao;
  const treino = programa.treinos[sessao.treino];
  const segundos = Math.round((Date.now() - sessao.inicio) / 1000);
  const minutos = Math.round(segundos / 60);
  const indices = indicesDaSessao();
  const total = indices.reduce((soma, i) => soma + seriesDaSessao(i), 0);
  const feitas = indices.reduce((soma, i) => soma + (Number(sessao.series[i]) || 0), 0);
  resumoFinal = {
    treino: sessao.treino,
    minutos: minutos < 240 ? Math.max(1, minutos) : null,
    segundos: minutos < 240 ? segundos : null,
    treinoId: treino.id,
    esforco: null,
    cargasAnotadas: Object.keys(sessao.cargas).length,
    series: Math.min(feitas, total),
    totalSeries: total,
    exercicios: indices.length,
    nivelAntes: ofensivaAtual().nivel,
    pontosAntes: pontosAtuais(),
  };
  // Marca o dia na semana e soma na ofensiva.
  estado.historico = [...estado.historico, { data: dataLocal(new Date()), treino: treino.id, minutos: resumoFinal.minutos, series: resumoFinal.series }].slice(-1500);
  estado.proximo = (sessao.treino + 1) % programa.treinos.length;
  estado.sessao = null;
  selecionado = estado.proximo;
  salvar();
  pararDescanso();
  soltarTravaTela();
  tela = 'fim';
  render();
}

// ---------- arrastar ----------

function ativarArraste(el) {
  let id = null;
  let x0 = 0;
  let y0 = 0;
  let t0 = 0;
  let dx = 0;
  let arrastando = false;
  let ignorarClique = false;

  const voltarAoLugar = () => {
    el.classList.remove('arrastando');
    el.style.transform = '';
    el.style.setProperty('--feito', '0');
    el.style.setProperty('--depois', '0');
  };

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || el.dataset.saindo) return;
    id = e.pointerId;
    x0 = e.clientX;
    y0 = e.clientY;
    t0 = performance.now();
    dx = 0;
    arrastando = false;
    ignorarClique = false;
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const mx = e.clientX - x0;
    const my = e.clientY - y0;
    if (!arrastando) {
      if (Math.abs(mx) < 10 || Math.abs(mx) < Math.abs(my)) return;
      arrastando = true;
      try {
        el.setPointerCapture(id);
      } catch (erro) {
        // Sem captura, o arraste continua enquanto o dedo estiver sobre o cartão.
      }
      el.classList.add('arrastando');
    }
    dx = mx;
    el.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    el.style.setProperty('--feito', String(Math.min(1, Math.max(0, dx / LIMIAR_ARRASTE))));
    el.style.setProperty('--depois', String(Math.min(1, Math.max(0, -dx / LIMIAR_ARRASTE))));
  });

  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== id) return;
    id = null;
    if (!arrastando) return;
    arrastando = false;
    ignorarClique = true;
    const velocidade = dx / Math.max(1, performance.now() - t0);
    if (dx > LIMIAR_ARRASTE || (dx > 40 && velocidade > 0.6)) voar(el, 'feito');
    else if (dx < -LIMIAR_ARRASTE || (dx < -40 && velocidade < -0.6)) voar(el, 'depois');
    else voltarAoLugar();
  });

  el.addEventListener('pointercancel', (e) => {
    if (e.pointerId !== id) return;
    id = null;
    arrastando = false;
    voltarAoLugar();
  });

  // Depois de arrastar, o soltar não deve contar como toque num botão do cartão.
  el.addEventListener('click', (e) => {
    if (!ignorarClique) return;
    ignorarClique = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);
}
