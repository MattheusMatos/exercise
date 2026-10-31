// Ofensiva, personagem, pontos, bordas, armário do dia e a folha do perfil.
'use strict';

// ---------- ofensiva e personagem ----------

// Programas na ordem da lista: os recomendados para o sexo escolhido, depois a mobilidade
// (para todos) e por fim os do outro sexo, que qualquer pessoa pode escolher.
const ORDEM_NIVEL = { Iniciante: 0, 'Intermediário': 1, 'Avançado': 2 };
function gruposDeProgramas(sexo) {
  const lista = Object.entries(programas).sort(([, a], [, b]) => (ORDEM_NIVEL[a.nivel] ?? 3) - (ORDEM_NIVEL[b.nivel] ?? 3));
  const de = (filtro) => lista.filter(([, p]) => !p.categoria && filtro(p.publico)).map(([id]) => id);
  return [
    ['Recomendados para você', de((x) => x === sexo)],
    ['Para todos', de((x) => x === 'todos')],
    [sexo === 'f' ? 'Outros treinos (sugeridos para homens)' : 'Outros treinos (sugeridos para mulheres)', de((x) => x !== sexo && x !== 'todos')],
    // Métodos conhecidos, para experimentar: cada um abre antes a explicação e o que a ciência diz.
    ['Experimente: outros métodos', Object.entries(programas).filter(([, p]) => p.categoria === 'experimente').map(([id]) => id)],
  ].filter(([, ids]) => ids.length);
}

function opcaoPrograma(id, escolher, atual) {
  const p = programas[id];
  return h('button', {
    class: `opcao-programa${p.metodo ? ' com-metodo' : ''}`,
    'aria-pressed': String(id === atual),
    'data-programa': id,
    onclick: () => (p.metodo ? abrirMetodo(id, escolher) : escolher(id)),
  },
  p.metodo ? h('img', { class: 'metodo-miniatura', src: p.metodo.ilustracao, alt: '' }) : null,
  h('span', { class: `nivel-programa nivel-${(p.nivel || '').normalize('NFD').replace(/[^a-z]/gi, '').toLowerCase()}` }, p.nivel),
  h('strong', null, p.titulo),
  h('span', { class: 'dias-programa' }, `${p.dias} · ${p.treinos.length} treinos`),
  h('span', null, p.resumo),
  p.metodo ? h('span', { class: 'link metodo-saiba' }, 'Ver a história e o que a ciência diz') : null);
}

