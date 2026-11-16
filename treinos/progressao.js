/*
 * Registro por série (carga × repetições): histórico por exercício, sugestão de carga para a
 * próxima vez (progressão dupla: primeiro sobem as repetições, depois a carga) e recordes pela
 * força estimada (1RM estimado, fórmula de Epley: kg × (1 + reps / 30), até 12 repetições).
 * No navegador fica em window.Progressao; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  // "8–12" → { min: 8, max: 12 }; "5" → { min: 5, max: 5 }; tempo ("30 s") ou texto → null.
  function faixa(reps) {
    const texto = String(reps);
    if (/\bs\b|seg|min/.test(texto)) return null;
    const n = (texto.match(/\d+/g) || []).map(Number);
    if (!n.length) return null;
    return { min: n[0], max: n[n.length - 1] };
  }

  // Força estimada de uma série. Acima de 12 repetições a conta perde precisão: usa 12.
  const forca = (kg, reps) => (kg > 0 && reps > 0 ? Math.round(kg * (1 + Math.min(reps, 12) / 30) * 10) / 10 : 0);

  // registro: [{ data, ex, n, kg, reps }] → sessões do exercício, da mais antiga para a mais nova:
  // [{ data, series: [{ kg, reps }], melhor (força estimada), maiorCarga }]
  function sessoes(registro, ex) {
    const porDia = new Map();
    for (const r of registro) {
      if (r.ex !== ex) continue;
      if (!porDia.has(r.data)) porDia.set(r.data, []);
      porDia.get(r.data).push(r);
    }
    return [...porDia].sort(([a], [b]) => a.localeCompare(b)).map(([data, lista]) => {
      const series = lista.sort((a, b) => a.n - b.n).map((r) => ({ kg: r.kg, reps: r.reps }));
      return {
        data, series,
        melhor: Math.max(0, ...series.map((s) => forca(s.kg, s.reps))),
        maiorCarga: Math.max(0, ...series.map((s) => s.kg)),
      };
    });
  }

  const arredondar = (kg) => Math.round(kg * 2) / 2;
  // Menor aumento que faz sentido: 2,5% da carga, no mínimo 1 kg (0,5 kg abaixo de 10 kg).
  const proximaCarga = (kg) => arredondar(kg + Math.max(kg < 10 ? 0.5 : 1, kg * 0.025));

  /**
   * Sugestão para hoje, pela última sessão do exercício. reps: a prescrição ("8–12"); series: quantas.
   * Devolve null sem histórico com repetições, ou { tipo, kg, reps, texto }:
   *   'subir'  todas as séries bateram o topo da faixa → mais carga, voltando à base da faixa;
   *   'manter' mesma carga, tentando 1 repetição a mais;
   *   'baixar' ficou abaixo da base da faixa em alguma série → 5 a 10% menos.
   */
  function sugestao(registro, ex, reps, series) {
    const f = faixa(reps);
    const ultima = sessoes(registro, ex).filter((s) => s.series.some((x) => x.reps > 0 && x.kg > 0)).pop();
    if (!f || !ultima) return null;
    const feitas = ultima.series.filter((x) => x.reps > 0 && x.kg > 0);
    const kg = Math.max(...feitas.map((x) => x.kg));
    const naCarga = feitas.filter((x) => x.kg === kg);
    const resumo = `${String(kg).replace('.', ',')} kg × ${naCarga.map((x) => x.reps).join(', ')}`;
    if (naCarga.length >= Math.min(series, 2) && naCarga.every((x) => x.reps >= f.max)) {
      const nova = proximaCarga(kg);
      return { tipo: 'subir', kg: nova, reps: f.min, ultima: resumo, texto: `Bateu o topo da faixa em todas as séries: suba para ${String(nova).replace('.', ',')} kg.` };
    }
    if (naCarga.some((x) => x.reps < f.min)) {
      const nova = arredondar(kg * 0.925);
      return { tipo: 'baixar', kg: nova, reps: f.min, ultima: resumo, texto: `Ficou abaixo de ${f.min} repetições: tente ${String(nova).replace('.', ',')} kg para ficar na faixa.` };
    }
    const alvo = Math.min(f.max, Math.min(...naCarga.map((x) => x.reps)) + 1);
    return { tipo: 'manter', kg, reps: alvo, ultima: resumo, texto: `Mesma carga: tente chegar a ${alvo} repetições em cada série.` };
  }

  // A série bate o recorde do exercício? Compara a força estimada com tudo o que veio antes dela.
  function ehRecorde(registro, ex, kg, reps) {
    const antes = registro.filter((r) => r.ex === ex).map((r) => forca(r.kg, r.reps));
    const melhor = Math.max(0, ...antes);
    return melhor > 0 && forca(kg, reps) > melhor;
  }

  const api = { faixa, forca, sessoes, sugestao, ehRecorde, proximaCarga };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Progressao = api;
})(typeof window !== 'undefined' ? window : globalThis);
