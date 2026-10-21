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
import re
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


def tem(nome, *palavras):
    return any(p in nome for p in palavras)


def extensao_triceps(n):
    if tem(n, "pushdown", "push down", "kickback", "bent over", "machine triceps", "cable one arm",
           "chain handle", "body up", "body tricep"):
        return "triceps-polia"  # braço ao lado do corpo
    return "triceps-acima"  # braço acima da cabeça ou deitado: cabeça longa alongada


def padrao_movimento(e):
    """Padrão de movimento pelo nome em inglês (o id) e pelo músculo principal.

    A base não traz esse campo, e ele pesa muito na hora de sugerir uma troca:
    leg press e cadeira extensora trabalham quadríceps, mas só o leg press
    substitui bem um agachamento. As palavras são buscadas com espaços em volta
    para "chin" não casar com "machine", por exemplo.
    """
    n = " " + re.sub(r"[\s_\-]+", " ", e["id"].lower()).strip() + " "
    m = (e["primaryMuscles"] or [""])[0]

    if m == "abdominais":
        if tem(n, "twist", "russian", "wood chop", "side bend", "oblique", "windmill", "180", "figure 8",
               "judo", "spell caster", "heel touch", "side jackknife", "cable lift", "pass between", "rotation"):
            return "abdomen-rotacao"
        if tem(n, "plank", "pallof", "side bridge", "dead bug", "rollout", "ab roller", "fallout", "spider crawl"):
            return "abdomen-estabilidade"
        if tem(n, "leg raise", "knee raise", "knee hip raise", "reverse crunch", "pull in", "leg pull", "hip raise",
               "pike", "leg tucks", "butt ups", "bottoms up", "cocoons"):
            return "abdomen-infra"  # elevar as pernas, em vez de enrolar o tronco
        return "abdomen-flexao"
    if m == "pescoco":
        return "pescoco"
    if tem(n, "wrist", "finger curl", "plate pinch", "hand squeeze") or (m == "antebracos" and " curl" not in n):
        return "punho"
    if "squat" in n and not tem(n, "jump", "jerk", "get up"):
        return "avanco" if tem(n, "split squat", "pistol", " one leg ", "single leg") else "agachamento"
    if m == "triceps" and "extension" in n:
        return extensao_triceps(n)
    if "push press" in n:
        return "desenvolvimento"
    if tem(n, "clean", "snatch", "jerk", "swing", "thruster", "get up", "muscle up", "rope climb", "battling",
           "sled", "pirate", "car drivers", "jammer", "slam", "jump", "london bridge", "pass through", "sprint"):
        return "potencia"
    if tem(n, "monster walk", "abduct"):
        return "abducao"
    if "adduct" in n:
        return "aducao"
    if "shrug" in n:
        return "encolhimento"
    if "calf" in n:
        return "panturrilha-sentada" if "seated" in n else "panturrilha"  # joelho dobrado: mais sóleo
    if tem(n, "upright", " high pull ", "row to neck"):
        return "remada-alta"
    if tem(n, "rear delt", "reverse fly", "reverse machine fly", "back flyes", "face pull", "rear lateral",
           "pull apart", "bent over low pulley side lateral"):
        return "posterior-ombro"
    if tem(n, "external rotation", "internal rotation", "cuban press"):
        return "rotacao-ombro"
    if tem(n, "lateral", "deltoid raise", "scaption", "power partials", "straight raises"):
        return "elevacao-lateral"
    if tem(n, "front raise", "front plate raise", "front two dumbbell raise", "front dumbbell raise",
           "front cable raise", "front barbell raise", "front delt raise", "front incline dumbbell raise",
           "single dumbbell raise"):
        return "elevacao-frontal"
    if tem(n, "pullover", "straight arm pulldown") or (m == "dorsais" and "pushdown" in n):
        return "pullover"
    if m == "ombros" and tem(n, "press", "handstand", "military"):
        return "desenvolvimento"
    if tem(n, " fly", "flye", "crossover", "cross over", "butterfly", "iron cross", "around the worlds"):
        return "crucifixo"
    if tem(n, " pull up", " pullup", " pull ups", " chin up", " chin ", " chins", "pulldown", "pull down") and "press" not in n:
        return "puxada-vertical"
    if tem(n, " row", "bench pull", "renegade"):
        return "remada"
    if tem(n, "seated leg curl", "seated band hamstring curl"):
        return "flexora-sentada"
    if tem(n, "leg curl", "hamstring curl", "glute ham raise", "hamstring slides", "prone manual hamstring"):
        return "flexora"
    if " curl" in n:
        if " hammer " in n:
            return "rosca-martelo"  # pegada neutra: mais braquial e braquiorradial
        if " reverse " in n:
            return "rosca-inversa"  # pegada pronada: mais braquiorradial
        return "rosca"
    if " dip" in n:
        return "mergulho"
    if m == "triceps":
        if tem(n, "press", "push up", "pushup") and not tem(n, "triceps press", "tricep press", "tate press"):
            return "supino"
        return extensao_triceps(n)
    if m == "peito" and tem(n, "press", "push up", "pushup", "push ups", "wipers", " bench"):
        return "supino"
    if "leg extension" in n:
        return "extensao-joelho"
    if tem(n, "deadlift", "good morning", "hyperextension", "back extension", "pull through", "rack pull"):
        return "quadril"
    if m == "gluteos" and tem(n, "kickback", "leg lift"):
        return "chute-gluteo"
    if tem(n, "lunge", "step up", "single leg high box"):
        return "avanco"
    if tem(n, "leg press", "hack"):
        return "agachamento"
    if tem(n, "hip thrust", "bridge", "hip lift", "hip extension", "butt lift"):
        return "ponte"
    return f"outro-{m or 'geral'}"


