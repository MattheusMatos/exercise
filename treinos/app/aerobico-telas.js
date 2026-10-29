// O aeróbico depois do treino e o cronômetro em tela cheia (as contas ficam em aerobico.js).
'use strict';

// ---------- aeróbico ----------

const aerobicosDeHoje = () => estado.aerobicos.filter((a) => a.data === dataLocal(new Date()));
const minutosNaSemana = () => {
  const dias = new Set(diasDaSemanaAtual().map(dataLocal));
  return estado.aerobicos.filter((a) => dias.has(a.data)).reduce((soma, a) => soma + a.minutos, 0);
};

function registrarAerobico(tipo, minutos) {
  const hoje = dataLocal(new Date());
  const antes = window.Aerobico.pontosDoAerobico(window.Aerobico.minutosDoDia(estado.aerobicos, hoje));
  estado.aerobicos = [...estado.aerobicos, { data: hoje, tipo, minutos }].slice(-1500);
  salvar();
  // Pontos só contam em dia de treino, até 30 min somados no dia.
  const treinou = estado.historico.some((x) => x.data === hoje);
  return treinou ? window.Aerobico.pontosDoAerobico(window.Aerobico.minutosDoDia(estado.aerobicos, hoje)) - antes : 0;
}

// No fim do treino: convite para somar aeróbico, ou o aeróbico já feito hoje.
function cartaoAerobico() {
  const feitos = aerobicosDeHoje();
  if (feitos.length) {
    const minutos = feitos.reduce((soma, a) => soma + a.minutos, 0);
    const m = window.Aerobico.modalidade(feitos[feitos.length - 1].tipo);
    const kcal = feitos.reduce((soma, a) => soma + window.Aerobico.calorias(a.tipo, a.minutos, estado.peso), 0);
    return h('article', { class: 'aerobico-cartao feito' },
      h('img', { src: `fotos/${m.imagem}-0.jpg`, alt: '' }),
      h('div', null,
        h('p', { class: 'etiqueta' }, `Aeróbico de hoje · +${window.Aerobico.pontosDoAerobico(minutos)} pontos`),
        h('strong', null, feitos.length === 1 ? `${m.nome}, ${minutos} min` : `${minutos} min em ${feitos.length} aeróbicos`),
        h('span', null, `Cerca de ${kcal} kcal · ${plural(pontosAtuais(), 'ponto')} no total`),
        h('button', { class: 'link', onclick: abrirAerobico }, 'Fazer mais')));
  }
  return h('button', { class: 'aerobico-cartao convite', onclick: abrirAerobico },
    h('span', { class: 'mais-pontos', 'aria-hidden': 'true' }, '+15'),
    h('div', null,
      h('strong', null, 'ADD aeróbico e ganhe + pontos'),
      h('span', null, `Esteira, bicicleta, elíptico, escada ou remo, com cronômetro: +1 ponto a cada 2 min, até +15. Treino feito já valeu ${window.Aerobico.PONTOS_TREINO}.`)));
}

