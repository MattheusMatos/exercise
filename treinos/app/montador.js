// Meu treino: a pessoa monta a própria divisão com exercícios da biblioteca, e o app avalia
// enquanto ela monta (volume, frequência, equilíbrio, ordem) e sugere o que incluir em cada dia.
// As contas ficam em avaliacao.js; aqui ficam a tela e o programa montado.
'use strict';

// ---------- meu treino ----------

const REPS_MEU = ['4–6', '6–10', '8–12', '10–15', '12–20'];
const DESCANSO_MEU = (item) => (item.mecanica === 'composto' ? '2–3 min' : '1–2 min');
const exercicioMeu = (item) => ({ id: item.id, ...prescricaoPadrao(item), descanso: DESCANSO_MEU(item) });

// O programa "meu" no mesmo formato dos programas do app, montado a partir da biblioteca.
function montarProgramaMeu(meu) {
  if (!biblioteca || !meu) return null;
  const A = window.Avaliacao;
  const treinos = meu.treinos.map((t, i) => {
    const vistos = new Set();
    const exercicios = t.exercicios.map((x) => [biblioteca.porId.get(x.id), x]).filter(([item]) => item).map(([item, x]) => {
      const g = A.gruposDoItem(item);
      // Aquecimento só no primeiro exercício que pega um grupo ainda não trabalhado no dia.
      const aquecimento = g.primarios.some((p) => !vistos.has(p));
      [...g.primarios, ...g.secundarios].forEach((p) => vistos.add(p));
      return {
        nome: item.nome, imagem: item.id, k: item.k,
        series: x.series, reps: x.reps, rir: x.rir, descanso: x.descanso,
        primarios: item.musculos.map(rotuloMusculo), secundarios: item.auxiliares.map(rotuloMusculo),
        dicas: item.passos, porque: null, evidencia: null,
        ...(aquecimento ? { aquecimento: true } : {}),
      };
    });
    const foco = [...new Set(t.exercicios.map((x) => biblioteca.porId.get(x.id)).filter(Boolean)
      .flatMap((item) => A.gruposDoItem(item).primarios))].slice(0, 3)
      .map((id) => A.GRUPOS.find((g) => g.id === id).nome).join(', ');
    return { id: `meu_${i + 1}`, titulo: t.titulo, foco: foco || 'Montado por você', duracao: `~${A.duracao(exercicios)} min`, extras: [], exercicios };
  });
  return {
    nome: 'Montado por você', titulo: 'Meu treino', marca: A.DIVISOES[meu.divisao].nome,
    publico: 'todos', nivel: 'Personalizado', categoria: 'meu', semVideo: true,
    dias: `${meu.dias} dias por semana`, opcoesDias: [2, 3, 4, 5, 6],
    resumo: `${A.DIVISOES[meu.divisao].nome}, ${meu.treinos.length} treinos montados por você.`,
    regras: ['Montado por você, com a avaliação do app'],
    progressao: 'Completou todas as séries no topo da faixa de repetições? Aumente a carga em 2,5–5% na próxima sessão.',
    treinos,
  };
}

function cartaoMeuTreino(aoAbrir) {
  const meu = estado.meuTreino;
  return h('div', { class: 'meu-treino-cartao' },
    h('div', null,
      h('strong', null, meu ? 'Meu treino' : 'Monte seu próprio treino'),
      h('span', null, meu
        ? `${window.Avaliacao.DIVISOES[meu.divisao].nome} · ${meu.treinos.length} treinos${estado.perfil.programa === 'meu' ? ' · em uso' : ''}`
        : 'Escolha os exercícios de cada dia; o app avalia o volume, a frequência e o equilíbrio e sugere o que falta.')),
    h('button', { class: 'botao primario', onclick: aoAbrir }, meu ? 'Editar' : 'Montar'));
}

const copiaMeu = (m) => JSON.parse(JSON.stringify(m));

