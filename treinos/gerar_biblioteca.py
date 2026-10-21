"""Monta a biblioteca de exercícios do app em treinos/biblioteca/.

Junta os nomes e o passo a passo em português do exercicios-bd-ptbr com as
fotos do free-exercise-db. Para o app carregar centenas de exercícios com
poucos arquivos, as fotos vão em folhas (sprites):

- miniaturas-N.jpg: 100 miniaturas 150x100 (posição inicial), grade 10x10
- fotos-a-N.jpg / fotos-b-N.jpg: 25 fotos 480x320 (posição inicial e final), grade 5x5

O índice de cada exercício em exercicios.json diz onde ele está nas folhas.

Uso:
    python3 treinos/gerar_biblioteca.py --fotos ../free-exercise-db --ptbr ../exercicios-bd-ptbr

Requisitos: Python 3 com Pillow.
"""

import argparse
import json
import unicodedata
from pathlib import Path

from PIL import Image, ImageFilter

AQUI = Path(__file__).resolve().parent
CATEGORIAS = {"forca", "powerlifting"}
ORDEM_MUSCULOS = [
    "peito", "ombros", "triceps", "dorsais", "meio-das-costas", "trapezio", "biceps",
    "antebracos", "quadriceps", "isquiotibiais", "gluteos", "adutores", "abdutores",
    "panturrilhas", "abdominais", "inferior-das-costas", "pescoco",
]
MINI = (150, 100, 10)  # largura, altura, colunas (e linhas)
FOTO = (480, 320, 5)
FUNDO = (37, 42, 51)


def sem_acento(texto):
    return unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()


def quadro(img, w, h):
    """Foto inteira dentro de w×h, sobre um fundo desfocado da própria foto."""
    escala = max(w / img.width, h / img.height)
    fundo = img.resize((round(img.width * escala), round(img.height * escala)), Image.Resampling.LANCZOS)
    x, y = (fundo.width - w) // 2, (fundo.height - h) // 2
    fundo = fundo.crop((x, y, x + w, y + h)).filter(ImageFilter.GaussianBlur(12))
    fundo = Image.blend(fundo, Image.new("RGB", (w, h), FUNDO), 0.5)
    escala = min(w / img.width, h / img.height)
    frente = img.resize((round(img.width * escala), round(img.height * escala)), Image.Resampling.LANCZOS)
    fundo.paste(frente, ((w - frente.width) // 2, (h - frente.height) // 2))
    return fundo


def folhas(fotos, w, h, colunas, prefixo, saida, qualidade):
    por_folha = colunas * colunas
    for n in range(0, len(fotos), por_folha):
        # A grade é sempre completa, para o CSS calcular as posições do mesmo jeito em toda folha.
        folha = Image.new("RGB", (w * colunas, h * colunas), FUNDO)
        for i, img in enumerate(fotos[n:n + por_folha]):
            folha.paste(quadro(img, w, h), ((i % colunas) * w, (i // colunas) * h))
        folha.save(saida / f"{prefixo}-{n // por_folha}.jpg", quality=qualidade, optimize=True, progressive=True)


def main():
    p = argparse.ArgumentParser(description="Monta a biblioteca de exercícios do app.")
    p.add_argument("--fotos", type=Path, default=AQUI.parent.parent / "free-exercise-db",
                   help="pasta do clone do free-exercise-db")
    p.add_argument("--ptbr", type=Path, default=AQUI.parent.parent / "exercicios-bd-ptbr",
                   help="pasta do clone do exercicios-bd-ptbr")
    p.add_argument("--saida", type=Path, default=AQUI / "biblioteca")
    args = p.parse_args()

    dados = json.loads((args.ptbr / "exercises" / "exercises-ptbr-full-translation.json").read_text(encoding="utf-8"))
    escolhidos = [e for e in dados if e["category"] in CATEGORIAS and len(e["images"]) >= 2]
    ordem = {m: i for i, m in enumerate(ORDEM_MUSCULOS)}
    escolhidos.sort(key=lambda e: (ordem.get((e["primaryMuscles"] or ["~"])[0], 99), sem_acento(e["name"])))

    args.saida.mkdir(parents=True, exist_ok=True)
    itens, iniciais, finais = [], [], []
    for e in escolhidos:
        par = []
        for k in (0, 1):
            caminho = args.fotos / "exercises" / e["id"] / f"{k}.jpg"
            if not caminho.exists():
                raise SystemExit(f"Foto não encontrada: {caminho}")
            par.append(Image.open(caminho).convert("RGB"))
        iniciais.append(par[0])
        finais.append(par[1])
        itens.append({
            "id": e["id"],
            "nome": e["name"],
            "musculos": e["primaryMuscles"],
            "auxiliares": e["secondaryMuscles"],
            "equipamento": e.get("equipment"),
            "nivel": e.get("level"),
            "mecanica": e.get("mechanic"),
            "passos": e["instructions"],
        })

    folhas(iniciais, *MINI, "miniaturas", args.saida, 72)
    folhas(iniciais, *FOTO, "fotos-a", args.saida, 74)
    folhas(finais, *FOTO, "fotos-b", args.saida, 74)
    (args.saida / "exercicios.json").write_text(
        json.dumps({"exercicios": itens}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(itens)} exercícios em {args.saida}")


if __name__ == "__main__":
    main()
