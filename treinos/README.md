# Treinos

| Arquivo | O que é |
|---|---|
| [`programa_ppl.md`](programa_ppl.md) | O programa PPL explicado, com as referências científicas |
| [`programa_ppl.json`](programa_ppl.json) | Os mesmos treinos em dados, usados pelo app e pelos vídeos |
| [`index.html`](index.html), [`app.css`](app.css), [`app.js`](app.js) | App de cartões para seguir o treino no celular |
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
- toque em **Trocar** para escolher outro exercício na biblioteca, com busca e filtro por músculo e equipamento;
- o app lembra qual é o próximo treino, as trocas feitas e retoma um treino interrompido.

Aberto pelo claude.ai por alguém que entrou na própria conta e tem permissão de editar, o app cumprimenta pelo nome e salva o progresso na conta da pessoa, em qualquer aparelho. Nos outros casos (link público, só visualização, GitHub Pages), salva no navegador do aparelho.

Para testar no computador:

```bash
python3 -m http.server -d treinos 8000
# abra http://localhost:8000
```

Para publicar de graça no GitHub Pages: em **Settings → Pages**, escolha **Deploy from a branch**, a branch com estes arquivos e a pasta **/ (root)**. O app fica em `https://mattheusmatos.github.io/exercise/treinos/`.

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
