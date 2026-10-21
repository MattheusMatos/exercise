(() => {
  'use strict';

  const CHAVE_PROXIMO = 'ppl:proximo';
  const CHAVE_SESSAO = 'ppl:sessao';
  const LIMIAR_ARRASTE = 110; // px para o cartão sair
  const app = document.getElementById('app');
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  const ICONES = {
    voltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    desfazer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5L4 9l4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10a5 5 0 0 1 0 10h-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    depois: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    feito: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  let programa = null;
  let tela = 'inicio';
  let selecionado = 0;
  let sessao = null; // { treino, fila, feitos, series, historico, inicio }
  let resumoFinal = null;
  let descanso = null; // { fim, total, proxima, fimDoExercicio, avisado, intervalo, esconder }
  let audio = null;
  let travaTela = null;

  // ---------- utilidades ----------

  function ler(chave, padrao) {
    try {
      const valor = localStorage.getItem(chave);
      return valor === null ? padrao : JSON.parse(valor);
    } catch (e) {
      return padrao;
    }
  }

  function gravar(chave, valor) {
    try {
      if (valor === null) localStorage.removeItem(chave);
      else localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
      // Sem armazenamento (aba anônima, por exemplo): o app funciona, só não lembra.
    }
  }

  function h(tag, props, ...filhos) {
    const el = document.createElement(tag);
    for (const [chave, valor] of Object.entries(props || {})) {
      if (valor === null || valor === undefined || valor === false) continue;
      if (chave === 'class') el.className = valor;
      else if (chave === 'icone') el.innerHTML = ICONES[valor];
      else if (chave.startsWith('on')) el.addEventListener(chave.slice(2), valor);
      else el.setAttribute(chave, valor === true ? '' : valor);
    }
    for (const filho of filhos.flat()) {
      if (filho === null || filho === undefined || filho === false) continue;
      el.append(filho instanceof Node ? filho : String(filho));
    }
    return el;
  }

  const foto = (ex, k) => `fotos/${ex.imagem}-${k}.jpg`;
  const totalSeries = (treino) => treino.exercicios.reduce((soma, ex) => soma + ex.series, 0);
  const doisDigitos = (n) => String(n).padStart(2, '0');

  function segundosDescanso(texto) {
    const numeros = (String(texto).match(/\d+/g) || []).map(Number);
    if (!numeros.length) return 90;
    const minutos = numeros.length > 1 ? (numeros[0] + numeros[1]) / 2 : numeros[0];
    return Math.round(minutos * 60);
  }

  function relogio(segundos) {
    const s = Math.max(0, Math.ceil(segundos));
    return `${Math.floor(s / 60)}:${doisDigitos(s % 60)}`;
  }

  function indiceProximo() {
    const p = ler(CHAVE_PROXIMO, 0);
    return Number.isInteger(p) && p >= 0 && p < programa.treinos.length ? p : 0;
  }

  function sessaoValida(s) {
    if (!s || typeof s !== 'object') return null;
    const treino = programa.treinos[s.treino];
    if (!treino || !Array.isArray(s.fila) || !Array.isArray(s.feitos) || !s.fila.length) return null;
    const valido = (i) => Number.isInteger(i) && i >= 0 && i < treino.exercicios.length;
    if (!s.fila.every(valido) || !s.feitos.every(valido)) return null;
    s.series = s.series && typeof s.series === 'object' ? s.series : {};
    s.historico = Array.isArray(s.historico) ? s.historico : [];
    s.inicio = Number(s.inicio) || Date.now();
    return s;
  }

  const salvarSessao = () => gravar(CHAVE_SESSAO, sessao);

  // ---------- telas ----------

  function render() {
    if (tela === 'treino' && sessao) renderTreino();
    else if (tela === 'fim' && resumoFinal) renderFim();
    else {
      tela = 'inicio';
      renderInicio();
    }
  }

  function renderInicio() {
    const proximo = indiceProximo();
    const lista = h('ul', { class: 'lista' }, programa.treinos.map((treino, i) => {
      let tag = null;
      if (sessao && sessao.treino === i) tag = h('span', { class: 'tag andamento' }, 'Em andamento');
      else if (i === proximo) tag = h('span', { class: 'tag' }, 'Próximo');
      return h('li', null, h('button', {
        class: 'linha-treino',
        'aria-pressed': String(i === selecionado),
        onclick: () => {
          selecionado = i;
          renderInicio();
        },
      },
        h('span', { class: 'linha-titulo' }, treino.titulo),
        tag,
        h('span', { class: 'linha-foco' }, `${treino.foco} · ${treino.exercicios.length} exercícios · ${treino.duracao}`)));
    }));

    app.replaceChildren(h('section', { class: 'inicio' },
      h('header', { class: 'marca' }, h('h1', null, 'Treino PPL'), h('span', null, 'Push · Pull · Legs')),
      heroTreino(selecionado, proximo),
      h('p', { class: 'como-usar' },
        h('strong', null, 'Como usar: '),
        'toque numa anilha ao terminar cada série e o descanso começa sozinho. Acabou o exercício? ',
        h('strong', null, 'Arraste o cartão para a direita.'),
        ' Aparelho ocupado? Arraste para a esquerda e ele volta no fim.'),
      h('h2', { class: 'rotulo' }, 'Todos os treinos'),
      lista,
      h('p', { class: 'credito' }, 'Fotos: free-exercise-db (domínio público)')));
  }

  function heroTreino(i, proximo) {
    const treino = programa.treinos[i];
    const emAndamento = sessao && sessao.treino === i;
    const etiqueta = emAndamento ? 'Em andamento' : i === proximo ? 'Próximo treino' : 'Treino escolhido';
    const miniaturas = h('div', { class: 'miniaturas' },
      treino.exercicios.map((ex) => h('img', { src: foto(ex, 0), alt: ex.nome, loading: 'lazy' })));
    miniaturas.style.setProperty('--colunas', treino.exercicios.length);

    const extras = [];
    if (sessao && !emAndamento) {
      extras.push(h('p', { class: 'aviso' },
        `Começar este treino encerra o ${programa.treinos[sessao.treino].titulo} em andamento.`));
    }
    if (emAndamento) extras.push(botaoRecomecar(i));

    return h('article', { class: 'hero' },
      h('p', { class: 'etiqueta' }, etiqueta),
      h('h2', null, treino.titulo),
      h('p', { class: 'foco' }, treino.foco),
      h('ul', { class: 'meta' },
        h('li', null, h('strong', null, treino.exercicios.length), 'exercícios'),
        h('li', null, h('strong', null, totalSeries(treino)), 'séries'),
        h('li', null, h('strong', null, treino.duracao.replace(' min', '')), 'min')),
      miniaturas,
      h('div', { class: 'hero-acoes' },
        h('button', { class: 'botao primario', onclick: () => (emAndamento ? abrirTreino() : comecar(i)) },
          emAndamento ? `Continuar (${sessao.feitos.length + 1} de ${treino.exercicios.length})` : 'Começar treino'),
        h('button', { class: 'botao secundario', icone: 'play', onclick: () => abrirVideo(i) }, 'Vídeo')),
      extras);
  }

  function botaoRecomecar(i) {
    let armado = false;
    let espera = null;
    const botao = h('button', {
      class: 'link',
      onclick: () => {
        if (!armado) {
          armado = true;
          botao.textContent = 'Toque de novo para recomeçar do zero';
          espera = setTimeout(() => {
            armado = false;
            botao.textContent = 'Recomeçar do zero';
          }, 3000);
          return;
        }
        clearTimeout(espera);
        comecar(i);
      },
    }, 'Recomeçar do zero');
    return botao;
  }

  function renderTreino() {
    const treino = programa.treinos[sessao.treino];
    const pilha = h('div', { class: 'pilha' });
    app.replaceChildren(h('section', { class: 'treino' },
      h('header', { class: 'barra' },
        h('button', { class: 'icone-botao', icone: 'voltar', 'aria-label': 'Voltar ao início', onclick: voltarInicio }),
        h('div', { class: 'barra-titulo' }, h('strong', null, treino.titulo), h('span', { class: 'contador' })),
        h('button', { class: 'icone-botao', icone: 'play', 'aria-label': `Ver vídeo do ${treino.titulo}`, onclick: () => abrirVideo(sessao.treino) })),
      h('div', { class: 'segmentos', 'aria-hidden': 'true' }, treino.exercicios.map(() => h('span'))),
      pilha,
      h('div', { class: 'descanso', hidden: true }),
      h('div', { class: 'acoes' },
        h('button', { class: 'acao depois', icone: 'depois', onclick: () => acaoBotao('depois') }, 'Depois'),
        h('button', { class: 'acao desfazer', icone: 'desfazer', 'aria-label': 'Desfazer', onclick: desfazer }),
        h('button', { class: 'acao feito', icone: 'feito', onclick: () => acaoBotao('feito') }, 'Feito'))));
    montarPilha(pilha, false);
    atualizarCabecalho();
    atualizarDescanso();
  }

  function atualizarCabecalho() {
    const n = programa.treinos[sessao.treino].exercicios.length;
    app.querySelector('.contador').textContent = `Exercício ${Math.min(sessao.feitos.length + 1, n)} de ${n}`;
    app.querySelectorAll('.segmentos span').forEach((seg, k) => {
      seg.className = sessao.feitos.includes(k) ? 'feito' : k === sessao.fila[0] ? 'atual' : '';
    });
    app.querySelector('.acao.desfazer').disabled = !sessao.historico.length;
  }

  function montarPilha(pilha, animar) {
    const [primeiro, segundo] = sessao.fila;
    pilha.replaceChildren();
    if (segundo !== undefined) pilha.append(cartao(segundo, 'atras'));
    if (primeiro === undefined) return;
    const topo = cartao(primeiro, animar ? 'atras' : 'topo');
    pilha.append(topo);
    ativarArraste(topo);
    if (animar) requestAnimationFrame(() => requestAnimationFrame(() => topo.classList.replace('atras', 'topo')));
  }

  function cartao(i, posicao) {
    const ex = programa.treinos[sessao.treino].exercicios[i];
    const feitas = sessao.series[i] || 0;
    const completo = feitas >= ex.series;
    return h('article', { class: `cartao ${posicao}`, 'data-i': i, 'aria-label': ex.nome },
      h('span', { class: 'carimbo carimbo-feito', 'aria-hidden': 'true' }, 'Feito'),
      h('span', { class: 'carimbo carimbo-depois', 'aria-hidden': 'true' }, 'Depois'),
      h('figure', { class: 'foto' },
        h('img', { class: 'fundo', src: foto(ex, 0), alt: '', draggable: 'false' }),
        h('img', { class: 'pose pose-a', src: foto(ex, 0), alt: `${ex.nome}: posição inicial`, draggable: 'false' }),
        h('img', { class: 'pose pose-b', src: foto(ex, 1), alt: `${ex.nome}: posição final`, draggable: 'false' }),
        h('span', { class: 'numero' }, doisDigitos(i + 1))),
      h('div', { class: 'corpo' },
        h('h2', null, ex.nome),
        h('div', { class: 'numeros' },
          h('div', null, h('span', { class: 'rotulo' }, 'Séries × reps'), h('strong', null, `${ex.series} × ${ex.reps}`)),
          h('div', null, h('span', { class: 'rotulo' }, 'RIR'), h('strong', null, ex.rir)),
          h('div', null, h('span', { class: 'rotulo' }, 'Descanso'), h('strong', null, ex.descanso))),
        h('ul', { class: 'musculos', 'aria-label': 'Músculos trabalhados' },
          ex.primarios.map((m) => h('li', { class: 'principal' }, m)),
          ex.secundarios.map((m) => h('li', { class: 'auxiliar' }, m))),
        h('p', { class: 'rotulo' }, 'Execução'),
        h('ul', { class: 'dicas' }, ex.dicas.map((d) => h('li', null, d)))),
      h('footer', { class: 'series' },
        h('div', { class: 'anilhas', role: 'group', 'aria-label': 'Séries feitas' },
          Array.from({ length: ex.series }, (_, k) => h('button', {
            class: k < feitas ? 'anilha cheia' : k === feitas ? 'anilha proxima' : 'anilha',
            'aria-pressed': String(k < feitas),
            'aria-label': `Série ${k + 1} de ${ex.series}`,
            onclick: () => marcarSerie(i, k),
          }, k + 1))),
        h('span', { class: completo ? 'arraste pronto' : 'arraste' },
          completo ? 'Pronto! Arraste para a direita' : 'Toque ao terminar cada série')));
  }

  function renderFim() {
    const treino = programa.treinos[resumoFinal.treino];
    const proximo = programa.treinos[(resumoFinal.treino + 1) % programa.treinos.length];
    app.replaceChildren(h('section', { class: 'fim' },
      h('p', { class: 'etiqueta' }, `${treino.titulo} concluído`),
      h('h1', null, 'Treino feito.'),
      h('dl', { class: 'resumo' },
        h('div', null, h('dt', null, 'Séries'), h('dd', null, `${resumoFinal.series}/${resumoFinal.totalSeries}`)),
        h('div', null, h('dt', null, 'Exercícios'), h('dd', null, resumoFinal.exercicios)),
        h('div', null, h('dt', null, 'Duração'), h('dd', null, resumoFinal.minutos ? `${resumoFinal.minutos} min` : '—'))),
      h('article', { class: 'proximo' },
        h('p', { class: 'etiqueta' }, 'Próximo treino'),
        h('strong', null, proximo.titulo),
        h('span', null, proximo.foco)),
      h('button', {
        class: 'botao primario',
        onclick: () => {
          resumoFinal = null;
          tela = 'inicio';
          render();
        },
      }, 'Voltar ao início')));
  }

  // ---------- ações do treino ----------

  function comecar(i) {
    const treino = programa.treinos[i];
    sessao = { treino: i, fila: treino.exercicios.map((_, k) => k), feitos: [], series: {}, historico: [], inicio: Date.now() };
    selecionado = i;
    pararDescanso();
    salvarSessao();
    abrirTreino();
  }

  function abrirTreino() {
    tela = 'treino';
    pedirTravaTela();
    render();
  }

  function voltarInicio() {
    tela = 'inicio';
    if (sessao) selecionado = sessao.treino;
    soltarTravaTela();
    render();
  }

  function marcarSerie(i, k) {
    prepararAudio();
    const ex = programa.treinos[sessao.treino].exercicios[i];
    const antes = sessao.series[i] || 0;
    const agora = k < antes ? k : k + 1; // tocar numa anilha cheia desmarca dela em diante
    sessao.series[i] = agora;
    salvarSessao();

    const topo = app.querySelector(`.cartao.topo[data-i="${i}"]`);
    if (topo) {
      topo.querySelectorAll('.anilha').forEach((botao, n) => {
        botao.classList.toggle('cheia', n < agora);
        botao.classList.toggle('proxima', n === agora);
        botao.setAttribute('aria-pressed', String(n < agora));
      });
      const dica = topo.querySelector('.arraste');
      dica.classList.toggle('pronto', agora >= ex.series);
      dica.textContent = agora >= ex.series ? 'Pronto! Arraste para a direita' : 'Toque ao terminar cada série';
    }

    if (agora > antes) {
      const ultima = agora >= ex.series;
      iniciarDescanso(segundosDescanso(ex.descanso), ultima ? 'próximo exercício' : `série ${agora + 1} de ${ex.series}`, ultima);
    }
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
    const i = sessao.fila.shift();
    if (direcao === 'feito') sessao.feitos.push(i);
    else sessao.fila.push(i);
    sessao.historico.push({ tipo: direcao, i });
    salvarSessao();
    if (!sessao.fila.length) {
      terminar();
      return;
    }
    montarPilha(app.querySelector('.pilha'), !semMovimento.matches);
    atualizarCabecalho();
  }

  function desfazer() {
    const ultimo = sessao.historico.pop();
    if (!ultimo) return;
    const lista = ultimo.tipo === 'feito' ? sessao.feitos : sessao.fila;
    const pos = lista.lastIndexOf(ultimo.i);
    if (pos >= 0) lista.splice(pos, 1);
    sessao.fila.unshift(ultimo.i);
    salvarSessao();
    montarPilha(app.querySelector('.pilha'), false);
    atualizarCabecalho();
  }

  function terminar() {
    const treino = programa.treinos[sessao.treino];
    const minutos = Math.round((Date.now() - sessao.inicio) / 60000);
    const feitas = Object.values(sessao.series).reduce((soma, n) => soma + (Number(n) || 0), 0);
    resumoFinal = {
      treino: sessao.treino,
      minutos: minutos < 240 ? Math.max(1, minutos) : null,
      series: Math.min(feitas, totalSeries(treino)),
      totalSeries: totalSeries(treino),
      exercicios: treino.exercicios.length,
    };
    const proximo = (sessao.treino + 1) % programa.treinos.length;
    gravar(CHAVE_PROXIMO, proximo);
    selecionado = proximo;
    sessao = null;
    salvarSessao();
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

    // Depois de arrastar, o soltar não deve contar como toque numa anilha.
    el.addEventListener('click', (e) => {
      if (!ignorarClique) return;
      ignorarClique = false;
      e.stopPropagation();
      e.preventDefault();
    }, true);
  }

  // ---------- descanso ----------

  function iniciarDescanso(segundos, proxima, fimDoExercicio) {
    pararDescanso();
    descanso = {
      fim: Date.now() + segundos * 1000,
      total: segundos,
      proxima,
      fimDoExercicio,
      avisado: false,
      intervalo: setInterval(tique, 250),
      esconder: null,
    };
    tique();
  }

  function pararDescanso() {
    if (descanso) {
      clearInterval(descanso.intervalo);
      clearTimeout(descanso.esconder);
    }
    descanso = null;
    atualizarDescanso();
  }

  function maisTrintaSegundos() {
    if (!descanso) return;
    descanso.fim += 30000;
    descanso.total += 30;
    descanso.avisado = false;
    clearTimeout(descanso.esconder);
    tique();
  }

  function tique() {
    if (!descanso) return;
    if (descanso.fim - Date.now() <= 0 && !descanso.avisado) {
      descanso.avisado = true;
      apitar();
      vibrar();
      descanso.esconder = setTimeout(pararDescanso, 6000);
    }
    atualizarDescanso();
  }

  function atualizarDescanso() {
    const caixa = app.querySelector('.descanso');
    if (!caixa) return;
    if (!descanso) {
      caixa.hidden = true;
      caixa.replaceChildren();
      return;
    }
    if (!caixa.firstChild) {
      caixa.append(
        h('span', { class: 'relogio', role: 'timer', 'aria-label': 'Tempo de descanso' }),
        h('div', { class: 'descanso-info' },
          h('span', { class: 'rotulo descanso-rotulo' }),
          h('span', { class: 'barra-tempo' }, h('i')),
          h('span', { class: 'so-leitor', 'aria-live': 'polite' })),
        h('button', { class: 'mais', 'aria-label': 'Mais 30 segundos', onclick: maisTrintaSegundos }, '+30 s'),
        h('button', { class: 'pular', onclick: pararDescanso }, 'Pular'));
    }
    const restante = Math.max(0, (descanso.fim - Date.now()) / 1000);
    const pronto = restante <= 0;
    caixa.hidden = false;
    caixa.classList.toggle('pronto', pronto);
    caixa.querySelector('.relogio').textContent = relogio(restante);
    caixa.querySelector('.descanso-rotulo').textContent = pronto ? 'Bora!' : 'Descanso';
    const aviso = pronto ? `Descanso feito. Agora: ${descanso.proxima}.` : `Descanso de ${relogio(descanso.total)}.`;
    const elAviso = caixa.querySelector('.so-leitor');
    if (elAviso.textContent !== aviso) elAviso.textContent = aviso;
    caixa.querySelector('.barra-tempo i').style.width = `${(restante / descanso.total) * 100}%`;
    caixa.querySelector('.mais').hidden = pronto;
    caixa.querySelector('.pular').textContent = pronto ? 'Ok' : 'Pular';
  }

  function prepararAudio() {
    try {
      if (!audio) {
        const Contexto = window.AudioContext || window.webkitAudioContext;
        if (Contexto) audio = new Contexto();
      }
      if (audio && audio.state === 'suspended') audio.resume();
    } catch (e) {
      audio = null;
    }
  }

  function apitar() {
    if (!audio) return;
    try {
      const agora = audio.currentTime;
      [0, 0.28].forEach((atraso) => {
        const osc = audio.createOscillator();
        const ganho = audio.createGain();
        osc.frequency.value = 880;
        ganho.gain.setValueAtTime(0.0001, agora + atraso);
        ganho.gain.exponentialRampToValueAtTime(0.35, agora + atraso + 0.02);
        ganho.gain.exponentialRampToValueAtTime(0.0001, agora + atraso + 0.2);
        osc.connect(ganho);
        ganho.connect(audio.destination);
        osc.start(agora + atraso);
        osc.stop(agora + atraso + 0.22);
      });
    } catch (e) {
      // Sem som disponível: o aviso visual basta.
    }
  }

  function vibrar() {
    try {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (e) {
      // Vibração indisponível.
    }
  }

  // ---------- tela ligada e vídeo ----------

  async function pedirTravaTela() {
    try {
      if ('wakeLock' in navigator && document.visibilityState === 'visible' && !travaTela) {
        travaTela = await navigator.wakeLock.request('screen');
        travaTela.addEventListener('release', () => {
          travaTela = null;
        });
      }
    } catch (e) {
      travaTela = null;
    }
  }

  function soltarTravaTela() {
    if (travaTela) travaTela.release().catch(() => {});
    travaTela = null;
  }

  function abrirVideo(i) {
    const treino = programa.treinos[i];
    const video = h('video', { src: `videos/${treino.id}.mp4`, controls: true, playsinline: true, preload: 'metadata' });
    const fechar = () => {
      video.pause();
      modal.remove();
    };
    const modal = h('div', {
      class: 'modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': `Vídeo do ${treino.titulo}`,
      onclick: (e) => {
        if (e.target === modal) fechar();
      },
    }, h('div', { class: 'modal-caixa' },
      video,
      h('button', { class: 'botao secundario', onclick: fechar }, 'Fechar vídeo')));
    document.body.append(modal);
    modal.querySelector('.botao').focus();
    video.play().catch(() => {});
  }

  document.addEventListener('keydown', (e) => {
    const modal = document.querySelector('.modal');
    if (modal) {
      if (e.key === 'Escape') {
        modal.querySelector('video').pause();
        modal.remove();
      }
      return;
    }
    if (tela !== 'treino' || !sessao) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      acaoBotao('feito');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      acaoBotao('depois');
    } else if (e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      desfazer();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (tela === 'treino') pedirTravaTela();
    tique();
  });

  // ---------- início ----------

  fetch('programa_ppl.json')
    .then((resposta) => {
      if (!resposta.ok) throw new Error(String(resposta.status));
      return resposta.json();
    })
    .then((dados) => {
      programa = dados;
      sessao = sessaoValida(ler(CHAVE_SESSAO, null));
      selecionado = sessao ? sessao.treino : indiceProximo();
      render();
    })
    .catch(() => {
      app.replaceChildren(h('section', { class: 'erro' },
        h('h1', null, 'Não deu para carregar os treinos'),
        h('p', null, 'Recarregue a página. Se você abriu o arquivo direto do computador, abra pelo link publicado ou rode um servidor local na pasta treinos.')));
    });
})();
