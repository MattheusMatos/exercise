// Treino PPL. O app fica dividido nos arquivos de treinos/app/, carregados em ordem pelo index.html
// como scripts comuns (não módulos). Scripts comuns dividem o mesmo escopo global: uma função ou
// variável declarada num arquivo é vista nos outros. Por isso, nada de nomes repetidos entre os
// arquivos. Ao carregar, os outros só declaram (e registram eventos); quem começa o app é o inicio.js,
// o último.
//
// Constantes, o estado em memória e as utilidades usadas em todo o app (h() para montar a tela, datas, avisos).
'use strict';

// Versão de uma academia (ver academias/): a página dela define window.ACADEMIA antes dos scripts.
// Cada academia guarda os dados numa chave própria, separada da do Treino PPL, e não instala o
// service worker (que é do Treino PPL). Sem window.ACADEMIA, o app é o Treino PPL de sempre.
const ACADEMIA = window.ACADEMIA && /^[a-z0-9-]+$/.test(window.ACADEMIA.id) ? window.ACADEMIA : null;
const CHAVE_ESTADO = ACADEMIA ? `${ACADEMIA.id}:estado` : 'ppl:estado';
const LIMIAR_ARRASTE = 110; // px para o cartão sair
const LIMITE_LISTA = 60; // resultados por página na biblioteca
const app = document.getElementById('app');
const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

const ICONES = {
  compartilhar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  voltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  desfazer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5L4 9l4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10a5 5 0 0 1 0 10h-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  depois: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  feito: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trocar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  mais: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  fechar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  sino: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const LETRAS_DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
// Dias sugeridos para cada meta semanal (0 = domingo). Com 3 ou 4, um dia de folga entre os treinos quando dá.
const DIAS_SUGERIDOS = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] };

// Grupos usados no filtro da biblioteca.
const MUSCULOS = {
  peito: 'Peito', ombros: 'Ombros', triceps: 'Tríceps', dorsais: 'Dorsais', 'meio-das-costas': 'Meio das costas',
  trapezio: 'Trapézio', biceps: 'Bíceps', antebracos: 'Antebraços', quadriceps: 'Quadríceps',
  isquiotibiais: 'Posteriores de coxa', gluteos: 'Glúteos', adutores: 'Adutores', abdutores: 'Abdutores',
  panturrilhas: 'Panturrilhas', abdominais: 'Abdômen', 'inferior-das-costas': 'Lombar', pescoco: 'Pescoço',
};
// A biblioteca separa o deltoide pelo padrão de movimento; no filtro, todos contam como ombros.
const DELTOIDES = { 'deltoide-anterior': 'Deltoide anterior', 'deltoide-lateral': 'Deltoide lateral', 'deltoide-posterior': 'Deltoide posterior' };
const MECANICAS = { composto: 'multiarticular', isolado: 'isolado' };
const EQUIPAMENTOS = {
  barra: 'Barra', 'barra-w': 'Barra W', halteres: 'Halteres', cabo: 'Cabo', maquina: 'Máquina',
  'peso-do-corpo': 'Peso do corpo', kettlebell: 'Kettlebell', faixas: 'Elástico', 'bola-medicinal': 'Bola medicinal',
  'bola-de-exercicio': 'Bola suíça', 'rolo-de-espuma': 'Rolo de espuma', outros: 'Outros',
};
const NIVEIS = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };
// O que sustenta cada motivo do programa (campo "evidencia" de programa_ppl.json).
const EVIDENCIAS = {
  crescimento: ['Estudo de crescimento', 'um estudo mediu o músculo crescendo'],
  ativacao: ['Estudo de ativação', 'só mediu o quanto o músculo trabalha no exercício'],
  'nao-testado': ['Princípios gerais', 'nenhum estudo mediu o crescimento com este exercício em si; ele trabalha o músculo com carga, amplitude e perto da falha, o que faz qualquer músculo crescer'],
};

// Avatar de menina usa o treino com foco em pernas e glúteo; o de menino, o PPL.
// "masculino" e "feminino" são os ids dos dois primeiros programas, guardados assim desde a primeira versão.
const ARQUIVOS_PROGRAMA = {
  masculino: 'programa_ppl.json',
  feminino: 'programa_feminino.json',
  iniciante_m: 'programa_iniciante_m.json',
  avancado_m: 'programa_avancado_m.json',
  iniciante_f: 'programa_iniciante_f.json',
  avancado_f: 'programa_avancado_f.json',
  mobilidade: 'programa_mobilidade.json',
  mentzer_classico: 'programa_mentzer_classico.json',
  mentzer_moderno: 'programa_mentzer_moderno.json',
};
let programas = {};
let programa = null; // o do avatar escolhido
let biblioteca = null; // { itens, porId }
let estado = {
  proximo: 0, proximos: {}, sessao: null, trocas: {}, plano: null, planos: {}, historico: [], extras: {},
  aerobicos: [], cronoAerobico: null, peso: 70, cargas: {}, ajustes: {}, extrasProximo: {}, bloqueios: [], baus: [],
  compras: [], apostas: [], estiloCard: 'laranja', registroCargas: [], pesos: [],
  perfil: { personagem: 'brutus', programa: 'masculino', sexo: null, nome: '', configurado: false }, atualizado: 0,
};
let tela = 'inicio';
let selecionado = 0;
let resumoFinal = null;
let descanso = null; // { fim, total, proxima, avisado, intervalo, esconder, variante }
let descansoMinimizado = false; // o descanso abre em tela cheia; dá para reduzir a uma barra
let audio = null;
let travaTela = null;
let bib = null; // estado da tela da biblioteca enquanto aberta
let esperaAviso = null;
let contadorDescansos = 0;

