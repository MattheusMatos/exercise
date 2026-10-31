"""Gera as ilustrações da seção Experimente (SVG 640x400).

Todas usam a mesma silhueta genérica de pose de duplo bíceps, sem rosto e sem retratar ninguém;
muda o cenário de cada método. Uso: python3 treinos/metodos/gerar_ilustracoes.py
"""

from pathlib import Path

AQUI = Path(__file__).resolve().parent
FONTE = 'font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800"'


def corpo(cor, destaque, dx=0):
    return f'''
  <g transform="translate({dx} 0)">
  <g fill="{cor}" stroke="{cor}" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="262,178 196,186 186,112" fill="none" stroke-width="34"/>
    <polyline points="378,178 444,186 454,112" fill="none" stroke-width="34"/>
    <ellipse cx="222" cy="168" rx="34" ry="22" transform="rotate(-12 222 168)" stroke="none"/>
    <ellipse cx="418" cy="168" rx="34" ry="22" transform="rotate(12 418 168)" stroke="none"/>
    <circle cx="186" cy="100" r="17" stroke="none"/>
    <circle cx="454" cy="100" r="17" stroke="none"/>
    <circle cx="262" cy="176" r="28" stroke="none"/>
    <circle cx="378" cy="176" r="28" stroke="none"/>
    <ellipse cx="320" cy="112" rx="23" ry="27" stroke="none"/>
    <path d="M300 128 L340 128 L346 150 Q372 156 392 168 L248 168 Q268 156 294 150 Z" stroke="none"/>
    <path d="M246 166 Q320 150 394 166 L378 236 Q370 284 348 296 L292 296 Q270 284 262 236 Z" stroke="none"/>
    <path d="M290 292 L350 292 L360 330 L280 330 Z" stroke="none"/>
    <path d="M282 326 Q258 362 274 402 L312 402 Q314 364 320 332 Z" stroke="none"/>
    <path d="M358 326 Q382 362 366 402 L328 402 Q326 364 320 332 Z" stroke="none"/>
  </g>
  <g fill="none" stroke="{destaque}" stroke-width="3" stroke-linecap="round" opacity="0.55">
    <path d="M320 178 L320 290"/>
    <path d="M276 196 Q298 210 318 200"/><path d="M364 196 Q342 210 322 200"/>
    <path d="M300 236 L340 236"/><path d="M302 258 L338 258"/>
    <path d="M206 160 Q222 150 240 158"/><path d="M434 160 Q418 150 400 158"/>
  </g>
  </g>'''


def svg(rotulo, conteudo):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" role="img" aria-label="{rotulo}">\n{conteudo}\n</svg>\n'


def anilha(cx, cy, r, cor, furo):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{cor}"/><circle cx="{cx}" cy="{cy}" r="{r * 0.62:.0f}" fill="none" stroke="{furo}" stroke-width="3" opacity="0.5"/><circle cx="{cx}" cy="{cy}" r="{r * 0.16:.0f}" fill="{furo}"/>'


ARTES = {}

ARTES["mentzer-classico"] = svg("Ilustração retrô de um fisiculturista fazendo pose de duplo bíceps", f'''
  <defs>
    <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1140"/><stop offset="0.45" stop-color="#b8325a"/><stop offset="0.8" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>
    <linearGradient id="sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#ff7a3d"/></linearGradient>
    <clipPath id="metade"><rect x="0" y="0" width="640" height="300"/></clipPath>
  </defs>
  <rect width="640" height="400" fill="url(#ceu)"/>
  <g fill="#fff" opacity="0.7"><circle cx="70" cy="50" r="2"/><circle cx="150" cy="90" r="1.5"/><circle cx="560" cy="60" r="2"/><circle cx="500" cy="110" r="1.5"/><circle cx="600" cy="140" r="1.2"/><circle cx="40" cy="150" r="1.2"/></g>
  <circle cx="320" cy="250" r="150" fill="url(#sol)" clip-path="url(#metade)"/>
  <g fill="#2a1140" opacity="0.85"><rect x="150" y="214" width="340" height="7"/><rect x="150" y="238" width="340" height="9"/><rect x="150" y="264" width="340" height="11"/><rect x="150" y="290" width="340" height="12"/></g>
  <rect x="0" y="300" width="640" height="100" fill="#4a1d5e"/>
  <g stroke="#ff8a3d" stroke-width="2" opacity="0.6">
    <line x1="0" y1="320" x2="640" y2="320"/><line x1="0" y1="348" x2="640" y2="348"/><line x1="0" y1="384" x2="640" y2="384"/>
    <line x1="320" y1="300" x2="320" y2="400"/><line x1="320" y1="300" x2="140" y2="400"/><line x1="320" y1="300" x2="500" y2="400"/><line x1="320" y1="300" x2="-40" y2="400"/><line x1="320" y1="300" x2="680" y2="400"/>
  </g>
  {corpo("#14081f", "#ff8a3d")}
  <text x="320" y="44" {FONTE} font-size="30" letter-spacing="6" fill="#ffe9a8" text-anchor="middle">1 SÉRIE · ATÉ A FALHA</text>''')

