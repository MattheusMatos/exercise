# Treinos

| Arquivo | O que é |
|---|---|
| [`programa_ppl.md`](programa_ppl.md) | O programa PPL explicado, com as referências científicas |
| [`programa_ppl.json`](programa_ppl.json) | Os mesmos treinos em dados, usados para gerar os vídeos |
| [`videos/`](videos/) | Um vídeo vertical por treino (1080×1920, ~1 min) |
| [`gerar_videos.py`](gerar_videos.py) | Script que gera os vídeos |

## Como gerar os vídeos

Requisitos: Python 3 com Pillow e ffmpeg (com libx264).

```bash
git clone --depth 1 https://github.com/MattheusMatos/free-exercise-db ../free-exercise-db
python3 treinos/gerar_videos.py --fotos ../free-exercise-db           # todos os treinos
python3 treinos/gerar_videos.py --fotos ../free-exercise-db pull_b    # só um
```

Para trocar um exercício, edite `programa_ppl.json`. O campo `imagem` é o nome da pasta do exercício em `free-exercise-db/exercises/`; para achar pelo nome em português, procure no [`exercicios-bd-ptbr`](https://github.com/MattheusMatos/exercicios-bd-ptbr), que usa os mesmos ids.

As fotos são do [free-exercise-db](https://github.com/yuhonas/free-exercise-db), em domínio público (Unlicense).
