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
    'nao-testado': ['Princípios gerais', 'nenhum estudo mediu o crescimento com este exercício em si; ele trabalha o músculo com carga, amplitude e perto da falha, o que faz qualquer músculo crescer'],
  };

  // Avatar de menina usa o treino com foco em pernas e glúteo; o de menino, o PPL.
  // "masculino" e "feminino" são os ids dos dois primeiros programas, guardados assim desde a primeira versão.
  const ARQUIVOS_PROGRAMA = {
    masculino: 'programa_ppl.json',
    feminino: 'programa_feminino.json',
    iniciante_m: 'programa_iniciante_m.json',
    avancado_m: 'programa_avancado_m.json',
    iniciante_f: 'programa_iniciante_f.json',
    avancado_f: 'programa_avancado_f.json',
    mobilidade: 'programa_mobilidade.json',
  };
  let programas = {};
  let programa = null; // o do avatar escolhido
  let biblioteca = null; // { itens, porId }
  let estado = {
    proximo: 0, proximos: {}, sessao: null, trocas: {}, plano: null, planos: {}, historico: [], extras: {},
    aerobicos: [], cronoAerobico: null, peso: 70, cargas: {}, ajustes: {}, extrasProximo: {}, bloqueios: [],
    perfil: { personagem: 'brutus', programa: 'masculino', sexo: null, nome: '', configurado: false }, atualizado: 0,
  };
  let tela = 'inicio';
  let selecionado = 0;
  let resumoFinal = null;
  let descanso = null; // { fim, total, proxima, avisado, intervalo, esconder, variante }
  let descansoMinimizado = false; // o descanso abre em tela cheia; dá para reduzir a uma barra
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
    for (const filho of filhos.flat(Infinity)) {
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

  // Motivo do exercício com a etiqueta da base. Sem estudo próprio não quer dizer sem efeito.
  function blocoPorque(ex) {
    if (!ex.porque) return null;
    return [
      h('div', { class: 'porque-topo' }, h('p', { class: 'rotulo' }, 'Por quê'), seloEvidencia(ex.evidencia)),
      h('p', { class: 'porque' }, ex.porque),
      ex.evidencia === 'nao-testado' && !programa.mobilidade
        ? h('p', { class: 'nota-evidencia' }, 'Funciona? Sim: o músculo cresce com séries perto da falha (Robinson et al., 2024) e com mais séries na semana (Pelland et al., 2026), em qualquer exercício que o trabalhe com carga. O que falta é um estudo comparando este exercício com outro.')
        : null,
    ];
  }

  function seloEvidencia(tipo) {
    return EVIDENCIAS[tipo] ? h('span', { class: `evidencia ${tipo}` }, EVIDENCIAS[tipo][0]) : null;
  }

  function legendaEvidencias() {
    return h('ul', { class: 'legenda-evidencia' },
      Object.entries(EVIDENCIAS).map(([tipo, [, descricao]]) => h('li', null, seloEvidencia(tipo), descricao)));
  }

  // "2–3 min" vira 150 s e "15 s" vira 15 s.
  function segundosDescanso(texto) {
    const numeros = (String(texto).match(/\d+/g) || []).map(Number);
    if (!numeros.length) return 90;
    const media = numeros.length > 1 ? (numeros[0] + numeros[1]) / 2 : numeros[0];
    return Math.round(/\bs\b/.test(texto) && !/min/.test(texto) ? media : media * 60);
  }

  // Descanso do cartão, com os segundos a mais pedidos no fim do último treino igual.
  function descansoComAjuste(texto) {
    const extra = estado.sessao ? estado.sessao.ajuste.descanso : 0;
    return extra ? `${texto} + ${extra} s` : texto;
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
      aquecidos: s.aquecidos && typeof s.aquecidos === 'object' ? s.aquecidos : {},
      cargas: s.cargas && typeof s.cargas === 'object' ? s.cargas : {},
      ajuste: s.ajuste && typeof s.ajuste === 'object' ? { descanso: Number(s.ajuste.descanso) || 0, carga: Number(s.ajuste.carga) || 0 } : { descanso: 0, carga: 0 },
      aquecer: typeof s.aquecer === 'boolean' || s.aquecer === null ? s.aquecer : true,
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
    // Quem já usava o app antes da primeira abertura guiada não passa por ela: o sexo vem do programa.
    const sexo = p.sexo === 'm' || p.sexo === 'f' ? p.sexo : prog.publico === 'f' ? 'f' : 'm';
    // Estado salvo por versões antigas não tem o campo: quem já usava o app não passa pela primeira abertura.
    const configurado = typeof p.configurado === 'boolean' ? p.configurado : Object.keys(e).length > 0;
    const limpo = {
      proximo: 0, proximos: {}, sessao: sessaoValida(e.sessao, prog), trocas: {}, plano: null, planos: {}, historico: [], extras: {},
      aerobicos: [], cronoAerobico: null, peso: Number(e.peso) >= 30 && Number(e.peso) <= 250 ? Math.round(Number(e.peso)) : 70,
      cargas: {}, ajustes: {}, extrasProximo: {}, bloqueios: [],
      perfil: { personagem, programa: nomePrograma, sexo: configurado ? sexo : null, nome: limparNome(p.nome), configurado }, atualizado: Number(e.atualizado) || 0,
    };
    // Bloqueios de ofensiva comprados com pontos; usado é o dia que cada um protegeu.
    const ehData = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
    if (Array.isArray(e.bloqueios)) {
      limpo.bloqueios = e.bloqueios.filter((b) => b && ehData(b.comprado) && (b.usado === null || ehData(b.usado)))
        .map((b) => ({ comprado: b.comprado, usado: b.usado })).slice(-100);
    }
    // Carga usada por exercício (id da foto), para a próxima vez.
    if (e.cargas && typeof e.cargas === 'object') {
      for (const [id, c] of Object.entries(e.cargas)) {
        if (c && Number.isFinite(c.kg) && c.kg >= 0 && c.kg <= 1000 && /^\d{4}-\d{2}-\d{2}$/.test(c.data)) limpo.cargas[id] = { kg: c.kg, data: c.data };
      }
    }
    // Ajuste pedido no fim de um treino, para a próxima vez que ele for feito.
    if (e.ajustes && typeof e.ajustes === 'object') {
      for (const [id, a] of Object.entries(e.ajustes)) {
        if (!a) continue;
        const descanso = [0, 30, 60].includes(a.descanso) ? a.descanso : 0;
        const carga = [-10, 0, 5].includes(a.carga) ? a.carga : 0;
        if (descanso || carga) limpo.ajustes[id] = { descanso, carga };
      }
    }
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
      const proximo = e.extrasProximo && e.extrasProximo[treino.id];
      if (Array.isArray(proximo) && proximo.every(extraValido) && proximo.length) limpo.extrasProximo[treino.id] = proximo.slice(0, 12);
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
    if (Array.isArray(e.aerobicos)) {
      limpo.aerobicos = e.aerobicos.filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(x.data) && window.Aerobico.modalidade(x.tipo)
        && Number.isInteger(x.minutos) && x.minutos >= 1 && x.minutos <= window.Aerobico.MINUTOS_MAX).slice(-400);
    }
    const c = e.cronoAerobico;
    if (c && window.Aerobico.modalidade(c.tipo) && Number.isInteger(c.minutos) && c.minutos >= 1 && c.minutos <= window.Aerobico.MINUTOS_MAX) {
      const fim = Number.isFinite(c.fim) ? c.fim : null;
      const restante = fim === null && Number.isFinite(c.restante) && c.restante >= 0 ? c.restante : null;
      limpo.cronoAerobico = { tipo: c.tipo, minutos: c.minutos, fim, restante };
    }
    return limpo;
  }

  function carregarLocal() {
    const salvo = ler(CHAVE_ESTADO, null);
    if (salvo) return estadoValido(salvo);
    // Versão anterior do app guardava em duas chaves separadas; sem nada salvo, é a primeira abertura.
    const proximo = ler('ppl:proximo', null);
    const sessao = ler('ppl:sessao', null);
    return estadoValido(proximo === null && sessao === null ? null : { proximo: proximo || 0, sessao });
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
    for (const x of estado.extrasProximo[treino.id] || []) ids.push(x.id);
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
      h('button', { class: 'botao primario', onclick: () => adicionarExtra(treinoIdx, extra, false) },
        naSessao ? 'Adicionar só hoje' : `Adicionar só no próximo ${treino.titulo}`),
      h('button', { class: 'botao secundario', onclick: () => adicionarExtra(treinoIdx, extra, true) },
        `Adicionar sempre no ${treino.titulo}`));
  }

  function adicionarExtra(treinoIdx, extra, sempre) {
    const treino = programa.treinos[treinoIdx];
    if (sempre) estado.extras[treino.id] = [...(estado.extras[treino.id] || []), extra];
    const sessao = estado.sessao;
    const naSessao = sessao && sessao.treino === treinoIdx;
    if (naSessao) {
      sessao.fila.push(treino.exercicios.length + sessao.extras.length);
      sessao.extras.push({ ...extra });
    } else if (!sempre) {
      // Fora do treino, "só uma vez" vale para a próxima vez que este treino começar.
      estado.extrasProximo[treino.id] = [...(estado.extrasProximo[treino.id] || []), extra];
    }
    salvar();
    fecharBiblioteca();
    render();
    avisar(sempre ? `Adicionado ao ${treino.titulo}` : naSessao ? 'Adicionado no fim do treino de hoje' : `Adicionado só no próximo ${treino.titulo}`);
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
  const diasProtegidos = () => estado.bloqueios.filter((b) => b.usado).map((b) => b.usado);
  const ofensivaAtual = () => window.Ofensiva.calcular(estado.historico, todosOsPlanos(), dataLocal(new Date()), diasProtegidos());

  // ---------- bloqueio de ofensiva ----------

  const PRECO_BLOQUEIO = 50; // pontos: uns 5 treinos
  const MAX_BLOQUEIOS = 2; // guardados ao mesmo tempo
  const bloqueiosGuardados = () => estado.bloqueios.filter((b) => !b.usado).length;

  // Usa os bloqueios guardados nos dias em que a ofensiva apagaria. Roda ao abrir o app e ao voltar para ele.
  function usarBloqueios() {
    if (!estado.bloqueios.some((b) => !b.usado)) return;
    const { bloqueios, salvos } = window.Ofensiva.aplicarBloqueios(estado.historico, todosOsPlanos(), dataLocal(new Date()), estado.bloqueios);
    if (!salvos.length) return;
    estado.bloqueios = bloqueios;
    salvar();
    const usados = salvos.reduce((soma, x) => soma + x.usados.length, 0);
    const dias = salvos[salvos.length - 1].dias;
    avisar(`🧊 ${usados === 1 ? 'Bloqueio usado' : `${usados} bloqueios usados`}: sua ofensiva de ${plural(dias, 'dia')} continua!`);
  }

  function comprarBloqueio() {
    if (pontosAtuais() < PRECO_BLOQUEIO || bloqueiosGuardados() >= MAX_BLOQUEIOS) return false;
    estado.bloqueios = [...estado.bloqueios, { comprado: dataLocal(new Date()), usado: null }];
    salvar();
    return true;
  }

  const dataCurta = (dia) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

  // Na aba Personagem: o que é, quantos tem guardados e o botão de comprar.
  function cartaoBloqueio(redesenhar) {
    const guardados = bloqueiosGuardados();
    const saldo = pontosAtuais();
    const usados = estado.bloqueios.filter((b) => b.usado).map((b) => b.usado).sort().reverse();
    const motivo = guardados >= MAX_BLOQUEIOS ? `Você já tem ${MAX_BLOQUEIOS}, o máximo guardado.`
      : saldo < PRECO_BLOQUEIO ? `Faltam ${plural(PRECO_BLOQUEIO - saldo, 'ponto')}: cada treino vale ${window.Aerobico.PONTOS_TREINO}, e o aeróbico soma mais.` : null;
    return h('div', { class: 'bloqueio-cartao' },
      h('div', { class: 'bloqueio-topo' },
        h('p', { class: 'rotulo' }, 'Bloqueio de ofensiva'),
        h('span', { class: 'bloqueio-icones', 'aria-label': `${guardados} de ${MAX_BLOQUEIOS} guardados` },
          Array.from({ length: MAX_BLOQUEIOS }, (_, k) => h('span', { class: k < guardados ? 'cheio' : '' }, '🧊')))),
      h('p', null, 'Vai viajar ou não vai conseguir treinar? Com um bloqueio guardado, o dia sem treino conta para a meta da semana e a ofensiva não apaga. Ele é usado sozinho, só se a ofensiva fosse apagar; o dia protegido não soma dia de ofensiva.'),
      h('button', {
        class: 'botao primario',
        disabled: Boolean(motivo),
        onclick: () => {
          if (comprarBloqueio()) {
            avisar(`🧊 Bloqueio guardado. Você tem ${plural(pontosAtuais(), 'ponto')}.`);
            redesenhar();
            renderInicio();
          }
        },
      }, `Comprar por ${PRECO_BLOQUEIO} pontos`),
      h('p', { class: 'aviso' }, motivo || `Você tem ${plural(saldo, 'ponto')}.`),
      usados.length ? h('p', { class: 'aviso' }, `Dias protegidos: ${usados.slice(0, 6).map(dataCurta).join(', ')}.`) : null);
  }

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
      } else if (diasProtegidos().includes(data)) {
        status = 'protegido';
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
    const descricoes = { feito: 'feito', planejado: 'planejado', faltou: 'planejado e não feito', descanso: 'descanso', protegido: 'protegido por bloqueio de ofensiva' };
    const tira = h('ol', { class: 'semana' }, dias.map((x) => {
      const podeMudar = interativo && !x.passado && x.status !== 'feito';
      const rotulo = x.treino ? tituloDoTreino(x.treino) : x.status === 'faltou' ? 'faltou' : x.status === 'protegido' ? '🧊' : '—';
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

  // Programas na ordem da lista: os recomendados para o sexo escolhido, depois a mobilidade
  // (para todos) e por fim os do outro sexo, que qualquer pessoa pode escolher.
  const ORDEM_NIVEL = { Iniciante: 0, 'Intermediário': 1, 'Avançado': 2 };
  function gruposDeProgramas(sexo) {
    const lista = Object.entries(programas).sort(([, a], [, b]) => (ORDEM_NIVEL[a.nivel] ?? 3) - (ORDEM_NIVEL[b.nivel] ?? 3));
    const de = (filtro) => lista.filter(([, p]) => filtro(p.publico)).map(([id]) => id);
    return [
      ['Recomendados para você', de((x) => x === sexo)],
      ['Para todos', de((x) => x === 'todos')],
      [sexo === 'f' ? 'Outros treinos (sugeridos para homens)' : 'Outros treinos (sugeridos para mulheres)', de((x) => x !== sexo && x !== 'todos')],
    ].filter(([, ids]) => ids.length);
  }

  function opcaoPrograma(id, escolher, atual) {
    const p = programas[id];
    return h('button', {
      class: 'opcao-programa',
      'aria-pressed': String(id === atual),
      'data-programa': id,
      onclick: () => escolher(id),
    },
    h('span', { class: `nivel-programa nivel-${(p.nivel || '').normalize('NFD').replace(/[^a-z]/gi, '').toLowerCase()}` }, p.nivel),
    h('strong', null, p.titulo),
    h('span', { class: 'dias-programa' }, `${p.dias} · ${p.treinos.length} treinos`),
    h('span', null, p.resumo));
  }

  // atual: o programa marcado como escolhido (nenhum na primeira abertura).
  function listaDeProgramas(sexo, escolher, atual) {
    return gruposDeProgramas(sexo).map(([titulo, ids]) => h('div', { class: 'grupo-programas' },
      h('p', { class: 'rotulo' }, titulo),
      h('div', { class: 'opcoes-programa' }, ids.map((id) => opcaoPrograma(id, escolher, atual)))));
  }

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

  const limparNome = (texto) => (typeof texto === 'string' ? texto.replace(/\s+/g, ' ').trim().slice(0, 24) : '');

  // Frase do dia ao lado do personagem, com o nome. Muda conforme o dia e a situação da ofensiva;
  // num mesmo dia fica a mesma frase.
  function fraseMotivacional(of) {
    const nome = estado.perfil.nome;
    const n = (texto) => (nome ? texto.replace('{nome}', nome) : texto.replace(/,? ?\{nome\},? ?/, '').trim().replace(/^\w/, (c) => c.toUpperCase()));
    const espelho = estado.perfil.sexo === 'f' ? 'Vencendo a garota do espelho, {nome}.' : 'Vencendo o cara do espelho, {nome}.';
    let lista;
    if (of.treinouHoje) {
      lista = ['Missão cumprida, {nome}! Agora é comer bem e descansar.', 'Treino feito, {nome}. O músculo cresce no descanso.', 'Mais um dia na conta, {nome}.'];
    } else if (of.risco) {
      lista = ['{nome}, hoje é dia de salvar a ofensiva!', 'Bora, {nome}: a ofensiva depende do treino de hoje.'];
    } else if (of.diasSemTreinar !== null && of.diasSemTreinar >= 4) {
      lista = ['Bora voltar, {nome}? O primeiro treino é o mais difícil.', 'Recomeçar também é progresso, {nome}.'];
    } else {
      lista = [
        'Bora, {nome}! Dia bom pra treinar.',
        '{nome}, um pouquinho melhor que ontem.',
        espelho,
        'Constância vence motivação, {nome}.',
        'Uma série de cada vez, {nome}.',
        'Hoje conta, {nome}.',
        '{nome}, o treino de hoje é o resultado de amanhã.',
        'Sem pressa e sem pausa, {nome}.',
        'Você contra você de ontem, {nome}.',
        'Disciplina é lembrar o que você quer, {nome}.',
        'Feito é melhor que perfeito, {nome}.',
        'Cada repetição conta, {nome}.',
      ];
    }
    const hoje = dataLocal(new Date());
    const dia = Math.round(new Date(`${hoje}T12:00:00`).getTime() / 86400000);
    return n(lista[dia % lista.length]);
  }

  // Campo para trocar o nome, na aba Personagem.
  function campoNome() {
    return h('label', { class: 'editar-nome' },
      h('span', { class: 'rotulo' }, 'Seu nome'),
      h('input', {
        class: 'campo-nome', type: 'text', maxlength: '24', autocomplete: 'given-name', autocapitalize: 'words',
        placeholder: 'Como quer ser chamado?', value: estado.perfil.nome,
        onchange: (e) => {
          estado.perfil = { ...estado.perfil, nome: limparNome(e.target.value) };
          e.target.value = estado.perfil.nome;
          salvar();
          renderInicio();
        },
      }));
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
    if (of.humor === 'novo') return `${nome} está ${window.Avatar.personagem(estado.perfil.personagem).genero === 'f' ? 'pronta' : 'pronto'} para começar. Termine o primeiro treino para acender a ofensiva.`;
    if (of.risco) return 'Treine hoje para não apagar a ofensiva!';
    if (of.treinouHoje) return of.dias >= 3 ? 'Treino de hoje feito. A ofensiva está pegando fogo!' : 'Treino de hoje feito!';
    // Último dia ativo foi um bloqueio: a ofensiva seguiu, mas não houve treino.
    const ultimoTreino = estado.historico.map((x) => x.data).sort().pop() || '';
    const hoje = dataLocal(new Date());
    if (diasProtegidos().some((x) => x > ultimoTreino && x <= hoje)) return '🧊 O bloqueio segurou a ofensiva enquanto você esteve fora. Bora voltar?';
    if (dias >= 15) return `${dias} dias parado. ${nome} está largado esperando você.`;
    if (dias >= 4) return `${dias} dias sem treinar. ${nome} está com saudade.`;
    if (of.dias === 0) return 'A ofensiva apagou: a meta da semana não fecha mais. O próximo treino acende de novo.';
    if (window.Ofensiva.fase(of) === 'volta') return `De volta! ${nome} já está pegando o ritmo.`;
    return of.humor === 'animado' ? 'Treinou ontem. Bora manter o ritmo?' : 'Descanso faz parte. Pronto para o próximo treino.';
  }

  function textoDoNivel(of) {
    const faltam = window.Ofensiva.faltamParaSubir(of.dias);
    return faltam === null ? `Nível ${of.nivel}, o máximo` : `Nível ${of.nivel} · ${faltam === 1 ? 'falta' : 'faltam'} ${plural(faltam, 'dia')} para o nível ${of.nivel + 1}`;
  }

  // Pontos para gastar: os ganhos com treino e aeróbico, menos os bloqueios comprados.
  const pontosAtuais = () => window.Aerobico.pontos(estado.historico, estado.aerobicos) - estado.bloqueios.length * PRECO_BLOQUEIO;

  function linhaOfensiva(of, estadoChama) {
    return h('p', { class: `ofensiva ${estadoChama}` },
      iconeChama(estadoChama), h('strong', null, of.dias), h('span', null, of.dias === 1 ? 'dia de ofensiva' : 'dias de ofensiva'));
  }

  function cartaoPerfil() {
    const of = ofensivaAtual();
    const fase = window.Ofensiva.fase(of);
    const p = window.Avatar.personagem(estado.perfil.personagem);
    return h('section', { class: 'perfil' },
      h('button', { class: `personagem-palco fase-${fase}`, 'aria-label': `${p.nome}: toque para trocar de personagem`, onclick: () => abrirPerfil('personagem') },
        imagemDoPersonagem(fase)),
      h('div', { class: 'perfil-texto' },
        h('p', { class: 'saudacao' }, fraseMotivacional(of)),
        estado.perfil.nome ? null : h('button', { class: 'link', onclick: () => abrirPerfil('personagem') }, 'Como quer ser chamado?'),
        h('p', { class: 'personagem-nome' }, h('strong', null, p.nome), h('span', null, window.Avatar.rotuloDaFase(p.id, fase))),
        linhaOfensiva(of, estadoDaChama(of)),
        h('p', { class: 'humor-texto' }, fraseDoHumor(of)),
        h('p', { class: 'nivel' }, textoDoNivel(of), ' · ', h('strong', { class: 'pontos' }, plural(pontosAtuais(), 'ponto')),
          bloqueiosGuardados() ? h('span', { class: 'bloqueio-mini', title: 'Bloqueios de ofensiva guardados' }, ` · 🧊 ${bloqueiosGuardados()}`) : null),
        h('button', { class: 'link', onclick: () => abrirPerfil('treino') }, 'Trocar treino')));
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
    avisar(programa.titulo);
  }

  // aba: 'treino' ou 'personagem', para não precisar rolar uma tela longa até a outra parte.
  function abrirPerfil(aba) {
    const of = ofensivaAtual();
    const fase = window.Ofensiva.fase(of);
    let abaAtual = aba === 'treino' ? 'treino' : 'personagem';
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
    // O escolhido aparece grande, com a descrição, acima da grade.
    function destaquePersonagem() {
      const p = window.Avatar.personagem(estado.perfil.personagem);
      return h('div', { class: 'destaque-personagem', 'aria-live': 'polite' },
        h('div', { class: `personagem-palco fase-${fase} entrando` }, h('img', { src: window.Avatar.imagem(p.id, fase), alt: '' })),
        h('div', null, h('strong', null, p.nome), h('p', null, p.descricao)));
    }
    function abaTreino() {
      return [
        h('p', { class: 'rotulo' }, 'Você é'),
        h('div', { class: 'escolha-sexo', role: 'group', 'aria-label': 'Sugestões de treino para' },
          [['m', 'Homem'], ['f', 'Mulher']].map(([valor, rotulo]) => h('button', {
            'aria-pressed': String(estado.perfil.sexo === valor),
            onclick: () => {
              estado.perfil = { ...estado.perfil, sexo: valor };
              salvar();
              desenhar();
            },
          }, rotulo)),
          h('span', null, 'Muda só a ordem das sugestões.')),
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
        listaDeProgramas(estado.perfil.sexo, escolherPrograma, estado.perfil.programa),
      ];
    }
    function abaPersonagem() {
      return [
        campoNome(),
        linhaOfensiva(of, estadoDaChama(of)),
        h('p', null, `Recorde: ${plural(of.recorde, 'dia')}. ${textoDoNivel(of)}.`),
        cartaoBloqueio(desenhar),
        destaquePersonagem(),
        h('div', { class: 'opcoes-personagem' }, window.Avatar.PERSONAGENS.map((p) => h('button', {
          class: 'opcao-personagem',
          'aria-pressed': String(p.id === estado.perfil.personagem),
          'aria-label': `${p.nome}: ${p.descricao}`,
          onclick: () => escolherPersonagem(p.id),
        }, h('img', { src: window.Avatar.imagem(p.id, 'auge'), alt: '' }), h('span', null, p.nome)))),
        h('p', { class: 'grupo-descricao' }, 'Qualquer personagem combina com qualquer treino. Ele muda de pose conforme a ofensiva: começando, no auge, afastado ou de volta.'),
        h('details', { class: 'regras-ofensiva' },
          h('summary', null, 'Como funciona a ofensiva'),
          h('ul', null,
            h('li', null, 'Cada dia com treino soma 1 dia de ofensiva. Dia de descanso não apaga.'),
            h('li', null, 'Ela apaga quando não dá mais para bater a meta da semana. Semana sem meta pede 1 treino.'),
            h('li', null, 'Com 15 dias de ofensiva, o personagem chega no auge.'),
            h('li', null, 'Com 4 dias ou mais sem treinar, ele aparece afastado; no primeiro treino depois disso, fica "de volta" por uma semana.'),
            h('li', null, `Bloqueio de ofensiva: custa ${PRECO_BLOQUEIO} pontos e dá para guardar até ${MAX_BLOQUEIOS}. Se a ofensiva fosse apagar, ele protege o dia sem treino.`))),
      ];
    }
    function desenhar() {
      const abas = [['treino', 'Treino'], ['personagem', 'Personagem']];
      caixa.replaceChildren(...[
        h('div', { class: 'abas', role: 'tablist', 'aria-label': 'Personagem e treino' }, abas.map(([id, rotulo]) => h('button', {
          role: 'tab',
          id: `aba-${id}`,
          'aria-selected': String(abaAtual === id),
          onclick: () => {
            abaAtual = id;
            desenhar();
            caixa.scrollTop = 0;
            caixa.querySelector(`#aba-${id}`).focus();
          },
        }, rotulo))),
        h('div', { class: 'aba-conteudo', role: 'tabpanel', 'aria-labelledby': `aba-${abaAtual}` },
          abaAtual === 'treino' ? abaTreino() : abaPersonagem()),
        h('button', { class: 'link', onclick: fechar }, 'Fechar'),
      ].flat(Infinity).filter(Boolean));
    }
    desenhar();
    document.body.append(modal);
    caixa.querySelector('[role="tab"][aria-selected="true"]').focus();
  }

  // ---------- telas ----------

  // Primeira abertura: sexo (só para ordenar as sugestões), personagem e treino.
  let boasVindas = { passo: 1 };

  function renderBoasVindas() {
    const passo = boasVindas.passo;
    const voltar = passo > 1 ? h('button', {
      class: 'link',
      onclick: () => {
        boasVindas.passo -= 1;
        renderBoasVindas();
      },
    }, 'Voltar') : null;
    const topo = h('header', { class: 'boas-vindas-topo' },
      h('p', { class: 'etiqueta' }, `Passo ${passo} de 4`),
      h('div', { class: 'passos-boas-vindas', 'aria-hidden': 'true' }, [1, 2, 3, 4].map((n) => h('span', { class: n <= passo ? 'feito' : '' }))));
    let corpo;
    if (passo === 1) {
      const seguir = () => {
        boasVindas = { ...boasVindas, passo: 2, nome: limparNome(campo.value) };
        renderBoasVindas();
      };
      const campo = h('input', {
        class: 'campo-nome', type: 'text', maxlength: '24', autocomplete: 'given-name', autocapitalize: 'words',
        placeholder: 'Seu nome ou apelido', value: boasVindas.nome || '', 'aria-label': 'Como quer ser chamado?',
        onkeydown: (e) => {
          if (e.key === 'Enter') seguir();
        },
      });
      corpo = [
        h('h1', null, 'Bem-vindo!'),
        h('p', { class: 'grupo-descricao' }, 'Como quer ser chamado?'),
        campo,
        h('button', { class: 'botao primario', onclick: seguir }, 'Continuar'),
      ];
      app.replaceChildren(h('section', { class: 'boas-vindas' }, topo, corpo));
      campo.focus();
      return;
    }
    if (passo === 2) {
      corpo = [
        h('h1', null, boasVindas.nome ? `Prazer, ${boasVindas.nome}!` : 'Prazer!'),
        h('p', { class: 'grupo-descricao' }, 'Para sugerir os treinos certos: você é homem ou mulher? Dá para escolher qualquer treino depois.'),
        h('div', { class: 'opcoes-sexo' }, [['m', 'Homem'], ['f', 'Mulher']].map(([valor, rotulo]) => h('button', {
          class: 'opcao-sexo',
          onclick: () => {
            boasVindas = { ...boasVindas, passo: 3, sexo: valor };
            renderBoasVindas();
          },
        }, rotulo))),
      ];
    } else if (passo === 3) {
      const escolhido = boasVindas.personagem || estado.perfil.personagem;
      const p = window.Avatar.personagem(escolhido);
      corpo = [
        h('h1', null, 'Escolha seu personagem'),
        h('p', { class: 'grupo-descricao' }, 'Ele acompanha seus treinos e muda conforme a ofensiva: começando, no auge, afastado ou de volta. Qualquer personagem combina com qualquer treino.'),
        h('div', { class: 'destaque-personagem' },
          h('div', { class: 'personagem-palco fase-auge' }, h('img', { src: window.Avatar.imagem(p.id, 'auge'), alt: '' })),
          h('div', null, h('strong', null, p.nome), h('p', null, p.descricao))),
        h('div', { class: 'opcoes-personagem' }, window.Avatar.PERSONAGENS.map((x) => h('button', {
          class: 'opcao-personagem',
          'aria-pressed': String(x.id === escolhido),
          'aria-label': `${x.nome}: ${x.descricao}`,
          onclick: () => {
            boasVindas.personagem = x.id;
            renderBoasVindas();
          },
        }, h('img', { src: window.Avatar.imagem(x.id, 'auge'), alt: '', loading: 'lazy' }), h('span', null, x.nome)))),
        h('button', {
          class: 'botao primario fixo',
          onclick: () => {
            boasVindas = { ...boasVindas, passo: 4, personagem: escolhido };
            renderBoasVindas();
            window.scrollTo(0, 0);
          },
        }, `Continuar com ${p.nome}`),
      ];
    } else {
      corpo = [
        h('h1', null, 'Escolha seu treino'),
        h('p', { class: 'grupo-descricao' }, 'Os primeiros são os recomendados para você. Cada exercício mostra o estudo que justifica a escolha.'),
        listaDeProgramas(boasVindas.sexo, (id) => {
          estado.perfil = { personagem: boasVindas.personagem, programa: id, sexo: boasVindas.sexo, nome: boasVindas.nome || '', configurado: true };
          programa = programas[id];
          estado.proximo = estado.proximos[id] || 0;
          selecionado = estado.proximo;
          salvar();
          tela = 'inicio';
          render();
          window.scrollTo(0, 0);
          avisar(`${window.Avatar.personagem(boasVindas.personagem).nome} e ${programa.titulo}: bora!`);
        }),
      ];
    }
    app.replaceChildren(h('section', { class: 'boas-vindas' }, topo, corpo, voltar));
  }

  function render() {
    if (!estado.perfil.configurado) renderBoasVindas();
    else if (tela === 'aquecimento' && estado.sessao) renderAquecimento();
    else if (tela === 'treino' && estado.sessao) renderTreino();
    else if (tela === 'fim' && resumoFinal) renderFim();
    else {
      tela = 'inicio';
      renderInicio();
    }
  }

  function renderInicio() {
    // A biblioteca e o aviso de instalar redesenham o início; antes da primeira escolha, fica a primeira abertura.
    if (!estado.perfil.configurado) {
      renderBoasVindas();
      return;
    }
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
      ofensivaAtual().treinouHoje ? cartaoAerobico() : null,
      cartaoSemana(true),
      cartaoInstalar(),
      heroTreino(selecionado),
      h('p', { class: 'como-usar' },
        h('strong', null, 'Como usar: '),
        'terminou a série? Toque no cronômetro dela e o descanso começa sozinho. Acabou o exercício? ',
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
    const ajuste = !emAndamento && estado.ajustes[treino.id];
    if (ajuste) {
      const partes = [ajuste.descanso ? `+${ajuste.descanso} s de descanso` : null, ajuste.carga ? `carga ${ajuste.carga > 0 ? '+' : '−'}${Math.abs(ajuste.carga)}%` : null].filter(Boolean);
      extras.push(h('p', { class: 'aviso ajuste-aviso' }, `Ajuste pedido no fim do último ${nomeDoTreino(treino.titulo)}: ${partes.join(' e ')}. `,
        h('button', {
          class: 'link',
          onclick: () => {
            delete estado.ajustes[treino.id];
            salvar();
            renderInicio();
          },
        }, 'Desfazer')));
    }

    const exercicios = h('ol', { class: 'exercicios-treino' }, treino.exercicios.map((_, slot) => {
      const ex = exercicio(i, slot);
      return h('li', null,
        h('button', { class: 'ex-previa', 'aria-label': `Ver ${ex.nome}`, onclick: () => abrirExercicio(i, slot) },
          miniatura(ex),
          h('span', { class: 'ex-play', 'aria-hidden': 'true' }, '▶')),
        h('button', { class: 'ex-texto', onclick: () => abrirExercicio(i, slot) },
          h('span', { class: 'ex-nome' }, ex.nome),
          h('span', { class: 'ex-meta' }, ex.trocado && ex.semelhanca !== null
            ? `${ex.series} × ${ex.reps} · trocado, ${ex.semelhanca}% semelhante`
            : `${ex.series} × ${ex.reps}${ex.trocado ? ' · trocado' : ''}`,
          ex.tecnica && TECNICAS[ex.tecnica.tipo] ? h('span', { class: 'tag-tecnica' }, `${TECNICAS[ex.tecnica.tipo].nome.replace(' na última série', '')}${ex.tecnica.grupo ? ` ${ex.tecnica.grupo}` : ''}`) : null)),
        biblioteca && !programa.mobilidade
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
    const extrasProximo = emAndamento ? [] : estado.extrasProximo[treino.id] || [];
    extrasProximo.forEach((x, j) => {
      const ex = extraComoExercicio(x);
      if (!ex) return;
      exercicios.append(h('li', null,
        miniatura(ex),
        h('span', { class: 'ex-texto' },
          h('span', { class: 'ex-nome' }, ex.nome),
          h('span', { class: 'ex-meta' }, `${x.series} × ${x.reps} · só no próximo`)),
        h('button', {
          class: 'trocar-linha',
          'aria-label': `Tirar ${ex.nome} do próximo treino`,
          onclick: () => {
            const lista = extrasProximo.filter((_, n) => n !== j);
            if (lista.length) estado.extrasProximo[treino.id] = lista;
            else delete estado.extrasProximo[treino.id];
            salvar();
            renderInicio();
          },
        }, 'Tirar')));
    });

    const totalExercicios = treino.exercicios.length + extrasFixos.length + extrasProximo.length;
    const series = totalSeries(treino) + [...extrasFixos, ...extrasProximo].reduce((soma, x) => soma + x.series, 0);
    return h('article', { class: 'hero' },
      h('p', { class: 'etiqueta' }, etiqueta),
      h('h2', { class: treino.titulo.length > 7 ? 'longo' : null }, treino.titulo),
      h('p', { class: 'foco' }, treino.foco),
      h('ul', { class: 'meta' },
        h('li', null, h('strong', null, totalExercicios), 'exercícios'),
        h('li', null, h('strong', null, series), 'séries'),
        h('li', null, h('strong', null, treino.duracao.replace(' min', '')), 'min')),
      h('button', { class: 'botao primario', onclick: () => (emAndamento ? abrirTreino() : comecar(i)) },
        emAndamento ? `Continuar (${sessao.feitos.length + 1} de ${indicesDaSessao().length})` : 'Começar treino'),
      extras,
      h('p', { class: 'rotulo' }, 'Exercícios'),
      h('p', { class: 'dica-semana' }, 'Toque num exercício para ver como fazer e o vídeo dele.'),
      exercicios,
      biblioteca ? h('button', { class: 'botao secundario', icone: 'mais', onclick: () => abrirAdicionar(i, false) }, 'Adicionar exercício') : null);
  }

  // Prévia de um exercício antes de começar: fotos em movimento, séries, técnica, motivo e o trecho do vídeo.
  function abrirExercicio(i, slot) {
    const ex = exercicio(i, slot);
    const t = ex.tecnica && TECNICAS[ex.tecnica.tipo];
    const fechar = () => {
      const video = modal.querySelector('video');
      if (video) video.pause();
      modal.remove();
    };
    const modal = h('div', {
      class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': ex.nome,
      onclick: (e) => {
        if (e.target === modal) fechar();
      },
    }, h('div', { class: 'modal-caixa folha previa' },
      ex.trocado ? figura(ex, doisDigitos(slot + 1), null) : videoDoExercicio(i, slot, true),
      h('h2', null, ex.nome),
      h('div', { class: 'numeros' },
        h('div', null, h('span', { class: 'rotulo' }, programa.mobilidade ? 'Séries × tempo' : 'Séries × reps'), h('strong', null, `${ex.series} × ${ex.reps}`)),
        programa.mobilidade ? null : h('div', null, h('span', { class: 'rotulo' }, 'RIR'), h('strong', null, ex.rir)),
        h('div', null, h('span', { class: 'rotulo' }, 'Descanso'), h('strong', null, ex.descanso))),
      t ? h('div', { class: `tecnica tecnica-${ex.tecnica.tipo}` },
        h('div', { class: 'porque-topo' }, h('p', { class: 'rotulo' }, `${t.nome}${ex.tecnica.grupo ? ` ${ex.tecnica.grupo}` : ''}`), seloEvidencia(t.evidencia)),
        h('p', { class: 'porque' }, t.texto)) : null,
      ex.aquecimento && !programa.mobilidade ? h('p', { class: 'aviso' }, 'Tem aquecimento antes: 6 repetições com 40% e 6 com 80% da carga.') : null,
      blocoPorque(ex),
      h('p', { class: 'rotulo' }, daBiblioteca(ex) ? 'Passo a passo' : 'Execução'),
      daBiblioteca(ex) ? h('ol', { class: 'passos' }, ex.dicas.map((d) => h('li', null, d))) : h('ul', { class: 'dicas' }, ex.dicas.map((d) => h('li', null, d))),
      ex.trocado ? h('p', { class: 'aviso' }, 'Exercício trocado: sem vídeo, as fotos mostram o movimento.') : null,
      h('button', { class: 'link', onclick: fechar }, 'Fechar')));
    document.body.append(modal);
    modal.querySelector('.link').focus();
  }

  function botaoRecomecar(i) {
    return h('button', { class: 'link', onclick: () => confirmarRecomecar(i) }, 'Recomeçar do zero');
  }

  function confirmarRecomecar(i) {
    const treino = programa.treinos[i];
    const fechar = () => modal.remove();
    const modal = h('div', {
      class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Recomeçar o treino',
      onclick: (e) => {
        if (e.target === modal) fechar();
      },
    }, h('div', { class: 'modal-caixa folha' },
      h('h2', null, `Recomeçar o ${treino.titulo}?`),
      h('p', null, 'As séries marcadas hoje e o tempo voltam para o zero. As cargas anotadas continuam salvas.'),
      h('button', {
        class: 'botao primario',
        onclick: () => {
          // Os exercícios adicionados só para hoje continuam no treino recomeçado.
          const fixos = (estado.extras[treino.id] || []).length;
          const deHoje = estado.sessao ? estado.sessao.extras.slice(fixos).filter((x) => !x.removido) : [];
          const ajuste = estado.sessao ? estado.sessao.ajuste : null;
          fechar();
          comecar(i, deHoje, ajuste);
        },
      }, 'Recomeçar do zero'),
      h('button', { class: 'link', onclick: fechar }, 'Cancelar')));
    document.body.append(modal);
    modal.querySelector('.botao').focus();
  }

  function renderTreino() {
    const treino = programa.treinos[estado.sessao.treino];
    const pilha = h('div', { class: 'pilha' });
    app.replaceChildren(h('section', { class: 'treino' },
      h('header', { class: 'barra' },
        h('button', { class: 'icone-botao', icone: 'voltar', 'aria-label': 'Voltar ao início', onclick: voltarInicio }),
        h('span', { class: 'personagem-mini' }, imagemDoPersonagem(window.Ofensiva.fase(ofensivaAtual()))),
        h('div', { class: 'barra-titulo' }, h('strong', null, treino.titulo),
          h('span', { class: 'contador-linha' }, h('span', { class: 'contador' }), ' · ', h('span', { class: 'tempo-treino', role: 'timer', 'aria-label': 'Tempo de treino' }))),
        h('button', { class: 'icone-botao', icone: 'mais', 'aria-label': 'Adicionar exercício', onclick: () => abrirAdicionar(estado.sessao.treino, true) })),
      h('div', { class: 'segmentos', 'aria-hidden': 'true' }, indicesDaSessao().map((i) => h('span', { 'data-i': i }))),
      h('div', { class: 'proximos', role: 'list', 'aria-label': 'Próximos exercícios' }),
      pilha,
      h('div', { class: 'desfazer-aviso', hidden: true, role: 'status' }),
      h('div', { class: 'descanso', hidden: true }),
      h('div', { class: 'acoes' },
        h('button', { class: 'acao depois', icone: 'depois', onclick: () => acaoBotao('depois') }, 'Depois'),
        h('button', { class: 'acao feito', icone: 'feito', onclick: () => acaoBotao('feito') }, 'Feito'))));
    montarPilha(pilha, false);
    atualizarCabecalho();
    atualizarDescanso();
  }

  // Tempo de treino desde o começo, com os descansos: no topo do treino e no cartão de descanso.
  const tempoLongo = (segundos) => {
    const s = Math.max(0, Math.floor(segundos));
    const horas = Math.floor(s / 3600);
    return horas ? `${horas}:${doisDigitos(Math.floor((s % 3600) / 60))}:${doisDigitos(s % 60)}` : relogio(s);
  };
  setInterval(() => {
    if (!estado.sessao) return;
    const texto = tempoLongo((Date.now() - estado.sessao.inicio) / 1000);
    document.querySelectorAll('.tempo-treino').forEach((el) => {
      if (el.textContent !== texto) el.textContent = texto;
    });
  }, 1000);

  function atualizarCabecalho() {
    const sessao = estado.sessao;
    const tempo = app.querySelector('.tempo-treino');
    if (tempo) tempo.textContent = tempoLongo((Date.now() - sessao.inicio) / 1000);
    const n = indicesDaSessao().length;
    app.querySelector('.contador').textContent = `Exercício ${Math.min(sessao.feitos.length + 1, n)} de ${n}`;
    app.querySelectorAll('.segmentos span').forEach((seg) => {
      const i = Number(seg.dataset.i);
      seg.className = sessao.feitos.includes(i) ? 'feito' : i === sessao.fila[0] ? 'atual' : '';
    });
    // Os próximos da fila; tocar num deles traz para a frente (aparelho livre, por exemplo).
    const proximos = app.querySelector('.proximos');
    if (proximos) {
      const resto = sessao.fila.slice(1);
      proximos.hidden = !resto.length;
      proximos.replaceChildren(...(resto.length ? [h('span', { class: 'rotulo' }, 'A seguir')] : []),
        ...resto.map((j) => {
          const ex = exercicioDaSessao(j);
          return h('button', {
            class: 'proximo-chip', role: 'listitem',
            'aria-label': `${ex ? ex.nome : 'Exercício'}: fazer agora`,
            onclick: () => {
              trazerParaFrente(j);
              avisar(`Agora: ${ex ? ex.nome : 'exercício'}`);
            },
          }, h('span', { class: 'proximo-numero' }, j + 1), ex ? ex.nome : '…');
        }));
    }
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

  // ---------- técnicas, aquecimento e carga ----------

  const TECNICAS = {
    biset: {
      nome: 'Bi-set', evidencia: 'crescimento',
      texto: 'Faça uma série de cada exercício do par, sem descanso entre eles; descanse só depois do par. Rendeu o mesmo músculo e a mesma força que séries normais, em menos tempo, mas cansa mais (Zhang et al., 2025).',
    },
    triset: {
      nome: 'Tri-set', evidencia: 'nao-testado',
      texto: 'Uma série de cada um dos três exercícios, sem descanso entre eles; descanse só depois do terceiro. Os estudos de superséries testaram pares, que renderam o mesmo que séries normais em menos tempo (Zhang et al., 2025); três seguidos não foram testados.',
    },
    drop: {
      nome: 'Drop-set na última série', evidencia: 'crescimento',
      texto: 'Na última série, ao chegar perto da falha, tire 20 a 30% do peso e continue até perto da falha de novo; dá para repetir mais uma vez. Rendeu crescimento parecido com séries normais, em metade a um terço do tempo (Sødal et al., 2023).',
    },
    restpause: {
      nome: 'Rest-pause', evidencia: 'crescimento',
      texto: 'Vá até 1 repetição antes da falha, descanse 15 s (botão Mini-pausa) e faça mais repetições; repita a pausa mais uma vez. Tudo conta como 1 série. Rendeu pelo menos o mesmo crescimento que séries normais em pessoas treinadas (Prestes et al., 2019).',
    },
    cluster: {
      nome: 'Cluster', evidencia: 'crescimento',
      texto: 'Cada série é dividida em blocos de 2 repetições, com 20 s de pausa entre eles (botão Mini-pausa). A carga pesada sai mais rápida e com menos cansaço; músculo e força cresceram igual às séries normais (Davies et al., 2021).',
    },
  };

  // Exercícios do mesmo bi-set ou tri-set, na ordem do treino (só os do programa).
  function membrosDoGrupo(i) {
    const treino = programa.treinos[estado.sessao.treino];
    const t = i < treino.exercicios.length ? treino.exercicios[i].tecnica : null;
    if (!t || !t.grupo) return null;
    return treino.exercicios.map((e, j) => (e.tecnica && e.tecnica.grupo === t.grupo ? j : -1)).filter((j) => j >= 0);
  }

  const arredondarCarga = (kg) => Math.round(kg * 2) / 2;
  const textoKg = (kg) => `${String(kg).replace('.', ',')} kg`;

  // Carga de hoje (se já digitada), senão a da última vez, com o ajuste pedido no fim do último treino.
  function cargaDoExercicio(i, ex) {
    const sessao = estado.sessao;
    const hoje = sessao.cargas[i];
    const ultima = estado.cargas[ex.imagem] || null;
    const ajuste = sessao.ajuste.carga;
    const sugerida = ultima && ajuste ? arredondarCarga(ultima.kg * (1 + ajuste / 100)) : null;
    return { hoje: Number.isFinite(hoje) ? hoje : null, ultima, sugerida, ajuste };
  }

  function campoCarga(i, ex) {
    const c = cargaDoExercicio(i, ex);
    const valor = c.hoje !== null ? c.hoje : c.sugerida !== null ? c.sugerida : c.ultima ? c.ultima.kg : '';
    const dica = c.sugerida !== null
      ? `Sugestão de hoje: ${textoKg(c.sugerida)} (${c.ajuste > 0 ? '+' : '−'}${Math.abs(c.ajuste)}% da última, ${textoKg(c.ultima.kg)})`
      : c.ultima ? `Última vez: ${textoKg(c.ultima.kg)}` : 'Anote a carga: fica salva para a próxima vez';
    return h('label', { class: 'campo-carga' },
      h('span', { class: 'rotulo' }, 'Carga'),
      h('input', {
        type: 'number', inputmode: 'decimal', step: '0.5', min: '0', max: '1000', value: String(valor), placeholder: '0',
        'aria-label': `Carga de ${ex.nome}, em kg`,
        onchange: (e) => {
          const kg = arredondarCarga(Number(String(e.target.value).replace(',', '.')));
          if (!Number.isFinite(kg) || kg < 0 || kg > 1000 || e.target.value === '') return;
          estado.sessao.cargas[i] = kg;
          estado.cargas[ex.imagem] = { kg, data: dataLocal(new Date()) };
          salvar();
          const aq = e.target.closest('.cartao').querySelector('.aquecimento');
          if (aq) aq.replaceWith(blocoAquecimento(i, ex));
        },
      }),
      h('span', { class: 'unidade' }, 'kg'),
      h('span', { class: 'dica-carga' }, dica));
  }

  // Aquecimento (Ribeiro et al., 2021): 6 repetições com 40% e 6 com 80% da carga do treino.
  function blocoAquecimento(i, ex) {
    const feitos = estado.sessao.aquecidos[i] || 0;
    const c = cargaDoExercicio(i, ex);
    const base = c.hoje !== null ? c.hoje : c.sugerida !== null ? c.sugerida : c.ultima ? c.ultima.kg : null;
    return h('div', { class: 'aquecimento' },
      h('span', { class: 'rotulo' }, 'Aquecimento'),
      [40, 80].map((pct, k) => h('button', {
        class: k < feitos ? 'serie-aquecimento feita' : 'serie-aquecimento',
        'aria-pressed': String(k < feitos),
        onclick: () => {
          estado.sessao.aquecidos[i] = k < feitos ? k : k + 1;
          salvar();
          const el = app.querySelector(`.cartao.topo[data-i="${i}"] .aquecimento`);
          if (el) el.replaceWith(blocoAquecimento(i, ex));
          if (k >= feitos) iniciarDescanso(60, k === 0 ? 'aquecimento com 80%' : `série 1 de ${ex.series} de ${ex.nome}`, true);
        },
      }, `6 × ${base ? textoKg(arredondarCarga((base * pct) / 100)) : `${pct}%`}`)),
      h('span', { class: 'dica-carga' }, 'Não conta como série. Prepara a carga e a técnica (Ribeiro et al., 2021).'));
  }

  function blocoTecnica(i, ex) {
    const t = ex.tecnica && TECNICAS[ex.tecnica.tipo];
    if (!t) return null;
    const membros = membrosDoGrupo(i);
    let titulo = t.nome;
    let aviso = null;
    if (membros) {
      const pos = membros.indexOf(i);
      titulo = `${t.nome} ${ex.tecnica.grupo} · ${pos + 1} de ${membros.length}`;
      const outros = membros.filter((j) => j !== i).map((j) => exercicio(estado.sessao.treino, j).nome);
      aviso = pos < membros.length - 1
        ? `Depois de cada série, sem descanso: ${exercicio(estado.sessao.treino, membros[pos + 1]).nome}.`
        : `Último do grupo: descanse depois de cada série e volte para ${exercicio(estado.sessao.treino, membros[0]).nome}.`;
      if (!outros.length) aviso = null;
    }
    const pausa = ex.tecnica.pausa
      ? h('button', { class: 'botao secundario mini-pausa', onclick: () => iniciarDescanso(ex.tecnica.pausa, ex.tecnica.tipo === 'cluster' ? 'próximo bloco' : 'mais repetições', true) }, `Mini-pausa ${ex.tecnica.pausa} s`)
      : null;
    return h('div', { class: `tecnica tecnica-${ex.tecnica.tipo}` },
      h('div', { class: 'porque-topo' }, h('p', { class: 'rotulo' }, titulo), seloEvidencia(t.evidencia)),
      aviso ? h('p', { class: 'tecnica-aviso' }, aviso) : null,
      h('p', { class: 'porque' }, t.texto),
      pausa);
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
    const mobilidade = Boolean(programa.mobilidade);
    if (mobilidade && !ex.extra) botao = null;
    return h('article', { class: `cartao ${posicao}`, 'data-i': i, 'aria-label': ex.nome },
      h('span', { class: 'carimbo carimbo-feito', 'aria-hidden': 'true' }, 'Feito'),
      h('span', { class: 'carimbo carimbo-depois', 'aria-hidden': 'true' }, 'Depois'),
      figura(ex, ex.extra ? 'Extra' : doisDigitos(i + 1), botao),
      h('div', { class: 'corpo' },
        h('h2', null, ex.nome),
        // O vídeo do treino tem os exercícios do programa, sem as trocas.
        i < programa.treinos[treinoIdx].exercicios.length && !ex.trocado
          ? h('button', { class: 'link video-exercicio', icone: 'play', onclick: () => abrirVideo(treinoIdx, i) }, 'Ver vídeo')
          : null,
        h('div', { class: 'numeros' },
          h('div', null, h('span', { class: 'rotulo' }, mobilidade ? 'Séries × tempo' : 'Séries × reps'), h('strong', null, `${ex.series} × ${ex.reps}`)),
          mobilidade ? null : h('div', null, h('span', { class: 'rotulo' }, 'RIR'), h('strong', null, ex.rir)),
          h('div', null, h('span', { class: 'rotulo' }, 'Descanso'), h('strong', null, descansoComAjuste(ex.descanso)))),
        blocoTecnica(i, ex),
        h('ul', { class: 'musculos', 'aria-label': 'Músculos trabalhados' },
          ex.primarios.map((m) => h('li', { class: 'principal' }, m)),
          ex.secundarios.map((m) => h('li', { class: 'auxiliar' }, m))),
        blocoPorque(ex),
        h('p', { class: 'rotulo' }, daBiblioteca(ex) ? 'Passo a passo' : 'Execução'),
        daBiblioteca(ex)
          ? h('ol', { class: 'passos' }, ex.dicas.map((d) => h('li', null, d)))
          : h('ul', { class: 'dicas' }, ex.dicas.map((d) => h('li', null, d)))),
      mobilidade ? null : h('div', { class: 'carga-e-aquecimento' },
        campoCarga(i, ex),
        ex.aquecimento && estado.sessao.aquecer !== false ? blocoAquecimento(i, ex) : null),
      h('footer', { class: 'series' },
        h('div', { class: 'anilhas', role: 'group', 'aria-label': 'Séries: toque no cronômetro ao terminar cada uma' },
          Array.from({ length: ex.series }, (_, k) => h('button', {
            class: k < feitas ? 'anilha cheia' : k === feitas ? 'anilha proxima' : 'anilha',
            'aria-pressed': String(k < feitas),
            'aria-label': `Série ${k + 1} de ${ex.series}`,
            onclick: () => marcarSerie(i, k),
          }, h('span', null, k + 1)))),
        h('span', { class: completo ? 'arraste pronto' : 'arraste' },
          completo ? 'Pronto! Arraste para a direita' : 'Terminou a série? Toque no cronômetro')));
  }

  // Esforço do treino (escala de percepção da sessão, Foster et al., 2001) e o que o app sugere.
  const ESFORCOS = {
    leve: { rotulo: 'Leve', emoji: '🙂' },
    medida: { rotulo: 'Na medida', emoji: '💪' },
    pesado: { rotulo: 'Pesado', emoji: '😤' },
    limite: { rotulo: 'No limite', emoji: '🥵' },
  };

  // Gasto do treino: MET × peso × horas (Compendium, Ainsworth et al., 2011). Musculação moderada
  // vale 3,5 METs, vigorosa 6,0, e alongamento leve 2,3.
  function caloriasDoTreino(r) {
    if (!r.segundos) return null;
    const met = programa.mobilidade ? 2.3 : r.esforco === 'pesado' || r.esforco === 'limite' ? 6 : 3.5;
    return Math.round((met * estado.peso * r.segundos) / 3600 / 5) * 5;
  }

  function sugestaoDoEsforco(r, treino) {
    const ajuste = estado.ajustes[treino.id] || { descanso: 0, carga: 0 };
    const pedir = (mudanca) => {
      const novo = { ...ajuste, ...mudanca };
      if (novo.descanso || novo.carga) estado.ajustes[treino.id] = novo;
      else delete estado.ajustes[treino.id];
      salvar();
      renderFim();
    };
    const botaoAjuste = (rotulo, mudanca, ligado) => h('button', {
      class: ligado ? 'ajuste ligado' : 'ajuste',
      'aria-pressed': String(ligado),
      onclick: () => pedir(ligado ? Object.fromEntries(Object.keys(mudanca).map((k) => [k, 0])) : mudanca),
    }, ligado ? `✓ ${rotulo}` : rotulo);
    const nome = nomeDoTreino(treino.titulo);
    if (programa.mobilidade) {
      const textos = {
        leve: 'Tranquilo. Na próxima, segure cada posição um pouco mais longe, sempre sem dor.',
        medida: 'Ótimo: desconforto leve é o ponto certo do alongamento.',
        pesado: 'Alongamento não precisa doer. Na próxima, vá até o desconforto leve e pare ali.',
        limite: 'Pare se sentir pontada ou formigamento. Alongar com dor não aumenta o ganho de amplitude.',
      };
      return h('p', { class: 'sugestao' }, textos[r.esforco]);
    }
    if (r.esforco === 'leve') {
      return h('div', { class: 'sugestao' },
        h('p', null, `Sobrou energia. Onde você fez todas as repetições no topo da faixa, suba 2,5 a 5% da carga (ACSM, 2009), ou pare mais perto da falha: o crescimento aumenta quanto mais perto dela a série termina (Robinson et al., 2024).`),
        botaoAjuste(`Sugerir +5% de carga no próximo ${nome}`, { carga: 5 }, ajuste.carga === 5));
    }
    if (r.esforco === 'medida') {
      return h('div', { class: 'sugestao' },
        h('p', null, 'Ótimo. Mantenha e siga a regra do programa: completou todas as séries no topo da faixa, sobe a carga na próxima.'));
    }
    if (r.esforco === 'pesado') {
      return h('div', { class: 'sugestao' },
        h('p', null, 'Treino perto da falha é pesado mesmo: é o que o programa pede (RIR 0 a 2). Mantenha a carga. Se a técnica caiu no fim das séries, pare 1 repetição antes.'));
    }
    return h('div', { class: 'sugestao' },
      h('p', null, `Intenso demais. No próximo ${nome}, o app pode dar mais descanso ou baixar a carga. Descansar mais entre as séries ajuda a manter as repetições e rendeu um pouco mais de músculo (Schoenfeld et al., 2016; Singer et al., 2024). Dor nas articulações ou tontura: pare e procure orientação.`),
      h('div', { class: 'ajustes' },
        botaoAjuste('+30 s de descanso', { descanso: 30 }, ajuste.descanso === 30),
        botaoAjuste('Baixar 10% da carga', { carga: -10 }, ajuste.carga === -10)),
      ajuste.descanso || ajuste.carga ? h('p', { class: 'aviso' }, `Vale só para o próximo ${nome}.`) : null);
  }

  function renderFim() {
    const treino = programa.treinos[resumoFinal.treino];
    const proximo = programa.treinos[(resumoFinal.treino + 1) % programa.treinos.length];
    const of = ofensivaAtual();
    const subiu = of.nivel > resumoFinal.nivelAntes;
    const kcal = caloriasDoTreino(resumoFinal);
    const marcarEsforco = (valor) => {
      resumoFinal.esforco = valor;
      // Guarda no histórico do dia, junto com o treino.
      for (let k = estado.historico.length - 1; k >= 0; k--) {
        if (estado.historico[k].treino === resumoFinal.treinoId) {
          estado.historico[k] = { ...estado.historico[k], esforco: valor };
          break;
        }
      }
      salvar();
      renderFim();
    };
    const rolagem = window.scrollY;
    app.replaceChildren(h('section', { class: 'fim' },
      h('div', { class: 'fim-destaque' },
        h('p', { class: 'rotulo' }, `${treino.titulo} concluído`),
        h('p', { class: 'fim-parabens' }, estado.perfil.nome ? `Mandou bem, ${estado.perfil.nome}!` : 'Mandou bem!'),
        h('div', { class: `personagem-solto${subiu ? ' subiu' : ''}` }, imagemDoMomento('comemora')),
        h('p', { class: 'fim-tempo' }, resumoFinal.segundos ? tempoLongo(resumoFinal.segundos) : '—'),
        h('p', { class: 'fim-tempo-rotulo' }, 'de treino, com os descansos'),
        h('dl', { class: 'resumo' },
          h('div', null, h('dt', null, 'Séries'), h('dd', null, `${resumoFinal.series}/${resumoFinal.totalSeries}`)),
          h('div', null, h('dt', null, 'Exercícios'), h('dd', null, resumoFinal.exercicios)),
          h('div', null, h('dt', null, 'Calorias'), h('dd', null, kcal ? `~${kcal}` : '—'))),
        h('div', { class: 'fim-ofensiva' },
          linhaOfensiva(of, estadoDaChama(of)),
          h('p', { class: subiu ? 'subiu-texto' : 'nivel' }, subiu ? `Subiu para o nível ${of.nivel}: mais forte!` : textoDoNivel(of)),
          h('p', { class: 'pontos-fim' }, `+${pontosAtuais() - resumoFinal.pontosAntes} pontos hoje · ${plural(pontosAtuais(), 'ponto')} no total`))),
      h('article', { class: 'esforco-cartao' },
        h('h2', null, 'Como foi o treino?'),
        h('div', { class: 'opcoes-esforco', role: 'group', 'aria-label': 'Esforço do treino' }, Object.entries(ESFORCOS).map(([valor, e]) => h('button', {
          'aria-pressed': String(resumoFinal.esforco === valor),
          onclick: () => marcarEsforco(valor),
        }, h('span', { 'aria-hidden': 'true' }, e.emoji), e.rotulo))),
        resumoFinal.esforco ? sugestaoDoEsforco(resumoFinal, treino) : null,
        h('p', { class: 'aviso' }, `Calorias: estimativa por MET × peso (${estado.peso} kg) × tempo, pelo Compendium of Physical Activities (Ainsworth et al., 2011); ${programa.mobilidade ? 'alongamento leve vale 2,3 METs' : 'musculação vale 3,5 METs, ou 6,0 se o treino foi pesado'}. O peso se ajusta no aeróbico.`)),
      cartaoAerobico(),
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
    window.scrollTo(0, rolagem);
  }

  // ---------- aeróbico ----------

  const aerobicosDeHoje = () => estado.aerobicos.filter((a) => a.data === dataLocal(new Date()));
  const minutosNaSemana = () => {
    const dias = new Set(diasDaSemanaAtual().map(dataLocal));
    return estado.aerobicos.filter((a) => dias.has(a.data)).reduce((soma, a) => soma + a.minutos, 0);
  };

  function registrarAerobico(tipo, minutos) {
    const hoje = dataLocal(new Date());
    const antes = window.Aerobico.pontosDoAerobico(window.Aerobico.minutosDoDia(estado.aerobicos, hoje));
    estado.aerobicos = [...estado.aerobicos, { data: hoje, tipo, minutos }].slice(-400);
    salvar();
    // Pontos só contam em dia de treino, até 30 min somados no dia.
    const treinou = estado.historico.some((x) => x.data === hoje);
    return treinou ? window.Aerobico.pontosDoAerobico(window.Aerobico.minutosDoDia(estado.aerobicos, hoje)) - antes : 0;
  }

  // No fim do treino: convite para somar aeróbico, ou o aeróbico já feito hoje.
  function cartaoAerobico() {
    const feitos = aerobicosDeHoje();
    if (feitos.length) {
      const minutos = feitos.reduce((soma, a) => soma + a.minutos, 0);
      const m = window.Aerobico.modalidade(feitos[feitos.length - 1].tipo);
      const kcal = feitos.reduce((soma, a) => soma + window.Aerobico.calorias(a.tipo, a.minutos, estado.peso), 0);
      return h('article', { class: 'aerobico-cartao feito' },
        h('img', { src: `fotos/${m.imagem}-0.jpg`, alt: '' }),
        h('div', null,
          h('p', { class: 'etiqueta' }, `Aeróbico de hoje · +${window.Aerobico.pontosDoAerobico(minutos)} pontos`),
          h('strong', null, feitos.length === 1 ? `${m.nome}, ${minutos} min` : `${minutos} min em ${feitos.length} aeróbicos`),
          h('span', null, `Cerca de ${kcal} kcal · ${plural(pontosAtuais(), 'ponto')} no total`),
          h('button', { class: 'link', onclick: abrirAerobico }, 'Fazer mais')));
    }
    return h('button', { class: 'aerobico-cartao convite', onclick: abrirAerobico },
      h('span', { class: 'mais-pontos', 'aria-hidden': 'true' }, '+15'),
      h('div', null,
        h('strong', null, 'ADD aeróbico e ganhe + pontos'),
        h('span', null, `Esteira, bicicleta, elíptico, escada ou remo, com cronômetro: +1 ponto a cada 2 min, até +15. Treino feito já valeu ${window.Aerobico.PONTOS_TREINO}.`)));
  }

  function abrirAerobico() {
    let escolhido = null;
    const fechar = () => modal.remove();
    const caixa = h('div', { class: 'modal-caixa folha aerobico-folha' });
    const modal = h('div', {
      class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Aeróbico',
      onclick: (e) => {
        if (e.target === modal) fechar();
      },
    }, caixa);
    function desenhar() {
      const semana = minutosNaSemana();
      const meta = window.Aerobico.META_SEMANA;
      const lista = window.Aerobico.MODALIDADES.map((m) => {
        const aberto = m.id === escolhido;
        return h('div', { class: `aerobico-opcao${aberto ? ' aberta' : ''}` },
          h('button', {
            class: 'aerobico-linha', 'aria-expanded': String(aberto),
            onclick: () => {
              escolhido = aberto ? null : m.id;
              desenhar();
            },
          },
          h('img', { src: `fotos/${m.imagem}-0.jpg`, alt: '', loading: 'lazy' }),
          h('span', { class: 'aerobico-texto' },
            h('strong', null, m.nome),
            h('span', { class: `impacto ${m.impacto}` }, window.Aerobico.IMPACTOS[m.impacto]),
            h('span', { class: 'kcal' }, `~${window.Aerobico.calorias(m.id, 30, estado.peso)} kcal em 30 min`))),
          aberto ? h('div', { class: 'aerobico-detalhe' },
            h('p', null, h('strong', null, 'Articulações: '), m.articulacoes),
            h('p', { class: 'aviso' }, `Ritmo da conta: ${m.ritmo} (${String(m.met).replace('.', ',')} METs).`),
            h('button', {
              class: 'botao primario',
              onclick: () => {
                fechar();
                abrirCronometro(m.id);
              },
            }, 'Abrir cronômetro')) : null);
      });
      caixa.replaceChildren(
        h('h2', null, 'Aeróbico no fim do treino'),
        h('p', null, 'Escolha o aparelho e marque o tempo no cronômetro. Feito depois da musculação, o aeróbico não atrapalha o ganho de músculo nem de força (Schumann et al., 2022).'),
        h('div', { class: 'aerobico-semana' },
          h('p', null, h('strong', null, `${semana} de ${meta} min`), ' de aeróbico esta semana'),
          h('span', { class: 'barra-tempo' }, h('i', { style: `width: ${Math.min(100, (semana / meta) * 100)}%` }))),
        h('label', { class: 'campo-peso' }, 'Seu peso, para as calorias',
          h('input', {
            type: 'number', inputmode: 'numeric', min: '30', max: '250', value: String(estado.peso),
            onchange: (e) => {
              const kg = Math.round(Number(e.target.value));
              if (kg >= 30 && kg <= 250) {
                estado.peso = kg;
                salvar();
              }
              desenhar();
            },
          }), 'kg'),
        h('div', { class: 'aerobico-lista' }, lista),
        h('details', { class: 'saiba-mais' },
          h('summary', null, 'O que dizem os estudos'),
          h('ul', null,
            h('li', null, h('strong', null, 'Quanto fazer: '), 'a OMS recomenda 150 a 300 minutos por semana de aeróbico moderado (ou 75 a 150 de intenso). Moderado é o ritmo em que dá para conversar, mas não cantar.'),
            h('li', null, h('strong', null, 'Depois da musculação: '), 'numa revisão de 43 estudos, juntar aeróbico e musculação não diminuiu o ganho de músculo nem de força máxima, com corrida ou bicicleta, no mesmo dia ou em dias separados. Só a força explosiva (salto, arranque) ganhou um pouco menos (Schumann et al., 2022).'),
            h('li', null, h('strong', null, 'Antes atrapalha o treino: '), 'aeróbico logo antes da musculação diminui as repetições do treino de força por algumas horas, principalmente o de perna (Sporer e Wenger, 2003). Por isso o app sugere fazer no fim.'),
            h('li', null, h('strong', null, 'Corrida ou bicicleta: '), 'olhando as fibras do músculo, a corrida diminuiu um pouco o crescimento das fibras do tipo I, e a bicicleta não (Lundberg et al., 2022). Os autores chamam isso de evidência preliminar. Em dia de perna, prefira bicicleta, elíptico ou caminhada.'),
            h('li', null, h('strong', null, 'Calorias: '), 'MET × peso × tempo, com os valores do Compendium of Physical Activities (Ainsworth et al., 2011). É uma média: o relógio ou o aparelho pode mostrar outro número.'))),
        h('button', { class: 'link', onclick: fechar }, 'Fechar'));
    }
    desenhar();
    document.body.append(modal);
    caixa.querySelector('.aerobico-linha').focus();
  }

  // Cronômetro do aeróbico em tela cheia. estado.cronoAerobico guarda { tipo, minutos, fim, restante }:
  // fim é a hora de acabar enquanto corre; restante (ms), enquanto está pausado. Sobrevive a fechar o app.
  let cronoIntervalo = null;

  function restanteDoCrono(c) {
    return c.fim ? Math.max(0, c.fim - Date.now()) : c.restante;
  }

  function abrirCronometro(tipo) {
    if (!estado.cronoAerobico || estado.cronoAerobico.tipo !== tipo) {
      estado.cronoAerobico = { tipo, minutos: 20, fim: null, restante: null };
      salvar();
    }
    desenharCronometro();
  }

  function fecharCronometro() {
    clearInterval(cronoIntervalo);
    cronoIntervalo = null;
    const el = document.querySelector('.crono-aerobico');
    if (el) el.remove();
    if (tela !== 'treino') soltarTravaTela();
  }

  function desenharCronometro(fim) {
    const c = estado.cronoAerobico;
    const m = window.Aerobico.modalidade(fim ? fim.tipo : c ? c.tipo : '');
    let el = document.querySelector('.crono-aerobico');
    if (!m) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = h('div', { class: 'crono-aerobico', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Cronômetro: ${m.nome}` });
      document.body.append(el);
    }
    clearInterval(cronoIntervalo);
    cronoIntervalo = null;
    const iniciado = c && (c.fim !== null || c.restante !== null);
    const topo = h('div', { class: 'crono-topo' },
      h('img', { src: `fotos/${m.imagem}-0.jpg`, alt: '' }),
      h('div', null, h('span', { class: 'rotulo' }, 'Aeróbico'), h('strong', null, m.nome)));

    if (fim) {
      // Acabou: mostra o que somou.
      el.replaceChildren(topo,
        h('div', { class: 'crono-personagem' }, imagemDoMomento('comemora')),
        h('p', { class: 'crono-feito' }, h('strong', null, `${fim.minutos} min feitos`),
          h('span', null, `Cerca de ${window.Aerobico.calorias(m.id, fim.minutos, estado.peso)} kcal`
            + (fim.pontos ? ` · +${plural(fim.pontos, 'ponto')}` : estado.historico.some((x) => x.data === dataLocal(new Date())) ? ' · pontos do dia já no máximo' : ' · pontos só em dia de treino'))),
        h('button', {
          class: 'botao primario',
          onclick: () => {
            fecharCronometro();
            render();
          },
        }, 'Ok'));
      el.querySelector('.botao').focus();
      return;
    }

    if (!iniciado) {
      // Ajuste do tempo: atalhos e − / + de 1 minuto, até 3 horas.
      const ajustar = (n) => {
        c.minutos = Math.max(1, Math.min(window.Aerobico.MINUTOS_MAX, n));
        salvar();
        desenharCronometro();
      };
      el.replaceChildren(topo,
        h('p', { class: 'crono-pergunta' }, 'Quanto tempo?'),
        h('div', { class: 'crono-ajuste' },
          h('button', { class: 'crono-passo', 'aria-label': 'Menos 1 minuto', onclick: () => ajustar(c.minutos - 1) }, '−'),
          h('p', { class: 'crono-minutos', 'aria-live': 'polite' }, h('strong', null, c.minutos), h('span', null, 'min')),
          h('button', { class: 'crono-passo', 'aria-label': 'Mais 1 minuto', onclick: () => ajustar(c.minutos + 1) }, '+')),
        h('div', { class: 'opcoes-minutos' }, [...window.Aerobico.MINUTOS, 45].map((n) => h('button', {
          'aria-pressed': String(n === c.minutos),
          onclick: () => ajustar(n),
        }, h('strong', null, `${n} min`)))),
        h('p', { class: 'crono-previsao' }, `~${window.Aerobico.calorias(m.id, c.minutos, estado.peso)} kcal · até +${window.Aerobico.pontosDoAerobico(c.minutos)} pontos`),
        h('button', {
          class: 'botao primario',
          onclick: () => {
            prepararAudio();
            c.fim = Date.now() + c.minutos * 60000;
            salvar();
            pedirTravaTela();
            desenharCronometro();
          },
        }, 'Começar'),
        h('button', {
          class: 'link',
          onclick: () => {
            estado.cronoAerobico = null;
            salvar();
            fecharCronometro();
          },
        }, 'Cancelar'));
      el.querySelector('.crono-ajuste .crono-passo + p + .crono-passo').focus();
      return;
    }

    // Correndo ou pausado.
    const encerrar = () => {
      const feitos = Math.floor((c.minutos * 60000 - restanteDoCrono(c)) / 60000);
      estado.cronoAerobico = null;
      if (feitos < 1) {
        salvar();
        fecharCronometro();
        avisar('Menos de 1 minuto: não foi registrado');
        return;
      }
      const pontos = registrarAerobico(m.id, feitos);
      desenharCronometro({ tipo: m.id, minutos: feitos, pontos });
    };
    const relogioEl = h('p', { class: 'crono-relogio', role: 'timer' });
    const barra = h('span', { class: 'barra-tempo' }, h('i'));
    const info = h('p', { class: 'crono-previsao' });
    const pausar = h('button', {
      class: 'botao secundario',
      onclick: () => {
        if (c.fim) {
          c.restante = restanteDoCrono(c);
          c.fim = null;
        } else {
          c.fim = Date.now() + c.restante;
          c.restante = null;
        }
        salvar();
        desenharCronometro();
      },
    }, c.fim ? 'Pausar' : 'Continuar');
    el.replaceChildren(topo,
      h('div', { class: 'crono-personagem' }, imagemDoPersonagem(window.Ofensiva.fase(ofensivaAtual()))),
      relogioEl, barra, info,
      h('div', { class: 'crono-botoes' }, pausar, h('button', { class: 'botao primario', onclick: encerrar }, 'Terminar')));
    el.classList.toggle('pausado', !c.fim);
    const atualizar = () => {
      const resta = restanteDoCrono(c);
      const feitos = (c.minutos * 60000 - resta) / 60000;
      relogioEl.textContent = relogio(resta / 1000);
      barra.firstChild.style.width = `${(1 - resta / (c.minutos * 60000)) * 100}%`;
      info.textContent = `${c.fim ? '' : 'Pausado · '}${Math.floor(feitos)} de ${c.minutos} min · ~${window.Aerobico.calorias(m.id, feitos, estado.peso)} kcal`;
      if (c.fim && resta <= 0) {
        apitar();
        vibrar();
        encerrar();
      }
    };
    atualizar();
    if (c.fim) cronoIntervalo = setInterval(atualizar, 250);
    pausar.focus();
  }

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
    // Bi-set e tri-set: entre os exercícios do grupo não há descanso; o app passa para o próximo.
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
        iniciarDescanso(segundosDescanso(ex.descanso), `rodada ${(sessao.series[primeiro] || 0) + 1} do ${ex.tecnica.tipo === 'triset' ? 'tri-set' : 'bi-set'}: ${exercicioDaSessao(primeiro).nome}`);
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
    estado.historico = [...estado.historico, { data: dataLocal(new Date()), treino: treino.id, minutos: resumoFinal.minutos }].slice(-400);
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

  // semAjuste: mini-pausas e aquecimento não ganham o descanso extra pedido no fim do último treino.
  function iniciarDescanso(segundos, proxima, semAjuste) {
    pararDescanso();
    if (!semAjuste && estado.sessao) segundos += estado.sessao.ajuste.descanso;
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

  function alternarDescanso() {
    descansoMinimizado = !descansoMinimizado;
    atualizarDescanso();
    const alvo = app.querySelector(descansoMinimizado ? '.descanso .expandir' : '.descanso .pular');
    if (alvo) alvo.focus();
  }

  // O descanso abre como um cartão de tela cheia, com o personagem descansando; "Minimizar"
  // reduz a uma barra acima dos botões para ver o cartão do exercício.
  function atualizarDescanso() {
    const caixa = app.querySelector('.descanso');
    if (!caixa) return;
    if (!descanso) {
      caixa.hidden = true;
      caixa.className = 'descanso';
      caixa.replaceChildren();
      return;
    }
    if (!caixa.firstChild) {
      caixa.append(
        h('div', { class: 'descanso-topo' },
          h('span', { class: 'rotulo descanso-rotulo' }),
          h('span', { class: 'descanso-treino' }, 'Treino ', h('span', { class: 'tempo-treino' }, estado.sessao ? tempoLongo((Date.now() - estado.sessao.inicio) / 1000) : '')),
          h('button', { class: 'minimizar', onclick: alternarDescanso }, 'Minimizar')),
        h('button', { class: 'expandir', 'aria-label': 'Abrir o descanso em tela cheia', onclick: alternarDescanso },
          h('span', { class: 'descanso-personagem' }),
          h('span', { class: 'relogio', role: 'timer', 'aria-label': 'Tempo de descanso' })),
        h('div', { class: 'descanso-info' },
          h('span', { class: 'barra-tempo' }, h('i')),
          h('span', { class: 'descanso-proxima' }),
          h('span', { class: 'so-leitor', 'aria-live': 'polite' })),
        h('div', { class: 'descanso-botoes' },
          h('button', { class: 'mais', 'aria-label': 'Mais 30 segundos', onclick: maisTrintaSegundos }, '+30 s'),
          h('button', { class: 'pular', onclick: pararDescanso }, 'Pular')));
    }
    const restante = Math.max(0, (descanso.fim - Date.now()) / 1000);
    const pronto = restante <= 0;
    caixa.hidden = false;
    caixa.classList.toggle('pronto', pronto);
    caixa.classList.toggle('minimizado', descansoMinimizado);
    caixa.classList.toggle('cheio', !descansoMinimizado);
    caixa.setAttribute('role', descansoMinimizado ? 'region' : 'dialog');
    caixa.setAttribute('aria-label', 'Descanso');
    caixa.querySelector('.relogio').textContent = relogio(restante);
    caixa.querySelector('.descanso-rotulo').textContent = pronto ? 'Bora!' : 'Descanso';
    caixa.querySelector('.expandir').disabled = !descansoMinimizado;
    caixa.querySelector('.descanso-proxima').textContent = `${pronto ? 'Agora' : 'A seguir'}: ${descanso.proxima}`;
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

  // Tempo de cada exercício no vídeo do treino (gerar_videos.py): abertura de 5 s, depois 8 s por exercício.
  const VIDEO_INTRO = 5;
  const VIDEO_EXERCICIO = 8;

  // Só o trecho do exercício slot no vídeo do treino. repetir: sem som e em loop, para a prévia.
  function videoDoExercicio(i, slot, repetir) {
    const treino = programa.treinos[i];
    const inicio = VIDEO_INTRO + slot * VIDEO_EXERCICIO;
    // O trecho vai também no endereço (#t=), que o navegador já entende sozinho.
    const video = h('video', {
      class: 'video-trecho', src: `videos/${treino.id}.mp4#t=${inicio},${inicio + VIDEO_EXERCICIO}`,
      controls: true, playsinline: true, preload: 'metadata', muted: repetir, autoplay: repetir,
    });
    if (repetir) video.muted = true;
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = inicio;
    }, { once: true });
    video.addEventListener('timeupdate', () => {
      if (video.currentTime >= inicio + VIDEO_EXERCICIO - 0.3) {
        video.currentTime = inicio;
        if (!repetir) video.pause();
      }
    });
    return video;
  }

  function abrirVideo(i, slot) {
    const treino = programa.treinos[i];
    const video = videoDoExercicio(i, slot, false);
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
      h('p', { class: 'aviso' }, 'Toque no play para ver de novo.'),
      h('button', { class: 'botao secundario', onclick: fechar }, 'Fechar vídeo')));
    document.body.append(modal);
    modal.querySelector('.botao').focus();
    video.play().catch(() => {});
  }

  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.crono-aerobico')) return;
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
    if (descanso && !descansoMinimizado) {
      if (e.key === 'Escape') alternarDescanso();
      return;
    }
    // Digitando a carga, as teclas são do campo, não atalhos do treino.
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      acaoBotao('feito');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      acaoBotao('depois');
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      desfazer();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (programa && estado.perfil.configurado) {
      const antes = estado.bloqueios.filter((b) => b.usado).length;
      usarBloqueios();
      if (estado.bloqueios.filter((b) => b.usado).length !== antes && tela === 'inicio') renderInicio();
    }
    if (tela === 'treino' || (estado.cronoAerobico && estado.cronoAerobico.fim)) pedirTravaTela();
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
    // updateViaCache: 'none' faz o celular buscar o sw.js novo a cada abertura.
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {
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
      if (estado.cronoAerobico) desenharCronometro();
      usarBloqueios();
      if (tela === 'inicio') renderInicio();
      carregarBiblioteca();
    })
    .catch(() => {
      app.replaceChildren(h('section', { class: 'erro' },
        h('h1', null, 'Não deu para carregar os treinos'),
        h('p', null, 'Recarregue a página. Se você abriu o arquivo direto do computador, abra pelo link publicado ou rode um servidor local na pasta treinos.')));
    });
})();
