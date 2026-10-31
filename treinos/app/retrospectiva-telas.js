// As telas da retrospectiva do mês e do ano e a imagem de resumo (os números vêm de retrospectiva.js).
'use strict';

// ---------- retrospectiva ----------

const R = () => window.Retrospectiva;
const fmt = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

// Meses e anos com pelo menos um treino, do mais recente para o mais antigo.
function periodosComTreino() {
  const meses = new Set(estado.historico.map((x) => x.data.slice(0, 7)));
  const anos = new Set(estado.historico.map((x) => x.data.slice(0, 4)));
  const lista = [...meses].sort().reverse().map((m) => ({ tipo: 'mes', ano: Number(m.slice(0, 4)), mes: Number(m.slice(5, 7)) - 1 }));
  return { meses: lista, anos: [...anos].sort().reverse().map((a) => ({ tipo: 'ano', ano: Number(a) })) };
}

function resumoDe(periodo) {
  const treinos = new Map(todosOsTreinos().map((t) => [t.id, t]));
  const nomes = new Map();
  for (const t of todosOsTreinos()) for (const e of t.exercicios) nomes.set(e.imagem, e.nome);
  if (biblioteca) for (const e of biblioteca.itens) if (!nomes.has(e.id)) nomes.set(e.id, e.nome);
  return R().resumir(estado, periodo, treinos, nomes, {
    ofensiva: (dia) => window.Ofensiva.calcular(estado.historico, todosOsPlanos(), dia, diasProtegidos()),
    calorias: (x) => (x.minutos ? (x.esforco === 'pesado' || x.esforco === 'limite' ? 6 : 3.5) * estado.peso * (x.minutos / 60) : 0),
    kcalAerobico: (a) => window.Aerobico.calorias(a.tipo, a.minutos, estado.peso),
  });
}

// A retrospectiva que vale destacar na tela inicial: a do mês passado nos 7 primeiros dias do mês,
// e a do ano entre 26/12 e 10/01.
function retrospectivaEmDestaque() {
  const hoje = new Date();
  const temTreino = (p) => { const { inicio, fim } = R().limites(p); return estado.historico.some((x) => x.data >= inicio && x.data <= fim); };
  if ((hoje.getMonth() === 11 && hoje.getDate() >= 26) || (hoje.getMonth() === 0 && hoje.getDate() <= 10)) {
    const ano = { tipo: 'ano', ano: hoje.getMonth() === 11 ? hoje.getFullYear() : hoje.getFullYear() - 1 };
    if (temTreino(ano)) return ano;
  }
  if (hoje.getDate() <= 7) {
    const mes = R().anterior({ tipo: 'mes', ano: hoje.getFullYear(), mes: hoje.getMonth() });
    if (temTreino(mes)) return mes;
  }
  return null;
}

function cartaoRetroInicio() {
  const p = retrospectivaEmDestaque();
  if (!p) return null;
  return h('button', { class: 'retro-convite', onclick: () => abrirRetrospectiva(p) },
    h('span', { class: 'retro-icone', 'aria-hidden': 'true' }, '📊'),
    h('div', null,
      h('strong', null, p.tipo === 'ano' ? `Sua retrospectiva de ${p.ano} chegou!` : `Sua retrospectiva de ${R().MESES[p.mes]} chegou!`),
      h('span', null, 'Treinos, cargas, ofensiva e mais. Toque para ver.')));
}

// Na aba Personagem: todas as retrospectivas disponíveis.
function cartaoRetrospectivas() {
  const { meses, anos } = periodosComTreino();
  if (!meses.length) return null;
  const botao = (p, rotulo) => h('button', { class: 'retro-periodo', onclick: () => abrirRetrospectiva(p) }, rotulo);
  return h('div', { class: 'bordas-cartao' },
    h('p', { class: 'rotulo' }, '📊 Retrospectivas'),
    h('div', { class: 'retro-periodos' },
      anos.map((p) => botao(p, String(p.ano))),
      meses.slice(0, 12).map((p) => botao(p, `${R().MESES[p.mes].slice(0, 3)}/${String(p.ano).slice(2)}`))));
}

