// Bloqueio de ofensiva e a loja de pontos (reparar a ofensiva, dobro ou nada, cores do card).
'use strict';

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

const hojeProtegido = () => diasProtegidos().includes(dataLocal(new Date()));
const treinouHoje = () => estado.historico.some((x) => x.data === dataLocal(new Date()));

// Usar na hora: protege o dia de hoje (conta para a meta, sem somar ofensiva).
function usarBloqueioHoje() {
  if (hojeProtegido() || treinouHoje()) return false;
  const livre = estado.bloqueios.filter((b) => !b.usado).sort((a, b) => a.comprado.localeCompare(b.comprado))[0];
  if (!livre) return false;
  livre.usado = dataLocal(new Date());
  salvar();
  return true;
}

// Mudou de ideia no mesmo dia: o bloqueio volta a ficar guardado.
function devolverBloqueioHoje() {
  const hoje = dataLocal(new Date());
  const usado = estado.bloqueios.find((b) => b.usado === hoje);
  if (!usado) return false;
  usado.usado = null;
  salvar();
  return true;
}

function comprarBloqueio() {
  if (pontosAtuais() < PRECO_BLOQUEIO || bloqueiosGuardados() >= MAX_BLOQUEIOS) return false;
  estado.bloqueios = [...estado.bloqueios, { comprado: dataLocal(new Date()), usado: null }];
  salvar();
  return true;
}

const dataCurta = (dia) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

// ---------- loja ----------

const PRECO_REPARO = 150;
const DIAS_PARA_REPARAR = 2; // depois do dia em que a ofensiva apagou
const PRECO_APOSTA = 50;
const PREMIO_APOSTA = 100;
const DIAS_APOSTA = 14;
const somarDiasData = (dia, n) => {
  const d = new Date(`${dia}T12:00:00`);
  d.setDate(d.getDate() + n);
  return dataLocal(d);
};
const diasDesde = (dia) => Math.round((new Date(`${dataLocal(new Date())}T12:00:00`) - new Date(`${dia}T12:00:00`)) / 86400000);

function gastar(tipo, pontos) {
  if (pontosAtuais() < pontos) return false;
  estado.compras = [...estado.compras, { data: dataLocal(new Date()), tipo, pontos }].slice(-400);
  return true;
}

// A ofensiva apagou há até 2 dias e dá para reparar: devolve a quebra e os dias a proteger.
function reparoDisponivel() {
  const of = ofensivaAtual();
  const q = of.quebras[of.quebras.length - 1];
  if (!q || diasDesde(q.data) > DIAS_PARA_REPARAR) return null;
  const dias = window.Ofensiva.diasParaSalvar(estado.historico, todosOsPlanos(), dataLocal(new Date()), diasProtegidos(), q.data, 7);
  return dias && dias.length ? { ...q, protegerDias: dias } : null;
}

function repararOfensiva() {
  const reparo = reparoDisponivel();
  if (!reparo || !gastar('reparo', PRECO_REPARO)) return false;
  estado.bloqueios = [...estado.bloqueios, ...reparo.protegerDias.map((dia) => ({ comprado: reparo.data, usado: dia, gratis: true, reparo: true }))];
  salvar();
  return true;
}

// Dobro ou nada: aposta 50 pontos; com a ofensiva acesa por 14 dias seguidos, recebe 100.
const apostaAtiva = () => estado.apostas.find((a) => a.status === 'ativa') || null;

function apostar() {
  if (apostaAtiva() || !gastar('aposta', PRECO_APOSTA)) return false;
  estado.apostas = [...estado.apostas, { inicio: dataLocal(new Date()), status: 'ativa' }];
  salvar();
  return true;
}

// Confere a aposta ativa: perde se a ofensiva apagou no período; ganha ao completar os 14 dias.
function conferirApostas() {
  const a = apostaAtiva();
  if (!a) return;
  const fim = somarDiasData(a.inicio, DIAS_APOSTA);
  const of = ofensivaAtual();
  if (of.quebras.some((q) => q.data >= a.inicio && q.data < fim)) {
    a.status = 'perdida';
    salvar();
    avisar('A ofensiva apagou: a aposta dobro ou nada foi perdida.');
  } else if (dataLocal(new Date()) >= fim) {
    a.status = 'ganha';
    salvar();
    avisar(`🏆 Dobro ou nada: 14 dias de ofensiva! +${PREMIO_APOSTA} pontos.`);
  }
}

