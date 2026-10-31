// O estado salvo no aparelho: validação do que vem do localStorage e salvar.
'use strict';

// ---------- estado, salvo no aparelho ----------

// Versão do formato salvo. Quando uma mudança no formato não puder ser resolvida só pela validação
// (estadoValido), suba o número e acrescente em MIGRACOES a função que converte da versão anterior.
const VERSAO_ESTADO = 1;
const MIGRACOES = {
  // 0 → 1: estados de antes do número de versão. As conversões antigas (avatares desenhados, chaves
  // separadas, histórico de cargas a partir da última carga) continuam em estadoValido.
  1: (e) => e,
};

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
    cargas: {}, ajustes: {}, extrasProximo: {}, bloqueios: [], baus: [],
    compras: [], apostas: [], estiloCard: ESTILOS_CARD.academia ? 'academia' : 'laranja', registroCargas: [], pesos: [],
    perfil: { personagem, programa: nomePrograma, sexo: configurado ? sexo : null, nome: limparNome(p.nome), configurado }, atualizado: Number(e.atualizado) || 0,
    versao: VERSAO_ESTADO,
  };
  // Armários do dia já abertos, com o prêmio de cada um.
  if (Array.isArray(e.baus)) {
    const valido = (b) => b && /^\d{4}-\d{2}-\d{2}$/.test(b.data) && b.premio && (
      (b.premio.tipo === 'pontos' && Number.isInteger(b.premio.valor) && b.premio.valor > 0 && b.premio.valor <= 100)
      || (b.premio.tipo === 'multiplicador' && [2, 3].includes(b.premio.valor))
      || b.premio.tipo === 'bloqueio');
    limpo.baus = e.baus.filter(valido).map((b) => ({ data: b.data, ouro: Boolean(b.ouro), premio: b.premio })).slice(-400);
  }
  // Loja: o que foi gasto, as apostas "dobro ou nada" e os estilos do card de compartilhar.
  if (Array.isArray(e.compras)) {
    limpo.compras = e.compras.filter((c) => c && /^\d{4}-\d{2}-\d{2}$/.test(c.data) && typeof c.tipo === 'string'
      && Number.isInteger(c.pontos) && c.pontos > 0 && c.pontos <= 1000).map((c) => ({ data: c.data, tipo: c.tipo, pontos: c.pontos })).slice(-400);
  }
  if (Array.isArray(e.apostas)) {
    limpo.apostas = e.apostas.filter((a) => a && /^\d{4}-\d{2}-\d{2}$/.test(a.inicio) && ['ativa', 'ganha', 'perdida'].includes(a.status))
      .map((a) => ({ inicio: a.inicio, status: a.status })).slice(-100);
  }
  if (ESTILOS_CARD[e.estiloCard]) limpo.estiloCard = e.estiloCard;
  // Histórico de cargas (uma por exercício por dia) e do peso do corpo, para as retrospectivas.
  const ehDia = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
  if (Array.isArray(e.registroCargas)) {
    limpo.registroCargas = e.registroCargas.filter((r) => r && ehDia(r.data) && typeof r.ex === 'string' && Number.isFinite(r.kg) && r.kg >= 0 && r.kg <= 1000)
      .map((r) => ({ data: r.data, ex: r.ex, kg: r.kg })).slice(-5000);
  }
  if (Array.isArray(e.pesos)) {
    limpo.pesos = e.pesos.filter((r) => r && ehDia(r.data) && Number.isFinite(r.kg) && r.kg >= 30 && r.kg <= 250).map((r) => ({ data: r.data, kg: r.kg })).slice(-1000);
  }
  if (typeof e.faltaResolvida === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.faltaResolvida)) limpo.faltaResolvida = e.faltaResolvida;
  // Bloqueios de ofensiva comprados com pontos; usado é o dia que cada um protegeu.
  const ehData = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
  if (Array.isArray(e.bloqueios)) {
    limpo.bloqueios = e.bloqueios.filter((b) => b && ehData(b.comprado) && (b.usado === null || ehData(b.usado)))
      .map((b) => ({ comprado: b.comprado, usado: b.usado, ...(b.gratis ? { gratis: true } : {}), ...(b.reparo ? { reparo: true } : {}) })).slice(-100);
  }
  // Todo usuário, novo ou antigo, ganha 2 bloqueios de presente, uma vez só.
  limpo.bloqueiosPresente = true;
  if (!e.bloqueiosPresente) {
    const hoje = dataLocal(new Date());
    limpo.bloqueios = [...limpo.bloqueios, { comprado: hoje, usado: null, gratis: true }, { comprado: hoje, usado: null, gratis: true }];
  }
  // Carga usada por exercício (id da foto), para a próxima vez.
  if (e.cargas && typeof e.cargas === 'object') {
    for (const [id, c] of Object.entries(e.cargas)) {
      if (c && Number.isFinite(c.kg) && c.kg >= 0 && c.kg <= 1000 && /^\d{4}-\d{2}-\d{2}$/.test(c.data)) limpo.cargas[id] = { kg: c.kg, data: c.data };
    }
  }
  // Quem já anotava cargas antes do histórico começa com a última de cada exercício.
  if (!Array.isArray(e.registroCargas)) {
    limpo.registroCargas = Object.entries(limpo.cargas).map(([ex, c]) => ({ data: c.data, ex, kg: c.kg }));
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
    limpo.historico = e.historico.filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(x.data) && ids.has(x.treino)).slice(-1500);
  }
  if (Array.isArray(e.aerobicos)) {
    limpo.aerobicos = e.aerobicos.filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(x.data) && window.Aerobico.modalidade(x.tipo)
      && Number.isInteger(x.minutos) && x.minutos >= 1 && x.minutos <= window.Aerobico.MINUTOS_MAX).slice(-1500);
  }
  const c = e.cronoAerobico;
  if (c && window.Aerobico.modalidade(c.tipo) && Number.isInteger(c.minutos) && c.minutos >= 1 && c.minutos <= window.Aerobico.MINUTOS_MAX) {
    const fim = Number.isFinite(c.fim) ? c.fim : null;
    const restante = fim === null && Number.isFinite(c.restante) && c.restante >= 0 ? c.restante : null;
    limpo.cronoAerobico = { tipo: c.tipo, minutos: c.minutos, fim, restante };
  }
  return limpo;
}