grade = ''.join(f'<line x1="{x}" y1="0" x2="{x}" y2="400"/>' for x in range(0, 641, 40)) + ''.join(f'<line x1="0" y1="{y}" x2="640" y2="{y}"/>' for y in range(0, 401, 40))
ARTES["mentzer-moderno"] = svg("Ilustração de um atleta fazendo pose de duplo bíceps, com um gráfico subindo ao fundo", f'''
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a33"/><stop offset="1" stop-color="#0f4c5c"/></linearGradient>
    <radialGradient id="luz" cx="0.5" cy="0.55" r="0.5"><stop offset="0" stop-color="#3fcf8e" stop-opacity="0.45"/><stop offset="1" stop-color="#3fcf8e" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="640" height="400" fill="url(#fundo)"/>
  <g stroke="#4ea3ff" stroke-width="1" opacity="0.18">{grade}</g>
  <circle cx="320" cy="220" r="210" fill="url(#luz)"/>
  <polyline points="20,360 110,330 190,338 270,290 350,300 430,240 520,200 620,120" fill="none" stroke="#3fcf8e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <g fill="#3fcf8e"><circle cx="270" cy="290" r="7"/><circle cx="430" cy="240" r="7"/><circle cx="620" cy="120" r="8"/></g>
  <g transform="translate(76 128)" fill="none" stroke="#f0f2f5" stroke-width="5" stroke-linecap="round"><circle r="30"/><line x1="0" y1="-30" x2="0" y2="-40"/><line x1="-8" y1="-42" x2="8" y2="-42"/><line x1="0" y1="0" x2="12" y2="-14"/></g>
  {corpo("#f0f2f5", "#0b1a33")}
  <text x="28" y="56" {FONTE} font-size="28" letter-spacing="3" fill="#f0f2f5">2 SÉRIES · 2× POR SEMANA</text>''')

# 5×5: barra com anilhas atrás e o número grande, em vermelho e ferro.
ARTES["cinco-por-cinco"] = svg("Ilustração de um levantador com uma barra carregada ao fundo e o número 5 por 5", f'''
  <defs><linearGradient id="f5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0d0d"/><stop offset="1" stop-color="#121214"/></linearGradient></defs>
  <rect width="640" height="400" fill="url(#f5)"/>
  <text x="320" y="300" {FONTE} font-size="300" fill="#e3262e" opacity="0.22" text-anchor="middle">5×5</text>
  <rect x="40" y="236" width="560" height="12" rx="6" fill="#9aa1ad"/>
  {anilha(92, 242, 70, "#26272b", "#9aa1ad")}{anilha(140, 242, 54, "#e3262e", "#2a0c0c")}
  {anilha(548, 242, 70, "#26272b", "#9aa1ad")}{anilha(500, 242, 54, "#e3262e", "#2a0c0c")}
  {corpo("#f0f2f5", "#3a0d0d")}
  <text x="320" y="44" {FONTE} font-size="28" letter-spacing="5" fill="#f0f2f5" text-anchor="middle">CARGA SOBE TODO TREINO</text>''')

# German Volume: dez marcas de série, faixas preto, vermelho e dourado.
marcas = ''.join(f'<rect x="{40 + i * 58}" y="330" width="40" height="40" rx="8" fill="{"#ffce00" if i < 7 else "none"}" stroke="#ffce00" stroke-width="3"/>' for i in range(10))
ARTES["german-volume"] = svg("Ilustração de um atleta com dez marcas de séries, sete cheias", f'''
  <rect width="640" height="400" fill="#141414"/>
  <rect y="0" width="640" height="110" fill="#1d1d1d"/><rect y="110" width="640" height="100" fill="#3a0f10"/><rect y="210" width="640" height="100" fill="#3a3010"/>
  <text x="320" y="270" {FONTE} font-size="220" fill="#ffce00" opacity="0.16" text-anchor="middle">10×10</text>
  {corpo("#f0f2f5", "#141414")}
  <rect x="0" y="312" width="640" height="88" fill="#141414" opacity="0.92"/>
  {marcas}
  <text x="320" y="44" {FONTE} font-size="28" letter-spacing="5" fill="#f0f2f5" text-anchor="middle">10 SÉRIES DE 10</text>''')