// Telas da retrospectiva, no estilo de stories: toque à direita avança, à esquerda volta.
function telasDaRetrospectiva(r, ant) {
  const nomeP = r.periodo.tipo === 'ano' ? `em ${r.periodo.ano}` : `em ${R().MESES[r.periodo.mes]}`;
  const nomeAnt = ant.periodo.tipo === 'ano' ? String(ant.periodo.ano) : R().MESES[ant.periodo.mes];
  const p = window.Avatar.personagem(estado.perfil.personagem);
  const img = (momento) => h('img', { class: 'retro-personagem', src: window.Avatar.imagemDoMomento(p.id, momento), alt: '' });
  const big = (texto) => h('p', { class: 'retro-grande' }, texto);
  const telas = [];
  telas.push({ cor: 'laranja', corpo: [h('p', { class: 'retro-rotulo' }, 'Sua retrospectiva'), h('h2', null, r.nome), img('comemora'), h('p', null, estado.perfil.nome ? `Bora ver como foi, ${estado.perfil.nome}?` : 'Bora ver como foi?')] });
  const diff = r.treinos - ant.treinos;
  telas.push({
    cor: 'azul',
    corpo: [h('p', { class: 'retro-rotulo' }, `Você treinou ${nomeP}`), big(r.treinos), h('p', { class: 'retro-sub' }, r.treinos === 1 ? 'treino' : 'treinos'),
      h('p', null, `${plural(r.dias, 'dia')} na academia${r.minutos ? ` e ${fmt(r.minutos / 60)} horas de treino` : ''}.`),
      ant.treinos ? h('p', { class: 'retro-destaque' }, diff > 0 ? `+${diff} que em ${nomeAnt}! 📈` : diff < 0 ? `${diff} que em ${nomeAnt}. Bora recuperar!` : `O mesmo que em ${nomeAnt}: constância!`) : null],
  });
  if (r.favoritos.length) {
    telas.push({
      cor: 'roxo',
      corpo: [h('p', { class: 'retro-rotulo' }, 'Seu treino favorito'), big(r.favoritos[0].titulo), h('p', { class: 'retro-sub' }, `${plural(r.favoritos[0].vezes, 'vez', 'vezes')}`),
        r.favoritos.length > 1 ? h('ol', { class: 'retro-lista' }, r.favoritos.map((f) => h('li', null, h('span', null, f.titulo), h('strong', null, `${f.vezes}×`)))) : null],
    });
  }
  if (r.topMusculos.length) {
    telas.push({
      cor: 'verde',
      corpo: [h('p', { class: 'retro-rotulo' }, 'O músculo que mais trabalhou'), big(r.topMusculos[0].nome), h('p', { class: 'retro-sub' }, `${r.topMusculos[0].series} séries`),
        h('ol', { class: 'retro-lista' }, r.topMusculos.map((m) => h('li', null, h('span', null, m.nome), h('strong', null, m.series)))),
        r.series ? h('p', null, `${r.series} séries no total.`) : null],
    });
  }
  telas.push(r.aumentos
    ? {
      cor: 'laranja',
      corpo: [h('p', { class: 'retro-rotulo' }, 'Evolução de carga'), big(r.aumentos), h('p', { class: 'retro-sub' }, r.aumentos === 1 ? 'vez que você subiu a carga' : 'vezes que você subiu a carga'),
        r.maiorEvolucao ? h('p', { class: 'retro-destaque' }, `Maior evolução: ${r.maiorEvolucao.nome}, de ${fmt(r.maiorEvolucao.de)} para ${fmt(r.maiorEvolucao.para)} kg (+${r.maiorEvolucao.pct}%)`) : null],
    }
    : { cor: 'laranja', corpo: [h('p', { class: 'retro-rotulo' }, 'Evolução de carga'), big('💪'), h('p', null, 'Anote a carga de cada exercício no treino: na próxima retrospectiva, aparece quantas vezes você subiu o peso.')] });
  if (r.recordes.length) {
    telas.push({
      cor: 'roxo',
      corpo: [h('p', { class: 'retro-rotulo' }, 'Recordes de carga'),
        r.recordesNovos ? big(`🏆 ${r.recordesNovos}`) : big('🏆'),
        h('p', { class: 'retro-sub' }, r.recordesNovos ? (r.recordesNovos === 1 ? 'recorde novo' : 'recordes novos') : 'suas maiores cargas'),
        h('ol', { class: 'retro-lista' }, r.recordes.map((x) => h('li', null,
          h('span', null, `${x.novo && x.antes !== null ? '🏆 ' : ''}${x.nome}`),
          h('strong', null, `${fmt(x.kg)} kg`)))),
        r.recordes.some((x) => x.novo && x.antes !== null) ? h('p', { class: 'aviso' }, '🏆 = passou da maior carga que você já tinha anotado.') : null],
    });
  }
  const borda = bordaDa(r.maiorOfensiva);
  telas.push({
    cor: 'fogo',
    corpo: [h('p', { class: 'retro-rotulo' }, 'Maior ofensiva'), big(`🔥 ${r.maiorOfensiva}`), h('p', { class: 'retro-sub' }, r.maiorOfensiva === 1 ? 'dia' : 'dias'),
      borda ? h('p', { class: 'retro-destaque' }, `Chegou na borda ${borda.icone} ${borda.nome}`) : null,
      r.bloqueiosUsados ? h('p', null, `${plural(r.bloqueiosUsados, 'dia')} protegido${r.bloqueiosUsados === 1 ? '' : 's'} por bloqueio 🧊`) : null],
  });
  if (r.minutosAerobico) {
    const m = r.aerobicoFavorito && window.Aerobico.modalidade(r.aerobicoFavorito.tipo);
    telas.push({
      cor: 'azul',
      corpo: [h('p', { class: 'retro-rotulo' }, 'Aeróbico'), big(r.minutosAerobico), h('p', { class: 'retro-sub' }, 'minutos'),
        h('p', null, `Cerca de ${Math.round(r.kcalAerobico)} kcal.`), m ? h('p', { class: 'retro-destaque' }, `Favorito: ${m.nome}`) : null],
    });
  }
  if (r.peso) {
    const d = r.peso.diferenca;
    telas.push({
      cor: 'roxo',
      corpo: [h('p', { class: 'retro-rotulo' }, 'Seu peso'), big(`${d > 0 ? '+' : d < 0 ? '−' : ''}${fmt(Math.abs(d))} kg`),
        h('p', null, `De ${fmt(r.peso.de)} para ${fmt(r.peso.para)} kg ${nomeP}.`),
        h('p', { class: 'aviso' }, 'O peso da balança mistura músculo, gordura e água: com treino de força, ganhar músculo pode até subir o número.')],
    });
  }
  if (r.diaFavorito || r.kcal) {
    telas.push({
      cor: 'verde',
      corpo: [h('p', { class: 'retro-rotulo' }, 'Seu dia de treino'), r.diaFavorito ? big(r.diaFavorito.dia) : null,
        r.diaFavorito ? h('p', { class: 'retro-sub' }, plural(r.diaFavorito.vezes, 'vez', 'vezes')) : null,
        r.kcal ? h('p', { class: 'retro-destaque' }, `~${Math.round(r.kcal)} kcal gastas nos treinos`) : null],
    });
  }
  telas.push({ cor: 'laranja', final: true, corpo: [h('p', { class: 'retro-rotulo' }, `Resumo · ${r.nome}`), img('comemora'),
    h('dl', { class: 'retro-resumo' },
      [['Treinos', r.treinos], ['Horas', fmt(r.minutos / 60)], ['Recordes novos', r.recordesNovos], ['Maior ofensiva', `${r.maiorOfensiva} d`]]
        .map(([k, v]) => h('div', null, h('dt', null, k), h('dd', null, v))))] });
  return telas;
}

