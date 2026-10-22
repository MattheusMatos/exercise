"""Gera vídeos verticais (1080x1920) dos treinos do programa PPL.

Cada exercício aparece com as fotos do free-exercise-db (domínio público)
alternando entre a posição inicial e a final, mais séries, RIR, descanso,
músculos trabalhados e dicas de execução.

Antes, clone as fotos:
    git clone --depth 1 https://github.com/MattheusMatos/free-exercise-db

Uso:
    python3 treinos/gerar_videos.py --fotos ../free-exercise-db            # todos
    python3 treinos/gerar_videos.py --fotos ../free-exercise-db push_a     # só um

Requisitos: Python 3 com Pillow e ffmpeg (libx264) no PATH.
"""

import argparse
import json
import subprocess
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = Path(__file__).resolve().parent

W, H = 1080, 1920
FPS = 30
MARGEM = 60
TRANSICAO = 0.5  # segundos de fusão entre slides
POSE = 0.9  # segundos parado em cada posição da foto
FUSAO_POSE = 0.35  # segundos de fusão entre as duas posições
DUR_INTRO, DUR_EXERCICIO, DUR_RESUMO = 5.0, 8.0, 7.0

BG = (15, 17, 21)
CARD = (27, 30, 37)
TRILHA = (52, 56, 66)
TEXT = (240, 242, 245)
MUTED = (150, 156, 168)
ACCENT = (255, 107, 53)
SECONDARY = (64, 156, 255)

FOTO_Y = 120
FOTO_W = W - 2 * MARGEM
FOTO_H = FOTO_W * 2 // 3

FONT_DIR = Path("/usr/share/fonts/opentype/inter")
_fontes = {}


def font(peso, tamanho):
    chave = (peso, tamanho)
    if chave not in _fontes:
        negrito = peso in ("SemiBold", "Bold", "Black")
        for caminho in (
            FONT_DIR / f"Inter-{peso}.otf",
            f"Inter-{peso}.otf",
            "DejaVuSans-Bold.ttf" if negrito else "DejaVuSans.ttf",
        ):
            try:
                _fontes[chave] = ImageFont.truetype(str(caminho), tamanho)
                break
            except OSError:
                continue
        else:
            raise SystemExit("Nenhuma fonte encontrada: instale a Inter ou a DejaVu Sans")
    return _fontes[chave]


def quebrar(d, texto, fnt, max_w, max_linhas=None):
    linhas, atual = [], ""
    for palavra in texto.split():
        teste = f"{atual} {palavra}".strip()
        if not atual or d.textlength(teste, font=fnt) <= max_w:
            atual = teste
        else:
            linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    if max_linhas and len(linhas) > max_linhas:
        ultima = " ".join(linhas[max_linhas - 1:])
        while d.textlength(ultima + "…", font=fnt) > max_w:
            ultima = ultima[:-1]
        linhas = linhas[:max_linhas - 1] + [ultima.rstrip() + "…"]
    return linhas


