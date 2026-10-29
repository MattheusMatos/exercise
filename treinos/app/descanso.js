// Cronômetro de descanso, som e vibração, tela ligada e o vídeo de cada exercício.
'use strict';

// ---------- descanso ----------

// semAjuste: mini-pausas e aquecimento não ganham o descanso extra pedido no fim do último treino.
function iniciarDescanso(segundos, proxima, semAjuste) {
  pararDescanso();
  if (!semAjuste && estado.sessao) segundos += estado.sessao.ajuste.descanso;
  descanso = {
    fim: Date.now() + segundos * 1000,
    total: segundos,
    proxima,
    avisado: false,
    intervalo: setInterval(tique, 250),
    esconder: null,
    variante: (contadorDescansos++ % 2) + 1,
  };
  tique();
}

function pararDescanso() {
  if (descanso) {
    clearInterval(descanso.intervalo);
    clearTimeout(descanso.esconder);
  }
  descanso = null;
  atualizarDescanso();
}

function maisTrintaSegundos() {
  if (!descanso) return;
  descanso.fim += 30000;
  descanso.total += 30;
  descanso.avisado = false;
  clearTimeout(descanso.esconder);
  tique();
}

function tique() {
  if (!descanso) return;
  if (descanso.fim - Date.now() <= 0 && !descanso.avisado) {
    descanso.avisado = true;
    apitar();
    vibrar();
    descanso.esconder = setTimeout(pararDescanso, 6000);
  }
  atualizarDescanso();
}

function alternarDescanso() {
  descansoMinimizado = !descansoMinimizado;
  atualizarDescanso();
  const alvo = app.querySelector(descansoMinimizado ? '.descanso .expandir' : '.descanso .pular');
  if (alvo) alvo.focus();
}

// O descanso abre como um cartão de tela cheia, com o personagem descansando; "Minimizar"
// reduz a uma barra acima dos botões para ver o cartão do exercício.
function atualizarDescanso() {
  const caixa = app.querySelector('.descanso');
  if (!caixa) return;
  if (!descanso) {
    caixa.hidden = true;
    caixa.className = 'descanso';
    caixa.replaceChildren();
    return;
  }
  if (!caixa.firstChild) {
    caixa.append(
      h('div', { class: 'descanso-topo' },
        h('span', { class: 'rotulo descanso-rotulo' }),
        h('span', { class: 'descanso-treino' }, 'Treino ', h('span', { class: 'tempo-treino' }, estado.sessao ? tempoLongo((Date.now() - estado.sessao.inicio) / 1000) : '')),
        h('button', { class: 'minimizar', onclick: alternarDescanso }, 'Minimizar')),
      h('button', { class: 'expandir', 'aria-label': 'Abrir o descanso em tela cheia', onclick: alternarDescanso },
        h('span', { class: 'descanso-personagem' }),
        h('span', { class: 'relogio', role: 'timer', 'aria-label': 'Tempo de descanso' })),
      h('div', { class: 'descanso-info' },
        h('span', { class: 'barra-tempo' }, h('i')),
        h('span', { class: 'descanso-proxima' }),
        h('span', { class: 'so-leitor', 'aria-live': 'polite' })),
      h('div', { class: 'descanso-botoes' },
        h('button', { class: 'mais', 'aria-label': 'Mais 30 segundos', onclick: maisTrintaSegundos }, '+30 s'),
        h('button', { class: 'pular', onclick: pararDescanso }, 'Pular')));
  }
  const restante = Math.max(0, (descanso.fim - Date.now()) / 1000);
  const pronto = restante <= 0;
  caixa.hidden = false;
  caixa.classList.toggle('pronto', pronto);
  caixa.classList.toggle('minimizado', descansoMinimizado);
  caixa.classList.toggle('cheio', !descansoMinimizado);
  caixa.setAttribute('role', descansoMinimizado ? 'region' : 'dialog');
  caixa.setAttribute('aria-label', 'Descanso');
  caixa.querySelector('.relogio').textContent = relogio(restante);
  caixa.querySelector('.descanso-rotulo').textContent = pronto ? 'Bora!' : 'Descanso';
  caixa.querySelector('.expandir').disabled = !descansoMinimizado;
  caixa.querySelector('.descanso-proxima').textContent = `${pronto ? 'Agora' : 'A seguir'}: ${descanso.proxima}`;
  // Durante o descanso o personagem descansa (alternando as duas poses); quando acaba, comemora.
  const momento = pronto ? 'comemora' : `descanso-${descanso.variante}`;
  const lugar = caixa.querySelector('.descanso-personagem');
  if (lugar.dataset.momento !== momento) {
    lugar.dataset.momento = momento;
    lugar.replaceChildren(imagemDoMomento(momento));
  }
  const aviso = pronto ? `Descanso feito. Agora: ${descanso.proxima}.` : `Descanso de ${relogio(descanso.total)}.`;
  const elAviso = caixa.querySelector('.so-leitor');
  if (elAviso.textContent !== aviso) elAviso.textContent = aviso;
  caixa.querySelector('.barra-tempo i').style.width = `${(restante / descanso.total) * 100}%`;
  caixa.querySelector('.mais').hidden = pronto;
  caixa.querySelector('.pular').textContent = pronto ? 'Ok' : 'Pular';
}

