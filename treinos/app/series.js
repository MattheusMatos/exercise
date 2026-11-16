// Registro por série no cartão do exercício (carga × repetições), a sugestão de carga do dia e a
// folha de evolução com o gráfico. As contas ficam em progressao.js.
'use strict';

// ---------- registro por série ----------

const seriesDoExercicio = (ex) => window.Progressao.sessoes(estado.registroSeries, ex.imagem);

// A sugestão de hoje pela última sessão registrada antes de hoje (null sem histórico com repetições).
function sugestaoDeHoje(ex) {
  const hoje = dataLocal(new Date());
  return window.Progressao.sugestao(estado.registroSeries.filter((r) => r.data < hoje), ex.imagem, ex.reps, ex.series);
}

// Repetições para preencher o campo na série k: as já feitas hoje nela, senão o alvo da sugestão.
function repsParaASerie(i, ex, k) {
  const hoje = (estado.sessao.feitas[i] || [])[k];
  if (hoje && hoje.reps) return hoje.reps;
  const s = sugestaoDeHoje(ex);
  return s ? s.reps : '';
}

function textoDasFeitas(i) {
  const feitas = estado.sessao.feitas[i] || [];
  return feitas.filter(Boolean).map((s) => (s.reps ? `${String(s.kg).replace('.', ',')}×${s.reps}` : `${String(s.kg).replace('.', ',')} kg`)).join(' · ');
}

// Guarda a série k do exercício i com o que está nos campos do cartão. Sem carga, não guarda nada.
function registrarSerie(i, ex, k, cartaoEl) {
  const lerNumero = (seletor) => {
    const campo = cartaoEl && cartaoEl.querySelector(seletor);
    return campo && campo.value !== '' ? Number(String(campo.value).replace(',', '.')) : NaN;
  };
  const kg = arredondarCarga(lerNumero('.campo-kg'));
  if (!Number.isFinite(kg) || kg < 0 || kg > 1000) return;
  const lido = Math.round(lerNumero('.campo-reps'));
  const reps = lido >= 1 && lido <= 200 ? lido : null;
  const hoje = dataLocal(new Date());
  const recorde = reps ? window.Progressao.ehRecorde(estado.registroSeries.filter((r) => !(r.data === hoje && r.ex === ex.imagem && r.n === k)), ex.imagem, kg, reps) : false;
  estado.sessao.feitas[i] = estado.sessao.feitas[i] || [];
  estado.sessao.feitas[i][k] = { kg, reps };
  estado.registroSeries = [...estado.registroSeries.filter((r) => !(r.data === hoje && r.ex === ex.imagem && r.n === k)),
    { data: hoje, ex: ex.imagem, n: k, kg, reps }].slice(-8000);
  if (recorde) avisar(`🏆 Recorde em ${ex.nome}: ${textoKg(kg)} × ${reps}`);
}

// Desmarcar séries apaga o registro delas (da série "de" em diante).
function apagarSeries(i, ex, de) {
  const hoje = dataLocal(new Date());
  if (estado.sessao.feitas[i]) estado.sessao.feitas[i].length = Math.min(estado.sessao.feitas[i].length, de);
  estado.registroSeries = estado.registroSeries.filter((r) => !(r.data === hoje && r.ex === ex.imagem && r.n >= de));
}

// Depois de marcar ou desmarcar: atualiza a linha das séries feitas e o campo de repetições.
function atualizarSeriesNoCartao(i, ex, cartaoEl, proxima) {
  if (!cartaoEl) return;
  const linha = cartaoEl.querySelector('.series-feitas');
  if (linha) {
    const texto = textoDasFeitas(i);
    linha.textContent = texto ? `Hoje: ${texto}` : '';
    linha.hidden = !texto;
  }
  const campo = cartaoEl.querySelector('.campo-reps');
  if (campo && document.activeElement !== campo && proxima < ex.series) campo.value = String(repsParaASerie(i, ex, proxima));
}

// ---------- evolução ----------

const dataCurtaBR = (dia) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