function abrirMontador() {
  const A = window.Avaliacao;
  let rascunho = estado.meuTreino ? copiaMeu(estado.meuTreino) : null;
  let atual = 0;
  let escolhendo = false; // a lista de exercícios para adicionar
  let busca = '';
  let filtro = null;
  const el = h('div', { class: 'montador', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Monte seu treino' });
  const fechar = () => el.remove();
  const preferidos = new Set(Object.values(programas).filter((p) => p.categoria !== 'meu')
    .flatMap((p) => p.treinos.flatMap((t) => t.exercicios.map((e) => e.imagem))));
  const doRascunho = () => rascunho.treinos.map((t) => ({
    titulo: t.titulo,
    exercicios: t.exercicios.map((x) => ({ item: biblioteca.porId.get(x.id), series: x.series })).filter((x) => x.item),
  }));

  function escolherDivisao(id) {
    const d = A.DIVISOES[id];
    const antigos = rascunho ? rascunho.treinos : [];
    // Troca de divisão mantém os exercícios já escolhidos, na mesma ordem dos treinos.
    rascunho = {
      divisao: id,
      dias: rascunho ? rascunho.dias : d.dias,
      treinos: d.treinos.map(([titulo, foco], i) => ({ titulo, foco, exercicios: antigos[i] ? antigos[i].exercicios : [] })),
    };
    if (!estado.meuTreino) rascunho.dias = d.dias;
    atual = 0;
    desenhar();
  }

  function adicionar(item) {
    const t = rascunho.treinos[atual];
    if (t.exercicios.length >= 12) {
      avisar('Até 12 exercícios por treino');
      return;
    }
    if (t.exercicios.some((x) => x.id === item.id)) {
      avisar('Este exercício já está no treino');
      return;
    }
    t.exercicios.push(exercicioMeu(item));
    escolhendo = false;
    desenhar();
    avisar(`${item.nome} no ${t.titulo}`);
  }

  function salvarMeu() {
    if (rascunho.treinos.some((t) => !t.exercicios.length)) {
      avisar('Todo treino precisa de pelo menos 1 exercício');
      return;
    }
    const emUso = estado.perfil.programa === 'meu';
    estado.meuTreino = copiaMeu(rascunho);
    // As trocas e extras do Meu treino antigo apontam para lugares que podem ter mudado.
    for (const chave of ['trocas', 'extras', 'extrasProximo', 'ajustes']) {
      estado[chave] = Object.fromEntries(Object.entries(estado[chave]).filter(([id]) => !id.startsWith('meu_')));
    }
    programas.meu = montarProgramaMeu(estado.meuTreino);
    fechar();
    if (emUso) {
      if (estado.sessao) {
        estado.sessao = null;
        pararDescanso();
      }
      estado.proximo = Math.min(estado.proximo, programas.meu.treinos.length - 1);
      programa = programas.meu;
      selecionado = estado.proximo;
      salvar();
      renderInicio();
      avisar('Meu treino atualizado');
    } else {
      salvar();
      trocarPrograma('meu');
    }
  }

  function telaDivisao() {
    return [
      h('h2', null, 'Como você quer dividir a semana?'),
      h('p', null, 'Escolha uma divisão para começar; dá para mudar o nome dos treinos e os exercícios depois.'),
      h('div', { class: 'opcoes-divisao' }, Object.entries(A.DIVISOES).map(([id, d]) => h('button', {
        class: 'opcao-divisao', 'data-divisao': id, 'aria-pressed': String(rascunho && rascunho.divisao === id),
        onclick: () => escolherDivisao(id),
      }, h('strong', null, d.nome),
      h('span', null, id === 'livre' ? 'Você cria os treinos, de 1 a 6' : `${d.treinos.map(([t]) => nomeDoTreino(t)).join(' · ')} · ${d.dias} dias por semana`)))),
      rascunho ? h('button', { class: 'link', onclick: () => { escolhendo = false; desenharEditor(); } }, 'Voltar sem mudar') : null,
    ];
  }

  function linhaExercicio(x, k, t) {
    const item = biblioteca.porId.get(x.id);
    if (!item) return null;
    const mudar = (f) => () => {
      f();
      desenhar();
    };
    return h('li', { class: 'meu-exercicio' },
      miniatura({ k: item.k, imagem: item.id }),
      h('div', { class: 'meu-exercicio-texto' },
        h('strong', null, item.nome),
        h('span', null, rotuloMusculo(item.musculos[0] || '')),
        h('div', { class: 'meu-controles' },
          h('button', { class: 'passo', 'aria-label': 'Menos 1 série', disabled: x.series <= 1, onclick: mudar(() => { x.series -= 1; }) }, '−'),
          h('span', { class: 'meu-series' }, `${x.series} ${x.series === 1 ? 'série' : 'séries'}`),
          h('button', { class: 'passo', 'aria-label': 'Mais 1 série', disabled: x.series >= 10, onclick: mudar(() => { x.series += 1; }) }, '+'),
          h('select', {
            'aria-label': 'Repetições',
            onchange: (e) => {
              x.reps = e.target.value;
              desenhar();
            },
          }, [...new Set([...REPS_MEU, x.reps])].map((r) => h('option', { value: r, selected: r === x.reps }, `${r} reps`))))),
      h('div', { class: 'meu-ordem' },
        h('button', { class: 'passo', 'aria-label': 'Subir', disabled: k === 0, onclick: mudar(() => { t.exercicios.splice(k - 1, 0, t.exercicios.splice(k, 1)[0]); }) }, '↑'),
        h('button', { class: 'passo', 'aria-label': 'Descer', disabled: k === t.exercicios.length - 1, onclick: mudar(() => { t.exercicios.splice(k + 1, 0, t.exercicios.splice(k, 1)[0]); }) }, '↓'),
        h('button', { class: 'passo remover', 'aria-label': `Tirar ${item.nome}`, onclick: mudar(() => { t.exercicios.splice(k, 1); }) }, '✕')));
  }

  function painelAvaliacao(r) {
    const icone = { erro: '⛔', atencao: '⚠️', dica: '💡', bom: '✅' };
    const grupos = r.grupos.filter((g) => g.grande || g.semana > 0);
    return h('section', { class: 'avaliacao' },
      h('h3', null, 'Avaliação da semana'),
      h('p', { class: 'aviso' }, `Com ${rascunho.dias} dias por semana, cada treino é feito ${String(Math.round(r.vezesPorSemana * 10) / 10).replace('.', ',')} vez${r.vezesPorSemana >= 1.5 ? 'es' : ''} por semana. Séries por músculo na semana (o auxiliar conta meia); o ideal fica entre ${A.IDEAL_MIN} e ${A.IDEAL_MAX}.`),
      h('ul', { class: 'barras-volume' }, grupos.map((g) => {
        const faixa = g.semana === 0 ? 'zero' : g.semana < A.IDEAL_MIN ? 'baixo' : g.semana > A.IDEAL_MAX + 4 ? 'alto' : 'ideal';
        return h('li', { class: `faixa-${faixa}` },
          h('span', { class: 'barra-nome' }, g.nome),
          h('span', { class: 'barra-trilho' },
            h('i', { class: 'barra-ideal', style: `left: ${(A.IDEAL_MIN / 30) * 100}%; width: ${((A.IDEAL_MAX - A.IDEAL_MIN) / 30) * 100}%` }),
            h('i', { class: 'barra-valor', style: `width: ${Math.min(100, (g.semana / 30) * 100)}%` })),
          h('span', { class: 'barra-numero' }, String(g.semana).replace('.', ',')));
      })),
      h('ul', { class: 'avisos-avaliacao' }, r.avisos.map((a) => h('li', { class: `aviso-${a.nivel}` },
        h('span', { 'aria-hidden': 'true' }, icone[a.nivel]), h('span', null, a.texto)))),
      h('p', { class: 'aviso' }, 'Base: volume e frequência (Schoenfeld et al., 2016 e 2017; Pelland et al., 2026), detalhados na análise do app.'));
  }

  function telaEscolher() {
    const t = rascunho.treinos[atual];
    const termo = semAcento(busca.trim());
    const grupo = filtro && A.GRUPOS.find((g) => g.id === filtro);
    const achados = biblioteca.itens
      .filter((e) => (!termo || e.busca.includes(termo)) && (!grupo || e.musculos.some((m) => grupo.musculos.includes(m))))
      .sort((a, b) => (preferidos.has(b.id) ? 1 : 0) - (preferidos.has(a.id) ? 1 : 0) || (a.incomum ? 1 : 0) - (b.incomum ? 1 : 0))
      .slice(0, LIMITE_LISTA);
    const campo = h('input', {
      type: 'search', class: 'busca-meu', placeholder: 'Buscar exercício', value: busca, 'aria-label': 'Buscar exercício',
      oninput: (e) => {
        busca = e.target.value;
        desenhar();
        const novo = el.querySelector('.busca-meu');
        novo.focus();
        novo.setSelectionRange(novo.value.length, novo.value.length);
      },
    });
    return [
      h('h2', null, `Adicionar ao ${t.titulo}`),
      campo,
      h('div', { class: 'filtros-meu', role: 'group', 'aria-label': 'Músculo' }, A.GRUPOS.map((g) => h('button', {
        'aria-pressed': String(filtro === g.id),
        onclick: () => {
          filtro = filtro === g.id ? null : g.id;
          desenhar();
        },
      }, g.nome))),
      h('ul', { class: 'lista-meu' }, achados.map((e) => h('li', null, h('button', { class: 'item-meu', onclick: () => adicionar(e) },
        miniatura({ k: e.k, imagem: e.id }),
        h('span', null, h('strong', null, e.nome), h('span', null, `${rotuloMusculo(e.musculos[0] || '')} · ${MECANICAS[e.mecanica] || ''}`)),
        h('span', { class: 'mais', 'aria-hidden': 'true' }, '+'))))),
      achados.length ? null : h('p', { class: 'aviso' }, 'Nada encontrado.'),
      h('button', { class: 'link', onclick: () => { escolhendo = false; desenhar(); } }, 'Voltar ao treino'),
    ];
  }

  function telaEditor() {
    const t = rascunho.treinos[atual];
    const r = A.avaliar(doRascunho(), rascunho.dias);
    const sug = A.sugestoes(doRascunho()[atual], t.foco.length ? t.foco : A.GRUPOS.map((g) => g.id), r, biblioteca.itens, preferidos, 4);
    const livre = rascunho.divisao === 'livre';
    return [
      h('div', { class: 'meu-topo' },
        h('div', null, h('p', { class: 'rotulo' }, 'Divisão'), h('strong', null, A.DIVISOES[rascunho.divisao].nome)),
        h('button', { class: 'link', onclick: () => { rascunho.divisaoTrocando = true; desenhar(); } }, 'Mudar divisão')),
      h('div', { class: 'meu-dias' }, h('span', { class: 'rotulo' }, 'Dias por semana'),
        h('div', { class: 'opcoes-meu-dias', role: 'group', 'aria-label': 'Dias por semana' }, [2, 3, 4, 5, 6].map((n) => h('button', {
          'aria-pressed': String(rascunho.dias === n),
          onclick: () => {
            rascunho.dias = n;
            desenhar();
          },
        }, n)))),
      h('div', { class: 'abas-meu', role: 'tablist', 'aria-label': 'Treinos' },
        rascunho.treinos.map((x, i) => h('button', {
          role: 'tab', 'aria-selected': String(i === atual), class: x.exercicios.length ? '' : 'vazio',
          onclick: () => {
            atual = i;
            desenhar();
          },
        }, nomeDoTreino(x.titulo))),
        livre && rascunho.treinos.length < 6 ? h('button', {
          class: 'novo-treino', 'aria-label': 'Novo treino',
          onclick: () => {
            rascunho.treinos.push({ titulo: `TREINO ${'ABCDEF'[rascunho.treinos.length]}`, foco: A.GRUPOS.map((g) => g.id), exercicios: [] });
            atual = rascunho.treinos.length - 1;
            desenhar();
          },
        }, '+') : null),
      h('div', { class: 'meu-treino-nome' },
        h('input', {
          type: 'text', value: t.titulo, maxlength: '30', 'aria-label': 'Nome do treino',
          onchange: (e) => {
            t.titulo = e.target.value.replace(/\s+/g, ' ').trim().toUpperCase().slice(0, 30) || t.titulo;
            desenhar();
          },
        }),
        h('span', null, `${t.exercicios.reduce((s, x) => s + x.series, 0)} séries · ~${A.duracao(t.exercicios)} min`),
        livre && rascunho.treinos.length > 1 ? h('button', {
          class: 'link',
          onclick: () => {
            rascunho.treinos.splice(atual, 1);
            atual = Math.max(0, atual - 1);
            desenhar();
          },
        }, 'Apagar treino') : null),
      t.exercicios.length
        ? h('ol', { class: 'lista-meu-treino' }, t.exercicios.map((x, k) => linhaExercicio(x, k, t)))
        : h('p', { class: 'aviso' }, 'Nenhum exercício ainda. Adicione da biblioteca ou use as sugestões abaixo.'),
      h('button', { class: 'botao secundario adicionar-meu', icone: 'mais', onclick: () => { escolhendo = true; busca = ''; desenhar(); } }, 'Adicionar exercício'),
      sug.length ? h('section', { class: 'sugestoes-meu' },
        h('h3', null, `Sugestões para o ${nomeDoTreino(t.titulo)}`),
        h('ul', null, sug.map((s) => h('li', null,
          miniatura({ k: s.item.k, imagem: s.item.id }),
          h('span', null, h('strong', null, s.item.nome), h('span', null, s.motivo)),
          h('button', { class: 'botao secundario', 'aria-label': `Adicionar ${s.item.nome}`, onclick: () => adicionar(s.item) }, '+'))))) : null,
      painelAvaliacao(r),
    ];
  }

  function desenharEditor() {
    if (rascunho) delete rascunho.divisaoTrocando;
    desenhar();
  }

  function desenhar() {
    let corpo;
    if (!biblioteca) {
      corpo = [h('p', { class: 'carregando' }, 'Carregando a biblioteca de exercícios…')];
      carregarBiblioteca().then(() => {
        if (el.isConnected) desenhar();
      });
    } else if (!rascunho || rascunho.divisaoTrocando) corpo = telaDivisao();
    else if (escolhendo) corpo = telaEscolher();
    else corpo = telaEditor();
    const pronto = rascunho && biblioteca && !escolhendo && !rascunho.divisaoTrocando;
    el.replaceChildren(
      h('header', { class: 'montador-topo' },
        h('button', { class: 'icone-botao', icone: 'fechar', 'aria-label': 'Fechar sem salvar', onclick: fechar }),
        h('strong', null, 'Monte seu treino')),
      h('div', { class: 'montador-corpo' }, corpo),
      pronto ? h('footer', { class: 'montador-rodape' },
        h('button', { class: 'botao primario', onclick: salvarMeu }, estado.perfil.programa === 'meu' ? 'Salvar' : 'Salvar e usar este treino')) : null);
  }

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (escolhendo) {
        escolhendo = false;
        desenhar();
      } else fechar();
    }
  });
  desenhar();
  document.body.append(el);
}