# A base chama todo exercício de ombro de "ombros". O padrão de movimento diz
# qual parte do deltoide trabalha.
CABECA_DELTOIDE = {
    "elevacao-lateral": "deltoide-lateral", "remada-alta": "deltoide-lateral",
    "elevacao-frontal": "deltoide-anterior", "desenvolvimento": "deltoide-anterior", "supino": "deltoide-anterior",
    "mergulho": "deltoide-anterior", "crucifixo": "deltoide-anterior",
    "posterior-ombro": "deltoide-posterior", "remada": "deltoide-posterior",
    "puxada-vertical": "deltoide-posterior", "pullover": "deltoide-posterior",
}


def refinar_musculos(primarios, secundarios, padrao):
    cabeca = CABECA_DELTOIDE.get(padrao)
    trocar = lambda lista: list(dict.fromkeys(cabeca if (mus == "ombros" and cabeca) else mus for mus in lista))
    primarios, secundarios = trocar(primarios), trocar(secundarios)
    if padrao == "desenvolvimento" and "deltoide-lateral" not in primarios + secundarios:
        secundarios.append("deltoide-lateral")  # desenvolvimento também trabalha o deltoide lateral
    if padrao == "aducao":
        primarios = ["adutores"]  # a base marca uma das aduções como quadríceps
    if padrao in ("rosca-martelo", "rosca-inversa") and "antebracos" not in primarios + secundarios:
        secundarios.append("antebracos")  # braquiorradial
    return primarios, [mus for mus in secundarios if mus not in primarios]


def incomum(e):
    """Variações que pedem equipamento especial ou são pouco usadas: ficam fora das mais recomendadas."""
    n = " " + re.sub(r"[\s_\-]+", " ", e["id"].lower()).strip() + " "
    return tem(n, "with bands", "with chains", "reverse band", "speed", "board press", "pin press", "neck press",
               "guillotine", "jefferson", "plate movers", "suspended", "bosu", "towel", "manual", "isometric",
               "behind the neck", "rocky", "side to side", "gironda", "anti gravity", "bradford", "seesaw",
               "see saw", "para press", "around the worlds", "iron cross", "power partials", "chain handle",
               "exercise ball", "body up", "kneeling squat", "one arm overhead kettlebell squat", "zercher",
               "off pins", "hanging bar", "chain press", "svend")


# Traduções da base que descrevem outro exercício.
NOMES_CORRIGIDOS = {
    "Cable_Incline_Pushdown": "Pulldown com Braços Estendidos no Banco Inclinado",
    "Dumbbell_Scaption": "Elevação no Plano da Escápula com Halteres",
    "Seated_Dumbbell_Inner_Biceps_Curl": "Rosca com Halteres Sentado (Bíceps Interno)",
    "Standing_Inner-Biceps_Curl": "Rosca em Pé (Bíceps Interno)",
    "Lying_High_Bench_Barbell_Curl": "Rosca com Barra Deitado no Banco Alto",
    "Seated_Dumbbell_Curl": "Rosca com Halteres Sentado",
    "Standing_One-Arm_Dumbbell_Curl_Over_Incline_Bench": "Rosca Unilateral com Halter Apoiado no Banco Inclinado",
    "Flexor_Incline_Dumbbell_Curls": "Rosca Inclinada com Halteres (Flexor)",
    "Lying_Supine_Dumbbell_Curl": "Rosca com Halteres Deitado",
}


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
        padrao = padrao_movimento(e)
        primarios, secundarios = refinar_musculos(e["primaryMuscles"], e["secondaryMuscles"], padrao)
        itens.append({
            "id": e["id"],
            "nome": NOMES_CORRIGIDOS.get(e["id"], e["name"]),
            "musculos": primarios,
            "auxiliares": secundarios,
            "equipamento": e.get("equipment"),
            "nivel": e.get("level"),
            "mecanica": e.get("mechanic"),
            "padrao": padrao,
            "incomum": incomum(e),
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