function cartaoReparo(redesenhar) {
  const reparo = reparoDisponivel();
  if (!reparo) {
    return h('div', { class: 'loja-item' },
      h('div', { class: 'loja-topo' }, h('p', { class: 'rotulo' }, '🔧 Reparar ofensiva'), h('span', { class: 'preco' }, `${PRECO_REPARO} pts`)),
      h('p', null, `Se a ofensiva apagar e não houver bloqueio guardado, dá para recuperá-la em até ${DIAS_PARA_REPARAR} dias. Aparece aqui quando acontecer.`));
  }
  const ate = somarDiasData(reparo.data, DIAS_PARA_REPARAR);
  const falta = PRECO_REPARO - pontosAtuais();
  return h('div', { class: 'loja-item destaque' },
    h('div', { class: 'loja-topo' }, h('p', { class: 'rotulo' }, '🔧 Reparar ofensiva'), h('span', { class: 'preco' }, `${PRECO_REPARO} pts`)),
    h('p', null, h('strong', null, `Sua ofensiva de ${plural(reparo.dias, 'dia')} apagou.`), ` Dá para recuperá-la até ${dataCurta(ate)}: os dias que faltaram para a meta ficam protegidos.`),
    h('button', {
      class: 'botao primario',
      disabled: falta > 0,
      onclick: () => {
        if (repararOfensiva()) {
          avisar(`🔧 Ofensiva de ${plural(reparo.dias, 'dia')} recuperada!`);
          redesenhar();
          renderInicio();
        }
      },
    }, `Reparar por ${PRECO_REPARO} pontos`),
    falta > 0 ? h('p', { class: 'aviso' }, `Faltam ${plural(falta, 'ponto')}.`) : null);
}

function cartaoAposta(redesenhar) {
  const a = apostaAtiva();
  const corpo = a
    ? [h('p', null, h('strong', null, `Dia ${Math.min(DIAS_APOSTA, diasDesde(a.inicio) + 1)} de ${DIAS_APOSTA}.`),
      ` Mantenha a ofensiva acesa até ${dataCurta(somarDiasData(a.inicio, DIAS_APOSTA - 1))} e receba ${PREMIO_APOSTA} pontos.`),
    h('div', { class: 'barra-tempo' }, h('i', { style: `width: ${Math.min(100, ((diasDesde(a.inicio) + 1) / DIAS_APOSTA) * 100)}%` }))]
    : [h('p', null, `Aposte ${PRECO_APOSTA} pontos: se a ofensiva ficar acesa por ${DIAS_APOSTA} dias, você recebe ${PREMIO_APOSTA}. Bloqueios valem; se ela apagar, perde a aposta.`),
      h('button', {
        class: 'botao primario',
        disabled: pontosAtuais() < PRECO_APOSTA,
        onclick: () => {
          if (apostar()) {
            avisar(`🎲 Aposta feita: ${DIAS_APOSTA} dias de ofensiva valem ${PREMIO_APOSTA} pontos.`);
            redesenhar();
            renderInicio();
          }
        },
      }, `Apostar ${PRECO_APOSTA} pontos`),
      pontosAtuais() < PRECO_APOSTA ? h('p', { class: 'aviso' }, `Faltam ${plural(PRECO_APOSTA - pontosAtuais(), 'ponto')}.`) : null];
  const ganhas = estado.apostas.filter((x) => x.status === 'ganha').length;
  return h('div', { class: 'loja-item' },
    h('div', { class: 'loja-topo' }, h('p', { class: 'rotulo' }, '🎲 Dobro ou nada'), h('span', { class: 'preco' }, a ? 'em andamento' : `${PRECO_APOSTA} pts`)),
    corpo,
    ganhas ? h('p', { class: 'aviso' }, `Apostas ganhas: ${ganhas}.`) : null);
}

function amostraEstilo(id) {
  const e = ESTILOS_CARD[id];
  const el = h('span', { class: 'amostra-estilo', 'aria-hidden': 'true' });
  el.style.background = `linear-gradient(180deg, ${e.fundo.join(', ')})`;
  el.style.color = e.tinta;
  el.textContent = '52:40';
  return el;
}

// Cores do card de compartilhar, todas liberadas.
function opcoesEstilo(aoMudar) {
  return h('div', { class: 'opcoes-estilo' }, Object.entries(ESTILOS_CARD).map(([id, e]) => h('button', {
    class: 'opcao-estilo',
    'aria-pressed': String(estado.estiloCard === id),
    onclick: () => {
      estado.estiloCard = id;
      salvar();
      aoMudar();
    },
  }, amostraEstilo(id), h('span', null, e.nome))));
}