function abrirAerobico() {
  let escolhido = null;
  const fechar = () => modal.remove();
  const caixa = h('div', { class: 'modal-caixa folha aerobico-folha' });
  const modal = h('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Aeróbico',
    onclick: (e) => {
      if (e.target === modal) fechar();
    },
  }, caixa);
  function desenhar() {
    const semana = minutosNaSemana();
    const meta = window.Aerobico.META_SEMANA;
    const lista = window.Aerobico.MODALIDADES.map((m) => {
      const aberto = m.id === escolhido;
      return h('div', { class: `aerobico-opcao${aberto ? ' aberta' : ''}` },
        h('button', {
          class: 'aerobico-linha', 'aria-expanded': String(aberto),
          onclick: () => {
            escolhido = aberto ? null : m.id;
            desenhar();
          },
        },
        h('img', { src: `fotos/${m.imagem}-0.jpg`, alt: '', loading: 'lazy' }),
        h('span', { class: 'aerobico-texto' },
          h('strong', null, m.nome),
          h('span', { class: `impacto ${m.impacto}` }, window.Aerobico.IMPACTOS[m.impacto]),
          h('span', { class: 'kcal' }, `~${window.Aerobico.calorias(m.id, 30, estado.peso)} kcal em 30 min`))),
        aberto ? h('div', { class: 'aerobico-detalhe' },
          h('p', null, h('strong', null, 'Articulações: '), m.articulacoes),
          h('p', { class: 'aviso' }, `Ritmo da conta: ${m.ritmo} (${String(m.met).replace('.', ',')} METs).`),
          h('button', {
            class: 'botao primario',
            onclick: () => {
              fechar();
              abrirCronometro(m.id);
            },
          }, 'Abrir cronômetro')) : null);
    });
    caixa.replaceChildren(
      h('h2', null, 'Aeróbico no fim do treino'),
      h('p', null, 'Escolha o aparelho e marque o tempo no cronômetro. Feito depois da musculação, o aeróbico não atrapalha o ganho de músculo nem de força (Schumann et al., 2022).'),
      h('div', { class: 'aerobico-semana' },
        h('p', null, h('strong', null, `${semana} de ${meta} min`), ' de aeróbico esta semana'),
        h('span', { class: 'barra-tempo' }, h('i', { style: `width: ${Math.min(100, (semana / meta) * 100)}%` }))),
      h('label', { class: 'campo-peso' }, 'Seu peso, para as calorias',
        h('input', {
          type: 'number', inputmode: 'numeric', min: '30', max: '250', value: String(estado.peso),
          onchange: (e) => {
            const kg = Math.round(Number(e.target.value));
            if (kg >= 30 && kg <= 250) {
              estado.peso = kg;
              registrarPeso(kg);
              salvar();
            }
            desenhar();
          },
        }), 'kg'),
      h('div', { class: 'aerobico-lista' }, lista),
      h('details', { class: 'saiba-mais' },
        h('summary', null, 'O que dizem os estudos'),
        h('ul', null,
          h('li', null, h('strong', null, 'Quanto fazer: '), 'a OMS recomenda 150 a 300 minutos por semana de aeróbico moderado (ou 75 a 150 de intenso). Moderado é o ritmo em que dá para conversar, mas não cantar.'),
          h('li', null, h('strong', null, 'Depois da musculação: '), 'numa revisão de 43 estudos, juntar aeróbico e musculação não diminuiu o ganho de músculo nem de força máxima, com corrida ou bicicleta, no mesmo dia ou em dias separados. Só a força explosiva (salto, arranque) ganhou um pouco menos (Schumann et al., 2022).'),
          h('li', null, h('strong', null, 'Antes atrapalha o treino: '), 'aeróbico logo antes da musculação diminui as repetições do treino de força por algumas horas, principalmente o de perna (Sporer e Wenger, 2003). Por isso o app sugere fazer no fim.'),
          h('li', null, h('strong', null, 'Corrida ou bicicleta: '), 'olhando as fibras do músculo, a corrida diminuiu um pouco o crescimento das fibras do tipo I, e a bicicleta não (Lundberg et al., 2022). Os autores chamam isso de evidência preliminar. Em dia de perna, prefira bicicleta, elíptico ou caminhada.'),
          h('li', null, h('strong', null, 'Calorias: '), 'MET × peso × tempo, com os valores do Compendium of Physical Activities (Ainsworth et al., 2011). É uma média: o relógio ou o aparelho pode mostrar outro número.'))),
      h('button', { class: 'link', onclick: fechar }, 'Fechar'));
  }
  desenhar();
  document.body.append(modal);
  caixa.querySelector('.aerobico-linha').focus();
}

// Cronômetro do aeróbico em tela cheia. estado.cronoAerobico guarda { tipo, minutos, fim, restante }:
// fim é a hora de acabar enquanto corre; restante (ms), enquanto está pausado. Sobrevive a fechar o app.
let cronoIntervalo = null;

function restanteDoCrono(c) {
  return c.fim ? Math.max(0, c.fim - Date.now()) : c.restante;
}

function abrirCronometro(tipo) {
  if (!estado.cronoAerobico || estado.cronoAerobico.tipo !== tipo) {
    estado.cronoAerobico = { tipo, minutos: 20, fim: null, restante: null };
    salvar();
  }
  desenharCronometro();
}

function fecharCronometro() {
  clearInterval(cronoIntervalo);
  cronoIntervalo = null;
  const el = document.querySelector('.crono-aerobico');
  if (el) el.remove();
  if (tela !== 'treino') soltarTravaTela();
}

