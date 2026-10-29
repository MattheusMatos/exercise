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
const diasProtegidos = () => estado.bloqueios.filter((b) => b.usado).map((b) => b.usado);
const ofensivaAtual = () => window.Ofensiva.calcular(estado.historico, todosOsPlanos(), dataLocal(new Date()), diasProtegidos());

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
    return { d, data, numero: dia.getDate(), hoje: data === hoje, passado: data < hoje, status, treino };
  });
}

// Dia planejado desta semana que passou sem treino, se depois dele ainda não houve treino e a
// pessoa ainda não escolheu entre fazer o que faltou ou pular para o seguinte.
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