// Gráfico de linha da força estimada por sessão (uma série só: o título diz o que é, sem legenda).
function graficoDeEvolucao(lista) {
  const W = 340;
  const H = 180;
  const m = { c: 14, d: 14, b: 26, e: 40 };
  const valores = lista.map((s) => s.melhor);
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (max === min) {
    max += 5;
    min -= 5;
  }
  const folga = (max - min) * 0.12;
  min = Math.max(0, min - folga);
  max += folga;
  const x = (k) => m.e + (lista.length === 1 ? (W - m.e - m.d) / 2 : (k * (W - m.e - m.d)) / (lista.length - 1));
  const y = (v) => m.c + (1 - (v - min) / (max - min)) * (H - m.c - m.b);
  const ns = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, texto) => {
    const n = document.createElementNS(ns, tag);
    for (const [a, v] of Object.entries(attrs)) n.setAttribute(a, v);
    if (texto !== undefined) n.textContent = texto;
    return n;
  };
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafico-evolucao', role: 'img', 'aria-label': `Força estimada por treino, de ${Math.round(valores[0])} a ${Math.round(valores[valores.length - 1])} kg` });
  // Grade discreta com 3 linhas e os valores do eixo.
  for (const v of [min + (max - min) * 0.1, (min + max) / 2, max - (max - min) * 0.1]) {
    svg.append(el('line', { x1: m.e, x2: W - m.d, y1: y(v), y2: y(v), class: 'grade' }));
    svg.append(el('text', { x: m.e - 6, y: y(v) + 4, 'text-anchor': 'end', class: 'eixo' }, String(Math.round(v))));
  }
  svg.append(el('text', { x: m.e, y: H - 6, class: 'eixo' }, dataCurtaBR(lista[0].data)));
  if (lista.length > 1) svg.append(el('text', { x: W - m.d, y: H - 6, 'text-anchor': 'end', class: 'eixo' }, dataCurtaBR(lista[lista.length - 1].data)));
  if (lista.length > 1) svg.append(el('polyline', { points: lista.map((s, k) => `${x(k)},${y(s.melhor)}`).join(' '), class: 'linha' }));
  const dica = h('p', { class: 'grafico-dica', 'aria-live': 'polite' });
  const mostrar = (k) => {
    const s = lista[k];
    dica.textContent = `${dataCurtaBR(s.data)}: ${s.series.map((z) => (z.reps ? `${String(z.kg).replace('.', ',')}×${z.reps}` : `${String(z.kg).replace('.', ',')} kg`)).join(' · ')} · força estimada ${String(s.melhor).replace('.', ',')} kg`;
    svg.querySelectorAll('.ponto').forEach((p, n) => p.classList.toggle('ativo', n === k));
  };
  lista.forEach((s, k) => {
    svg.append(el('circle', { cx: x(k), cy: y(s.melhor), r: 4.5, class: 'ponto' }));
    // Área de toque maior que o ponto.
    const alvo = el('circle', { cx: x(k), cy: y(s.melhor), r: 16, class: 'alvo', tabindex: '0', role: 'button', 'aria-label': `${dataCurtaBR(s.data)}: força estimada ${s.melhor} kg` });
    for (const evento of ['pointerenter', 'click', 'focus']) alvo.addEventListener(evento, () => mostrar(k));
    svg.append(alvo);
  });
  mostrar(lista.length - 1);
  return h('div', { class: 'grafico-caixa' }, svg, dica);
}

function abrirEvolucao(ex) {
  const todas = seriesDoExercicio(ex);
  const comForca = todas.filter((s) => s.melhor > 0).slice(-20);
  const fechar = () => modal.remove();
  const primeira = comForca[0];
  const ultima = comForca[comForca.length - 1];
  const ganho = primeira && ultima && comForca.length > 1 ? Math.round(((ultima.melhor - primeira.melhor) / primeira.melhor) * 100) : null;
  const recorde = comForca.reduce((m, s) => (s.melhor > (m ? m.melhor : 0) ? s : m), null);
  const caixa = h('div', { class: 'modal-caixa folha evolucao-folha' },
    h('p', { class: 'etiqueta' }, 'Evolução'),
    h('h2', null, ex.nome),
    comForca.length
      ? [
        h('div', { class: 'evolucao-numeros' },
          h('div', null, h('span', { class: 'rotulo' }, 'Recorde'), h('strong', null, `${String(recorde.melhor).replace('.', ',')} kg`), h('span', null, dataCurtaBR(recorde.data))),
          h('div', null, h('span', { class: 'rotulo' }, 'Maior carga'), h('strong', null, textoKg(Math.max(...todas.map((s) => s.maiorCarga))))),
          ganho !== null ? h('div', null, h('span', { class: 'rotulo' }, 'Desde o início'), h('strong', null, `${ganho > 0 ? '+' : ''}${ganho}%`)) : null),
        h('h3', null, 'Força estimada por treino (kg)'),
        graficoDeEvolucao(comForca),
        h('p', { class: 'aviso' }, 'Força estimada: a carga que você levantaria 1 vez, calculada pela melhor série do dia (fórmula de Epley). Serve para comparar treinos com cargas e repetições diferentes.'),
      ]
      : h('p', null, 'Anote a carga e as repetições de cada série para ver o gráfico aqui.'),
    todas.length ? [
      h('h3', null, 'Últimos treinos'),
      h('table', { class: 'evolucao-tabela' },
        h('thead', null, h('tr', null, h('th', null, 'Dia'), h('th', null, 'Séries'))),
        h('tbody', null, todas.slice(-8).reverse().map((s) => h('tr', null,
          h('td', null, dataCurtaBR(s.data)),
          h('td', null, s.series.map((z) => (z.reps ? `${String(z.kg).replace('.', ',')}×${z.reps}` : `${String(z.kg).replace('.', ',')} kg`)).join(' · ')))))),
    ] : null,
    h('button', { class: 'link', onclick: fechar }, 'Fechar'));
  const modal = h('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Evolução: ${ex.nome}`,
    onclick: (e) => {
      if (e.target === modal) fechar();
    },
  }, caixa);
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fechar();
  });
  document.body.append(modal);
  caixa.tabIndex = -1;
  caixa.focus();
}
