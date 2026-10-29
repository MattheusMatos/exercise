/*
 * Retrospectiva do mês ou do ano, no estilo das retrospectivas de música: os números do período
 * a partir do que o app guarda (treinos, cargas, aeróbico, peso, ofensiva).
 * No navegador fica em window.Retrospectiva; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dois = (n) => String(n).padStart(2, '0');
  const chave = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
  const data = (texto) => {
    const [a, m, d] = texto.split('-').map(Number);
    return new Date(a, m - 1, d);
  };

  // Período: { tipo: 'mes', ano, mes (0–11) } ou { tipo: 'ano', ano }. Devolve início e fim (inclusive).
  function limites(periodo) {
    if (periodo.tipo === 'ano') return { inicio: `${periodo.ano}-01-01`, fim: `${periodo.ano}-12-31` };
    const ultimo = new Date(periodo.ano, periodo.mes + 1, 0).getDate();
    return { inicio: `${periodo.ano}-${dois(periodo.mes + 1)}-01`, fim: `${periodo.ano}-${dois(periodo.mes + 1)}-${dois(ultimo)}` };
  }

  function nomeDoPeriodo(periodo) {
    return periodo.tipo === 'ano' ? String(periodo.ano) : `${MESES[periodo.mes]} de ${periodo.ano}`;
  }

  // O período anterior, para comparar.
  function anterior(periodo) {
    if (periodo.tipo === 'ano') return { tipo: 'ano', ano: periodo.ano - 1 };
    return periodo.mes === 0 ? { tipo: 'mes', ano: periodo.ano - 1, mes: 11 } : { tipo: 'mes', ano: periodo.ano, mes: periodo.mes - 1 };
  }

  const ordenar = (mapa) => [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  const contar = (lista, f) => lista.reduce((m, x) => m.set(f(x), (m.get(f(x)) || 0) + 1), new Map());

  /**
   * dados: { historico, aerobicos, registroCargas, pesos, bloqueios, planos }
   * treinos: Map id → { titulo, exercicios: [{ nome, imagem, primarios, secundarios, series }] }
   * nomes: Map id da foto → nome do exercício
   * extra: { ofensiva(hoje) → { dias, recorde }, calorias(entrada do histórico) → kcal, kcalAerobico(a) → kcal }
   */
  function resumir(dados, periodo, treinos, nomes, extra) {
    const { inicio, fim } = limites(periodo);
    const dentro = (dia) => dia >= inicio && dia <= fim;
    const sessoes = dados.historico.filter((x) => dentro(x.data));
    const dias = new Set(sessoes.map((x) => x.data));
    const minutos = sessoes.reduce((soma, x) => soma + (Number(x.minutos) || 0), 0);
    const kcal = sessoes.reduce((soma, x) => soma + (extra.calorias(x) || 0), 0);

    // Treinos mais feitos.
    const favoritos = ordenar(contar(sessoes, (x) => x.treino)).slice(0, 3)
      .map(([id, vezes]) => ({ titulo: (treinos.get(id) || { titulo: id }).titulo, vezes }));

    // Séries por músculo (principal conta 1, auxiliar 0,5), pelo desenho de cada treino feito.
    const musculos = new Map();
    let series = 0;
    for (const s of sessoes) {
      const t = treinos.get(s.treino);
      if (!t) continue;
      series += Number.isFinite(s.series) ? s.series : t.exercicios.reduce((soma, e) => soma + e.series, 0);
      for (const e of t.exercicios) {
        for (const m of e.primarios) musculos.set(m, (musculos.get(m) || 0) + e.series);
        for (const m of e.secundarios) musculos.set(m, (musculos.get(m) || 0) + e.series * 0.5);
      }
    }
    const topMusculos = ordenar(musculos).slice(0, 3).map(([nome, qtd]) => ({ nome, series: Math.round(qtd) }));

    // Dia da semana preferido.
    const porDia = ordenar(contar([...dias], (d) => data(d).getDay()));
    const diaFavorito = porDia.length ? { dia: DIAS[porDia[0][0]], vezes: porDia[0][1] } : null;

    // Cargas: quantas vezes subiu e a maior evolução do período, por exercício.
    const porExercicio = new Map();
    for (const r of [...dados.registroCargas].sort((a, b) => a.data.localeCompare(b.data))) {
      if (!porExercicio.has(r.ex)) porExercicio.set(r.ex, []);
      porExercicio.get(r.ex).push(r);
    }
    let aumentos = 0;
    let maiorEvolucao = null;
    for (const [ex, lista] of porExercicio) {
      // A referência é a última carga antes do período (ou a primeira dentro dele).
      const antes = lista.filter((r) => r.data < inicio).pop();
      const noPeriodo = lista.filter((r) => dentro(r.data));
      if (!noPeriodo.length) continue;
      let ref = antes ? antes.kg : noPeriodo[0].kg;
      for (const r of noPeriodo) {
        if (r.kg > ref) aumentos += 1;
        ref = r.kg;
      }
      const primeiro = antes ? antes.kg : noPeriodo[0].kg;
      const ultimo = noPeriodo[noPeriodo.length - 1].kg;
      if (primeiro > 0 && ultimo > primeiro) {
        const pct = Math.round(((ultimo - primeiro) / primeiro) * 100);
        if (!maiorEvolucao || pct > maiorEvolucao.pct) maiorEvolucao = { nome: nomes.get(ex) || ex, de: primeiro, para: ultimo, pct };
      }
    }

    // Aeróbico.
    const aer = dados.aerobicos.filter((a) => dentro(a.data));
    const minutosAerobico = aer.reduce((soma, a) => soma + a.minutos, 0);
    const kcalAerobico = aer.reduce((soma, a) => soma + (extra.kcalAerobico(a) || 0), 0);
    const aerobicoFavorito = ordenar(aer.reduce((m, a) => m.set(a.tipo, (m.get(a.tipo) || 0) + a.minutos), new Map()))[0] || null;

    // Peso do corpo: primeiro e último registro do período (ou o último antes dele como início).
    const pesos = [...dados.pesos].sort((a, b) => a.data.localeCompare(b.data));
    const pesoInicio = pesos.filter((p) => p.data < inicio).pop() || pesos.find((p) => dentro(p.data));
    const pesoFim = pesos.filter((p) => dentro(p.data)).pop();
    const peso = pesoInicio && pesoFim && pesoInicio !== pesoFim ? { de: pesoInicio.kg, para: pesoFim.kg, diferenca: Math.round((pesoFim.kg - pesoInicio.kg) * 10) / 10 } : null;

    // Maior ofensiva alcançada no período (conferindo dia a dia).
    let maiorOfensiva = 0;
    const hoje = chave(new Date());
    for (let d = data(inicio); chave(d) <= fim && chave(d) <= hoje; d.setDate(d.getDate() + 1)) {
      maiorOfensiva = Math.max(maiorOfensiva, extra.ofensiva(chave(d)).dias);
    }
    const bloqueiosUsados = dados.bloqueios.filter((b) => b.usado && dentro(b.usado)).length;

    // Esforço marcado no fim dos treinos.
    const esforcos = contar(sessoes.filter((x) => x.esforco), (x) => x.esforco);

    return {
      periodo, nome: nomeDoPeriodo(periodo), inicio, fim,
      treinos: sessoes.length, dias: dias.size, minutos, kcal, series,
      favoritos, topMusculos, diaFavorito,
      aumentos, maiorEvolucao,
      minutosAerobico, kcalAerobico, aerobicoFavorito: aerobicoFavorito ? { tipo: aerobicoFavorito[0], minutos: aerobicoFavorito[1] } : null,
      peso, maiorOfensiva, bloqueiosUsados,
      esforcos: Object.fromEntries(esforcos),
    };
  }

  const api = { resumir, limites, nomeDoPeriodo, anterior, MESES };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Retrospectiva = api;
})(typeof window !== 'undefined' ? window : globalThis);
