// Guarda o app no celular para abrir rápido e funcionar sem internet na academia.
// Ao mudar fotos ou a biblioteca, troque VERSAO para o celular baixar tudo de novo.
const VERSAO = 'treino-ppl-v8';
const PROGRAMAS = [
  'programa_ppl.json',
  'programa_feminino.json',
  'programa_iniciante_m.json',
  'programa_avancado_m.json',
  'programa_iniciante_f.json',
  'programa_avancado_f.json',
  'programa_mobilidade.json',
];
const ESSENCIAIS = [
  './',
  'index.html',
  'app.css',
  'app.js',
  'semelhanca.js',
  'ofensiva.js',
  'avatar.js',
  'aerobico.js',
  ...PROGRAMAS,
  'biblioteca/exercicios.json',
  'manifest.webmanifest',
  'icones/icone-192.png',
  'icones/icone-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    await cache.addAll(ESSENCIAIS);
    try {
      // Fotos de todos os programas, para o treino abrir completo mesmo sem sinal.
      const programas = await Promise.all(PROGRAMAS.map(async (arquivo) => (await cache.match(arquivo)).json()));
      const fotos = programas.flatMap((programa) => programa.treinos.flatMap((treino) =>
        treino.exercicios.flatMap((ex) => [`fotos/${ex.imagem}-0.jpg`, `fotos/${ex.imagem}-1.jpg`])));
      const nomes = ['brutus', 'otto', 'capi', 'zeca', 'duda', 'nina', 'ravi', 'bento', 'bia', 'joca', 'nino'];
      const personagens = nomes.flatMap((n) => ['comecando', 'auge', 'afastado', 'volta', 'comemora', 'descanso-1', 'descanso-2'].map((f) => `personagens/${n}-${f}.webp`));
      const aerobicos = ['Walking_Treadmill', 'Running_Treadmill', 'Bicycling_Stationary', 'Elliptical_Trainer', 'Stairmaster', 'Rowing_Stationary'].map((n) => `fotos/${n}-0.jpg`);
      await cache.addAll([...new Set(fotos), ...personagens, ...aerobicos]);
    } catch (erro) {
      // As fotos entram no cache quando aparecerem na tela.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter((nome) => nome !== VERSAO).map((nome) => caches.delete(nome)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (url.pathname.endsWith('.mp4')) return; // vídeos vão direto à rede: o navegador os pede em partes
  const fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonte) return;
  // Fotos e fontes quase não mudam: do cache primeiro. Código e dados: da rede primeiro, para pegar atualizações.
  const imagem = /\.(jpg|jpeg|png|webp)$/i.test(url.pathname);
  evento.respondWith(fonte || imagem ? cachePrimeiro(pedido) : redePrimeiro(pedido));
});

async function cachePrimeiro(pedido) {
  const cache = await caches.open(VERSAO);
  const guardado = await cache.match(pedido);
  if (guardado) return guardado;
  const resposta = await fetch(pedido);
  if (resposta.ok || resposta.type === 'opaque') cache.put(pedido, resposta.clone());
  return resposta;
}

async function redePrimeiro(pedido) {
  const cache = await caches.open(VERSAO);
  const daRede = fetch(pedido).then((resposta) => {
    if (resposta.ok) cache.put(pedido, resposta.clone());
    return resposta;
  });
  const guardado = await cache.match(pedido, { ignoreSearch: true });
  if (!guardado) return daRede;
  daRede.catch(() => {});
  // Com uma cópia guardada, espera a rede no máximo 3 s: sinal ruim não trava a abertura.
  const limite = new Promise((resolve) => setTimeout(() => resolve(guardado), 3000));
  try {
    return await Promise.race([daRede, limite]);
  } catch (erro) {
    return guardado;
  }
}
