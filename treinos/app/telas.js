// Primeira abertura, tela inicial e a tela do treino.
'use strict';

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
    ACADEMIA
      ? h('header', { class: 'marca marca-academia' },
        h('img', { src: ACADEMIA.logo, alt: ACADEMIA.nome }),
        h('span', null, ACADEMIA.subtitulo || programa.titulo, h('br'), programa.marca))
      : h('header', { class: 'marca' }, h('h1', null, programa.titulo), h('span', null, programa.marca)),
    cartaoPerfil(),
    cartaoRetroInicio(),
    cartaoBau(),
    cartaoSemana(true),
    cartaoAerobico(),
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
  const falta = i === estado.proximo ? faltaPendente() : null;
  if (falta) extras.push(cartaoFalta(falta));
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

// Faltou um dia: fazer hoje o treino que ficou (recomendado: o volume da semana fica completo)
// ou pular para o seguinte da sequência.
function cartaoFalta(falta) {
  const atual = programa.treinos[estado.proximo];
  const seguinte = programa.treinos[(estado.proximo + 1) % programa.treinos.length];
  const resolver = (pular) => {
    estado.faltaResolvida = falta.data;
    if (pular) {
      estado.proximo = (estado.proximo + 1) % programa.treinos.length;
      selecionado = estado.proximo;
    }
    salvar();
    if (pular) {
      renderInicio();
      avisar(`Pulou para o ${seguinte.titulo}`);
    } else {
      comecar(estado.proximo);
    }
  };
  return h('div', { class: 'falta-aviso' },
    h('p', null, h('strong', null, `Você faltou ${NOMES_DIAS[falta.d] === 'sábado' || NOMES_DIAS[falta.d] === 'domingo' ? 'no' : 'na'} ${NOMES_DIAS[falta.d]}.`),
      ` O ${atual.titulo} ficou para trás. Fazer ele agora mantém todos os músculos com o volume da semana; pular deixa os músculos dele sem esse treino até a volta da sequência.`),
    h('button', { class: 'botao primario', onclick: () => resolver(false) }, `Começar o ${atual.titulo} (recomendado)`),
    h('button', { class: 'botao secundario', onclick: () => resolver(true) }, `Pular para o ${seguinte.titulo}`),
    h('details', null,
      h('summary', null, 'O que dizem os estudos'),
      h('p', null, 'O que mais pesa no crescimento é o total de séries de cada músculo na semana (Pelland et al., 2026); com o mesmo volume, treinar um dia antes ou depois quase não muda o resultado (Schoenfeld, Grgic & Krieger, 2019). Por isso vale fazer o treino que faltou. E faltar um dia não tira o que você ganhou: quem parou 3 semanas inteiras recuperou rápido e cresceu igual a quem não parou (Ogasawara et al., 2013).')));
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