// Leva o estado salvo até a versão atual. Antes de mexer, guarda uma cópia intacta em
// ppl:estado:v<versão>: se uma migração der errado, os dados continuam no aparelho.
function migrar(salvo) {
  const de = Number.isInteger(salvo.versao) ? salvo.versao : 0;
  if (de === VERSAO_ESTADO) return salvo;
  const copia = `${CHAVE_ESTADO}:v${de}`;
  if (ler(copia, null) === null) gravar(copia, salvo);
  // Salvo por uma versão mais nova do app (o celular ainda rodando a antiga, do cache): segue com o
  // que esta versão entende, e a cópia guarda o que ela não conhece.
  if (de > VERSAO_ESTADO) return salvo;
  let e = salvo;
  for (let v = de + 1; v <= VERSAO_ESTADO; v++) e = MIGRACOES[v](e);
  return e;
}

function carregarLocal() {
  const salvo = ler(CHAVE_ESTADO, null);
  if (salvo && typeof salvo === 'object') return estadoValido(migrar(salvo));
  // Algo salvo que não dá para ler: guarda o texto como está antes que a primeira gravação o substitua.
  try {
    const bruto = localStorage.getItem(CHAVE_ESTADO);
    if (bruto !== null && localStorage.getItem(`${CHAVE_ESTADO}:ilegivel`) === null) localStorage.setItem(`${CHAVE_ESTADO}:ilegivel`, bruto);
  } catch (e) {
    // sem armazenamento ou sem espaço: segue como primeira abertura
  }
  // Versão anterior do app guardava em duas chaves separadas; sem nada salvo, é a primeira abertura.
  if (ACADEMIA) return estadoValido(null);
  const proximo = ler('ppl:proximo', null);
  const sessao = ler('ppl:sessao', null);
  return estadoValido(proximo === null && sessao === null ? null : { proximo: proximo || 0, sessao });
}

function salvar() {
  estado.atualizado = Date.now();
  gravar(CHAVE_ESTADO, estado);
}
