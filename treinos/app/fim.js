// A tela de fim do treino: tempo, calorias, como foi o treino e o ajuste para a próxima vez.
'use strict';

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
        h('p', { class: 'pontos-fim' }, `+${pontosAtuais() - resumoFinal.pontosAntes} pontos hoje${multiplicadorDeHoje() > 1 ? ` (treino em ${multiplicadorDeHoje() === 2 ? 'dobro ⚡' : 'triplo 🔥'})` : ''} · ${plural(pontosAtuais(), 'ponto')} no total`)),
      h('button', { class: 'botao compartilhar', icone: 'compartilhar', onclick: () => abrirCompartilhar(resumoFinal, treino) }, 'Compartilhar treino')),
    h('article', { class: 'esforco-cartao' },
      h('h2', null, 'Como foi o treino?'),
      h('div', { class: 'opcoes-esforco', role: 'group', 'aria-label': 'Esforço do treino' }, Object.entries(ESFORCOS).map(([valor, e]) => h('button', {
        'aria-pressed': String(resumoFinal.esforco === valor),
        onclick: () => marcarEsforco(valor),
      }, h('span', { 'aria-hidden': 'true' }, e.emoji), e.rotulo))),
      resumoFinal.esforco ? sugestaoDoEsforco(resumoFinal, treino) : null,
      h('p', { class: 'aviso' }, `Calorias: estimativa por MET × peso (${estado.peso} kg) × tempo, pelo Compendium of Physical Activities (Ainsworth et al., 2011); ${programa.mobilidade ? 'alongamento leve vale 2,3 METs' : 'musculação vale 3,5 METs, ou 6,0 se o treino foi pesado'}. O peso se ajusta no aeróbico.`)),
    cartaoAerobico(true),
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