// Aba Loja: pontos para gastar e o que dá para comprar.
function abaLoja(redesenhar) {
  return [
    h('p', { class: 'saldo-loja' }, '⭐ ', h('strong', null, plural(pontosAtuais(), 'ponto')), ' para gastar'),
    h('p', { class: 'grupo-descricao' }, `Cada treino vale ${window.Aerobico.PONTOS_TREINO} pontos; o aeróbico e o armário do dia dão mais.`),
    cartaoBloqueio(redesenhar),
    cartaoReparo(redesenhar),
    cartaoAposta(redesenhar),
  ];
}

// Na aba Loja: o que é, quantos tem guardados e o botão de comprar.
function cartaoBloqueio(redesenhar) {
  const guardados = bloqueiosGuardados();
  const saldo = pontosAtuais();
  const usados = estado.bloqueios.filter((b) => b.usado).map((b) => b.usado).sort().reverse();
  const motivo = guardados >= MAX_BLOQUEIOS ? `Você já tem ${MAX_BLOQUEIOS}, o máximo guardado.`
    : saldo < PRECO_BLOQUEIO ? `Faltam ${plural(PRECO_BLOQUEIO - saldo, 'ponto')}: cada treino vale ${window.Aerobico.PONTOS_TREINO}, e o aeróbico soma mais.` : null;
  // O botão diz o que falta quando não dá para comprar, para não parecer só um botão apagado.
  const rotuloCompra = guardados >= MAX_BLOQUEIOS ? 'Máximo guardado'
    : saldo < PRECO_BLOQUEIO ? `Faltam ${plural(PRECO_BLOQUEIO - saldo, 'ponto')} para comprar` : `Comprar por ${PRECO_BLOQUEIO} pontos`;
  return h('div', { class: 'bloqueio-cartao' },
    h('div', { class: 'bloqueio-topo' },
      h('p', { class: 'rotulo' }, 'Bloqueio de ofensiva'),
      h('span', { class: 'bloqueio-icones', 'aria-label': `${guardados} de ${MAX_BLOQUEIOS} guardados` },
        Array.from({ length: MAX_BLOQUEIOS }, (_, k) => h('span', { class: k < guardados ? 'cheio' : '' }, '🧊')))),
    estado.bloqueios.some((b) => b.gratis && !b.usado) ? h('p', { class: 'presente' }, '🎁 Você ganhou 2 bloqueios de presente.') : null,
    h('p', null, 'Vai viajar ou não vai conseguir treinar? Use um bloqueio: o dia sem treino conta para a meta da semana e a ofensiva não apaga, mas também não soma dia de ofensiva. Se esquecer, o app usa sozinho no dia em que a ofensiva apagaria.'),
    hojeProtegido()
      ? h('div', { class: 'bloqueio-hoje' },
        h('p', null, h('strong', null, '🧊 Hoje está protegido.'), ' A ofensiva não apaga por causa de hoje.'),
        treinouHoje() ? null : h('button', {
          class: 'link',
          onclick: () => {
            if (devolverBloqueioHoje()) {
              avisar('Bloqueio devolvido: ele continua guardado.');
              redesenhar();
              renderInicio();
            }
          },
        }, 'Vou treinar: devolver o bloqueio'))
      : treinouHoje() ? h('p', { class: 'aviso' }, 'Hoje você já treinou: não precisa de bloqueio.')
        : !guardados ? null
        : h('button', {
          class: 'botao primario',
          onclick: () => {
            if (usarBloqueioHoje()) {
              avisar('🧊 Bloqueio usado hoje: a ofensiva está protegida.');
              redesenhar();
              renderInicio();
            }
          },
        }, 'Usar um bloqueio hoje'),
    h('button', {
      class: 'botao comprar',
      disabled: Boolean(motivo),
      onclick: () => {
        if (comprarBloqueio()) {
          avisar(`🧊 Bloqueio guardado. Você tem ${plural(pontosAtuais(), 'ponto')}.`);
          redesenhar();
          renderInicio();
        }
      },
    }, rotuloCompra),
    h('p', { class: 'aviso' }, guardados >= MAX_BLOQUEIOS ? motivo
      : saldo < PRECO_BLOQUEIO ? `${guardados ? '' : 'Nenhum bloqueio guardado. '}Cada treino vale ${window.Aerobico.PONTOS_TREINO} pontos, e o aeróbico soma mais.`
        : `Você tem ${plural(saldo, 'ponto')}.`),
    usados.length ? h('p', { class: 'aviso' }, `Dias protegidos: ${usados.slice(0, 6).map(dataCurta).join(', ')}.`) : null);
}

// Encaixa a meta nos dias que ainda faltam da semana, preferindo os dias sugeridos.