// A folha de um método da seção Experimente: quem criou, como funciona, prós, contras e o veredito.
function abrirMetodo(id, escolher) {
  const p = programas[id];
  const m = p.metodo;
  const fechar = () => modal.remove();
  const lista = (itens) => h('ul', null, itens.map((x) => h('li', null, x)));
  const caixa = h('div', { class: 'modal-caixa folha metodo-folha' },
    h('figure', { class: 'metodo-arte' }, h('img', { src: m.ilustracao, alt: '' }), h('span', { class: 'metodo-epoca' }, m.epoca)),
    h('p', { class: 'etiqueta' }, 'Experimente'),
    h('h2', null, p.titulo),
    h('p', { class: 'metodo-resumo' }, p.resumo),
    h('h3', null, 'A história'), m.historia.map((x) => h('p', null, x)),
    h('h3', null, 'Como funciona'), lista(m.como),
    h('div', { class: 'metodo-colunas' },
      h('div', { class: 'metodo-pros' }, h('h3', null, 'O que funciona'), lista(m.pros)),
      h('div', { class: 'metodo-contras' }, h('h3', null, 'O que a ciência corrigiu'), lista(m.contras))),
    h('div', { class: 'metodo-veredito' }, h('strong', null, 'Veredito: '), m.veredito),
    h('p', null, h('strong', null, 'Para quem: '), m.paraQuem),
    h('p', { class: 'aviso' }, `${p.dias} · ${p.treinos.length} treinos: ${p.treinos.map((t) => t.titulo.toLowerCase()).join(', ')}.`),
    h('details', { class: 'saiba-mais' }, h('summary', null, 'Referências'), lista(m.referencias)),
    h('p', { class: 'aviso' }, 'Ilustração original, sem retratar ninguém. O app não tem ligação com o criador do método.'),
    h('button', { class: 'botao primario', onclick: () => { fechar(); escolher(id); } }, 'Experimentar este treino'),
    h('button', { class: 'link', onclick: fechar }, 'Voltar'));
  const modal = h('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': p.titulo,
    onclick: (e) => {
      if (e.target === modal) fechar();
    },
  }, caixa);
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      fechar();
    }
  });
  document.body.append(modal);
  caixa.tabIndex = -1;
  caixa.focus();
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
  if (!of.treinouHoje && diasProtegidos().includes(dataLocal(new Date()))) {
    lista = ['Folga protegida, {nome}. A ofensiva está guardada.'];
  } else if (of.treinouHoje) {
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

// Uma carga por exercício por dia (a última digitada vale) e um peso do corpo por dia.
function registrarCarga(ex, kg) {
  const hoje = dataLocal(new Date());
  estado.registroCargas = [...estado.registroCargas.filter((r) => !(r.data === hoje && r.ex === ex)), { data: hoje, ex, kg }].slice(-5000);
}
function registrarPeso(kg) {
  const hoje = dataLocal(new Date());
  estado.pesos = [...estado.pesos.filter((r) => r.data !== hoje), { data: hoje, kg }].slice(-1000);
}

// Peso do corpo, na aba Personagem: vale para as calorias e para a retrospectiva.
function campoPeso() {
  const ultimo = estado.pesos[estado.pesos.length - 1];
  return h('label', { class: 'editar-nome' },
    h('span', { class: 'rotulo' }, 'Seu peso (kg)'),
    h('input', {
      // Texto com teclado numérico: aceita vírgula ("78,5") em qualquer celular.
      class: 'campo-nome', type: 'text', inputmode: 'decimal', autocomplete: 'off',
      placeholder: 'Ex.: 78,5', value: ultimo ? String(ultimo.kg).replace('.', ',') : '',
      onchange: (e) => {
        const kg = Math.round(Number(String(e.target.value).replace(',', '.')) * 10) / 10;
        if (!(kg >= 30 && kg <= 250)) return;
        estado.peso = Math.round(kg);
        registrarPeso(kg);
        salvar();
        avisar(`Peso anotado: ${String(kg).replace('.', ',')} kg`);
      },
    }),
    h('span', { class: 'dica-carga' }, ultimo ? `Último registro: ${dataCurta(ultimo.data)}. Anote de vez em quando para ver a evolução na retrospectiva.` : 'Anote de vez em quando para ver a evolução na retrospectiva.'));
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
const plural = (n, palavra, noPlural) => `${n} ${n === 1 ? palavra : noPlural || `${palavra}s`}`;

function fraseDoHumor(of) {
  const nome = window.Avatar.personagem(estado.perfil.personagem).nome;
  const dias = of.diasSemTreinar;
  if (of.humor === 'novo') return `${nome} está ${window.Avatar.personagem(estado.perfil.personagem).genero === 'f' ? 'pronta' : 'pronto'} para começar. Termine o primeiro treino para acender a ofensiva.`;
  if (of.risco) return 'Treine hoje para não apagar a ofensiva!';
  if (of.treinouHoje) return of.dias >= 3 ? 'Treino de hoje feito. A ofensiva está pegando fogo!' : 'Treino de hoje feito!';
  // Último dia ativo foi um bloqueio: a ofensiva seguiu, mas não houve treino.
  const ultimoTreino = estado.historico.map((x) => x.data).sort().pop() || '';
  const hoje = dataLocal(new Date());
  if (diasProtegidos().includes(hoje) && ultimoTreino !== hoje) return '🧊 Hoje está protegido: a ofensiva não apaga. Descanse e volte com tudo.';
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
// Pontos para gastar: treino e aeróbico, mais os prêmios do armário do dia (pontos e treino em dobro ou
// triplo no dia), mais as apostas ganhas, menos o que foi gasto na loja.
function pontosAtuais() {
  const treinou = new Set(estado.historico.map((x) => x.data));
  const dosBaus = estado.baus.reduce((soma, b) => {
    if (b.premio.tipo === 'pontos') return soma + b.premio.valor;
    if (b.premio.tipo === 'multiplicador' && treinou.has(b.data)) return soma + (b.premio.valor - 1) * window.Aerobico.PONTOS_TREINO;
    return soma;
  }, 0);
  const apostas = estado.apostas.filter((a) => a.status === 'ganha').length * PREMIO_APOSTA;
  const gastos = estado.compras.reduce((soma, c) => soma + c.pontos, 0);
  return window.Aerobico.pontos(estado.historico, estado.aerobicos) + dosBaus + apostas - gastos
    - estado.bloqueios.filter((b) => !b.gratis).length * PRECO_BLOQUEIO;
}

// ---------- bordas da ofensiva ----------

// A borda do cartão do personagem e do card de compartilhar sobe com os dias de ofensiva.
const BORDAS = [
  { id: 'madeira', nome: 'Madeira', icone: '🪵', dias: 3, cores: ['#d9a066', '#8b5a2b', '#5c3a1a'] },
  { id: 'ferro', nome: 'Ferro', icone: '⚙️', dias: 7, cores: ['#d5dae1', '#7b8592', '#3f4650'] },
  { id: 'bronze', nome: 'Bronze', icone: '🥉', dias: 15, cores: ['#f0b27a', '#b06a2c', '#6e3b12'] },
  { id: 'prata', nome: 'Prata', icone: '🥈', dias: 30, cores: ['#ffffff', '#c3cad3', '#7d8794'] },
  { id: 'ouro', nome: 'Ouro', icone: '🥇', dias: 60, cores: ['#fff1a8', '#f2c230', '#a8740c'] },
  { id: 'diamante', nome: 'Diamante', icone: '💎', dias: 100, cores: ['#e6fbff', '#6fd6ff', '#a98bff'] },
];
const bordaDa = (dias) => [...BORDAS].reverse().find((b) => dias >= b.dias) || null;
const proximaBorda = (dias) => BORDAS.find((b) => dias < b.dias) || null;

// Na aba Personagem: a borda de agora e as próximas.
function cartaoBordas(of) {
  const atual = bordaDa(of.dias);
  const proxima = proximaBorda(of.dias);
  return h('div', { class: 'bordas-cartao' },
    h('p', { class: 'rotulo' }, 'Borda da ofensiva'),
    h('p', null, atual ? h('strong', null, `${atual.icone} ${atual.nome}`) : 'Sem borda ainda', proxima ? ` · faltam ${plural(proxima.dias - of.dias, 'dia')} para ${proxima.nome}` : ' · a maior de todas!'),
    h('div', { class: 'bordas-lista' }, BORDAS.map((b) => {
      const el = h('span', { class: `borda-amostra${of.dias >= b.dias ? '' : ' travada'}`, title: `${b.nome}: ${b.dias} dias` },
        h('span', null, b.icone), h('small', null, `${b.dias}d`));
      el.style.setProperty('--b1', b.cores[0]);
      el.style.setProperty('--b2', b.cores[1]);
      el.style.setProperty('--b3', b.cores[2]);
      return el;
    })),
    h('p', { class: 'aviso' }, 'Aparece no cartão do personagem e no card de compartilhar. Se a ofensiva apagar, a borda volta junto com ela.'));
}

// ---------- armário do dia (prêmio por abrir o app) ----------

// Prêmios e chances (somam 100). No armário VIP, a cada 7 dias seguidos abrindo o app, só os melhores.
const PREMIOS = [
  [40, { tipo: 'pontos', valor: 5 }],
  [25, { tipo: 'pontos', valor: 10 }],
  [18, { tipo: 'multiplicador', valor: 2 }],
  [8, { tipo: 'pontos', valor: 20 }],
  [6, { tipo: 'multiplicador', valor: 3 }],
  [3, { tipo: 'bloqueio' }],
];
const PREMIOS_OURO = [
  [40, { tipo: 'multiplicador', valor: 3 }],
  [35, { tipo: 'pontos', valor: 30 }],
  [25, { tipo: 'bloqueio' }],
];
const bauDeHoje = () => estado.baus.find((b) => b.data === dataLocal(new Date())) || null;

// Dias seguidos abrindo o armário, contando hoje se já abriu.
function diasSeguidosDeBau() {
  const datas = new Set(estado.baus.map((b) => b.data));
  const d = new Date();
  if (!datas.has(dataLocal(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (datas.has(dataLocal(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function sortear(lista) {
  let r = Math.random() * 100;
  for (const [chance, premio] of lista) {
    r -= chance;
    if (r < 0) return { ...premio };
  }
  return { ...lista[0][1] };
}

function abrirBau() {
  if (bauDeHoje()) return null;
  const ouro = (diasSeguidosDeBau() + 1) % 7 === 0;
  let premio = sortear(ouro ? PREMIOS_OURO : PREMIOS);
  // Bloqueio além do máximo guardado vira pontos.
  if (premio.tipo === 'bloqueio' && bloqueiosGuardados() >= MAX_BLOQUEIOS) premio = { tipo: 'pontos', valor: ouro ? 30 : 20 };
  const hoje = dataLocal(new Date());
  estado.baus = [...estado.baus, { data: hoje, ouro, premio }].slice(-400);
  if (premio.tipo === 'bloqueio') estado.bloqueios = [...estado.bloqueios, { comprado: hoje, usado: null, gratis: true }];
  salvar();
  return { ouro, premio };
}

function textoDoPremio(p) {
  if (p.tipo === 'pontos') return { titulo: `+${p.valor} pontos`, detalhe: 'Já estão no seu saldo.' };
  if (p.tipo === 'multiplicador') {
    return {
      titulo: `Pontos em ${p.valor === 2 ? 'dobro' : 'triplo'} hoje!`,
      detalhe: `Treine hoje e ganhe ${p.valor * window.Aerobico.PONTOS_TREINO} pontos pelo treino, em vez de ${window.Aerobico.PONTOS_TREINO}.`,
    };
  }
  return { titulo: 'Bloqueio de ofensiva!', detalhe: 'Ficou guardado: protege a ofensiva num dia sem treino.' };
}
const iconeDoPremio = (p) => (p.tipo === 'pontos' ? '⭐' : p.tipo === 'multiplicador' ? (p.valor === 2 ? '⚡' : '🔥') : '🧊');

// Multiplicador de hoje ainda valendo (não treinou ainda).
function multiplicadorDeHoje() {
  const b = bauDeHoje();
  return b && b.premio.tipo === 'multiplicador' ? b.premio.valor : 1;
}

// Na tela inicial: o armário fechado para abrir, ou o que ele deu hoje.
function cartaoBau() {
  const b = bauDeHoje();
  const seguidos = diasSeguidosDeBau();
  if (b) {
    const t = textoDoPremio(b.premio);
    const treinou = estado.historico.some((x) => x.data === b.data);
    if (b.premio.tipo !== 'multiplicador') return null;
    return h('div', { class: 'bau-cartao aberto' },
      h('span', { class: 'bau-icone', 'aria-hidden': 'true' }, iconeDoPremio(b.premio)),
      h('div', null,
        h('strong', null, t.titulo),
        h('span', null, treinou ? `Treino de hoje valeu ${b.premio.valor * window.Aerobico.PONTOS_TREINO} pontos.` : t.detalhe)));
  }
  const ouro = (seguidos + 1) % 7 === 0;
  const diaDaSerie = ((seguidos) % 7) + 1;
  return h('button', { class: `bau-cartao fechado${ouro ? ' ouro' : ''}`, onclick: mostrarBau },
    h('span', { class: 'bau-icone', 'aria-hidden': 'true' }, '🔐'),
    h('div', null,
      h('strong', null, ouro ? 'Armário VIP do dia!' : 'Armário do dia'),
      h('span', null, ouro ? '7 dias seguidos: prêmios melhores. Toque para abrir.'
        : `Toque para abrir. Dia ${diaDaSerie} de 7 seguidos: no 7º, armário VIP.`)));
}

function mostrarBau() {
  const resultado = abrirBau();
  if (!resultado) return;
  const t = textoDoPremio(resultado.premio);
  const fechar = () => {
    modal.remove();
    renderInicio();
  };
  const modal = h('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Armário do dia',
    onclick: (e) => {
      if (e.target === modal) fechar();
    },
  }, h('div', { class: `modal-caixa folha bau-folha${resultado.ouro ? ' ouro' : ''}` },
    h('p', { class: 'rotulo' }, resultado.ouro ? 'Armário VIP' : 'Armário do dia'),
    h('div', { class: 'bau-premio', 'aria-hidden': 'true' }, iconeDoPremio(resultado.premio)),
    h('h2', null, t.titulo),
    h('p', null, t.detalhe),
    h('p', { class: 'aviso' }, `Volte amanhã para abrir de novo. ${plural(diasSeguidosDeBau(), 'dia')} seguido${diasSeguidosDeBau() === 1 ? '' : 's'}.`),
    h('button', { class: 'botao primario', onclick: fechar }, 'Boa!')));
  document.body.append(modal);
  modal.querySelector('.botao').focus();
}

function linhaOfensiva(of, estadoChama) {
  return h('p', { class: `ofensiva ${estadoChama}` },
    iconeChama(estadoChama), h('strong', null, of.dias), h('span', null, of.dias === 1 ? 'dia de ofensiva' : 'dias de ofensiva'));
}

function cartaoPerfil() {
  const of = ofensivaAtual();
  const fase = window.Ofensiva.fase(of);
  const p = window.Avatar.personagem(estado.perfil.personagem);
  const borda = bordaDa(of.dias);
  const secao = h('section', { class: borda ? `perfil com-borda borda-${borda.id}` : 'perfil' },
    h('button', { class: `personagem-palco fase-${fase}`, 'aria-label': `${p.nome}: toque para trocar de personagem`, onclick: () => abrirPerfil('personagem') },
      imagemDoPersonagem(fase)),
    h('div', { class: 'perfil-texto' },
      h('p', { class: 'saudacao' }, fraseMotivacional(of)),
      estado.perfil.nome ? null : h('button', { class: 'link', onclick: () => abrirPerfil('personagem') }, 'Como quer ser chamado?'),
      h('p', { class: 'personagem-nome' }, h('strong', null, p.nome), h('span', null, window.Avatar.rotuloDaFase(p.id, fase))),
      linhaOfensiva(of, estadoDaChama(of)),
      h('p', { class: 'humor-texto' }, fraseDoHumor(of)),
      of.risco && bloqueiosGuardados() && !hojeProtegido()
        ? h('button', {
          class: 'link usar-bloqueio',
          onclick: () => {
            if (usarBloqueioHoje()) {
              avisar('🧊 Bloqueio usado hoje: a ofensiva está protegida.');
              renderInicio();
            }
          },
        }, `Não vai dar hoje? Usar um bloqueio 🧊 (${bloqueiosGuardados()} guardado${bloqueiosGuardados() === 1 ? '' : 's'})`)
        : null,
      reparoDisponivel() ? h('button', { class: 'link usar-bloqueio', onclick: () => abrirPerfil('loja') }, `🔧 A ofensiva apagou: dá para reparar na Loja`) : null,
      h('p', { class: 'nivel' }, textoDoNivel(of), ' · ', h('button', { class: 'pontos', onclick: () => abrirPerfil('loja') }, `⭐ ${plural(pontosAtuais(), 'ponto')}`),
        bloqueiosGuardados() ? h('span', { class: 'bloqueio-mini', title: 'Bloqueios de ofensiva guardados' }, ` · 🧊 ${bloqueiosGuardados()}`) : null),
      h('button', { class: 'link', onclick: () => abrirPerfil('treino') }, 'Trocar treino')),
    borda ? h('span', { class: 'selo-borda', title: `Ofensiva ${borda.nome}: ${borda.dias}+ dias` }, `${borda.icone} ${borda.nome}`) : null);
  if (borda) {
    secao.style.setProperty('--b1', borda.cores[0]);
    secao.style.setProperty('--b2', borda.cores[1]);
    secao.style.setProperty('--b3', borda.cores[2]);
  }
  return secao;
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
  let abaAtual = ['treino', 'loja'].includes(aba) ? aba : 'personagem';
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
      cartaoMeuTreino(() => {
        fechar();
        abrirMontador();
      }),
      estado.meuTreino && programas.meu && estado.perfil.programa !== 'meu'
        ? h('button', { class: 'link usar-meu', onclick: () => escolherPrograma('meu') }, 'Usar o Meu treino')
        : null,
      listaDeProgramas(estado.perfil.sexo, escolherPrograma, estado.perfil.programa),
    ];
  }
  function abaPersonagem() {
    return [
      campoNome(),
      campoPeso(),
      cartaoRetrospectivas(),
      linhaOfensiva(of, estadoDaChama(of)),
      h('p', null, `Recorde: ${plural(of.recorde, 'dia')}. ${textoDoNivel(of)}.`),
      cartaoBordas(of),
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
    const abas = [['treino', 'Treino'], ['personagem', 'Personagem'], ['loja', 'Loja']];
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
        abaAtual === 'treino' ? abaTreino() : abaAtual === 'loja' ? abaLoja(desenhar) : abaPersonagem()),
      h('button', { class: 'link', onclick: fechar }, 'Fechar'),
    ].flat(Infinity).filter(Boolean));
  }
  desenhar();
  document.body.append(modal);
  caixa.querySelector('[role="tab"][aria-selected="true"]').focus();
}
