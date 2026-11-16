// Backup (exportar e importar tudo o que o app guarda no aparelho) e a medição de uso: contadores
// por dia, guardados só no aparelho, que a pessoa pode ver e compartilhar se quiser. Nada é enviado
// sozinho; quando houver servidor, medir() é o único lugar que precisa mudar.
'use strict';

// ---------- medição de uso ----------

const EVENTOS_DE_USO = {
  abrir: 'Dias em que abriu o app', treino_iniciado: 'Treinos começados', treino_feito: 'Treinos terminados',
  aerobico: 'Aeróbicos e esportes registrados', compra: 'Compras na loja', compartilhar: 'Cards do treino gerados',
  retrospectiva: 'Retrospectivas abertas', montador: 'Meu treino salvo', evolucao: 'Evoluções abertas',
};

// Soma 1 ao evento de hoje ("abrir" conta no máximo 1 por dia). Guarda os últimos 120 dias.
function medir(evento) {
  if (!EVENTOS_DE_USO[evento] || !estado.uso) return;
  const hoje = dataLocal(new Date());
  const dia = estado.uso[hoje] || {};
  dia[evento] = evento === 'abrir' ? 1 : (dia[evento] || 0) + 1;
  estado.uso[hoje] = dia;
  const dias = Object.keys(estado.uso).sort();
  for (const antigo of dias.slice(0, Math.max(0, dias.length - 120))) delete estado.uso[antigo];
}

// Totais dos últimos n dias, por evento.
function resumoDeUso(n) {
  const limite = somarDiasData(dataLocal(new Date()), -n + 1);
  const totais = Object.fromEntries(Object.keys(EVENTOS_DE_USO).map((e) => [e, 0]));
  for (const [dia, eventos] of Object.entries(estado.uso)) {
    if (dia < limite) continue;
    for (const [e, q] of Object.entries(eventos)) if (e in totais) totais[e] += q;
  }
  return totais;
}

function textoDoUso() {
  const t = resumoDeUso(30);
  const concluidos = t.treino_iniciado ? Math.round((t.treino_feito / t.treino_iniciado) * 100) : null;
  return [
    'Treino PPL: meu uso nos últimos 30 dias',
    ...Object.entries(EVENTOS_DE_USO).map(([e, rotulo]) => `${rotulo}: ${t[e]}`),
    concluidos !== null ? `Treinos terminados entre os começados: ${concluidos}%` : null,
    `Programa: ${programa.titulo}. Ofensiva: ${ofensivaAtual().dias} dias (recorde ${ofensivaAtual().recorde}).`,
  ].filter(Boolean).join('\n');
}

// ---------- backup ----------

