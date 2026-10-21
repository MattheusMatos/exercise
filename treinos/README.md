# Treinos

| Arquivo | O que é |
|---|---|
| [`programa_ppl.md`](programa_ppl.md) | O programa PPL explicado, com as referências científicas |
| [`programa_ppl.json`](programa_ppl.json) | Os mesmos treinos em dados, usados pelo app e pelos vídeos |
| [`index.html`](index.html), [`app.css`](app.css), [`app.js`](app.js) | App de cartões para seguir o treino no celular |
| [`semelhanca.js`](semelhanca.js) | Calcula o quanto um exercício se parece com outro, para sugerir trocas |
| [`manifest.webmanifest`](manifest.webmanifest), [`sw.js`](sw.js), [`icones/`](icones/) | Deixam o app instalável no celular e funcionando sem internet |
| [`fotos/`](fotos/) | Fotos dos exercícios do programa, usadas pelo app |
| [`biblioteca/`](biblioteca/) | 619 exercícios para trocar no app: dados em português e fotos em folhas |
| [`videos/`](videos/) | Um vídeo vertical por treino (1080×1920, ~1 min) |
| [`gerar_videos.py`](gerar_videos.py) | Gera os vídeos |
| [`copiar_fotos.py`](copiar_fotos.py) | Copia e reduz as fotos do programa para o app |
| [`gerar_biblioteca.py`](gerar_biblioteca.py) | Monta a biblioteca do app |

## App

Cada exercício é um cartão com as fotos animadas, séries, RIR, descanso e dicas de execução:

- toque numa anilha ao terminar cada série e o cronômetro de descanso começa sozinho;
- arraste o cartão para a direita quando terminar o exercício;
- arraste para a esquerda para deixar para depois (ele volta no fim da fila);
- toque em **Trocar** para escolher outro exercício na biblioteca: os mais parecidos com o original vêm primeiro, com a porcentagem de semelhança numa escala de vermelho (pouco parecido) a verde (muito parecido);
- o app lembra qual é o próximo treino, as trocas feitas e retoma um treino interrompido. Tudo fica salvo no navegador do celular, sem login.

### Como a semelhança é calculada

[`semelhanca.js`](semelhanca.js) compara o exercício original com cada opção da biblioteca:

| Parte | Peso | O que mede |
|---|---|---|
| Músculos | 50% | Quanto a opção cobre os músculos principais do original e quanto os músculos coincidem no todo (principal vale 1, auxiliar 0,5) |
| Movimento | 30% | Mesmo padrão de movimento vale 100%; padrões parecidos valem uma parte (agachamento e afundo, 80%) |
| Tipo | 10% | Multiarticular ou isolado |
| Equipamento | 10% | Mesmo equipamento |

Exemplos: leg press no lugar do agachamento dá 87%; cadeira extensora, 46%. O padrão de movimento vem do nome do exercício (`gerar_biblioteca.py`) e também separa o deltoide: a base chama todo exercício de ombro de "ombros", e o padrão diz se é anterior, lateral ou posterior. Algumas trocas têm a nota reduzida com base em estudos: tríceps na polia no lugar do tríceps acima da cabeça (Maeo et al., 2023) e mesa flexora deitada no lugar da sentada (Maeo et al., 2021).

Para testar no computador:

```bash
python3 -m http.server -d treinos 8000
# abra http://localhost:8000
```

## Publicar como site (GitHub Pages)

O app é um site estático: não precisa de servidor, banco de dados nem login.

1. No GitHub, abra o repositório e vá em **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Escolha a branch com estes arquivos e a pasta **/ (root)**, e clique em **Save**.
4. Em um ou dois minutos o site fica no ar em `https://mattheusmatos.github.io/exercise/` (a raiz leva direto ao app).

Cada push nessa branch atualiza o site sozinho.

## Instalar no celular

- **Android (Chrome):** abra o link e toque em **Instalar como app**, na tela inicial do app, ou em **Instalar app** no menu do Chrome.
- **iPhone (Safari):** abra o link, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.

Instalado, ele abre em tela cheia pelo ícone e funciona sem internet depois da primeira abertura (`sw.js` guarda o app e as fotos do programa; os vídeos precisam de internet). O progresso fica no aparelho: no iPhone, o app instalado e o Safari guardam o progresso separado, então instale antes de começar a usar.

Ao trocar fotos ou a biblioteca, mude `VERSAO` em `sw.js` para os celulares baixarem tudo de novo. Mudanças em código e no programa chegam sozinhas na próxima abertura com internet.

## Como gerar os vídeos e as fotos

Requisitos: Python 3 com Pillow, e ffmpeg (com libx264) para os vídeos.

```bash
git clone --depth 1 https://github.com/MattheusMatos/free-exercise-db ../free-exercise-db
python3 treinos/gerar_videos.py --fotos ../free-exercise-db           # todos os vídeos
python3 treinos/gerar_videos.py --fotos ../free-exercise-db pull_b    # só um
python3 treinos/copiar_fotos.py --fotos ../free-exercise-db           # fotos do app

git clone --depth 1 https://github.com/MattheusMatos/exercicios-bd-ptbr ../exercicios-bd-ptbr
python3 treinos/gerar_biblioteca.py --fotos ../free-exercise-db --ptbr ../exercicios-bd-ptbr
```

Para mudar um exercício do programa, edite `programa_ppl.json` e rode `gerar_videos.py` e `copiar_fotos.py` de novo. O campo `imagem` é o nome da pasta do exercício em `free-exercise-db/exercises/`; para achar pelo nome em português, procure no [`exercicios-bd-ptbr`](https://github.com/MattheusMatos/exercicios-bd-ptbr), que usa os mesmos ids.

As fotos são do [free-exercise-db](https://github.com/yuhonas/free-exercise-db), em domínio público (Unlicense).