async function desenharRetro(r) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  await document.fonts.ready.catch(() => {});
  const titulo = (peso, tamanho) => `${peso} ${tamanho}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  const texto = (peso, tamanho) => `${peso} ${tamanho}px Barlow, system-ui, sans-serif`;
  const fundo = c.createLinearGradient(0, 0, 0, H);
  fundo.addColorStop(0, '#2b3754');
  fundo.addColorStop(1, '#07090f');
  c.fillStyle = fundo;
  c.fillRect(0, 0, W, H);
  areaSeguraStory(c, W, H); // em compartilhar.js
  c.textAlign = 'center';
  c.fillStyle = '#ff6b35';
  c.font = titulo(800, 48);
  c.fillText('MINHA RETROSPECTIVA', W / 2, 150);
  c.fillStyle = '#f0f2f5';
  c.font = titulo(800, 130);
  c.fillText(r.nome.toUpperCase(), W / 2, 290, W - 120);
  try {
    const im = await carregarImagem(window.Avatar.imagemDoMomento(estado.perfil.personagem, 'comemora'));
    const alto = 560;
    const largo = (im.width / im.height) * alto;
    c.drawImage(im, (W - largo) / 2, 340, largo, alto);
  } catch (e) {
    // Sem a imagem, só os números.
  }
  const linhas = [
    ['Treinos', String(r.treinos)],
    ['Horas de treino', fmt(r.minutos / 60)],
    ['Treino favorito', r.favoritos[0] ? r.favoritos[0].titulo : '—'],
    ['Músculo mais treinado', r.topMusculos[0] ? r.topMusculos[0].nome : '—'],
    ['Vezes que subiu a carga', String(r.aumentos)],
    ['Recordes de carga novos', String(r.recordesNovos)],
    ['Maior ofensiva', `${r.maiorOfensiva} dias`],
  ];
  linhas.forEach(([k, v], i) => {
    const y = 960 + i * 128;
    c.fillStyle = 'rgba(255, 255, 255, 0.07)';
    c.beginPath();
    c.roundRect(80, y - 76, W - 160, 108, 28);
    c.fill();
    c.textAlign = 'left';
    c.fillStyle = '#9aa1ad';
    c.font = texto(600, 36);
    c.fillText(k, 120, y - 8);
    c.textAlign = 'right';
    c.fillStyle = '#f0f2f5';
    c.font = titulo(800, 60);
    c.fillText(v, W - 120, y, 480);
  });
  c.textAlign = 'center';
  c.fillStyle = '#f0f2f5';
  c.font = texto(600, 36);
  const assinatura = ACADEMIA ? ACADEMIA.nome : programa.titulo;
  c.fillText(estado.perfil.nome ? `${estado.perfil.nome} · ${assinatura}` : assinatura, W / 2, 1860, W - 120);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function abrirRetrospectiva(periodo) {
  const r = resumoDe(periodo);
  const ant = resumoDe(R().anterior(periodo));
  const telas = telasDaRetrospectiva(r, ant);
  let atual = 0;
  const barras = h('div', { class: 'retro-barras' }, telas.map(() => h('span', null, h('i'))));
  const palco = h('div', { class: 'retro-palco' });
  const fechar = () => el.remove();
  const el = h('div', { class: 'retro', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Retrospectiva de ${r.nome}` },
    barras,
    h('button', { class: 'retro-fechar', 'aria-label': 'Fechar', onclick: fechar }, '✕'),
    palco);
  function mostrar(i) {
    atual = Math.max(0, Math.min(telas.length - 1, i));
    const t = telas[atual];
    el.dataset.cor = t.cor;
    barras.querySelectorAll('span').forEach((b, k) => b.classList.toggle('feita', k <= atual));
    const conteudo = h('div', { class: 'retro-tela' }, t.corpo);
    if (t.final) {
      conteudo.append(
        h('button', {
          class: 'botao primario', icone: 'compartilhar',
          onclick: async (e) => {
            e.stopPropagation();
            const blob = await desenharRetro(r);
            const arquivo = new File([blob], `retrospectiva-${r.inicio.slice(0, 7)}.png`, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
              try {
                await navigator.share({ files: [arquivo], text: `Minha retrospectiva de ${r.nome} 💪` });
              } catch (erro) {
                // Fechou o menu de compartilhar.
              }
            } else {
              const a = h('a', { href: URL.createObjectURL(blob), download: arquivo.name });
              document.body.append(a);
              a.click();
              a.remove();
            }
          },
        }, 'Compartilhar retrospectiva'),
        h('button', { class: 'link', onclick: (e) => { e.stopPropagation(); fechar(); } }, 'Fechar'));
    } else {
      conteudo.append(h('p', { class: 'retro-dica' }, 'Toque para continuar'));
    }
    palco.replaceChildren(conteudo);
  }
  palco.addEventListener('click', (e) => {
    if (telas[atual].final) return;
    const x = e.clientX / window.innerWidth;
    mostrar(x < 0.3 ? atual - 1 : atual + 1);
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') mostrar(atual + 1);
    else if (e.key === 'ArrowLeft') mostrar(atual - 1);
    else if (e.key === 'Escape') fechar();
  });
  document.body.append(el);
  el.tabIndex = -1;
  el.focus();
  mostrar(0);
}
