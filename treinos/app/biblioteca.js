// Exercícios do treino, trocas, extras e a biblioteca de exercícios.
'use strict';

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
  if (!item) return { ...base, trocado: false, k: base.k ?? null, semelhanca: null };
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

// Carrega uma vez; quem precisa dela antes de seguir (o Meu treino) espera a promessa.
let carregandoBiblioteca = null;
function carregarBiblioteca() {
  if (carregandoBiblioteca) return carregandoBiblioteca;
  carregandoBiblioteca = fetch('biblioteca/exercicios.json')
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
      if (estado.meuTreino) programas.meu = montarProgramaMeu(estado.meuTreino);
      if (!programa) return; // ainda abrindo o app
      if (tela === 'inicio') renderInicio();
      else if (tela === 'treino' && estado.sessao) montarPilha(app.querySelector('.pilha'), false);
    })
    .catch(() => {
      biblioteca = null; // o treino segue normal, só sem a troca de exercícios
      carregandoBiblioteca = null;
    });
  return carregandoBiblioteca;
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
