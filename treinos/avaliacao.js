/*
 * Avaliação de um treino montado pela pessoa: séries por músculo na semana, quantas vezes cada
 * músculo é treinado, excesso num dia, ordem dos exercícios, repetidos e equilíbrio, e sugestões
 * do que incluir em cada dia. Os números seguem a análise do app (analise_hipertrofia.md):
 * 10 a 20 séries por músculo na semana, até ~11 por treino, cada músculo 2 vezes na semana.
 * No navegador fica em window.Avaliacao; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  // Grupos avaliados, com os músculos da biblioteca que contam para cada um.
  const GRUPOS = [
    { id: 'peito', nome: 'Peito', musculos: ['peito'], grande: true, lado: 'empurrar' },
    { id: 'costas', nome: 'Costas', musculos: ['dorsais', 'meio-das-costas'], grande: true, lado: 'puxar' },
    { id: 'ombros', nome: 'Ombros', musculos: ['ombros', 'deltoide-anterior', 'deltoide-lateral', 'deltoide-posterior'], grande: true },
    { id: 'biceps', nome: 'Bíceps', musculos: ['biceps'] },
    { id: 'triceps', nome: 'Tríceps', musculos: ['triceps'] },
    { id: 'quadriceps', nome: 'Quadríceps', musculos: ['quadriceps'], grande: true, lado: 'frente' },
    { id: 'posteriores', nome: 'Posteriores de coxa', musculos: ['isquiotibiais'], grande: true, lado: 'tras' },
    { id: 'gluteos', nome: 'Glúteos', musculos: ['gluteos'], grande: true },
    { id: 'panturrilhas', nome: 'Panturrilhas', musculos: ['panturrilhas'] },
    { id: 'abdomen', nome: 'Abdômen', musculos: ['abdominais'] },
  ];
  const DO_MUSCULO = new Map(GRUPOS.flatMap((g) => g.musculos.map((m) => [m, g.id])));
  const NOME = new Map(GRUPOS.map((g) => [g.id, g.nome]));

  const IDEAL_MIN = 10; // séries por semana
  const IDEAL_MAX = 20;
  const MAX_TREINO = 11; // séries de um músculo num treino
  const SEG_POR_SERIE = 150; // série + descanso, para estimar a duração

  // Divisões prontas: nome de cada treino e os grupos que ele foca (para sugerir o que incluir).
  const SUP = ['peito', 'costas', 'ombros', 'biceps', 'triceps'];
  const INF = ['quadriceps', 'posteriores', 'gluteos', 'panturrilhas', 'abdomen'];
  const TODOS = GRUPOS.map((g) => g.id);
  const DIVISOES = {
    ppl: { nome: 'Push, Pull e Legs', dias: 6, treinos: [['PUSH', ['peito', 'ombros', 'triceps']], ['PULL', ['costas', 'biceps', 'ombros']], ['LEGS', INF]] },
    supinf: { nome: 'Superior e inferior', dias: 4, treinos: [['SUPERIOR A', SUP], ['INFERIOR A', INF], ['SUPERIOR B', SUP], ['INFERIOR B', INF]] },
    corpo: { nome: 'Corpo inteiro', dias: 3, treinos: [['TREINO A', TODOS], ['TREINO B', TODOS], ['TREINO C', TODOS]] },
    abc: { nome: 'ABC', dias: 6, treinos: [['A: PEITO E TRÍCEPS', ['peito', 'triceps', 'ombros']], ['B: COSTAS E BÍCEPS', ['costas', 'biceps']], ['C: PERNAS E OMBROS', [...INF, 'ombros']]] },
    livre: { nome: 'Livre', dias: 3, treinos: [['TREINO A', TODOS]] },
  };

  const gruposDoItem = (item) => ({
    primarios: [...new Set(item.musculos.map((m) => DO_MUSCULO.get(m)).filter(Boolean))],
    secundarios: [...new Set(item.auxiliares.map((m) => DO_MUSCULO.get(m)).filter(Boolean))],
  });

  // Séries de cada grupo num treino: o músculo principal conta 1, o auxiliar 0,5.
  function seriesDoTreino(exercicios) {
    const conta = new Map();
    for (const { item, series } of exercicios) {
      const { primarios, secundarios } = gruposDoItem(item);
      for (const g of primarios) conta.set(g, (conta.get(g) || 0) + series);
      for (const g of secundarios) if (!primarios.includes(g)) conta.set(g, (conta.get(g) || 0) + series * 0.5);
    }
    return conta;
  }

  const arred = (n) => Math.round(n * 2) / 2;
  const fmt = (n) => String(arred(n)).replace('.', ',');
  const lista = (nomes) => nomes.join(', ').replace(/, ([^,]+)$/, ' e $1');
  const maiuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /**
   * treinos: [{ titulo, exercicios: [{ item, series }] }], com item da biblioteca
   * ({ id, nome, musculos, auxiliares, mecanica, padrao });
   * diasPorSemana: quantos treinos por semana (a sequência gira: cada treino é feito dias / n vezes).
   */
  function avaliar(treinos, diasPorSemana) {
    const n = treinos.length;
    const vezesPorSemana = n ? diasPorSemana / n : 0;
    const porTreino = treinos.map((t) => seriesDoTreino(t.exercicios));
    const grupos = GRUPOS.map((g) => {
      const doTreino = porTreino.map((c) => c.get(g.id) || 0);
      const semana = doTreino.reduce((s, x) => s + x, 0) * vezesPorSemana;
      // Vezes por semana em que o grupo recebe pelo menos 2 séries diretas ou somadas.
      const vezes = doTreino.filter((x) => x >= 2).length * vezesPorSemana;
      return { ...g, semana: arred(semana), vezes: Math.round(vezes * 10) / 10, doTreino };
    });
    const avisos = [];
    const aviso = (nivel, texto, treino) => avisos.push({ nivel, texto, ...(treino === undefined ? {} : { treino }) });

    if (!n || treinos.every((t) => !t.exercicios.length)) {
      return { grupos, avisos: [{ nivel: 'dica', texto: 'Comece adicionando exercícios: o app avalia o treino enquanto você monta.' }], vezesPorSemana };
    }

    // Com treinos ainda vazios, o volume da semana não diz nada: avalia só os dias montados.
    const incompleto = treinos.some((x) => !x.exercicios.length);
    if (incompleto) aviso('dica', 'Monte todos os treinos para ver o volume e a frequência da semana.');
    // Semana: grupos sem nada, com pouco, com muito, e treinados só 1 vez.
    const semNada = incompleto ? [] : grupos.filter((g) => g.grande && g.semana === 0);
    if (semNada.length) aviso('erro', `Nenhum exercício para ${lista(semNada.map((g) => g.nome.toLowerCase()))}.`);
    // Avisos parecidos viram um só, com a lista dos músculos.
    const daSemana = incompleto ? [] : grupos;
    const poucos = daSemana.filter((g) => g.semana > 0 && g.semana < IDEAL_MIN);
    const grandesPoucos = poucos.filter((g) => g.grande);
    const pequenosPoucos = poucos.filter((g) => !g.grande);
    const comNumero = (gs) => lista(gs.map((g) => `${g.nome.toLowerCase()} (${fmt(g.semana)})`));
    if (grandesPoucos.length) aviso('atencao', `Menos de 10 séries por semana em ${comNumero(grandesPoucos)}. Já dá resultado, mas 10 a 20 rendem mais.`);
    if (pequenosPoucos.length) aviso('dica', `Menos de 10 séries por semana em ${comNumero(pequenosPoucos)}. Os supinos e as puxadas já ajudam esses músculos.`);
    for (const g of daSemana.filter((x) => x.semana > IDEAL_MAX + 4)) {
      aviso('atencao', `${g.nome}: ${fmt(g.semana)} séries por semana. Acima de ~20 o ganho extra é pequeno e a recuperação pesa.`);
    }
    const umaVez = daSemana.filter((g) => g.semana >= 4 && g.vezes > 0 && g.vezes < 1.5);
    if (umaVez.length) aviso('dica', `${maiuscula(lista(umaVez.map((g) => g.nome.toLowerCase())))}: só 1 vez por semana. Dividir em 2 treinos tende a render igual ou mais.`);
    const ladoDe = (l) => (incompleto ? 0 : 1) * grupos.filter((g) => g.lado === l).reduce((s, g) => s + g.semana, 0);
    if (ladoDe('empurrar') > 1.5 * ladoDe('puxar') && ladoDe('empurrar') >= 6) aviso('atencao', `Muito mais peito (${fmt(ladoDe('empurrar'))}) que costas (${fmt(ladoDe('puxar'))}) por semana. Equilibre para proteger o ombro e a postura.`);
    if (ladoDe('frente') > 2 * ladoDe('tras') && ladoDe('frente') >= 6) aviso('atencao', `Muito mais quadríceps (${fmt(ladoDe('frente'))}) que posteriores de coxa (${fmt(ladoDe('tras'))}) por semana.`);
    if (!incompleto && !treinos.some((t) => t.exercicios.some(({ item }) => item.musculos.includes('deltoide-lateral'))) && grupos.find((g) => g.id === 'ombros').semana > 0) {
      aviso('dica', 'Nenhum exercício para o deltoide lateral: os supinos e desenvolvimentos quase não pegam. Uma elevação lateral resolve.');
    }

    // Cada treino: vazio, excesso de um músculo, ordem, repetidos e duração.
    treinos.forEach((t, i) => {
      const nome = t.titulo;
      if (!t.exercicios.length) {
        aviso('erro', `${nome} está vazio.`, i);
        return;
      }
      for (const [g, s] of porTreino[i]) {
        if (s > MAX_TREINO) aviso('atencao', `${nome}: ${fmt(s)} séries de ${NOME.get(g).toLowerCase()}. Acima de ~11 num treino, as séries a mais rendem pouco; passe algumas para outro dia.`, i);
      }
      t.exercicios.forEach(({ item }, k) => {
        if (item.mecanica !== 'isolado') return;
        const { primarios } = gruposDoItem(item);
        const composto = t.exercicios.slice(k + 1).find(({ item: o }) => o.mecanica === 'composto' && gruposDoItem(o).primarios.some((g) => primarios.includes(g)));
        if (composto) aviso('dica', `${nome}: ${item.nome} vem antes de ${composto.item.nome}. Composto primeiro aguenta mais carga; isolado antes só se for pré-exaustão de propósito.`, i);
      });
      const vistos = new Map();
      for (const { item } of t.exercicios) {
        const chave = item.padrao ? `${item.padrao}|${gruposDoItem(item).primarios.join()}` : null;
        if (!chave) continue;
        if (vistos.has(chave)) aviso('dica', `${nome}: ${vistos.get(chave)} e ${item.nome} são o mesmo movimento. Trocar um por um ângulo diferente varia o estímulo.`, i);
        else vistos.set(chave, item.nome);
      }
      const series = t.exercicios.reduce((s, x) => s + x.series, 0);
      const minutos = Math.round((series * SEG_POR_SERIE) / 60 / 5) * 5;
      if (minutos > 90) aviso('atencao', `${nome}: ${series} séries, uns ${minutos} minutos. Treinos muito longos cansam e perdem qualidade no fim.`, i);
    });

    if (!avisos.some((a) => a.nivel !== 'dica')) aviso('bom', 'Volume, frequência e equilíbrio dentro do que os estudos recomendam. Bom treino!');
    const ordem = { erro: 0, atencao: 1, dica: 2, bom: 3 };
    avisos.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
    return { grupos, avisos, vezesPorSemana };
  }

  // Duração estimada de um treino, em minutos.
  const duracao = (exercicios) => Math.max(5, Math.round((exercicios.reduce((s, x) => s + x.series, 0) * SEG_POR_SERIE) / 60 / 5) * 5);

  /**
   * Sugestões para um dia: dos grupos que o dia foca, os que estão com menos séries na semana;
   * para cada um, um exercício da biblioteca que ainda não está no dia (composto se o grupo ainda
   * não tem nada no dia, isolado se já tem).
   * foco: ids de grupos; itens: a biblioteca; resultado: avaliar(...); preferidos: ids dos
   * exercícios dos programas do app, que vêm primeiro.
   */
  function sugestoes(treino, foco, resultado, itens, preferidos = new Set(), quantas = 4) {
    const noDia = new Set(treino.exercicios.map(({ item }) => item.id));
    const doDia = seriesDoTreino(treino.exercicios);
    const comuns = itens.filter((x) => !x.incomum && ['barra', 'halteres', 'maquina', 'cabo', 'peso-do-corpo', 'barra-w'].includes(x.equipamento) && !noDia.has(x.id))
      .sort((a, b) => (preferidos.has(b.id) ? 1 : 0) - (preferidos.has(a.id) ? 1 : 0));
    const alvo = resultado.grupos
      .filter((g) => foco.includes(g.id) && g.semana < IDEAL_MIN && (doDia.get(g.id) || 0) < MAX_TREINO - 2)
      .sort((a, b) => a.semana - b.semana || (b.grande ? 1 : 0) - (a.grande ? 1 : 0));
    const saida = [];
    for (const g of alvo) {
      const temNoDia = (doDia.get(g.id) || 0) > 0;
      const candidatos = comuns.filter((x) => gruposDoItem(x).primarios[0] === g.id && !saida.some((s) => s.item.id === x.id));
      const preferido = candidatos.find((x) => x.mecanica === (temNoDia ? 'isolado' : 'composto')) || candidatos[0];
      if (!preferido) continue;
      saida.push({ item: preferido, grupo: g.id, motivo: g.semana === 0 ? `${g.nome}: nada na semana ainda` : `${g.nome}: ${fmt(g.semana)} séries na semana` });
      if (saida.length >= quantas) break;
    }
    return saida;
  }

  const api = { GRUPOS, DIVISOES, IDEAL_MIN, IDEAL_MAX, MAX_TREINO, gruposDoItem, seriesDoTreino, avaliar, sugestoes, duracao };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Avaliacao = api;
})(typeof window !== 'undefined' ? window : globalThis);
