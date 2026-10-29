// O cartão de cada exercício: técnicas avançadas, aquecimento e carga.
'use strict';

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
      type: 'text', inputmode: 'decimal', autocomplete: 'off', value: String(valor).replace('.', ','), placeholder: '0',
      'aria-label': `Carga de ${ex.nome}, em kg`,
      onchange: (e) => {
        const kg = arredondarCarga(Number(String(e.target.value).replace(',', '.')));
        if (!Number.isFinite(kg) || kg < 0 || kg > 1000 || e.target.value === '') return;
        estado.sessao.cargas[i] = kg;
        estado.cargas[ex.imagem] = { kg, data: dataLocal(new Date()) };
        registrarCarga(ex.imagem, kg);
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