function desenharCronometro(fim) {
  const c = estado.cronoAerobico;
  const m = window.Aerobico.modalidade(fim ? fim.tipo : c ? c.tipo : '');
  let el = document.querySelector('.crono-aerobico');
  if (!m) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = h('div', { class: 'crono-aerobico', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Cronômetro: ${m.nome}` });
    document.body.append(el);
  }
  clearInterval(cronoIntervalo);
  cronoIntervalo = null;
  const iniciado = c && (c.fim !== null || c.restante !== null);
  const topo = h('div', { class: 'crono-topo' },
    h('img', { src: `fotos/${m.imagem}-0.jpg`, alt: '' }),
    h('div', null, h('span', { class: 'rotulo' }, 'Aeróbico'), h('strong', null, m.nome)));

  if (fim) {
    // Acabou: mostra o que somou.
    el.replaceChildren(topo,
      h('div', { class: 'crono-personagem' }, imagemDoMomento('comemora')),
      h('p', { class: 'crono-feito' }, h('strong', null, `${fim.minutos} min feitos`),
        h('span', null, `Cerca de ${window.Aerobico.calorias(m.id, fim.minutos, estado.peso)} kcal`
          + (fim.pontos ? ` · +${plural(fim.pontos, 'ponto')}` : estado.historico.some((x) => x.data === dataLocal(new Date())) ? ' · pontos do dia já no máximo' : ' · pontos só em dia de treino'))),
      h('button', {
        class: 'botao primario',
        onclick: () => {
          fecharCronometro();
          render();
        },
      }, 'Ok'));
    el.querySelector('.botao').focus();
    return;
  }

  if (!iniciado) {
    // Ajuste do tempo: atalhos e − / + de 1 minuto, até 3 horas.
    const ajustar = (n) => {
      c.minutos = Math.max(1, Math.min(window.Aerobico.MINUTOS_MAX, n));
      salvar();
      desenharCronometro();
    };
    el.replaceChildren(topo,
      h('p', { class: 'crono-pergunta' }, 'Quanto tempo?'),
      h('div', { class: 'crono-ajuste' },
        h('button', { class: 'crono-passo', 'aria-label': 'Menos 1 minuto', onclick: () => ajustar(c.minutos - 1) }, '−'),
        h('p', { class: 'crono-minutos', 'aria-live': 'polite' }, h('strong', null, c.minutos), h('span', null, 'min')),
        h('button', { class: 'crono-passo', 'aria-label': 'Mais 1 minuto', onclick: () => ajustar(c.minutos + 1) }, '+')),
      h('div', { class: 'opcoes-minutos' }, [...window.Aerobico.MINUTOS, 45].map((n) => h('button', {
        'aria-pressed': String(n === c.minutos),
        onclick: () => ajustar(n),
      }, h('strong', null, `${n} min`)))),
      h('p', { class: 'crono-previsao' }, `~${window.Aerobico.calorias(m.id, c.minutos, estado.peso)} kcal · até +${window.Aerobico.pontosDoAerobico(c.minutos)} pontos`),
      h('button', {
        class: 'botao primario',
        onclick: () => {
          prepararAudio();
          c.fim = Date.now() + c.minutos * 60000;
          salvar();
          pedirTravaTela();
          desenharCronometro();
        },
      }, 'Começar'),
      h('button', {
        class: 'link',
        onclick: () => {
          estado.cronoAerobico = null;
          salvar();
          fecharCronometro();
        },
      }, 'Cancelar'));
    el.querySelector('.crono-ajuste .crono-passo + p + .crono-passo').focus();
    return;
  }

  // Correndo ou pausado.
  const encerrar = () => {
    const feitos = Math.floor((c.minutos * 60000 - restanteDoCrono(c)) / 60000);
    estado.cronoAerobico = null;
    if (feitos < 1) {
      salvar();
      fecharCronometro();
      avisar('Menos de 1 minuto: não foi registrado');
      return;
    }
    const pontos = registrarAerobico(m.id, feitos);
    desenharCronometro({ tipo: m.id, minutos: feitos, pontos });
  };
  const relogioEl = h('p', { class: 'crono-relogio', role: 'timer' });
  const barra = h('span', { class: 'barra-tempo' }, h('i'));
  const info = h('p', { class: 'crono-previsao' });
  const pausar = h('button', {
    class: 'botao secundario',
    onclick: () => {
      if (c.fim) {
        c.restante = restanteDoCrono(c);
        c.fim = null;
      } else {
        c.fim = Date.now() + c.restante;
        c.restante = null;
      }
      salvar();
      desenharCronometro();
    },
  }, c.fim ? 'Pausar' : 'Continuar');
  el.replaceChildren(topo,
    h('div', { class: 'crono-personagem' }, imagemDoPersonagem(window.Ofensiva.fase(ofensivaAtual()))),
    relogioEl, barra, info,
    h('div', { class: 'crono-botoes' }, pausar, h('button', { class: 'botao primario', onclick: encerrar }, 'Terminar')));
  el.classList.toggle('pausado', !c.fim);
  const atualizar = () => {
    const resta = restanteDoCrono(c);
    const feitos = (c.minutos * 60000 - resta) / 60000;
    relogioEl.textContent = relogio(resta / 1000);
    barra.firstChild.style.width = `${(1 - resta / (c.minutos * 60000)) * 100}%`;
    info.textContent = `${c.fim ? '' : 'Pausado · '}${Math.floor(feitos)} de ${c.minutos} min · ~${window.Aerobico.calorias(m.id, feitos, estado.peso)} kcal`;
    if (c.fim && resta <= 0) {
      apitar();
      vibrar();
      encerrar();
    }
  };
  atualizar();
  if (c.fim) cronoIntervalo = setInterval(atualizar, 250);
  pausar.focus();
}