function prepararAudio() {
  try {
    if (!audio) {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (Contexto) audio = new Contexto();
    }
    if (audio && audio.state === 'suspended') audio.resume();
  } catch (e) {
    audio = null;
  }
}

function apitar() {
  if (!audio) return;
  try {
    const agora = audio.currentTime;
    [0, 0.28].forEach((atraso) => {
      const osc = audio.createOscillator();
      const ganho = audio.createGain();
      osc.frequency.value = 880;
      ganho.gain.setValueAtTime(0.0001, agora + atraso);
      ganho.gain.exponentialRampToValueAtTime(0.35, agora + atraso + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, agora + atraso + 0.2);
      osc.connect(ganho);
      ganho.connect(audio.destination);
      osc.start(agora + atraso);
      osc.stop(agora + atraso + 0.22);
    });
  } catch (e) {
    // Sem som disponível: o aviso visual basta.
  }
}

function vibrar() {
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch (e) {
    // Vibração indisponível.
  }
}

// ---------- tela ligada e vídeo ----------

async function pedirTravaTela() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible' && !travaTela) {
      travaTela = await navigator.wakeLock.request('screen');
      travaTela.addEventListener('release', () => {
        travaTela = null;
      });
    }
  } catch (e) {
    travaTela = null;
  }
}

function soltarTravaTela() {
  if (travaTela) travaTela.release().catch(() => {});
  travaTela = null;
}

// Tempo de cada exercício no vídeo do treino (gerar_videos.py): abertura de 5 s, depois 8 s por exercício.
const VIDEO_INTRO = 5;
const VIDEO_EXERCICIO = 8;

// Só o trecho do exercício slot no vídeo do treino. repetir: sem som e em loop, para a prévia.
function videoDoExercicio(i, slot, repetir) {
  const treino = programa.treinos[i];
  const inicio = VIDEO_INTRO + slot * VIDEO_EXERCICIO;
  // O trecho vai também no endereço (#t=), que o navegador já entende sozinho.
  const video = h('video', {
    class: 'video-trecho', src: `videos/${treino.id}.mp4#t=${inicio},${inicio + VIDEO_EXERCICIO}`,
    controls: true, playsinline: true, preload: 'metadata', muted: repetir, autoplay: repetir,
  });
  if (repetir) video.muted = true;
  video.addEventListener('loadedmetadata', () => {
    video.currentTime = inicio;
  }, { once: true });
  video.addEventListener('timeupdate', () => {
    if (video.currentTime >= inicio + VIDEO_EXERCICIO - 0.3) {
      video.currentTime = inicio;
      if (!repetir) video.pause();
    }
  });
  return video;
}

function abrirVideo(i, slot) {
  const treino = programa.treinos[i];
  const video = videoDoExercicio(i, slot, false);
  const fechar = () => {
    video.pause();
    modal.remove();
  };
  const modal = h('div', {
    class: 'modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': `Vídeo do ${treino.titulo}`,
    onclick: (e) => {
      if (e.target === modal) fechar();
    },
  }, h('div', { class: 'modal-caixa' },
    video,
    h('p', { class: 'aviso' }, 'Toque no play para ver de novo.'),
    h('button', { class: 'botao secundario', onclick: fechar }, 'Fechar vídeo')));
  document.body.append(modal);
  modal.querySelector('.botao').focus();
  video.play().catch(() => {});
}

document.addEventListener('keydown', (e) => {
  if (document.querySelector('.crono-aerobico')) return;
  const modal = document.querySelector('.modal');
  if (modal) {
    if (e.key === 'Escape') {
      const video = modal.querySelector('video');
      if (video) video.pause();
      modal.remove();
    }
    return;
  }
  if (bib) {
    if (e.key === 'Escape') voltarNaBiblioteca();
    return;
  }
  if (tela !== 'treino' || !estado.sessao) return;
  if (descanso && !descansoMinimizado) {
    if (e.key === 'Escape') alternarDescanso();
    return;
  }
  // Digitando a carga, as teclas são do campo, não atalhos do treino.
  if (e.target.closest && e.target.closest('input, textarea, select')) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    acaoBotao('feito');
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    acaoBotao('depois');
  } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    desfazer();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (programa && estado.perfil.configurado) {
    const antes = estado.bloqueios.filter((b) => b.usado).length;
    usarBloqueios();
    conferirApostas();
    if (estado.bloqueios.filter((b) => b.usado).length !== antes && tela === 'inicio') renderInicio();
  }
  if (tela === 'treino' || (estado.cronoAerobico && estado.cronoAerobico.fim)) pedirTravaTela();
  tique();
});