# Era de ouro: praia ao pôr do sol, palmeiras, tom sépia anos 70.
def palmeira(x, s):
    folhas = ''.join(f'<path d="M{x} {300 - 150 * s} q{dx * s} {-30 * s} {2 * dx * s} {10 * s}" fill="none" stroke="#2b1a0e" stroke-width="{9 * s:.0f}" stroke-linecap="round"/>' for dx in (-40, -25, 25, 40))
    return f'<path d="M{x - 6 * s} 300 Q{x + 14 * s} {300 - 80 * s} {x} {300 - 150 * s}" fill="none" stroke="#2b1a0e" stroke-width="{12 * s:.0f}" stroke-linecap="round"/>{folhas}'
ARTES["era-de-ouro"] = svg("Ilustração em estilo anos 70 de um fisiculturista na praia ao pôr do sol", f'''
  <defs><linearGradient id="ouro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b25b"/><stop offset="0.6" stop-color="#e2723a"/><stop offset="1" stop-color="#8a3b24"/></linearGradient></defs>
  <rect width="640" height="400" fill="url(#ouro)"/>
  <circle cx="320" cy="232" r="120" fill="#ffe2a1" opacity="0.85"/>
  <rect y="280" width="640" height="40" fill="#5a7c8a"/><rect y="320" width="640" height="80" fill="#e9c38a"/>
  <g stroke="#ffe2a1" stroke-width="3" opacity="0.6"><line x1="220" y1="292" x2="420" y2="292"/><line x1="250" y1="305" x2="390" y2="305"/></g>
  {palmeira(70, 1.2)}{palmeira(580, 1.0)}{palmeira(520, 0.75)}
  {corpo("#3b2212", "#f6b25b")}
  <text x="320" y="44" {FONTE} font-size="30" letter-spacing="6" fill="#3b2212" text-anchor="middle">ERA DE OURO · 6 DIAS</text>''')

# PHUL: metade força (ferro, pesado) e metade hipertrofia (verde, volume).
ARTES["phul"] = svg("Ilustração de um atleta dividida em duas cores: força e hipertrofia", f'''
  <rect width="320" height="400" fill="#1f2a44"/><rect x="320" width="320" height="400" fill="#123b2e"/>
  <text x="160" y="250" {FONTE} font-size="150" fill="#4ea3ff" opacity="0.18" text-anchor="middle">3–5</text>
  <text x="480" y="250" {FONTE} font-size="130" fill="#3fcf8e" opacity="0.18" text-anchor="middle">8–12</text>
  {corpo("#f0f2f5", "#1f2a44")}
  <text x="160" y="380" {FONTE} font-size="30" letter-spacing="5" fill="#4ea3ff" text-anchor="middle">FORÇA</text>
  <text x="480" y="380" {FONTE} font-size="30" letter-spacing="5" fill="#3fcf8e" text-anchor="middle">HIPERTROFIA</text>
  <text x="320" y="44" {FONTE} font-size="28" letter-spacing="5" fill="#f0f2f5" text-anchor="middle">SUPERIOR · INFERIOR</text>''')

# FST-7: o 7 grande e ondas de "pump", em roxo e azul elétrico.
ondas = ''.join(f'<circle cx="320" cy="200" r="{r}" fill="none" stroke="#b46cff" stroke-width="3" opacity="{0.5 - i * 0.08:.2f}"/>' for i, r in enumerate(range(150, 330, 36)))
ARTES["fst-7"] = svg("Ilustração de um atleta com ondas ao redor e o número 7", f'''
  <defs><radialGradient id="r7" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="#4b1c7a"/><stop offset="1" stop-color="#0e0a1f"/></radialGradient></defs>
  <rect width="640" height="400" fill="url(#r7)"/>
  {ondas}
  <text x="560" y="330" {FONTE} font-size="280" fill="#4ea3ff" opacity="0.35" text-anchor="middle">7</text>
  {corpo("#f0f2f5", "#4b1c7a")}
  <text x="28" y="56" {FONTE} font-size="28" letter-spacing="4" fill="#f0f2f5">7 SÉRIES · 30–45 S</text>''')

for nome, conteudo in ARTES.items():
    (AQUI / f"{nome}.svg").write_text(conteudo, encoding="utf-8")
print("ok", len(ARTES))
