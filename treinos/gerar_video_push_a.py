"""Gera um vídeo vertical (1080x1920) em formato slideshow com o treino Push A.

Uso:
    python3 treinos/gerar_video_push_a.py [saida.mp4]

Requisitos: Python 3 com Pillow e ffmpeg (libx264) no PATH.
"""

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30
FADE = 0.5  # segundos de transição entre slides

BG = (15, 17, 21)
CARD = (27, 30, 37)
TEXT = (240, 242, 245)
MUTED = (150, 156, 168)
ACCENT = (255, 107, 53)
SECONDARY = (64, 156, 255)

FONT_DIR = Path("/usr/share/fonts/opentype/inter")


def font(weight, size):
    return ImageFont.truetype(str(FONT_DIR / f"Inter-{weight}.otf"), size)


EXERCICIOS = [
    {
        "nome": "Supino reto com barra",
        "series": "3 × 6–10",
        "rir": "RIR 1–2",
        "descanso": "2–3 min",
        "primarios": ["Peitoral maior"],
        "secundarios": ["Deltoide anterior", "Tríceps"],
        "dicas": [
            "Escápulas retraídas e deprimidas",
            "Desça em 2–3 s até a linha do mamilo",
            "Pés firmes no chão, leve arco lombar",
        ],
    },
    {
        "nome": "Supino inclinado com halteres",
        "series": "3 × 8–12",
        "rir": "RIR 1–2",
        "descanso": "2–3 min",
        "primarios": ["Peitoral (porção clavicular)"],
        "secundarios": ["Deltoide anterior", "Tríceps"],
        "dicas": [
            "Banco a ~30°",
            "Desça até sentir o peito alongar",
            "Cotovelos a ~45° do tronco",
        ],
    },
    {
        "nome": "Crucifixo no cabo ou peck deck",
        "series": "2 × 12–15",
        "rir": "RIR 0–1",
        "descanso": "1–2 min",
        "primarios": ["Peitoral maior"],
        "secundarios": ["Deltoide anterior"],
        "dicas": [
            "Cotovelos levemente flexionados e fixos",
            "Ênfase na fase alongada",
            "Pausa de 1 s na contração",
        ],
    },
    {
        "nome": "Elevação lateral no cabo",
        "series": "4 × 12–20",
        "rir": "RIR 0–1",
        "descanso": "1–2 min",
        "primarios": ["Deltoide lateral"],
        "secundarios": ["Trapézio superior"],
        "dicas": [
            "Cabo passando por trás do corpo",
            "Suba até a linha do ombro",
            "Sem balanço do tronco",
        ],
    },
    {
        "nome": "Tríceps acima da cabeça no cabo",
        "series": "3 × 10–15",
        "rir": "RIR 0–1",
        "descanso": "1–2 min",
        "primarios": ["Tríceps (cabeça longa)"],
        "secundarios": [],
        "dicas": [
            "Cotovelos apontados para a frente",
            "Alongamento total atrás da cabeça",
            "~40% mais hipertrofia que na polia (Maeo 2023)",
        ],
    },
    {
        "nome": "Tríceps na polia (pushdown)",
        "series": "2 × 12–15",
        "rir": "RIR 0–1",
        "descanso": "1 min",
        "primarios": ["Tríceps (cabeças lateral e medial)"],
        "secundarios": [],
        "dicas": [
            "Cotovelos colados ao corpo",
            "Extensão completa embaixo",
            "Controle a volta em 2 s",
        ],
    },
]


def wrap(draw, text, fnt, max_w):
    linhas, atual = [], ""
    for palavra in text.split():
        teste = f"{atual} {palavra}".strip()
        if draw.textlength(teste, font=fnt) <= max_w:
            atual = teste
        else:
            linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    return linhas


def chips(draw, x, y, itens, cor, max_x):
    fnt = font("SemiBold", 36)
    for item in itens:
        tw = draw.textlength(item, font=fnt)
        w = tw + 56
        if x + w > max_x:
            x = 80
            y += 84
        draw.rounded_rectangle((x, y, x + w, y + 68), radius=34, fill=cor)
        draw.text((x + 28, y + 13), item, font=fnt, fill=BG)
        x += w + 16
    return y + 68


def base(titulo_topo):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((80, 110), titulo_topo, font=font("Bold", 34), fill=ACCENT)
    return img, d


def slide_intro():
    img, d = base("TREINO PPL · HIPERTROFIA")
    d.text((80, 520), "PUSH A", font=font("Black", 190), fill=TEXT)
    d.text((86, 760), "Foco em peito", font=font("Medium", 64), fill=MUTED)
    d.rectangle((86, 880, 286, 892), fill=ACCENT)

    y = 1000
    for rotulo, valor in [
        ("Exercícios", "6"),
        ("Séries totais", "17"),
        ("Duração", "~60 min"),
    ]:
        d.text((86, y), rotulo, font=font("Regular", 44), fill=MUTED)
        vw = d.textlength(valor, font=font("Bold", 52))
        d.text((W - 86 - vw, y - 4), valor, font=font("Bold", 52), fill=TEXT)
        y += 96

    d.rounded_rectangle((80, 1380, W - 80, 1700), radius=32, fill=CARD)
    d.text((124, 1420), "Regras do dia", font=font("Bold", 44), fill=TEXT)
    for i, regra in enumerate([
        "Compostos: 1–2 reps na reserva",
        "Isoladores: 0–1 rep na reserva",
        "Fase excêntrica controlada (2–3 s)",
    ]):
        d.text((124, 1500 + i * 62), "•  " + regra, font=font("Regular", 38), fill=MUTED)
    return img


