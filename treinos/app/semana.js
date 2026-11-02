// O plano da semana: dias de treino, dia que faltou e lembrete na agenda.
'use strict';

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
// Para a ofensiva e os pontos, conta o treino de musculação e o dia ativo: 20 minutos ou mais de
// aeróbico ou esporte, mesmo sem musculação (aerobico.js).
function historicoDaOfensiva() {
  const treinos = new Set(estado.historico.map((x) => x.data));
  const ativos = window.Aerobico.diasAtivos(estado.aerobicos).filter((d) => !treinos.has(d)).map((data) => ({ data, treino: null, atividade: true }));
  return [...estado.historico, ...ativos];
}
const diasDeBloqueio = () => estado.bloqueios.filter((b) => b.usado).map((b) => b.usado);
// Feriado nacional em dia de treino planejado, sem treino: a academia costuma fechar, e o dia fica
// protegido como se fosse um bloqueio, sem gastar nenhum (feriados.js).
function diasDeFeriado() {
  const hoje = dataLocal(new Date());
  const treinou = new Set(historicoDaOfensiva().map((x) => x.data));
  const saida = [];
  for (const [semana, dias] of Object.entries(todosOsPlanos())) {
    dias.forEach((planejado, d) => {
      const dia = somarDiasData(semana, d);
      if (planejado && dia <= hoje && !treinou.has(dia) && window.Feriados.nome(dia)) saida.push(dia);
    });
  }
  return saida;
}
const diasProtegidos = () => [...diasDeBloqueio(), ...diasDeFeriado()];
const ofensivaAtual = () => window.Ofensiva.calcular(historicoDaOfensiva(), todosOsPlanos(), dataLocal(new Date()), diasProtegidos());

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
  const ativos = new Set(window.Aerobico.diasAtivos(estado.aerobicos));
  let seguinte = estado.sessao ? estado.sessao.treino : estado.proximo;
  return diasDaSemanaAtual().map((dia, d) => {
    const data = dataLocal(dia);
    const planejado = !!(plano && plano.dias[d]);
    let status = 'descanso';
    let treino = null;
    let atividade = null;
    if (feitos.has(data)) {
      status = 'feito';
      treino = feitos.get(data);
    } else if (ativos.has(data)) {
      status = 'feito';
      const ultima = estado.aerobicos.filter((a) => a.data === data).pop();
      const m = window.Aerobico.modalidade(ultima.tipo);
      atividade = m.icone || '🏃';
    } else if (diasDeFeriado().includes(data)) {
      status = 'feriado';
    } else if (diasProtegidos().includes(data)) {
      status = 'protegido';
    } else if (planejado && data < hoje) {
      status = 'faltou';
    } else if (planejado) {
      status = 'planejado';
      treino = programa.treinos[seguinte].id;
      seguinte = (seguinte + 1) % programa.treinos.length;
    }
    return { d, data, numero: dia.getDate(), hoje: data === hoje, passado: data < hoje, status, treino, atividade };
  });
}

// Dia planejado desta semana que passou sem treino, se depois dele ainda não houve treino e a
// pessoa ainda não escolheu entre fazer o que faltou ou pular para o seguinte.
// Aviso de feriado na tela inicial: na véspera e no dia, dizendo o que acontece com a ofensiva.
function cartaoFeriado() {
  const hoje = dataLocal(new Date());
  const amanha = somarDiasData(hoje, 1);
  const deHoje = window.Feriados.nome(hoje);
  const deAmanha = window.Feriados.nome(amanha);
  const plano = todosOsPlanos();
  const planejado = (dia) => {
    const semana = new Date(`${dia}T12:00:00`).getDay();
    const dias = plano[somarDiasData(dia, -semana)];
    return Boolean(dias && dias[semana]);
  };
  let texto = null;
  if (deHoje && !treinouHoje()) {
    texto = planejado(hoje)
      ? `Hoje é ${deHoje}. Academia fechada? Era dia de treino, então a ofensiva está protegida, sem gastar bloqueio. Se der para treinar, conta normal.`
      : `Hoje é ${deHoje}. Não era dia de treino: a ofensiva não depende de hoje.`;
  } else if (deAmanha && !deHoje) {
    texto = planejado(amanha)
      ? `Amanhã é ${deAmanha} e muitas academias fecham. Se não der para treinar, a ofensiva fica protegida sozinha, sem gastar bloqueio.`
      : `Amanhã é ${deAmanha} e muitas academias fecham. Amanhã não era dia de treino, então nada muda na ofensiva.`;
  }
  if (!texto) return null;
  return h('div', { class: 'feriado-cartao', role: 'note' }, h('span', { 'aria-hidden': 'true' }, '🗓️'), h('p', null, texto));
}

function faltaPendente() {
  if (estado.sessao || !programa.treinos.length) return null;
  const dias = semanaComTreinos();
  const k = dias.map((x) => x.status).lastIndexOf('faltou');
  if (k < 0 || dias.slice(k + 1).some((x) => x.status === 'feito')) return null;
  if (estado.faltaResolvida === dias[k].data) return null;
  return dias[k];
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
    // Alguns programas pedem outros números de dias (o estilo Mentzer clássico, só 2).
    h('div', { class: 'opcoes-dias' }, (programa.opcoesDias || [3, 4, 5, 6]).map((n) => h('button', {
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
  const descricoes = { feito: 'feito', planejado: 'planejado', faltou: 'planejado e não feito', descanso: 'descanso', protegido: 'protegido por bloqueio de ofensiva', feriado: 'feriado: protegido sem gastar bloqueio' };
  const tira = h('ol', { class: 'semana' }, dias.map((x) => {
    const podeMudar = interativo && !x.passado && x.status !== 'feito';
    const rotulo = x.treino ? tituloDoTreino(x.treino) : x.atividade ? x.atividade : x.status === 'faltou' ? 'faltou' : x.status === 'protegido' ? '🧊' : x.status === 'feriado' ? 'feriado' : '—';
    const nome = `${maiuscula(NOMES_DIAS[x.d])}, dia ${x.numero}${x.hoje ? ' (hoje)' : ''}`;
    return h('li', null, h(podeMudar ? 'button' : 'div', {
      class: `dia ${x.status}${x.hoje ? ' hoje' : ''}`,
      'aria-label': `${nome}: ${x.treino ? `${tituloDoTreino(x.treino)} ` : x.atividade ? 'aeróbico ou esporte ' : ''}${descricoes[x.status]}`,
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
