// Instalar como app, service worker e o começo: carrega os programas e desenha a primeira tela.
'use strict';

// ---------- instalar como app ----------

let pedidoInstalar = null; // o Chrome do Android oferece instalar; o iPhone não, então ali mostramos o passo a passo
const instalado = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const dentroDeOutraPagina = window.self !== window.top;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  pedidoInstalar = e;
  if (tela === 'inicio' && programa) renderInicio();
});
window.addEventListener('appinstalled', () => {
  pedidoInstalar = null;
  if (tela === 'inicio' && programa) renderInicio();
});

function cartaoInstalar() {
  if (instalado() || dentroDeOutraPagina) return null;
  if (pedidoInstalar) {
    return h('button', {
      class: 'botao secundario',
      onclick: async () => {
        const pedido = pedidoInstalar;
        pedidoInstalar = null;
        pedido.prompt();
        await pedido.userChoice.catch(() => null);
        renderInicio();
      },
    }, 'Instalar como app');
  }
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    return h('p', { class: 'como-usar' },
      h('strong', null, 'Instale no iPhone: '),
      'no Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".');
  }
  return null;
}

if ('serviceWorker' in navigator && window.isSecureContext && !dentroDeOutraPagina && !ACADEMIA) {
  // updateViaCache: 'none' faz o celular buscar o sw.js novo a cada abertura.
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {
    // Sem service worker, o app funciona normal, só não abre sem internet.
  });
}

// ---------- início ----------

Promise.all(Object.entries(ARQUIVOS_PROGRAMA).map(([nome, arquivo]) => fetch(arquivo)
  .then((resposta) => {
    if (!resposta.ok) throw new Error(String(resposta.status));
    return resposta.json();
  })
  .then((dados) => [nome, dados])))
  .then((lista) => {
    programas = Object.fromEntries(lista);
    estado = carregarLocal();
    salvar(); // grava o que a validação acrescentou, como os bloqueios de presente
    programa = programas[estado.perfil.programa];
    selecionado = estado.sessao ? estado.sessao.treino : estado.proximo;
    render();
    if (estado.cronoAerobico) desenharCronometro();
    usarBloqueios();
    conferirApostas();
    if (tela === 'inicio') renderInicio();
    carregarBiblioteca();
  })
  .catch(() => {
    app.replaceChildren(h('section', { class: 'erro' },
      h('h1', null, 'Não deu para carregar os treinos'),
      h('p', null, 'Recarregue a página. Se você abriu o arquivo direto do computador, abra pelo link publicado ou rode um servidor local na pasta treinos.')));
  });