// ---------- utilidades ----------

function ler(chave, padrao) {
  try {
    const valor = localStorage.getItem(chave);
    return valor === null ? padrao : JSON.parse(valor);
  } catch (e) {
    return padrao;
  }
}

function gravar(chave, valor) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, JSON.stringify(valor));
  } catch (e) {
    // Sem armazenamento (aba anônima, por exemplo): o app funciona, só não lembra.
  }
}

function h(tag, props, ...filhos) {
  const el = document.createElement(tag);
  for (const [chave, valor] of Object.entries(props || {})) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (chave === 'class') el.className = valor;
    else if (chave === 'icone') el.innerHTML = ICONES[valor];
    else if (chave.startsWith('on')) el.addEventListener(chave.slice(2), valor);
    else el.setAttribute(chave, valor === true ? '' : valor);
  }
  for (const filho of filhos.flat(Infinity)) {
    if (filho === null || filho === undefined || filho === false) continue;
    el.append(filho instanceof Node ? filho : String(filho));
  }
  return el;
}

const totalSeries = (treino) => treino.exercicios.reduce((soma, ex) => soma + ex.series, 0);
const doisDigitos = (n) => String(n).padStart(2, '0');
const semAcento = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rotuloMusculo = (m) => DELTOIDES[m] || MUSCULOS[m] || m;
const grupoMuscular = (m) => (DELTOIDES[m] ? 'ombros' : m);
const rotuloEquipamento = (e) => EQUIPAMENTOS[e] || 'Sem equipamento';
const maiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// De vermelho (pouco parecido) a verde (muito parecido); abaixo de 30% é vermelho, acima de 90% é verde.
function corSemelhanca(porcentagem) {
  const t = Math.min(1, Math.max(0, (porcentagem - 30) / 60));
  return `hsl(${Math.round(t * 130)} 70% 58%)`;
}

function seloSemelhanca(porcentagem, classe) {
  const selo = h('span', { class: `selo ${classe || ''}`, title: 'Semelhança com o exercício original' }, `${porcentagem}%`);
  selo.style.backgroundColor = corSemelhanca(porcentagem);
  return selo;
}

// Motivo do exercício com a etiqueta da base. Sem estudo próprio não quer dizer sem efeito.
function blocoPorque(ex) {
  if (!ex.porque) return null;
  return [
    h('div', { class: 'porque-topo' }, h('p', { class: 'rotulo' }, 'Por quê'), seloEvidencia(ex.evidencia)),
    h('p', { class: 'porque' }, ex.porque),
    ex.evidencia === 'nao-testado' && !programa.mobilidade
      ? h('p', { class: 'nota-evidencia' }, 'Funciona? Sim: o músculo cresce com séries perto da falha (Robinson et al., 2024) e com mais séries na semana (Pelland et al., 2026), em qualquer exercício que o trabalhe com carga. O que falta é um estudo comparando este exercício com outro.')
      : null,
  ];
}

function seloEvidencia(tipo) {
  return EVIDENCIAS[tipo] ? h('span', { class: `evidencia ${tipo}` }, EVIDENCIAS[tipo][0]) : null;
}

function legendaEvidencias() {
  return h('ul', { class: 'legenda-evidencia' },
    Object.entries(EVIDENCIAS).map(([tipo, [, descricao]]) => h('li', null, seloEvidencia(tipo), descricao)));
}

// "2–3 min" vira 150 s e "15 s" vira 15 s.
function segundosDescanso(texto) {
  const numeros = (String(texto).match(/\d+/g) || []).map(Number);
  if (!numeros.length) return 90;
  const media = numeros.length > 1 ? (numeros[0] + numeros[1]) / 2 : numeros[0];
  return Math.round(/\bs\b/.test(texto) && !/min/.test(texto) ? media : media * 60);
}

// Descanso do cartão, com os segundos a mais pedidos no fim do último treino igual.
function descansoComAjuste(texto) {
  const extra = estado.sessao ? estado.sessao.ajuste.descanso : 0;
  return extra ? `${texto} + ${extra} s` : texto;
}

function relogio(segundos) {
  const s = Math.max(0, Math.ceil(segundos));
  return `${Math.floor(s / 60)}:${doisDigitos(s % 60)}`;
}

// Datas pelo relógio do celular; a semana começa no domingo.
const dataLocal = (d) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

function diasDaSemanaAtual() {
  const hoje = new Date();
  return Array.from({ length: 7 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + i));
}

const semanaAtual = () => dataLocal(diasDaSemanaAtual()[0]);
const todosOsTreinos = () => Object.values(programas).flatMap((p) => p.treinos);
// O histórico guarda treinos dos dois programas.
const tituloDoTreino = (id) => (todosOsTreinos().find((t) => t.id === id) || { titulo: '' }).titulo;
// "PUSH A" vira "Push A".
const nomeDoTreino = (titulo) => titulo.split(' ').map((p) => (p.length > 1 ? p.charAt(0) + p.slice(1).toLowerCase() : p)).join(' ');

function avisar(texto) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = h('div', { class: 'toast', role: 'status' });
    document.body.append(el);
  }
  el.textContent = texto;
  el.hidden = false;
  clearTimeout(esperaAviso);
  esperaAviso = setTimeout(() => {
    el.hidden = true;
  }, 2200);
}