function baixarArquivo(nome, texto, tipo) {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = h('a', { href: url, download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function exportarBackup() {
  const conteudo = JSON.stringify({ app: 'treino-ppl', chave: CHAVE_ESTADO, exportado: new Date().toISOString(), estado });
  baixarArquivo(`treino-backup-${dataLocal(new Date())}.json`, conteudo, 'application/json');
  estado.ultimoBackup = dataLocal(new Date());
  salvar();
  if (tela === 'inicio') renderInicio(); // some o lembrete de backup
}

// Lê um arquivo de backup e devolve o estado bruto dele, ou lança um erro com a mensagem para a pessoa.
function lerBackup(texto) {
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch (e) {
    throw new Error('Este arquivo não é um backup do app.');
  }
  const bruto = dados && dados.app === 'treino-ppl' ? dados.estado : null;
  if (!bruto || typeof bruto !== 'object' || !bruto.perfil) throw new Error('Este arquivo não é um backup do app.');
  return bruto;
}

// Troca tudo pelo backup. O que havia antes fica guardado em <chave>:antes-de-importar.
function importarBackup(bruto) {
  gravar(`${CHAVE_ESTADO}:antes-de-importar`, estado);
  gravar(CHAVE_ESTADO, bruto);
  location.reload();
}

function abrirDados() {
  const fechar = () => modal.remove();
  const caixa = h('div', { class: 'modal-caixa folha dados-folha' });
  let pendente = null; // backup lido, esperando confirmação
  const arquivo = h('input', {
    type: 'file', accept: 'application/json,.json', class: 'campo-arquivo', 'aria-label': 'Arquivo de backup',
    onchange: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        pendente = lerBackup(await f.text());
      } catch (erro) {
        pendente = null;
        avisar(erro.message);
      }
      desenhar();
    },
  });
  function desenhar() {
    const t = resumoDeUso(30);
    caixa.replaceChildren(
      h('h2', null, 'Backup e dados'),
      h('p', null, 'Tudo o que você faz no app fica guardado só neste celular. Se trocar de aparelho ou limpar o navegador, um backup traz tudo de volta: treinos, cargas, ofensiva, pontos e compras.'),
      h('section', null,
        h('h3', null, 'Guardar um backup'),
        h('p', null, estado.ultimoBackup ? `Último backup: ${dataCurta(estado.ultimoBackup)}.` : 'Você ainda não fez nenhum backup.', ' Salve o arquivo num lugar fora do celular, como o Drive, o iCloud ou o seu e-mail.'),
        h('button', {
          class: 'botao primario exportar',
          onclick: () => {
            exportarBackup();
            desenhar();
            avisar('Backup salvo nos downloads');
          },
        }, 'Baixar backup')),
      h('section', null,
        h('h3', null, 'Trazer um backup'),
        h('p', null, 'Escolha um arquivo de backup. Ele substitui o que está neste aparelho.'),
        arquivo,
        pendente ? h('div', { class: 'confirmar-importar' },
          h('p', null, `Backup de ${pendente.perfil.nome || 'sem nome'}, com ${plural((pendente.historico || []).length, 'treino')}. Substituir os dados deste aparelho (${plural(estado.historico.length, 'treino')})?`),
          h('button', { class: 'botao primario importar', onclick: () => importarBackup(pendente) }, 'Substituir pelos dados do backup'),
          h('p', { class: 'aviso' }, 'Os dados de agora ficam guardados como cópia de segurança neste aparelho.')) : null),
      h('section', null,
        h('h3', null, 'Seu uso nos últimos 30 dias'),
        h('ul', { class: 'lista-uso' }, Object.entries(EVENTOS_DE_USO).map(([e, rotulo]) => h('li', null, h('span', null, rotulo), h('strong', null, t[e])))),
        h('p', { class: 'aviso' }, 'Esses números ficam só neste aparelho; nada é enviado sozinho. Se quiser ajudar a melhorar o app, mande o resumo para quem cuida dele.'),
        h('button', {
          class: 'botao secundario',
          onclick: async () => {
            const texto = textoDoUso();
            if (navigator.share) {
              try {
                await navigator.share({ text: texto });
              } catch (erro) {
                // Fechou o menu de compartilhar.
              }
            } else if (navigator.clipboard) {
              await navigator.clipboard.writeText(texto).catch(() => {});
              avisar('Resumo copiado');
            }
          },
        }, 'Compartilhar resumo de uso')),
      h('button', { class: 'link', onclick: fechar }, 'Fechar'));
  }
  const modal = h('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Backup e dados',
    onclick: (e) => {
      if (e.target === modal) fechar();
    },
  }, caixa);
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fechar();
  });
  desenhar();
  document.body.append(modal);
  caixa.tabIndex = -1;
  caixa.focus();
}

// Lembrete de backup na tela inicial: depois de 10 treinos sem nenhum backup, ou 30 dias desde o último.
function cartaoBackup() {
  const hoje = dataLocal(new Date());
  if (estado.historico.length < 10) return null;
  if (estado.ultimoBackup && diasDesde(estado.ultimoBackup) < 30) return null;
  if (estado.backupAdiado && diasDesde(estado.backupAdiado) < 7) return null;
  return h('div', { class: 'backup-cartao', role: 'note' },
    h('p', null, h('strong', null, 'Guarde seus treinos. '), estado.ultimoBackup
      ? `Seu último backup foi em ${dataCurta(estado.ultimoBackup)}.`
      : `Você já tem ${estado.historico.length} treinos, e eles ficam só neste celular.`),
    h('div', null,
      h('button', { class: 'botao secundario', onclick: abrirDados }, 'Fazer backup'),
      h('button', {
        class: 'link',
        onclick: () => {
          estado.backupAdiado = hoje;
          salvar();
          renderInicio();
        },
      }, 'Depois')));
}
