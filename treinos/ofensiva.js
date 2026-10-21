/*
 * Ofensiva: dias seguidos de treino, no estilo do Duolingo, mas respeitando o descanso.
 *
 *   - cada dia com treino soma 1 dia de ofensiva;
 *   - dia de descanso não apaga a ofensiva;
 *   - ela apaga quando não dá mais para bater a meta da semana (domingo a sábado): a meta
 *     é o número de dias planejados; semana sem plano, ou com "Agora não", pede 1 treino;
 *   - depois que apaga, o próximo treino já começa uma ofensiva nova.
 *
 * O nível de força do avatar sobe com a ofensiva, e o humor depende de quantos dias
 * se passaram desde o último treino: animado (até 1), bem (até 3), triste (até 7),
 * magro, perdendo músculo (até 14) e sedentário (15 ou mais).
 * No navegador fica em window.Ofensiva; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  // Dias de ofensiva para chegar a cada nível de força (índice = nível).
  const NIVEIS = [0, 3, 7, 15, 30, 50];

  const dois = (n) => String(n).padStart(2, '0');
  const chave = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
  const data = (texto) => {
    const [a, m, d] = texto.split('-').map(Number);
    return new Date(a, m - 1, d);
  };
  const somarDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const domingo = (d) => somarDias(d, -d.getDay());
  const diasEntre = (a, b) => Math.round((data(b) - data(a)) / 86400000);

  function nivel(dias) {
    let n = 0;
    while (n + 1 < NIVEIS.length && dias >= NIVEIS[n + 1]) n += 1;
    return n;
  }

  function humor(diasSemTreinar) {
    if (diasSemTreinar === null) return 'novo';
    if (diasSemTreinar <= 1) return 'animado';
    if (diasSemTreinar <= 3) return 'bem';
    if (diasSemTreinar <= 7) return 'triste';
    if (diasSemTreinar <= 14) return 'magro';
    return 'sedentario';
  }

  /**
   * historico: [{ data: 'AAAA-MM-DD' }], planos: { 'AAAA-MM-DD' do domingo: [7 booleanos] },
   * hoje: 'AAAA-MM-DD'.
   */
  function calcular(historico, planos, hoje) {
    const treinou = new Set(historico.map((x) => x.data).filter((x) => x <= hoje));
    const metaDaSemana = (semana) => Math.max(1, (planos[semana] || []).filter(Boolean).length);
    const ultimo = [...treinou].sort().pop() || null;
    const diasSemTreinar = ultimo ? diasEntre(ultimo, hoje) : null;
    // Dias desde a volta: o primeiro treino depois de 4 dias ou mais parado.
    const datas = [...treinou].sort();
    let voltouHa = null;
    for (let i = datas.length - 1; i > 0; i--) {
      if (diasEntre(datas[i - 1], datas[i]) >= 4) {
        voltouHa = diasEntre(datas[i], hoje);
        break;
      }
    }
    const base = { recorde: 0, diasSemTreinar, voltouHa, humor: humor(diasSemTreinar) };
    if (!ultimo) return { ...base, dias: 0, nivel: 0, treinouHoje: false, risco: false, metaSemana: null, feitosSemana: 0 };

    let atual = 0;
    let recorde = 0;
    let quebrada = null; // semana em que a ofensiva já apagou: o resto dela não apaga de novo
    let feitosSemana = 0;
    let semanaCorrente = null;
    const fim = data(hoje);
    for (let d = data([...treinou].sort()[0]); d <= fim; d = somarDias(d, 1)) {
      const semana = chave(domingo(d));
      if (semana !== semanaCorrente) {
        semanaCorrente = semana;
        feitosSemana = 0;
      }
      if (treinou.has(chave(d))) {
        atual += 1;
        feitosSemana += 1;
        recorde = Math.max(recorde, atual);
      }
      // Só um dia que já terminou pode apagar a ofensiva; hoje ainda dá para treinar.
      if (chave(d) < hoje && quebrada !== semana && feitosSemana + (6 - d.getDay()) < metaDaSemana(semana)) {
        atual = 0;
        quebrada = semana;
      }
    }

    const semana = chave(domingo(fim));
    const treinouHoje = treinou.has(hoje);
    const meta = metaDaSemana(semana);
    // Se não treinar hoje, amanhã já não dá para bater a meta.
    const risco = atual > 0 && !treinouHoje && quebrada !== semana && feitosSemana + (6 - fim.getDay()) < meta;
    return { ...base, dias: atual, recorde, nivel: nivel(atual), treinouHoje, risco, metaSemana: meta, feitosSemana };
  }

  // Quantos dias de ofensiva faltam para o próximo nível, ou null no último.
  const faltamParaSubir = (dias) => {
    const n = nivel(dias);
    return n + 1 < NIVEIS.length ? NIVEIS[n + 1] - dias : null;
  };

  // Qual das 4 imagens do personagem mostrar: afastado, no auge, de volta ou começando.
  function fase(of) {
    if (of.diasSemTreinar !== null && of.diasSemTreinar >= 4) return 'afastado';
    if (of.nivel >= 3) return 'auge';
    if (of.voltouHa !== null && of.voltouHa <= 6) return 'volta';
    return 'comecando';
  }

  const api = { calcular, nivel, humor, fase, faltamParaSubir, NIVEIS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Ofensiva = api;
})(typeof window !== 'undefined' ? window : globalThis);