def slide_exercicio(i, ex):
    img, d = base(f"PUSH A · EXERCÍCIO {i}/{len(EXERCICIOS)}")
    d.text((80, 230), f"{i:02d}", font=font("Black", 220), fill=ACCENT)

    y = 520
    for linha in wrap(d, ex["nome"], font("Bold", 92), W - 160):
        d.text((80, y), linha, font=font("Bold", 92), fill=TEXT)
        y += 108

    y += 40
    caixa_w = (W - 160 - 32) // 3
    for j, (rotulo, valor) in enumerate([
        ("SÉRIES × REPS", ex["series"]),
        ("ESFORÇO", ex["rir"]),
        ("DESCANSO", ex["descanso"]),
    ]):
        x = 80 + j * (caixa_w + 16)
        d.rounded_rectangle((x, y, x + caixa_w, y + 180), radius=28, fill=CARD)
        d.text((x + 28, y + 30), rotulo, font=font("SemiBold", 26), fill=MUTED)
        d.text((x + 28, y + 86), valor, font=font("Bold", 50), fill=TEXT)
    y += 240

    d.text((80, y), "Músculos", font=font("Bold", 44), fill=TEXT)
    y += 76
    y = chips(d, 80, y, ex["primarios"], ACCENT, W - 80)
    if ex["secundarios"]:
        y = chips(d, 80, y + 16, ex["secundarios"], SECONDARY, W - 80)
    y += 28
    d.ellipse((84, y + 10, 104, y + 30), fill=ACCENT)
    d.text((116, y), "primário", font=font("Regular", 32), fill=MUTED)
    if ex["secundarios"]:
        d.ellipse((300, y + 10, 320, y + 30), fill=SECONDARY)
        d.text((332, y), "secundário", font=font("Regular", 32), fill=MUTED)
    y += 90

    d.rounded_rectangle((80, y, W - 80, H - 200), radius=32, fill=CARD)
    d.text((124, y + 40), "Execução", font=font("Bold", 44), fill=TEXT)
    ty = y + 120
    for dica in ex["dicas"]:
        linhas = wrap(d, dica, font("Regular", 40), W - 160 - 130)
        d.ellipse((128, ty + 16, 144, ty + 32), fill=ACCENT)
        for linha in linhas:
            d.text((168, ty), linha, font=font("Regular", 40), fill=TEXT)
            ty += 56
        ty += 24
    return img


def slide_resumo():
    img, d = base("PUSH A · RESUMO")
    d.text((80, 220), "Resumo", font=font("Black", 120), fill=TEXT)
    y = 420
    for i, ex in enumerate(EXERCICIOS, 1):
        d.rounded_rectangle((80, y, W - 80, y + 130), radius=24, fill=CARD)
        d.text((116, y + 38), f"{i}", font=font("Black", 48), fill=ACCENT)
        sw = d.textlength(ex["series"], font=font("Bold", 40))
        nome, fnt = ex["nome"], font("SemiBold", 38)
        max_nome = W - 116 - sw - 180 - 32
        if d.textlength(nome, font=fnt) > max_nome:
            while d.textlength(nome + "…", font=fnt) > max_nome:
                nome = nome[:-1]
            nome = nome.rstrip() + "…"
        d.text((180, y + 42), nome, font=fnt, fill=TEXT)
        d.text((W - 116 - sw, y + 40), ex["series"], font=font("Bold", 40), fill=TEXT)
        y += 150

    y += 40
    d.text((80, y), "Progressão", font=font("Bold", 52), fill=ACCENT)
    y += 84
    for linha in wrap(
        d,
        "Completou todas as séries no topo da faixa de repetições? "
        "Aumente a carga em 2,5–5% na próxima sessão.",
        font("Regular", 42),
        W - 160,
    ):
        d.text((80, y), linha, font=font("Regular", 42), fill=MUTED)
        y += 60
    return img


def render(saida):
    slides = [(slide_intro(), 5.0)]
    slides += [(slide_exercicio(i, ex), 7.0) for i, ex in enumerate(EXERCICIOS, 1)]
    slides.append((slide_resumo(), 6.0))

    ff = subprocess.Popen(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
            "-i", "-",
            "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            str(saida),
        ],
        stdin=subprocess.PIPE,
    )

    fade_frames = int(FADE * FPS)
    for idx, (img, dur) in enumerate(slides):
        n = int(dur * FPS)
        prox = slides[idx + 1][0] if idx + 1 < len(slides) else None
        for f in range(n):
            frame = img.copy()
            # barra de progresso do slide
            ImageDraw.Draw(frame).rectangle((0, H - 12, int(W * (f + 1) / n), H), fill=ACCENT)
            if prox is not None and f >= n - fade_frames:
                alpha = (f - (n - fade_frames) + 1) / (fade_frames + 1)
                frame = Image.blend(frame, prox, alpha)
            ff.stdin.write(frame.tobytes())

    ff.stdin.close()
    if ff.wait() != 0:
        sys.exit("ffmpeg falhou")


if __name__ == "__main__":
    destino = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("push_a.mp4")
    render(destino)
    print(f"Vídeo salvo em {destino}")