def cobrir(img, w, h):
    """Redimensiona e corta pelo centro para preencher w×h."""
    escala = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * escala), round(img.height * escala)), Image.Resampling.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def cartao_foto(img, w, h):
    """Foto inteira, sem cortes, sobre um fundo desfocado da própria foto."""
    fundo = cobrir(img, w, h).filter(ImageFilter.GaussianBlur(28))
    fundo = Image.blend(fundo, Image.new("RGB", (w, h), BG), 0.5)
    escala = min(w / img.width, h / img.height)
    frente = img.resize((round(img.width * escala), round(img.height * escala)), Image.Resampling.LANCZOS)
    fundo.paste(frente, ((w - frente.width) // 2, (h - frente.height) // 2))
    return fundo


def colar_arredondado(base, img, xy, raio):
    mascara = Image.new("L", img.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius=raio, fill=255)
    base.paste(img, xy, mascara)


def cabecalho(d, texto):
    d.text((MARGEM, 72), texto, font=font("Bold", 32), fill=ACCENT)


def chips(d, y, itens, cor):
    fnt = font("SemiBold", 34)
    x = MARGEM
    for item in itens:
        w = d.textlength(item, font=fnt) + 56
        if x > MARGEM and x + w > W - MARGEM:
            x = MARGEM
            y += 78
        d.rounded_rectangle((x, y, x + w, y + 64), radius=32, fill=cor)
        d.text((x + 28, y + 32), item, font=fnt, fill=BG, anchor="lm")
        x += w + 14
    return y + 64


def barras(img, total, atual, progresso):
    """Barras no topo, estilo stories: uma por slide."""
    d = ImageDraw.Draw(img)
    gap = 8
    larg = (W - 2 * MARGEM - gap * (total - 1)) / total
    for i in range(total):
        x0 = MARGEM + i * (larg + gap)
        d.rounded_rectangle((x0, 34, x0 + larg, 42), radius=4, fill=TRILHA)
        if i < atual:
            d.rounded_rectangle((x0, 34, x0 + larg, 42), radius=4, fill=TEXT)
        elif i == atual and larg * progresso >= 8:
            d.rounded_rectangle((x0, 34, x0 + larg * progresso, 42), radius=4, fill=ACCENT)


def caber(d, texto, peso, tamanho, largura, minimo=24):
    """Maior fonte, até tamanho, em que o texto cabe na largura."""
    while tamanho > minimo and d.textlength(texto, font=font(peso, tamanho)) > largura:
        tamanho -= 2
    return font(peso, tamanho)


def slide_intro(treino, fotos, regras, titulo):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    cabecalho(d, titulo.upper() if "mobilidade" in titulo.lower() else f"{titulo.upper()} · HIPERTROFIA")
    d.text((MARGEM - 6, 190), treino["titulo"], font=font("Black", 180), fill=TEXT)
    d.text((MARGEM, 420), treino["foco"], font=font("Medium", 56), fill=MUTED)
    d.rectangle((MARGEM, 520, MARGEM + 200, 532), fill=ACCENT)

    series = sum(e["series"] for e in treino["exercicios"])
    y = 580
    for rotulo, valor in [
        ("Exercícios", str(len(treino["exercicios"]))),
        ("Séries", str(series)),
        ("Duração", treino["duracao"]),
    ]:
        d.text((MARGEM, y), rotulo, font=font("Regular", 42), fill=MUTED)
        d.text((W - MARGEM, y - 4), valor, font=font("Bold", 50), fill=TEXT, anchor="ra")
        y += 84

    gap = 16
    tw = (W - 2 * MARGEM - 2 * gap) // 3
    th = tw * 2 // 3
    y0 = y + 44
    for i, (inicial, _final) in enumerate(fotos):
        x = MARGEM + (i % 3) * (tw + gap)
        yy = y0 + (i // 3) * (th + gap)
        colar_arredondado(img, cobrir(inicial, tw, th), (x, yy), 20)
        d.rounded_rectangle((x + 12, yy + 12, x + 60, yy + 60), radius=12, fill=ACCENT)
        d.text((x + 36, yy + 36), str(i + 1), font=font("Black", 30), fill=BG, anchor="mm")

    y = y0 + ((len(fotos) + 2) // 3) * (th + gap) + 40
    d.rounded_rectangle((MARGEM, y, W - MARGEM, y + 120 + 62 * len(regras)), radius=32, fill=CARD)
    d.text((MARGEM + 44, y + 36), "Regras do dia", font=font("Bold", 42), fill=TEXT)
    for i, regra in enumerate(regras):
        texto = "•  " + regra
        d.text((MARGEM + 44, y + 110 + i * 62), texto, font=caber(d, texto, "Regular", 36, W - 2 * MARGEM - 88), fill=MUTED)
    return img


def slide_exercicio(treino, i, ex, fotos):
    """Devolve dois quadros do mesmo slide: um com cada foto."""
    base = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(base)
    cabecalho(d, f"{treino['titulo']} · EXERCÍCIO {i}/{len(treino['exercicios'])}")

    y = FOTO_Y + FOTO_H + 40
    for linha in quebrar(d, ex["nome"], font("Bold", 80), W - 2 * MARGEM, max_linhas=2):
        d.text((MARGEM, y), linha, font=font("Bold", 80), fill=TEXT)
        y += 94
    y += 24

    caixa_w = (W - 2 * MARGEM - 2 * 16) // 3
    for j, (rotulo, valor) in enumerate([
        ("SÉRIES × REPS", f"{ex['series']} × {ex['reps']}"),
        ("RIR", ex["rir"]),
        ("DESCANSO", ex["descanso"]),
    ]):
        x = MARGEM + j * (caixa_w + 16)
        d.rounded_rectangle((x, y, x + caixa_w, y + 150), radius=28, fill=CARD)
        d.text((x + 28, y + 28), rotulo, font=font("SemiBold", 26), fill=MUTED)
        d.text((x + 28, y + 70), valor, font=caber(d, valor, "Bold", 50, caixa_w - 56), fill=TEXT)
    y += 150 + 36

    y = chips(d, y, ex["primarios"], ACCENT)
    if ex["secundarios"]:
        y = chips(d, y + 14, ex["secundarios"], SECONDARY)
    y += 22
    legenda = font("Regular", 30)
    d.ellipse((MARGEM + 4, y + 9, MARGEM + 24, y + 29), fill=ACCENT)
    d.text((MARGEM + 36, y), "principal", font=legenda, fill=MUTED)
    if ex["secundarios"]:
        x = MARGEM + 36 + d.textlength("principal", font=legenda) + 40
        d.ellipse((x, y + 9, x + 20, y + 29), fill=SECONDARY)
        d.text((x + 32, y), "auxiliar", font=legenda, fill=MUTED)
    y += 68

    fnt = font("Regular", 38)
    blocos = [quebrar(d, dica, fnt, W - 2 * MARGEM - 128) for dica in ex["dicas"]]
    altura = 160 + sum(54 * len(b) for b in blocos) + 18 * (len(blocos) - 1)
    if y + altura > H - 70:
        raise SystemExit(f"O texto de '{ex['nome']}' não cabe no slide")
    d.rounded_rectangle((MARGEM, y, W - MARGEM, y + altura), radius=32, fill=CARD)
    d.text((MARGEM + 44, y + 38), "Execução", font=font("Bold", 42), fill=TEXT)
    ty = y + 116
    for bloco in blocos:
        d.ellipse((MARGEM + 48, ty + 19, MARGEM + 63, ty + 34), fill=ACCENT)
        for linha in bloco:
            d.text((MARGEM + 84, ty), linha, font=fnt, fill=TEXT)
            ty += 54
        ty += 18

    quadros = []
    for foto in fotos:
        q = base.copy()
        colar_arredondado(q, cartao_foto(foto, FOTO_W, FOTO_H), (MARGEM, FOTO_Y), 32)
        dq = ImageDraw.Draw(q)
        selo_y = FOTO_Y + FOTO_H - 104
        dq.rounded_rectangle((MARGEM + 24, selo_y, MARGEM + 164, selo_y + 80), radius=20, fill=ACCENT)
        dq.text((MARGEM + 94, selo_y + 40), f"{i:02d}", font=font("Black", 56), fill=BG, anchor="mm")
        quadros.append(q)
    return quadros


def slide_resumo(treino, fotos, progressao, proximo):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    cabecalho(d, f"{treino['titulo']} · RESUMO")
    d.text((MARGEM, 130), "Resumo", font=font("Black", 110), fill=TEXT)

    y = 300
    tw, th = 162, 108
    fnt_nome, fnt_serie = font("SemiBold", 34), font("Bold", 38)
    for ex, (inicial, _final) in zip(treino["exercicios"], fotos):
        d.rounded_rectangle((MARGEM, y, W - MARGEM, y + 136), radius=24, fill=CARD)
        colar_arredondado(img, cobrir(inicial, tw, th), (MARGEM + 14, y + 14), 16)
        serie = f"{ex['series']} × {ex['reps']}"
        d.text((W - MARGEM - 28, y + 68), serie, font=fnt_serie, fill=TEXT, anchor="rm")
        nome_x = MARGEM + 14 + tw + 24
        max_w = W - MARGEM - 28 - d.textlength(serie, font=fnt_serie) - 24 - nome_x
        linhas = quebrar(d, ex["nome"], fnt_nome, max_w, max_linhas=2)
        ly = y + 68 - 22 * (len(linhas) - 1)
        for linha in linhas:
            d.text((nome_x, ly), linha, font=fnt_nome, fill=TEXT, anchor="lm")
            ly += 44
        y += 150

    y += 40
    d.text((MARGEM, y), "Progressão", font=font("Bold", 52), fill=ACCENT)
    y += 84
    for linha in quebrar(d, progressao, font("Regular", 40), W - 2 * MARGEM):
        d.text((MARGEM, y), linha, font=font("Regular", 40), fill=MUTED)
        y += 56

    y += 40
    texto = f"Próximo: {proximo}"
    fnt = font("Bold", 38)
    d.rounded_rectangle((MARGEM, y, MARGEM + d.textlength(texto, font=fnt) + 64, y + 76), radius=38, fill=CARD)
    d.text((MARGEM + 32, y + 38), texto, font=fnt, fill=TEXT, anchor="lm")

    d.text((MARGEM, H - 100), "Fotos: free-exercise-db (domínio público)", font=font("Regular", 26), fill=MUTED)
    return img


def alpha_pose(t):
    """0 = posição inicial, 1 = final; alterna com fusão suave."""
    ciclo = 2 * (POSE + FUSAO_POSE)
    f = t % ciclo
    if f < POSE:
        a = 0.0
    elif f < POSE + FUSAO_POSE:
        a = (f - POSE) / FUSAO_POSE
    elif f < 2 * POSE + FUSAO_POSE:
        a = 1.0
    else:
        a = 1 - (f - 2 * POSE - FUSAO_POSE) / FUSAO_POSE
    return a * a * (3 - 2 * a)


def animado(inicial, final):
    def quadro(t):
        a = alpha_pose(t)
        if a <= 0:
            return inicial
        if a >= 1:
            return final
        return Image.blend(inicial, final, a)
    return quadro


def gerar(programa, indice, pasta_fotos, saida):
    treinos = programa["treinos"]
    treino = treinos[indice]
    fotos = []
    for ex in treino["exercicios"]:
        par = []
        for k in (0, 1):
            caminho = pasta_fotos / "exercises" / ex["imagem"] / f"{k}.jpg"
            if not caminho.exists():
                raise SystemExit(f"Foto não encontrada: {caminho}")
            par.append(Image.open(caminho).convert("RGB"))
        fotos.append(par)

    proximo = treinos[indice + 1]["titulo"] if indice + 1 < len(treinos) else f"descanso e {treinos[0]['titulo']}"
    intro = slide_intro(treino, fotos, programa["regras"], programa.get("titulo", "Treino PPL"))
    resumo = slide_resumo(treino, fotos, programa["progressao"], proximo)
    slides = [(DUR_INTRO, lambda t: intro)]
    for i, (ex, par) in enumerate(zip(treino["exercicios"], fotos), 1):
        slides.append((DUR_EXERCICIO, animado(*slide_exercicio(treino, i, ex, par))))
    slides.append((DUR_RESUMO, lambda t: resumo))

    destino = saida / f"{treino['id']}.mp4"
    ff = subprocess.Popen(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
            "-i", "-",
            "-c:v", "libx264", "-preset", "slow", "-crf", "28",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            str(destino),
        ],
        stdin=subprocess.PIPE,
    )
    nt = round(TRANSICAO * FPS)
    for idx, (dur, quadro) in enumerate(slides):
        n = round(dur * FPS)
        for f in range(n):
            frame = quadro(f / FPS).copy()
            barras(frame, len(slides), idx, (f + 1) / n)
            if idx + 1 < len(slides) and f >= n - nt:
                prox = slides[idx + 1][1](0.0).copy()
                barras(prox, len(slides), idx + 1, 0.0)
                frame = Image.blend(frame, prox, (f - (n - nt) + 1) / (nt + 1))
            ff.stdin.write(frame.tobytes())
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit(f"ffmpeg falhou ao gerar {destino}")
    return destino


def main():
    p = argparse.ArgumentParser(description="Gera os vídeos dos treinos do programa PPL.")
    p.add_argument("treinos", nargs="*", help="ids dos treinos a gerar (padrão: todos)")
    p.add_argument("--fotos", type=Path, default=AQUI.parent.parent / "free-exercise-db",
                   help="pasta do clone do free-exercise-db")
    p.add_argument("--programa", type=Path, default=AQUI / "programa_ppl.json")
    p.add_argument("--saida", type=Path, default=AQUI / "videos")
    args = p.parse_args()

    if not (args.fotos / "exercises").is_dir():
        raise SystemExit(
            f"Não achei as fotos em {args.fotos}. Clone com:\n"
            "  git clone --depth 1 https://github.com/MattheusMatos/free-exercise-db\n"
            "e passe o caminho em --fotos."
        )
    programa = json.loads(args.programa.read_text(encoding="utf-8"))
    ids = [t["id"] for t in programa["treinos"]]
    desconhecidos = set(args.treinos) - set(ids)
    if desconhecidos:
        raise SystemExit(f"Treinos desconhecidos: {', '.join(sorted(desconhecidos))}. Opções: {', '.join(ids)}")
    escolhidos = args.treinos or ids

    args.saida.mkdir(parents=True, exist_ok=True)
    with ProcessPoolExecutor() as pool:
        tarefas = [pool.submit(gerar, programa, ids.index(i), args.fotos, args.saida) for i in escolhidos]
        for tarefa in tarefas:
            print(f"Vídeo salvo em {tarefa.result()}")


if __name__ == "__main__":
    main()
