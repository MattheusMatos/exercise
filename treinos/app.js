(() => {
  'use strict';

  const CHAVE_ESTADO = 'ppl:estado';
  const LIMIAR_ARRASTE = 110; // px para o cartão sair
  const LIMITE_LISTA = 60; // resultados por página na biblioteca
  const app = document.getElementById('app');
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  const ICONES = {
    voltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    desfazer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5L4 9l4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10a5 5 0 0 1 0 10h-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    depois: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    feito: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trocar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mais: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    sino: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  const LETRAS_DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  // Dias sugeridos para cada meta semanal (0 = domingo). Com 3 ou 4, um dia de folga entre os treinos quando dá.
  const DIAS_SUGERIDOS = { 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] };

  // Grupos usados no filtro da biblioteca.
  const MUSCULOS = {
    peito: 'Peito', ombros: 'Ombros', triceps: 'Tríceps', dorsais: 'Dorsais', 'meio-das-costas': 'Meio das costas',
    trapezio: 'Trapézio', biceps: 'Bíceps', antebracos: 'Antebraços', quadriceps: 'Quadríceps',
    isquiotibiais: 'Posteriores de coxa', gluteos: 'Glúteos', adutores: 'Adutores', abdutores: 'Abdutores',
    panturrilhas: 'Panturrilhas', abdominais: 'Abdômen', 'inferior-das-costas': 'Lombar', pescoco: 'Pescoço',
  };
  // A biblioteca separa o deltoide pelo padrão de movimento; no filtro, todos contam como ombros.
  const DELTOIDES = { 'deltoide-anterior': 'Deltoide anterior', 'deltoide-lateral': 'Deltoide lateral', 'deltoide-posterior': 'Deltoide posterior' };
  const MECANICAS = { composto: 'multiarticular', isolado: 'isolado' };
  const EQUIPAMENTOS = {
    barra: 'Barra', 'barra-w': 'Barra W', halteres: 'Halteres', cabo: 'Cabo', maquina: 'Máquina',
    'peso-do-corpo': 'Peso do corpo', kettlebell: 'Kettlebell', faixas: 'Elástico', 'bola-medicinal': 'Bola medicinal',
    'bola-de-exercicio': 'Bola suíça', 'rolo-de-espuma': 'Rolo de espuma', outros: 'Outros',
  };
  const NIVEIS = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };
  // O que sustenta cada motivo do programa (campo "evidencia" de programa_ppl.json).
  const EVIDENCIAS = {
    crescimento: ['Estudo de crescimento', 'um estudo mediu o músculo crescendo'],
    ativacao: ['Estudo de ativação', 'só mediu o quanto o músculo trabalha no exercício'],
    'nao-testado': ['Não testado', 'vem da anatomia ou de estudos com exercícios parecidos'],
  };

  // Avatar de menina usa o treino com foco em pernas e glúteo; o de menino, o PPL.
  const ARQUIVOS_PROGRAMA = { masculino: 'programa_ppl.json', feminino: 'programa_feminino.json' };
  let programas = {};
  let programa = null; // o do avatar escolhido
  let biblioteca = null; // { itens, porId }
  let estado = {
    proximo: 0, proximos: {}, sessao: null, trocas: {}, plano: null, planos: {}, historico: [], extras: {},
    perfil: { personagem: 'brutus', programa: 'masculino' }, atualizado: 0,
  };
  let tela = 'inicio';
  let selecionado = 0;
  let resumoFinal = null;
  let descanso = null; // { fim, total, proxima, avisado, intervalo, esconder }
  let audio = null;
  let travaTela = null;
  let bib = null; // estado da tela da biblioteca enquanto aberta
  let esperaAviso = null;
  let contadorDescansos = 0;

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

  const totalSeries = (treino) => treino.exercicios.reduce((soma, ex) => soma + ex.series, 0);
  const doisDigitos = (n) => String(n).padStart(2, '0');
  const semAcento = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const rotuloMusculo = (m) => DELTOIDES[m] || MUSCULOS[m] || m;
  const grupoMuscular = (m) => (DELTOIDES[m] ? 'ombros' : m);
  const rotuloEquipamento = (e) => EQUIPAMENTOS[e] || 'Sem equipamento';
  const maiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

  // De vermelho (pouco parecido) a verde (muito parecido); abaixo de 30% é vermelho, acima de 90% é verde.
  function corSemelhanca(porcentagem) {
    const t = Math.min(1, Math.max(0, (porcentagem - 30) / 60));
    return `hsl(${Math.round(t * 130)} 70% 58%)`;
  }

  function seloSemelhanca(porcentagem, classe) {
    const selo = h('span', { class: `selo ${classe || ''}`, title: 'Semelhança com o exercício original' }, `${porcentagem}%`);
    selo.style.backgroundColor = corSemelhanca(porcentagem);
    return selo;
  }

  function seloEvidencia(tipo) {
    return EVIDENCIAS[tipo] ? h('span', { class: `evidencia ${tipo}` }, EVIDENCIAS[tipo][0]) : null;
  }

  function legendaEvidencias() {
    return h('ul', { class: 'legenda-evidencia' },
      Object.entries(EVIDENCIAS).map(([tipo, [, descricao]]) => h('li', null, seloEvidencia(tipo), descricao)));
  }

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

  // Datas pelo relógio do celular; a semana começa no domingo.
  const dataLocal = (d) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

  function diasDaSemanaAtual() {
    const hoje = new Date();
    return Array.from({ length: 7 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + i));
  }

  const semanaAtual = () => dataLocal(diasDaSemanaAtual()[0]);
  const todosOsTreinos = () => Object.values(programas).flatMap((p) => p.treinos);
  // O histórico guarda treinos dos dois programas.
  const tituloDoTreino = (id) => (todosOsTreinos().find((t) => t.id === id) || { titulo: '' }).titulo;
  // "PUSH A" vira "Push A".
  const nomeDoTreino = (titulo) => titulo.split(' ').map((p) => (p.length > 1 ? p.charAt(0) + p.slice(1).toLowerCase() : p)).join(' ');

  function avisar(texto) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = h('div', { class: 'toast', role: 'status' });
      document.body.append(el);
    }
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(esperaAviso);
    esperaAviso = setTimeout(() => {
      el.hidden = true;
    }, 2200);
  }

  // ---------- estado, salvo no aparelho ----------

  function extraValido(x) {
    return !!x && typeof x.id === 'string' && Number.isInteger(x.series) && x.series >= 1 && x.series <= 10 &&
      typeof x.reps === 'string' && typeof x.rir === 'string' && typeof x.descanso === 'string';
  }

  function sessaoValida(s, prog) {
    if (!s || typeof s !== 'object') return null;
    const treino = prog.treinos[s.treino];
    if (!treino || !Array.isArray(s.fila) || !Array.isArray(s.feitos) || !s.fila.length) return null;
    const extras = Array.isArray(s.extras) ? s.extras : [];
    if (!extras.every(extraValido)) return null;
    const valido = (i) => Number.isInteger(i) && i >= 0 && i < treino.exercicios.length + extras.length;
    if (!s.fila.every(valido) || !s.feitos.every(valido)) return null;
    return {
      treino: s.treino,
      fila: s.fila,
      feitos: s.feitos,
      series: s.series && typeof s.series === 'object' ? s.series : {},
      historico: Array.isArray(s.historico) ? s.historico : [],
      inicio: Number(s.inicio) || Date.now(),
      extras,
    };
  }

  function estadoValido(bruto) {
    const e = bruto && typeof bruto === 'object' ? JSON.parse(JSON.stringify(bruto)) : {};
    // Versão anterior: avatares desenhados, e o treino seguia o gênero do avatar.
    const ANTIGOS = { 'menino-1': 'brutus', 'menino-2': 'ravi', 'menina-1': 'nina', 'menina-2': 'duda' };
    const p = e.perfil || {};
    const personagem = window.Avatar.PERSONAGENS.some((x) => x.id === p.personagem) ? p.personagem : ANTIGOS[p.avatar] || 'brutus';
    const nomePrograma = programas[p.programa] ? p.programa : /^menina/.test(p.avatar || '') ? 'feminino' : 'masculino';
    const prog = programas[nomePrograma];
    const limpo = {
      proximo: 0, proximos: {}, sessao: sessaoValida(e.sessao, prog), trocas: {}, plano: null, planos: {}, historico: [], extras: {},
      perfil: { personagem, programa: nomePrograma }, atualizado: Number(e.atualizado) || 0,
    };
    if (Number.isInteger(e.proximo) && e.proximo >= 0 && e.proximo < prog.treinos.length) limpo.proximo = e.proximo;
    // Próximo treino do outro programa, guardado para quando trocar de avatar.
    for (const [nome, p] of Object.entries(programas)) {
      const n = e.proximos && e.proximos[nome];
      if (Number.isInteger(n) && n >= 0 && n < p.treinos.length) limpo.proximos[nome] = n;
    }
    for (const treino of todosOsTreinos()) {
      const trocas = e.trocas && e.trocas[treino.id];
      if (trocas && typeof trocas === 'object') {
        const validas = {};
        for (const [slot, id] of Object.entries(trocas)) {
          if (Number(slot) >= 0 && Number(slot) < treino.exercicios.length && typeof id === 'string') validas[slot] = id;
        }
        if (Object.keys(validas).length) limpo.trocas[treino.id] = validas;
      }
      const extras = e.extras && e.extras[treino.id];
      if (Array.isArray(extras) && extras.every(extraValido) && extras.length) limpo.extras[treino.id] = extras.slice(0, 12);
    }
    if (e.plano && typeof e.plano.semana === 'string' && Array.isArray(e.plano.dias) && e.plano.dias.length === 7) {
      limpo.plano = { semana: e.plano.semana, dias: e.plano.dias.map(Boolean) };
    }
    if (e.planos && typeof e.planos === 'object') {
      for (const [semana, dias] of Object.entries(e.planos)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(semana) && Array.isArray(dias) && dias.length === 7) limpo.planos[semana] = dias.map(Boolean);
      }
    }
    const ids = new Set(todosOsTreinos().map((t) => t.id));
    if (Array.isArray(e.historico)) {
      limpo.historico = e.historico.filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(x.data) && ids.has(x.treino)).slice(-400);
    }
    return limpo;
  }

  function carregarLocal() {
    const salvo = ler(CHAVE_ESTADO, null);
    // Versão anterior do app guardava em duas chaves separadas.
    return estadoValido(salvo || { proximo: ler('ppl:proximo', 0), sessao: ler('ppl:sessao', null) });
  }

  function salvar() {
    estado.atualizado = Date.now();
    gravar(CHAVE_ESTADO, estado);
  }

  // ---------- exercícios e biblioteca ----------

  // O exercício que o programa definiu para o lugar, como aparece na biblioteca.
  function originalDoLugar(treinoIdx, slot) {
    return biblioteca ? biblioteca.porId.get(programa.treinos[treinoIdx].exercicios[slot].imagem) : null;
  }

  function exercicio(treinoIdx, slot) {
    const treino = programa.treinos[treinoIdx];
    const base = treino.exercicios[slot];
    const id = estado.trocas[treino.id] && estado.trocas[treino.id][slot];
    const item = id && biblioteca ? biblioteca.porId.get(id) : null;
    if (!item) return { ...base, trocado: false, k: null, semelhanca: null };
    const original = originalDoLugar(treinoIdx, slot);
    return {
      ...base,
      nome: item.nome,
      imagem: item.id,
      primarios: item.musculos.map(rotuloMusculo),
      secundarios: item.auxiliares.map(rotuloMusculo),
      dicas: item.passos,
      porque: null, // o motivo do programa vale para o exercício original, não para o trocado
      evidencia: null,
      trocado: true,
      k: item.k,
      semelhanca: original && window.Semelhanca ? window.Semelhanca.comparar(original, item).porcentagem : null,
    };
  }

  // Com o treino, um extra que veio dos recomendados traz o motivo junto.
  function extraComoExercicio(x, treinoIdx) {
    const item = biblioteca ? biblioteca.porId.get(x.id) : null;
    if (!item) return null;
    const recomendacao = treinoIdx === undefined
      ? null
      : (programa.treinos[treinoIdx].extras || []).find((r) => r.imagem === x.id);
    return {
      nome: item.nome,
      imagem: item.id,
      series: x.series,
      reps: x.reps,
      rir: x.rir,
      descanso: x.descanso,
      primarios: item.musculos.map(rotuloMusculo),
      secundarios: item.auxiliares.map(rotuloMusculo),
      dicas: item.passos,
      porque: recomendacao ? recomendacao.motivo : null,
      evidencia: recomendacao ? recomendacao.evidencia : null,
      trocado: false,
      extra: true,
      k: item.k,
      semelhanca: null,
    };
  }

  // Exercício i da sessão em andamento: primeiro os do programa, depois os extras.
  function exercicioDaSessao(i) {
    const sessao = estado.sessao;
    const base = programa.treinos[sessao.treino].exercicios.length;
    return i < base ? exercicio(sessao.treino, i) : extraComoExercicio(sessao.extras[i - base], sessao.treino);
  }

  // Índices que contam na sessão; um extra tirado do treino de hoje sai da conta.
  function indicesDaSessao() {
    const sessao = estado.sessao;
    const base = programa.treinos[sessao.treino].exercicios.length;
    const extras = sessao.extras.map((x, j) => (x.removido ? -1 : base + j)).filter((i) => i >= 0);
    return [...Array(base).keys(), ...extras];
  }

  function seriesDaSessao(i) {
    const sessao = estado.sessao;
    const treino = programa.treinos[sessao.treino];
    return i < treino.exercicios.length ? treino.exercicios[i].series : sessao.extras[i - treino.exercicios.length].series;
  }

  function porQue(original, outro, nota) {
    const todos = (e) => [...e.musculos, ...e.auxiliares];
    const comuns = todos(original).filter((m) => todos(outro).includes(m));
    const faltam = original.musculos.filter((m) => !todos(outro).includes(m));
    const movimento = window.Semelhanca.rotuloMovimento;
    const itens = [comuns.length ? `Músculos em comum: ${comuns.map(rotuloMusculo).join(', ')}` : 'Nenhum músculo em comum'];
    if (faltam.length) itens.push(`Não trabalha: ${faltam.map(rotuloMusculo).join(', ')}`);
    if (nota.movimento === 1) itens.push(`Mesmo movimento: ${movimento(outro.padrao)}`);
    else {
      const tipoDeDiferenca = nota.movimento > 0 ? 'Movimento parecido' : 'Movimento diferente';
      itens.push(`${tipoDeDiferenca}: ${movimento(outro.padrao)} (o original é ${movimento(original.padrao)})`);
    }
    if (MECANICAS[original.mecanica] && MECANICAS[outro.mecanica]) {
      itens.push(original.mecanica === outro.mecanica
        ? `Também ${MECANICAS[outro.mecanica]}`
        : `${maiuscula(MECANICAS[outro.mecanica])}; o original é ${MECANICAS[original.mecanica]}`);
    }
    itens.push(nota.equipamento === 1
      ? `Mesmo equipamento: ${rotuloEquipamento(outro.equipamento)}`
      : `Outro equipamento: ${rotuloEquipamento(outro.equipamento)}`);
    const estudo = window.Semelhanca.estudo(original, outro);
    if (estudo) itens.push(h('strong', null, estudo));
    return itens;
  }

  function sprite(k, classe, quadro, rotulo) {
    const pos = k % 25;
    const el = h('div', rotulo
      ? { class: `sprite ${classe}`, role: 'img', 'aria-label': rotulo }
      : { class: `sprite ${classe}`, 'aria-hidden': 'true' });
    el.style.backgroundImage = `url("biblioteca/fotos-${quadro ? 'b' : 'a'}-${Math.floor(k / 25)}.jpg")`;
    el.style.backgroundPosition = `${(pos % 5) * 25}% ${Math.floor(pos / 5) * 25}%`;
    return el;
  }

  // Exercícios do programa têm fotos próprias; os da biblioteca (trocas e extras) vêm das folhas.
  const daBiblioteca = (ex) => ex.k !== null && ex.k !== undefined;

  function miniatura(ex) {
    if (!daBiblioteca(ex)) return h('img', { class: 'mini', src: `fotos/${ex.imagem}-0.jpg`, alt: '', loading: 'lazy' });
    const pos = ex.k % 100;
    const el = h('span', { class: 'mini mini-folha', 'aria-hidden': 'true' });
    el.style.backgroundImage = `url("biblioteca/miniaturas-${Math.floor(ex.k / 100)}.jpg")`;
    el.style.backgroundPosition = `${((pos % 10) * 100) / 9}% ${(Math.floor(pos / 10) * 100) / 9}%`;
    return el;
  }

  function figura(ex, numero, botao) {
    const fig = h('figure', { class: 'foto' });
    if (daBiblioteca(ex)) {
      fig.append(
        sprite(ex.k, 'fundo', 0, ''),
        h('div', { class: 'quadro' },
          sprite(ex.k, 'pose pose-a', 0, `${ex.nome}: posição inicial`),
          sprite(ex.k, 'pose pose-b', 1, `${ex.nome}: posição final`)));
    } else {
      fig.append(
        h('img', { class: 'fundo', src: `fotos/${ex.imagem}-0.jpg`, alt: '', draggable: 'false' }),
        h('img', { class: 'pose pose-a', src: `fotos/${ex.imagem}-0.jpg`, alt: `${ex.nome}: posição inicial`, draggable: 'false' }),
        h('img', { class: 'pose pose-b', src: `fotos/${ex.imagem}-1.jpg`, alt: `${ex.nome}: posição final`, draggable: 'false' }));
    }
    if (numero) fig.append(h('span', { class: 'numero' }, numero));
    if (botao) fig.append(botao);
    return fig;
  }

  function carregarBiblioteca() {
    fetch('biblioteca/exercicios.json')
      .then((resposta) => {
        if (!resposta.ok) throw new Error(String(resposta.status));
        return resposta.json();
      })
      .then((dados) => {
        const itens = dados.exercicios.map((e, k) => ({
          ...e,
          k,
          busca: semAcento(`${e.nome} ${e.id.replace(/[_-]+/g, ' ')}`),
        }));
        biblioteca = { itens, porId: new Map(itens.map((e) => [e.id, e])) };
        if (tela === 'inicio') renderInicio();
        else if (tela === 'treino' && estado.sessao) montarPilha(app.querySelector('.pilha'), false);
      })
      .catch(() => {
        biblioteca = null; // o treino segue normal, só sem a troca de exercícios
      });
  }

  function abrirBiblioteca(treinoIdx, slot) {
    if (!biblioteca) {
      avisar('A biblioteca ainda está carregando');
      return;
    }
    const trocando = slot !== undefined;
    const original = trocando ? originalDoLugar(treinoIdx, slot) : null;
    const notas = original && window.Semelhanca
      ? new Map(biblioteca.itens.map((e) => [e.k, window.Semelhanca.comparar(original, e)]))
      : null;
    bib = {
      trocando, treinoIdx, slot, original, notas,
      musculo: 'todos', equipamento: 'todos', busca: '', limite: LIMITE_LISTA, detalhe: null, rolagem: 0,
    };
    document.body.append(h('div', { class: 'camada biblioteca', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Biblioteca de exercícios' }));
    renderBiblioteca();
  }

  // Abre nos exercícios recomendados para o treino; dali dá para escolher qualquer um da biblioteca.
  function abrirAdicionar(treinoIdx, naSessao) {
    if (!biblioteca) {
      avisar('A biblioteca ainda está carregando');
      return;
    }
    bib = {
      trocando: false, adicionando: { treinoIdx, naSessao }, verTudo: false, treinoIdx, original: null, notas: null,
      musculo: 'todos', equipamento: 'todos', busca: '', limite: LIMITE_LISTA, detalhe: null, rolagem: 0,
    };
    document.body.append(h('div', { class: 'camada biblioteca', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Adicionar exercício' }));
    renderBiblioteca();
  }

  function fecharBiblioteca() {
    const camada = document.querySelector('.biblioteca');
    if (camada) camada.remove();
    bib = null;
  }

  // Volta um passo: do detalhe para a lista, da biblioteca completa para os recomendados, ou fecha.
  function voltarNaBiblioteca() {
    if (bib.detalhe !== null) bib.detalhe = null;
    else if (bib.adicionando && bib.verTudo) {
      bib.verTudo = false;
      bib.rolagem = 0;
    } else {
      fecharBiblioteca();
      return;
    }
    renderBiblioteca();
  }

  function idsNoTreino(treinoIdx) {
    const treino = programa.treinos[treinoIdx];
    const ids = treino.exercicios.map((_, slot) => exercicio(treinoIdx, slot).imagem);
    for (const x of estado.extras[treino.id] || []) ids.push(x.id);
    if (estado.sessao && estado.sessao.treino === treinoIdx) {
      for (const x of estado.sessao.extras) if (!x.removido) ids.push(x.id);
    }
    return new Set(ids);
  }

  function recomendados(treinoIdx) {
    const presentes = idsNoTreino(treinoIdx);
    return (programa.treinos[treinoIdx].extras || []).filter((x) => biblioteca.porId.has(x.imagem) && !presentes.has(x.imagem));
  }

  const prescricaoPadrao = (item) => (item.mecanica === 'composto'
    ? { series: 3, reps: '8–12', rir: '1–2', descanso: '2 min' }
    : { series: 2, reps: '10–15', rir: '0–1', descanso: '1–2 min' });

  function telaRecomendados() {
    const treino = programa.treinos[bib.adicionando.treinoIdx];
    const lista = recomendados(bib.adicionando.treinoIdx);
    return h('div', { class: 'bib-conteudo' },
      h('header', { class: 'bib-topo' },
        h('button', { class: 'icone-botao', icone: 'voltar', 'aria-label': 'Fechar', onclick: fecharBiblioteca }),
        h('h2', null, `Adicionar ao ${treino.titulo}`)),
      h('p', { class: 'aviso' }, 'Extras são opcionais. Mais séries ainda rendem crescimento, mas cada série extra rende menos que a anterior (Pelland et al., 2026).'),
      legendaEvidencias(),
      h('p', { class: 'rotulo' }, 'Recomendados para este treino'),
      lista.length
        ? h('ul', { class: 'resultados' }, lista.map((x) => {
          const item = biblioteca.porId.get(x.imagem);
          return h('li', null, h('button', {
            class: 'item-bib recomendacao',
            onclick: () => {
              bib.rolagem = document.querySelector('.biblioteca').scrollTop;
              bib.detalhe = item.k;
              renderBiblioteca();
            },
          },
            miniatura({ k: item.k }),
            h('span', { class: 'item-texto' },
              h('span', { class: 'item-nome' }, item.nome),
              h('span', { class: 'item-meta' }, `${x.series} × ${x.reps} · ${item.musculos.map(rotuloMusculo).join(', ')}`),
              seloEvidencia(x.evidencia),
              h('span', { class: 'motivo' }, x.motivo))));
        }))
        : h('p', { class: 'vazio' }, 'Os recomendados já estão no treino. Escolha outro na biblioteca.'),
      h('button', {
        class: 'botao secundario',
        onclick: () => {
          bib.verTudo = true;
          bib.rolagem = 0;
          renderBiblioteca();
        },
      }, 'Escolher outro na biblioteca'));
  }

  function botoesAdicionar(item, recomendacao) {
    const { treinoIdx, naSessao } = bib.adicionando;
    const treino = programa.treinos[treinoIdx];
    if (idsNoTreino(treinoIdx).has(item.id)) {
      return h('div', { class: 'bib-acoes' }, h('p', { class: 'aviso' }, 'Este exercício já está no treino.'));
    }
    const prescricao = recomendacao
      ? { series: recomendacao.series, reps: recomendacao.reps, rir: recomendacao.rir, descanso: recomendacao.descanso }
      : prescricaoPadrao(item);
    const extra = { id: item.id, ...prescricao };
    return h('div', { class: 'bib-acoes' },
      h('p', { class: 'aviso' }, `Entra com ${prescricao.series} × ${prescricao.reps}, RIR ${prescricao.rir} e ${prescricao.descanso} de descanso.`),
      naSessao ? h('button', { class: 'botao primario', onclick: () => adicionarExtra(treinoIdx, extra, false) }, 'Adicionar só hoje') : null,
      h('button', { class: naSessao ? 'botao secundario' : 'botao primario', onclick: () => adicionarExtra(treinoIdx, extra, true) },
        `Adicionar sempre no ${treino.titulo}`));
  }

  function adicionarExtra(treinoIdx, extra, sempre) {
    const treino = programa.treinos[treinoIdx];
    if (sempre) estado.extras[treino.id] = [...(estado.extras[treino.id] || []), extra];
    const sessao = estado.sessao;
    if (sessao && sessao.treino === treinoIdx) {
      sessao.fila.push(treino.exercicios.length + sessao.extras.length);
      sessao.extras.push({ ...extra });
    }
    salvar();
    fecharBiblioteca();
    render();
    avisar(sempre ? `Adicionado ao ${treino.titulo}` : 'Adicionado no fim do treino de hoje');
  }

  function removerExtraFixo(treinoId, j) {
    const lista = (estado.extras[treinoId] || []).filter((_, n) => n !== j);
    if (lista.length) estado.extras[treinoId] = lista;
    else delete estado.extras[treinoId];
    salvar();
    renderInicio();
    avisar('Exercício tirado do treino');
  }

  function removerDaSessao(i) {
    const sessao = estado.sessao;
    const extra = sessao.extras[i - programa.treinos[sessao.treino].exercicios.length];
    if (!extra) return;
    extra.removido = true;
    sessao.fila = sessao.fila.filter((x) => x !== i);
    sessao.feitos = sessao.feitos.filter((x) => x !== i);
    sessao.historico = sessao.historico.filter((x) => x.i !== i);
    salvar();
    if (!sessao.fila.length) {
      terminar();
      return;
    }
    renderTreino();
    avisar('Exercício tirado do treino de hoje');
  }

  const nomeDoLugar = () => programa.treinos[bib.treinoIdx].exercicios[bib.slot].nome;

  function renderBiblioteca() {
    const camada = document.querySelector('.biblioteca');
    if (!camada || !bib) return;
    if (bib.detalhe !== null) {
      camada.replaceChildren(detalheBiblioteca(biblioteca.itens[bib.detalhe]));
      camada.scrollTop = 0;
      return;
    }
    if (bib.adicionando && !bib.verTudo) {
      camada.replaceChildren(telaRecomendados());
      camada.scrollTop = bib.rolagem;
      return;
    }

    let titulo = 'Biblioteca de exercícios';
    if (bib.trocando) titulo = `Trocar ${nomeDoLugar()}`;
    else if (bib.adicionando) titulo = `Adicionar ao ${programa.treinos[bib.adicionando.treinoIdx].titulo}`;
    const busca = h('input', {
      type: 'search', id: 'busca-exercicio', class: 'campo', value: bib.busca, autocomplete: 'off',
      placeholder: 'Buscar: supino, rosca, agachamento…', 'aria-label': 'Buscar exercício',
    });
    busca.addEventListener('input', () => {
      bib.busca = busca.value;
      bib.limite = LIMITE_LISTA;
      atualizarResultados();
    });
    const opcoesMusculo = [['todos', 'Todos'], ...Object.entries(MUSCULOS)];
    const chips = h('div', { class: 'filtro-musculos', role: 'group', 'aria-label': 'Filtrar por músculo' },
      opcoesMusculo.map(([valor, rotulo]) => h('button', {
        class: 'chip-filtro',
        'aria-pressed': String(bib.musculo === valor),
        onclick: () => {
          bib.musculo = valor;
          bib.limite = LIMITE_LISTA;
          renderBiblioteca();
        },
      }, rotulo)));
    const equipamento = h('select', {
      id: 'filtro-equipamento', class: 'campo', 'aria-label': 'Filtrar por equipamento',
      onchange: (e) => {
        bib.equipamento = e.target.value;
        bib.limite = LIMITE_LISTA;
        atualizarResultados();
      },
    },
      h('option', { value: 'todos' }, 'Qualquer equipamento'),
      Object.entries(EQUIPAMENTOS).map(([valor, rotulo]) => h('option', { value: valor, selected: bib.equipamento === valor }, rotulo)));

    const extras = [];
    if (bib.trocando) {
      if (bib.notas) {
        extras.push(h('div', { class: 'legenda-semelhanca' },
          h('p', null, `A porcentagem mostra o quanto cada exercício se parece com ${nomeDoLugar()}: músculos (50%), movimento (30%), tipo de exercício (10%) e equipamento (10%). Aparelho ocupado? Filtre por outro equipamento.`),
          h('div', { class: 'escala', 'aria-hidden': 'true' }),
          h('div', { class: 'escala-rotulos', 'aria-hidden': 'true' }, h('span', null, 'Pouco parecido'), h('span', null, 'Muito parecido'))));
      }
      extras.push(h('p', { class: 'aviso' }, 'Séries, repetições e descanso continuam os do treino.'));
      if (exercicio(bib.treinoIdx, bib.slot).trocado) {
        extras.push(h('button', { class: 'botao secundario', onclick: () => trocar(bib.treinoIdx, bib.slot, null) },
          `Voltar para ${nomeDoLugar()}`));
      }
    }

    camada.replaceChildren(h('div', { class: 'bib-conteudo' },
      h('header', { class: 'bib-topo' },
        h('button', { class: 'icone-botao', icone: 'voltar', 'aria-label': bib.adicionando ? 'Voltar aos recomendados' : 'Fechar biblioteca', onclick: voltarNaBiblioteca }),
        h('h2', null, titulo)),
      extras,
      busca,
      chips,
      equipamento,
      h('p', { class: 'contagem' }),
      h('ul', { class: 'resultados' }),
      h('button', {
        class: 'botao secundario mais-resultados',
        onclick: () => {
          bib.limite += LIMITE_LISTA;
          atualizarResultados();
        },
      }, 'Mostrar mais')));
    atualizarResultados();
    const ativo = camada.querySelector('.chip-filtro[aria-pressed="true"]');
    if (ativo) ativo.scrollIntoView({ block: 'nearest', inline: 'center' });
    camada.scrollTop = bib.rolagem;
  }

  function itemBiblioteca(e, atual) {
    const nota = bib.notas ? bib.notas.get(e.k) : null;
    return h('li', null, h('button', {
      class: 'item-bib',
      'aria-current': e.id === atual ? 'true' : null,
      onclick: () => {
        bib.rolagem = document.querySelector('.biblioteca').scrollTop;
        bib.detalhe = e.k;
        renderBiblioteca();
      },
    },
      miniatura({ trocado: true, k: e.k }),
      h('span', { class: 'item-texto' },
        h('span', { class: 'item-nome' }, e.nome),
        h('span', { class: 'item-meta' }, `${e.musculos.map(rotuloMusculo).join(', ')} · ${rotuloEquipamento(e.equipamento)}`),
        e.id === atual ? h('span', { class: 'item-atual' }, 'No treino agora') : null),
      nota ? seloSemelhanca(nota.porcentagem) : null));
  }

  function atualizarResultados() {
    const camada = document.querySelector('.biblioteca');
    if (!camada || !bib) return;
    const termos = semAcento(bib.busca).split(/\s+/).filter(Boolean);
    const idOriginal = bib.original ? bib.original.id : null;
    const lista = biblioteca.itens.filter((e) =>
      e.id !== idOriginal &&
      (bib.musculo === 'todos' || e.musculos.some((m) => grupoMuscular(m) === bib.musculo)) &&
      (bib.equipamento === 'todos' || e.equipamento === bib.equipamento) &&
      termos.every((t) => e.busca.includes(t)));
    const atual = bib.trocando ? exercicio(bib.treinoIdx, bib.slot).imagem : null;
    const ul = camada.querySelector('.resultados');
    camada.querySelector('.contagem').textContent = lista.length === 1 ? '1 exercício' : `${lista.length} exercícios`;

    if (bib.notas) {
      // Na troca: os mais parecidos primeiro; variações incomuns não entram entre os recomendados.
      const nota = (e) => bib.notas.get(e.k).porcentagem;
      lista.sort((a, b) => nota(b) - nota(a) || a.nome.localeCompare(b.nome, 'pt'));
      const recomendados = lista.filter((e) => !e.incomum).slice(0, 6);
      const outros = lista.filter((e) => !recomendados.includes(e));
      const linhas = [];
      if (recomendados.length) linhas.push(h('li', { class: 'secao' }, 'Mais recomendados'), ...recomendados.map((e) => itemBiblioteca(e, atual)));
      if (outros.length) linhas.push(h('li', { class: 'secao' }, 'Outras opções'), ...outros.slice(0, bib.limite).map((e) => itemBiblioteca(e, atual)));
      ul.replaceChildren(...linhas);
      camada.querySelector('.mais-resultados').hidden = outros.length <= bib.limite;
    } else {
      ul.replaceChildren(...lista.slice(0, bib.limite).map((e) => itemBiblioteca(e, atual)));
      camada.querySelector('.mais-resultados').hidden = lista.length <= bib.limite;
    }
    if (!lista.length) ul.append(h('li', { class: 'vazio' }, 'Nenhum exercício encontrado. Tente outra palavra ou tire um filtro.'));
  }

  function detalheBiblioteca(e) {
    const ex = { nome: e.nome, trocado: true, k: e.k };
    const meta = [
      rotuloEquipamento(e.equipamento),
      NIVEIS[e.nivel],
      MECANICAS[e.mecanica] ? maiuscula(MECANICAS[e.mecanica]) : null,
    ].filter(Boolean).join(' · ');
    const nota = bib.notas ? bib.notas.get(e.k) : null;
    const recomendacao = bib.adicionando
      ? (programa.treinos[bib.adicionando.treinoIdx].extras || []).find((x) => x.imagem === e.id)
      : null;
    let acoes = null;
    if (bib.trocando) {
      acoes = h('div', { class: 'bib-acoes' },
        h('button', { class: 'botao primario', onclick: () => trocar(bib.treinoIdx, bib.slot, e.id) }, 'Usar este exercício'));
    } else if (bib.adicionando) {
      acoes = botoesAdicionar(e, recomendacao);
    }
    return h('div', { class: 'bib-conteudo' },
      h('header', { class: 'bib-topo' },
        h('button', { class: 'icone-botao', icone: 'voltar', 'aria-label': 'Voltar para a lista', onclick: voltarNaBiblioteca }),
        h('h2', null, e.nome)),
      h('div', { class: 'detalhe-foto' }, figura(ex, null, null)),
      recomendacao
        ? h('section', { class: 'semelhanca' },
          h('div', { class: 'porque-topo' }, h('p', { class: 'rotulo' }, 'Por que adicionar'), seloEvidencia(recomendacao.evidencia)),
          h('p', { class: 'motivo' }, recomendacao.motivo))
        : null,
      nota
        ? h('section', { class: 'semelhanca' },
          h('div', { class: 'semelhanca-topo' },
            seloSemelhanca(nota.porcentagem, 'grande'),
            h('p', null, `semelhante a ${nomeDoLugar()}`)),
          h('ul', { class: 'por-que' }, porQue(bib.original, e, nota).map((texto) => h('li', null, texto))))
        : null,
      h('ul', { class: 'musculos', 'aria-label': 'Músculos trabalhados' },
        e.musculos.map((m) => h('li', { class: 'principal' }, rotuloMusculo(m))),
        e.auxiliares.map((m) => h('li', { class: 'auxiliar' }, rotuloMusculo(m)))),
      h('p', { class: 'item-meta' }, meta),
      h('p', { class: 'rotulo' }, 'Passo a passo'),
      h('ol', { class: 'passos' }, e.passos.map((passo) => h('li', null, passo))),
      acoes);
  }

  function trocar(treinoIdx, slot, id) {
    const treino = programa.treinos[treinoIdx];
    const original = treino.exercicios[slot].imagem;
    const trocas = { ...(estado.trocas[treino.id] || {}) };
    if (!id || id === original) delete trocas[slot];
    else trocas[slot] = id;
    if (Object.keys(trocas).length) estado.trocas[treino.id] = trocas;
    else delete estado.trocas[treino.id];
    salvar();
    fecharBiblioteca();
    if (tela === 'treino' && estado.sessao) montarPilha(app.querySelector('.pilha'), false);
    else render();
    avisar(id && id !== original ? 'Exercício trocado' : 'Exercício original de volta');
  }

  // ---------- semana ----------

  const planoDaSemana = () => (estado.plano && estado.plano.semana === semanaAtual() ? estado.plano : null);

  // O plano de uma semana que passou fica guardado: a ofensiva confere a meta de cada semana.
  function definirPlano(dias) {
    if (estado.plano && estado.plano.semana !== semanaAtual()) {
      const planos = { ...estado.planos, [estado.plano.semana]: estado.plano.dias };
      estado.planos = Object.fromEntries(Object.entries(planos).sort().slice(-26));
    }
    estado.plano = { semana: semanaAtual(), dias };
  }

  const todosOsPlanos = () => (estado.plano ? { ...estado.planos, [estado.plano.semana]: estado.plano.dias } : estado.planos);
  const ofensivaAtual = () => window.Ofensiva.calcular(estado.historico, todosOsPlanos(), dataLocal(new Date()));

  // Encaixa a meta nos dias que ainda faltam da semana, preferindo os dias sugeridos.
  function planejarSemana(meta) {
    const hoje = new Date().getDay();
    const livres = [1, 2, 3, 4, 5, 6].filter((d) => d >= hoje);
    const dias = DIAS_SUGERIDOS[meta].filter((d) => livres.includes(d));
    for (const d of livres) if (dias.length < meta && !dias.includes(d)) dias.push(d);
    definirPlano([0, 1, 2, 3, 4, 5, 6].map((d) => dias.includes(d)));
    salvar();
    renderInicio();
    avisar(dias.length < meta
      ? `Até sábado cabe${dias.length === 1 ? '' : 'm'} ${dias.length} treino${dias.length === 1 ? '' : 's'}`
      : `Semana planejada: ${meta} treinos`);
  }

  function pularSemana() {
    definirPlano(Array(7).fill(false));
    salvar();
    renderInicio();
  }

  function mudarMeta() {
    estado.plano = null;
    salvar();
    renderInicio();
  }

  function alternarDia(d) {
    const plano = planoDaSemana();
    if (!plano) return;
    plano.dias[d] = !plano.dias[d];
    salvar();
    renderInicio();
  }

  // Cada dia da semana com o que foi feito ou o treino planejado, seguindo a sequência a partir do próximo.
  function semanaComTreinos() {
    const plano = planoDaSemana();
    const hoje = dataLocal(new Date());
    const feitos = new Map();
    for (const x of estado.historico) feitos.set(x.data, x.treino);
    let seguinte = estado.sessao ? estado.sessao.treino : estado.proximo;
    return diasDaSemanaAtual().map((dia, d) => {
      const data = dataLocal(dia);
      const planejado = !!(plano && plano.dias[d]);
      let status = 'descanso';
      let treino = null;
      if (feitos.has(data)) {
        status = 'feito';
        treino = feitos.get(data);
      } else if (planejado && data < hoje) {
        status = 'faltou';
      } else if (planejado) {
        status = 'planejado';
        treino = programa.treinos[seguinte].id;
        seguinte = (seguinte + 1) % programa.treinos.length;
      }
      return { d, numero: dia.getDate(), hoje: data === hoje, passado: data < hoje, status, treino };
    });
  }

  // "hoje", o nome do dia do próximo treino planejado, ou null sem plano.
  function quandoEOProximo() {
    const dia = semanaComTreinos().find((x) => x.status === 'planejado');
    if (!dia) return null;
    return dia.hoje ? 'hoje' : NOMES_DIAS[dia.d];
  }

  function perguntaSemana() {
    return h('section', { class: 'semana-cartao' },
      h('p', { class: 'etiqueta' }, new Date().getDay() === 0 ? 'Nova semana' : 'Esta semana'),
      h('h2', null, 'Preparado para a semana?'),
      h('p', { class: 'pergunta-texto' }, 'Quantos dias você pretende treinar?'),
      h('div', { class: 'opcoes-dias' }, [3, 4, 5, 6].map((n) => h('button', {
        class: 'opcao-dia',
        'aria-label': `${n} dias`,
        onclick: () => planejarSemana(n),
      }, h('strong', null, n), h('span', null, 'dias')))),
      h('p', { class: 'aviso' }, `Os treinos seguem a sequência ${programa.treinos.map((t) => nomeDoTreino(t.titulo)).join(', ').replace(/, ([^,]+)$/, ' e $1')}. Dá para ajustar os dias depois.`),
      h('div', { class: 'semana-rodape' },
        h('button', { class: 'link', onclick: pularSemana }, 'Agora não'),
        h('button', { class: 'link', icone: 'sino', onclick: abrirLembrete }, 'Lembrete todo domingo')));
  }

  function cartaoSemana(interativo) {
    const plano = planoDaSemana();
    if (!plano && interativo) return perguntaSemana();
    const dias = semanaComTreinos();
    const feitos = dias.filter((x) => x.status === 'feito').length;
    const meta = plano ? plano.dias.filter(Boolean).length : 0;
    let resumo = 'Sem treinos planejados';
    if (meta === 1) resumo = `${feitos} de 1 treino feito`;
    else if (meta) resumo = `${feitos} de ${meta} treinos feitos`;
    else if (feitos) resumo = `${feitos} treino${feitos === 1 ? ' feito' : 's feitos'}`;
    const descricoes = { feito: 'feito', planejado: 'planejado', faltou: 'planejado e não feito', descanso: 'descanso' };
    const tira = h('ol', { class: 'semana' }, dias.map((x) => {
      const podeMudar = interativo && !x.passado && x.status !== 'feito';
      const rotulo = x.treino ? tituloDoTreino(x.treino) : x.status === 'faltou' ? 'faltou' : '—';
      const nome = `${maiuscula(NOMES_DIAS[x.d])}, dia ${x.numero}${x.hoje ? ' (hoje)' : ''}`;
      return h('li', null, h(podeMudar ? 'button' : 'div', {
        class: `dia ${x.status}${x.hoje ? ' hoje' : ''}`,
        'aria-label': `${nome}: ${x.treino ? `${tituloDoTreino(x.treino)} ` : ''}${descricoes[x.status]}`,
        onclick: podeMudar ? () => alternarDia(x.d) : null,
      },
        h('span', { class: 'dia-letra', 'aria-hidden': 'true' }, LETRAS_DIAS[x.d]),
        h('span', { class: 'dia-numero', 'aria-hidden': 'true' }, x.numero),
        h('span', { class: 'dia-treino', 'aria-hidden': 'true' }, rotulo)));
    }));
    return h('section', { class: 'semana-cartao' },
      h('div', { class: 'semana-rodape' },
        h('p', { class: 'etiqueta' }, 'Esta semana'),
        h('span', { class: 'semana-resumo' }, resumo)),
      tira,
      interativo
        ? h('div', { class: 'semana-rodape' },
          h('span', { class: 'dica-semana' }, 'Toque num dia para trocar entre treino e descanso.'),
          h('button', { class: 'link', onclick: mudarMeta }, 'Mudar meta'))
        : null,
      interativo ? h('button', { class: 'link', icone: 'sino', onclick: abrirLembrete }, 'Lembrete todo domingo') : null);
  }

  // Sem servidor, o site não manda notificação sozinho; a agenda do celular avisa todo domingo.
  function urlGoogleAgenda() {
    const hoje = new Date();
    const domingo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7 - hoje.getDay());
    const dia = `${domingo.getFullYear()}${doisDigitos(domingo.getMonth() + 1)}${doisDigitos(domingo.getDate())}`;
    const parametros = new URLSearchParams({
      action: 'TEMPLATE',
      text: 'Treino PPL: planejar a semana',
      details: `Preparado para a semana? Abra o app e escolha quantos dias vai treinar: ${location.href.split('#')[0]}`,
      dates: `${dia}T090000/${dia}T091500`,
      recur: 'RRULE:FREQ=WEEKLY;BYDAY=SU',
    });
    return `https://calendar.google.com/calendar/render?${parametros}`;
  }

  function abrirLembrete() {
    const fechar = () => modal.remove();
    const modal = h('div', {
      class: 'modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Lembrete todo domingo',
      onclick: (e) => {
        if (e.target === modal) fechar();
      },
    }, h('div', { class: 'modal-caixa folha' },
      h('h2', null, 'Lembrete todo domingo'),
      h('p', null, 'Um site não consegue mandar notificação sozinho, sem um servidor. Por isso o lembrete fica na agenda do celular: todo domingo às 9h ela avisa para você planejar a semana. Dá para mudar o horário depois, na própria agenda.'),
      h('a', { class: 'botao primario', href: urlGoogleAgenda(), target: '_blank', rel: 'noopener' }, 'Google Agenda (Android)'),
      h('a', { class: 'botao secundario', href: 'lembrete-domingo.ics' }, 'Calendário do iPhone'),
      h('button', { class: 'link', onclick: fechar }, 'Fechar')));
    document.body.append(modal);
    modal.querySelector('.botao').focus();
  }

  // ---------- ofensiva e personagem ----------

  const PROGRAMAS_NOMES = { masculino: ['Treino PPL', 'Push, pull e legs: volume distribuído no corpo todo'], feminino: ['Pernas e glúteo', 'Quatro de seis treinos para pernas e glúteo'] };

  function imagemDoPersonagem(fase, classe) {
    const p = window.Avatar.personagem(estado.perfil.personagem);
    return h('img', { class: classe || 'personagem-img', src: window.Avatar.imagem(p.id, fase), alt: `${p.nome}, ${window.Avatar.rotuloDaFase(p.id, fase).toLowerCase()}` });
  }

  // Comemorando ou descansando, com fundo transparente.
  function imagemDoMomento(momento) {
    const p = window.Avatar.personagem(estado.perfil.personagem);
    const textos = { comemora: 'comemorando o treino', 'descanso-1': 'descansando', 'descanso-2': 'olhando o relógio' };
    return h('img', { class: 'personagem-momento', src: window.Avatar.imagemDoMomento(p.id, momento), alt: `${p.nome}, ${textos[momento]}` });
  }

  function iconeChama(estadoChama) {
    const el = h('span', { class: 'chama-icone', 'aria-hidden': 'true' });
    el.innerHTML = window.Avatar.chama(estadoChama);
    return el;
  }

  const estadoDaChama = (of) => (of.dias === 0 ? 'apagada' : of.risco ? 'risco' : 'acesa');
  const plural = (n, palavra) => `${n} ${palavra}${n === 1 ? '' : 's'}`;

  function fraseDoHumor(of) {
    const nome = window.Avatar.personagem(estado.perfil.personagem).nome;
    const dias = of.diasSemTreinar;
    if (of.humor === 'novo') return `${nome} está pronto para começar. Termine o primeiro treino para acender a ofensiva.`;
    if (of.risco) return 'Treine hoje para não apagar a ofensiva!';
    if (of.treinouHoje) return of.dias >= 3 ? 'Treino de hoje feito. A ofensiva está pegando fogo!' : 'Treino de hoje feito!';
    if (dias >= 15) return `${dias} dias parado. ${nome} está largado esperando você.`;
    if (dias >= 4) return `${dias} dias sem treinar. ${nome} está com saudade.`;
    if (of.dias === 0) return 'A ofensiva apagou: a meta da semana não fecha mais. O próximo treino acende de novo.';
    if (window.Ofensiva.fase(of) === 'volta') return `De volta! ${nome} já está pegando o ritmo.`;
    return of.humor === 'animado' ? 'Treinou ontem. Bora manter o ritmo?' : 'Descanso faz parte. Pronto para o próximo treino.';
  }

  function textoDoNivel(of) {
    const faltam = window.Ofensiva.faltamParaSubir(of.dias);
    return faltam === null ? `Nível ${of.nivel}, o máximo` : `Nível ${of.nivel} · faltam ${plural(faltam, 'dia')} para o nível ${of.nivel + 1}`;
  }

  function linhaOfensiva(of, estadoChama) {
    return h('p', { class: `ofensiva ${estadoChama}` },
      iconeChama(estadoChama), h('strong', null, of.dias), h('span', null, of.dias === 1 ? 'dia de ofensiva' : 'dias de ofensiva'));
  }

  function cartaoPerfil() {
    const of = ofensivaAtual();
    const fase = window.Ofensiva.fase(of);
    const p = window.Avatar.personagem(estado.perfil.personagem);
    return h('section', { class: 'perfil' },
      h('button', { class: `personagem-palco fase-${fase}`, 'aria-label': `${p.nome}: toque para trocar de personagem`, onclick: abrirPerfil },
        imagemDoPersonagem(fase)),
      h('div', { class: 'perfil-texto' },
        h('p', { class: 'personagem-nome' }, h('strong', null, p.nome), h('span', null, window.Avatar.rotuloDaFase(p.id, fase))),
        linhaOfensiva(of, estadoDaChama(of)),
        h('p', { class: 'humor-texto' }, fraseDoHumor(of)),
        h('p', { class: 'nivel' }, textoDoNivel(of)),
        h('button', { class: 'link', onclick: abrirPerfil }, 'Personagem e treino')));
  }

  function trocarPrograma(depois) {
    const antes = estado.perfil.programa;
    if (antes === depois) return;
    // Cada programa lembra o próprio próximo treino; um treino em andamento é encerrado.
    estado.proximos = { ...estado.proximos, [antes]: estado.proximo };
    estado.proximo = estado.proximos[depois] || 0;
    estado.sessao = null;
    estado.perfil = { ...estado.perfil, programa: depois };
    programa = programas[depois];
    selecionado = estado.proximo;
    pararDescanso();
    salvar();
    renderInicio();
    avisar(PROGRAMAS_NOMES[depois][0]);
  }

  function abrirPerfil() {
    const of = ofensivaAtual();
    const fase = window.Ofensiva.fase(of);
    let confirmando = null; // programa esperando confirmação, com treino em andamento
    const fechar = () => modal.remove();
    const caixa = h('div', { class: 'modal-caixa folha perfil-folha' });
    const modal = h('div', {
      class: 'modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Personagem e treino',
      onclick: (e) => {
        if (e.target === modal) fechar();
      },
    }, caixa);
    const escolherPersonagem = (id) => {
      estado.perfil = { ...estado.perfil, personagem: id };
      salvar();
      desenhar();
      renderInicio();
    };
    const escolherPrograma = (nome) => {
      if (nome === estado.perfil.programa) return;
      if (estado.sessao) {
        confirmando = nome;
        desenhar();
        return;
      }
      fechar();
      trocarPrograma(nome);
    };
    function desenhar() {
      caixa.replaceChildren(...[
        h('h2', null, 'Personagem e treino'),
        linhaOfensiva(of, estadoDaChama(of)),
        h('p', null, `Recorde: ${plural(of.recorde, 'dia')}. ${textoDoNivel(of)}.`),
        h('p', { class: 'rotulo' }, 'Seu treino'),
        h('div', { class: 'opcoes-programa' }, Object.entries(PROGRAMAS_NOMES).map(([nome, [titulo, descricao]]) => h('button', {
          class: 'opcao-programa',
          'aria-pressed': String(nome === estado.perfil.programa),
          onclick: () => escolherPrograma(nome),
        }, h('strong', null, titulo), h('span', null, descricao)))),
        confirmando
          ? h('div', { class: 'confirmar-troca' },
            h('p', null, `Trocar de treino encerra o ${programa.treinos[estado.sessao.treino].titulo} em andamento.`),
            h('button', {
              class: 'botao primario',
              onclick: () => {
                fechar();
                trocarPrograma(confirmando);
              },
            }, 'Trocar mesmo assim'),
            h('button', {
              class: 'link',
              onclick: () => {
                confirmando = null;
                desenhar();
              },
            }, 'Cancelar'))
          : null,
        h('p', { class: 'rotulo' }, 'Seu personagem'),
        h('p', { class: 'grupo-descricao' }, 'Qualquer personagem combina com qualquer treino. Ele muda de pose conforme a ofensiva: começando, no auge, afastado ou de volta.'),
        h('div', { class: 'opcoes-personagem' }, window.Avatar.PERSONAGENS.map((p) => h('button', {
          class: 'opcao-personagem',
          'aria-pressed': String(p.id === estado.perfil.personagem),
          onclick: () => escolherPersonagem(p.id),
        }, h('img', { src: window.Avatar.imagem(p.id, p.id === estado.perfil.personagem ? fase : 'comecando'), alt: '', loading: 'lazy' }), h('span', null, p.nome)))),
        h('details', { class: 'regras-ofensiva' },
          h('summary', null, 'Como funciona a ofensiva'),
          h('ul', null,
            h('li', null, 'Cada dia com treino soma 1 dia de ofensiva. Dia de descanso não apaga.'),
            h('li', null, 'Ela apaga quando não dá mais para bater a meta da semana. Semana sem meta pede 1 treino.'),
            h('li', null, 'Com 15 dias de ofensiva, o personagem chega no auge.'),
            h('li', null, 'Com 4 dias ou mais sem treinar, ele aparece afastado; no primeiro treino depois disso, fica "de volta" por uma semana.'))),
        h('button', { class: 'link', onclick: fechar }, 'Fechar'),
      ].filter(Boolean));
    }
    desenhar();
    document.body.append(modal);
    caixa.querySelector('.opcao-programa[aria-pressed="true"]').focus();
  }

  // ---------- telas ----------

  function render() {
    if (tela === 'treino' && estado.sessao) renderTreino();
    else if (tela === 'fim' && resumoFinal) renderFim();
    else {
      tela = 'inicio';
      renderInicio();
    }
  }

  function renderInicio() {
    const lista = h('ul', { class: 'lista' }, programa.treinos.map((treino, i) => {
      let tag = null;
      if (estado.sessao && estado.sessao.treino === i) tag = h('span', { class: 'tag andamento' }, 'Em andamento');
      else if (i === estado.proximo) tag = h('span', { class: 'tag' }, 'Próximo');
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
      h('header', { class: 'marca' }, h('h1', null, programa.titulo), h('span', null, programa.marca)),
      cartaoPerfil(),
      cartaoSemana(true),
      cartaoInstalar(),
      heroTreino(selecionado),
      h('p', { class: 'como-usar' },
        h('strong', null, 'Como usar: '),
        'toque numa anilha ao terminar cada série e o descanso começa sozinho. Acabou o exercício? ',
        h('strong', null, 'Arraste o cartão para a direita.'),
        ' Aparelho ocupado? Arraste para a esquerda e ele volta no fim.'),
      h('h2', { class: 'rotulo' }, 'Todos os treinos'),
      lista,
      biblioteca
        ? h('button', { class: 'botao secundario', icone: 'trocar', onclick: () => abrirBiblioteca() },
          `Biblioteca com ${biblioteca.itens.length} exercícios`)
        : null,
      h('p', { class: 'credito' }, 'Seu progresso fica salvo neste celular. Fotos: free-exercise-db (domínio público).')));
  }

  function heroTreino(i) {
    const treino = programa.treinos[i];
    const sessao = estado.sessao;
    const emAndamento = sessao && sessao.treino === i;
    let etiqueta = emAndamento ? 'Em andamento' : i === estado.proximo ? 'Próximo treino' : 'Treino escolhido';
    if (!sessao && i === estado.proximo) {
      const quando = quandoEOProximo();
      if (quando === 'hoje') etiqueta = 'Treino de hoje';
      else if (quando) etiqueta = `Próximo treino · ${quando}`;
    }
    const extrasFixos = estado.extras[treino.id] || [];

    const extras = [];
    if (sessao && !emAndamento) {
      extras.push(h('p', { class: 'aviso' },
        `Começar este treino encerra o ${programa.treinos[sessao.treino].titulo} em andamento.`));
    }
    if (emAndamento) extras.push(botaoRecomecar(i));

    const exercicios = h('ol', { class: 'exercicios-treino' }, treino.exercicios.map((_, slot) => {
      const ex = exercicio(i, slot);
      return h('li', null,
        miniatura(ex),
        h('span', { class: 'ex-texto' },
          h('span', { class: 'ex-nome' }, ex.nome),
          h('span', { class: 'ex-meta' }, ex.trocado && ex.semelhanca !== null
            ? `${ex.series} × ${ex.reps} · trocado, ${ex.semelhanca}% semelhante`
            : `${ex.series} × ${ex.reps}${ex.trocado ? ' · trocado' : ''}`)),
        biblioteca
          ? h('button', { class: 'trocar-linha', 'aria-label': `Trocar ${ex.nome}`, onclick: () => abrirBiblioteca(i, slot) }, 'Trocar')
          : null);
    }));
    extrasFixos.forEach((x, j) => {
      const ex = extraComoExercicio(x);
      if (!ex) return;
      exercicios.append(h('li', null,
        miniatura(ex),
        h('span', { class: 'ex-texto' },
          h('span', { class: 'ex-nome' }, ex.nome),
          h('span', { class: 'ex-meta' }, `${x.series} × ${x.reps} · extra`)),
        h('button', { class: 'trocar-linha', 'aria-label': `Tirar ${ex.nome} do treino`, onclick: () => removerExtraFixo(treino.id, j) }, 'Tirar')));
    });

    const totalExercicios = treino.exercicios.length + extrasFixos.length;
    const series = totalSeries(treino) + extrasFixos.reduce((soma, x) => soma + x.series, 0);
    return h('article', { class: 'hero' },
      h('p', { class: 'etiqueta' }, etiqueta),
      h('h2', { class: treino.titulo.length > 7 ? 'longo' : null }, treino.titulo),
      h('p', { class: 'foco' }, treino.foco),
      h('ul', { class: 'meta' },
        h('li', null, h('strong', null, totalExercicios), 'exercícios'),
        h('li', null, h('strong', null, series), 'séries'),
        h('li', null, h('strong', null, treino.duracao.replace(' min', '')), 'min')),
      h('div', { class: 'hero-acoes' },
        h('button', { class: 'botao primario', onclick: () => (emAndamento ? abrirTreino() : comecar(i)) },
          emAndamento ? `Continuar (${sessao.feitos.length + 1} de ${indicesDaSessao().length})` : 'Começar treino'),
        h('button', { class: 'botao secundario', icone: 'play', onclick: () => abrirVideo(i) }, 'Vídeo')),
      extras,
      h('p', { class: 'rotulo' }, 'Exercícios'),
      exercicios,
      biblioteca ? h('button', { class: 'botao secundario', icone: 'mais', onclick: () => abrirAdicionar(i, false) }, 'Adicionar exercício') : null);
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
    const treino = programa.treinos[estado.sessao.treino];
    const pilha = h('div', { class: 'pilha' });
    app.replaceChildren(h('section', { class: 'treino' },
      h('header', { class: 'barra' },
        h('button', { class: 'icone-botao', icone: 'voltar', 'aria-label': 'Voltar ao início', onclick: voltarInicio }),
        h('span', { class: 'personagem-mini' }, imagemDoPersonagem(window.Ofensiva.fase(ofensivaAtual()))),
        h('div', { class: 'barra-titulo' }, h('strong', null, treino.titulo), h('span', { class: 'contador' })),
        h('button', { class: 'icone-botao', icone: 'mais', 'aria-label': 'Adicionar exercício', onclick: () => abrirAdicionar(estado.sessao.treino, true) }),
        h('button', { class: 'icone-botao', icone: 'play', 'aria-label': `Ver vídeo do ${treino.titulo}`, onclick: () => abrirVideo(estado.sessao.treino) })),
      h('div', { class: 'segmentos', 'aria-hidden': 'true' }, indicesDaSessao().map((i) => h('span', { 'data-i': i }))),
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
    const sessao = estado.sessao;
    const n = indicesDaSessao().length;
    app.querySelector('.contador').textContent = `Exercício ${Math.min(sessao.feitos.length + 1, n)} de ${n}`;
    app.querySelectorAll('.segmentos span').forEach((seg) => {
      const i = Number(seg.dataset.i);
      seg.className = sessao.feitos.includes(i) ? 'feito' : i === sessao.fila[0] ? 'atual' : '';
    });
    app.querySelector('.acao.desfazer').disabled = !sessao.historico.length;
  }

  function montarPilha(pilha, animar) {
    if (!pilha) return;
    const [primeiro, segundo] = estado.sessao.fila;
    pilha.replaceChildren();
    if (segundo !== undefined) pilha.append(cartao(segundo, 'atras'));
    if (primeiro === undefined) return;
    const topo = cartao(primeiro, animar ? 'atras' : 'topo');
    pilha.append(topo);
    ativarArraste(topo);
    if (animar) requestAnimationFrame(() => requestAnimationFrame(() => topo.classList.replace('atras', 'topo')));
  }

  function cartao(i, posicao) {
    const treinoIdx = estado.sessao.treino;
    const ex = exercicioDaSessao(i);
    if (!ex) {
      // Extra cujas fotos e dados estão na biblioteca, que ainda não carregou: o cartão completa quando ela chegar.
      return h('article', { class: `cartao ${posicao}`, 'data-i': i }, h('p', { class: 'carregando' }, 'Carregando exercício…'));
    }
    const feitas = estado.sessao.series[i] || 0;
    const completo = feitas >= ex.series;
    let botao = null;
    if (ex.extra) {
      botao = h('button', { class: 'trocar', icone: 'fechar', onclick: () => removerDaSessao(i) }, 'Tirar de hoje');
    } else if (biblioteca) {
      botao = h('button', { class: ex.trocado ? 'trocar ativo' : 'trocar', icone: 'trocar', onclick: () => abrirBiblioteca(treinoIdx, i) },
        ex.trocado ? (ex.semelhanca !== null ? `Trocado · ${ex.semelhanca}%` : 'Trocado') : 'Trocar');
    }
    return h('article', { class: `cartao ${posicao}`, 'data-i': i, 'aria-label': ex.nome },
      h('span', { class: 'carimbo carimbo-feito', 'aria-hidden': 'true' }, 'Feito'),
      h('span', { class: 'carimbo carimbo-depois', 'aria-hidden': 'true' }, 'Depois'),
      figura(ex, ex.extra ? 'Extra' : doisDigitos(i + 1), botao),
      h('div', { class: 'corpo' },
        h('h2', null, ex.nome),
        h('div', { class: 'numeros' },
          h('div', null, h('span', { class: 'rotulo' }, 'Séries × reps'), h('strong', null, `${ex.series} × ${ex.reps}`)),
          h('div', null, h('span', { class: 'rotulo' }, 'RIR'), h('strong', null, ex.rir)),
          h('div', null, h('span', { class: 'rotulo' }, 'Descanso'), h('strong', null, ex.descanso))),
        h('ul', { class: 'musculos', 'aria-label': 'Músculos trabalhados' },
          ex.primarios.map((m) => h('li', { class: 'principal' }, m)),
          ex.secundarios.map((m) => h('li', { class: 'auxiliar' }, m))),
        ex.porque
          ? [h('div', { class: 'porque-topo' }, h('p', { class: 'rotulo' }, 'Por quê'), seloEvidencia(ex.evidencia)),
            h('p', { class: 'porque' }, ex.porque)]
          : null,
        h('p', { class: 'rotulo' }, daBiblioteca(ex) ? 'Passo a passo' : 'Execução'),
        daBiblioteca(ex)
          ? h('ol', { class: 'passos' }, ex.dicas.map((d) => h('li', null, d)))
          : h('ul', { class: 'dicas' }, ex.dicas.map((d) => h('li', null, d)))),
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
    const of = ofensivaAtual();
    const subiu = of.nivel > resumoFinal.nivelAntes;
    app.replaceChildren(h('section', { class: 'fim' },
      h('div', { class: 'fim-avatar' },
        h('div', { class: `personagem-solto${subiu ? ' subiu' : ''}` }, imagemDoMomento('comemora')),
        h('div', { class: 'fim-ofensiva' },
          linhaOfensiva(of, estadoDaChama(of)),
          h('p', { class: subiu ? 'subiu-texto' : 'nivel' }, subiu ? `Subiu para o nível ${of.nivel}: mais forte!` : textoDoNivel(of)))),
      h('p', { class: 'etiqueta' }, `${treino.titulo} concluído`),
      h('h1', null, 'Treino feito.'),
      h('dl', { class: 'resumo' },
        h('div', null, h('dt', null, 'Séries'), h('dd', null, `${resumoFinal.series}/${resumoFinal.totalSeries}`)),
        h('div', null, h('dt', null, 'Exercícios'), h('dd', null, resumoFinal.exercicios)),
        h('div', null, h('dt', null, 'Duração'), h('dd', null, resumoFinal.minutos ? `${resumoFinal.minutos} min` : '—'))),
      cartaoSemana(false),
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
    const extras = (estado.extras[treino.id] || []).map((x) => ({ ...x }));
    estado.sessao = {
      treino: i,
      fila: [...Array(treino.exercicios.length + extras.length).keys()],
      feitos: [],
      series: {},
      historico: [],
      inicio: Date.now(),
      extras,
    };
    selecionado = i;
    pararDescanso();
    salvar();
    abrirTreino();
  }

  function abrirTreino() {
    tela = 'treino';
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
    const agora = k < antes ? k : k + 1; // tocar numa anilha cheia desmarca dela em diante
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
      dica.textContent = agora >= ex.series ? 'Pronto! Arraste para a direita' : 'Toque ao terminar cada série';
    }

    if (agora > antes) {
      const ultima = agora >= ex.series;
      iniciarDescanso(segundosDescanso(ex.descanso), ultima ? 'próximo exercício' : `série ${agora + 1} de ${ex.series}`);
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
    const sessao = estado.sessao;
    const i = sessao.fila.shift();
    if (direcao === 'feito') sessao.feitos.push(i);
    else sessao.fila.push(i);
    sessao.historico.push({ tipo: direcao, i });
    salvar();
    if (!sessao.fila.length) {
      terminar();
      return;
    }
    montarPilha(app.querySelector('.pilha'), !semMovimento.matches);
    atualizarCabecalho();
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
    const minutos = Math.round((Date.now() - sessao.inicio) / 60000);
    const indices = indicesDaSessao();
    const total = indices.reduce((soma, i) => soma + seriesDaSessao(i), 0);
    const feitas = indices.reduce((soma, i) => soma + (Number(sessao.series[i]) || 0), 0);
    resumoFinal = {
      treino: sessao.treino,
      minutos: minutos < 240 ? Math.max(1, minutos) : null,
      series: Math.min(feitas, total),
      totalSeries: total,
      exercicios: indices.length,
      nivelAntes: ofensivaAtual().nivel,
    };
    // Marca o dia na semana e soma na ofensiva.
    estado.historico = [...estado.historico, { data: dataLocal(new Date()), treino: treino.id }].slice(-400);
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

  // ---------- descanso ----------

  function iniciarDescanso(segundos, proxima) {
    pararDescanso();
    descanso = {
      fim: Date.now() + segundos * 1000,
      total: segundos,
      proxima,
      avisado: false,
      intervalo: setInterval(tique, 250),
      esconder: null,
      variante: (contadorDescansos++ % 2) + 1,
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
        h('span', { class: 'descanso-personagem' }),
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
    // Durante o descanso o personagem descansa (alternando as duas poses); quando acaba, comemora.
    const momento = pronto ? 'comemora' : `descanso-${descanso.variante}`;
    const lugar = caixa.querySelector('.descanso-personagem');
    if (lugar.dataset.momento !== momento) {
      lugar.dataset.momento = momento;
      lugar.replaceChildren(imagemDoMomento(momento));
    }
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
      h('p', { class: 'aviso' }, 'O vídeo mostra o treino original, sem as trocas.'),
      h('button', { class: 'botao secundario', onclick: fechar }, 'Fechar vídeo')));
    document.body.append(modal);
    modal.querySelector('.botao').focus();
    video.play().catch(() => {});
  }

  document.addEventListener('keydown', (e) => {
    const modal = document.querySelector('.modal');
    if (modal) {
      if (e.key === 'Escape') {
        const video = modal.querySelector('video');
        if (video) video.pause();
        modal.remove();
      }
      return;
    }
    if (bib) {
      if (e.key === 'Escape') voltarNaBiblioteca();
      return;
    }
    if (tela !== 'treino' || !estado.sessao) return;
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

  // ---------- instalar como app ----------

  let pedidoInstalar = null; // o Chrome do Android oferece instalar; o iPhone não, então ali mostramos o passo a passo
  const instalado = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const dentroDeOutraPagina = window.self !== window.top;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pedidoInstalar = e;
    if (tela === 'inicio' && programa) renderInicio();
  });
  window.addEventListener('appinstalled', () => {
    pedidoInstalar = null;
    if (tela === 'inicio' && programa) renderInicio();
  });

  function cartaoInstalar() {
    if (instalado() || dentroDeOutraPagina) return null;
    if (pedidoInstalar) {
      return h('button', {
        class: 'botao secundario',
        onclick: async () => {
          const pedido = pedidoInstalar;
          pedidoInstalar = null;
          pedido.prompt();
          await pedido.userChoice.catch(() => null);
          renderInicio();
        },
      }, 'Instalar como app');
    }
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      return h('p', { class: 'como-usar' },
        h('strong', null, 'Instale no iPhone: '),
        'no Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".');
    }
    return null;
  }

  if ('serviceWorker' in navigator && window.isSecureContext && !dentroDeOutraPagina) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Sem service worker, o app funciona normal, só não abre sem internet.
    });
  }

  // ---------- início ----------

  Promise.all(Object.entries(ARQUIVOS_PROGRAMA).map(([nome, arquivo]) => fetch(arquivo)
    .then((resposta) => {
      if (!resposta.ok) throw new Error(String(resposta.status));
      return resposta.json();
    })
    .then((dados) => [nome, dados])))
    .then((lista) => {
      programas = Object.fromEntries(lista);
      estado = carregarLocal();
      programa = programas[estado.perfil.programa];
      selecionado = estado.sessao ? estado.sessao.treino : estado.proximo;
      render();
      carregarBiblioteca();
    })
    .catch(() => {
      app.replaceChildren(h('section', { class: 'erro' },
        h('h1', null, 'Não deu para carregar os treinos'),
        h('p', null, 'Recarregue a página. Se você abriu o arquivo direto do computador, abra pelo link publicado ou rode um servidor local na pasta treinos.')));
    });
})();
