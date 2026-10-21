"""Copia as fotos dos exercícios do programa para treinos/fotos/, reduzidas para o app.

Rode de novo sempre que trocar um exercício em programa_ppl.json.

Uso:
    python3 treinos/copiar_fotos.py --fotos ../free-exercise-db

Requisitos: Python 3 com Pillow.
"""

import argparse
import json
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parent
LADO_MAX = 720


def main():
    p = argparse.ArgumentParser(description="Copia as fotos usadas pelo app de treino.")
    p.add_argument("--fotos", type=Path, default=AQUI.parent.parent / "free-exercise-db",
                   help="pasta do clone do free-exercise-db")
    p.add_argument("--programa", type=Path, default=AQUI / "programa_ppl.json")
    p.add_argument("--saida", type=Path, default=AQUI / "fotos")
    args = p.parse_args()

    programa = json.loads(args.programa.read_text(encoding="utf-8"))
    ids = sorted({ex["imagem"] for treino in programa["treinos"] for ex in treino["exercicios"]})
    args.saida.mkdir(parents=True, exist_ok=True)
    for ex_id in ids:
        for k in (0, 1):
            origem = args.fotos / "exercises" / ex_id / f"{k}.jpg"
            if not origem.exists():
                raise SystemExit(f"Foto não encontrada: {origem}")
            img = Image.open(origem).convert("RGB")
            img.thumbnail((LADO_MAX, LADO_MAX), Image.Resampling.LANCZOS)
            img.save(args.saida / f"{ex_id}-{k}.jpg", quality=80, optimize=True, progressive=True)
    print(f"{len(ids) * 2} fotos salvas em {args.saida}")


if __name__ == "__main__":
    main()
