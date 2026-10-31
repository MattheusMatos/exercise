"""Gera os programas da seção Experimente (estilo Mentzer clássico e moderno).

Uso: python3 treinos/gerar_metodos.py
"""
import json
from pathlib import Path

AQUI = Path(__file__).resolve().parent
PRE = lambda g: {"tipo": "preexaustao", "grupo": g}
ALEM = {"tipo": "alemdafalha"}
RP = {"tipo": "restpause", "pausa": 15}
DROP = {"tipo": "drop"}
BI = lambda g: {"tipo": "biset", "grupo": g}

def ex(nome, imagem, series, reps, rir, descanso, prim, sec, porque, evid, dicas, tecnica=None, aquec=False):
    e = {"nome": nome, "imagem": imagem, "series": series, "reps": reps, "rir": rir, "descanso": descanso,
         "primarios": prim, "secundarios": sec}
    if aquec: e["aquecimento"] = True
    if tecnica: e["tecnica"] = tecnica
    e.update({"porque": porque, "evidencia": evid, "dicas": dicas})
    return e

D = {
 "voador": ["Cotovelos levemente dobrados e fixos", "Aperte o peito no meio, sem bater os braços", "Volte devagar até sentir o alongamento"],
 "inclinado": ["Banco a 30–45°", "Barra desce até a parte de cima do peito", "Escápulas presas no banco"],
 "pullover": ["Braços quase estendidos, cotovelos fixos", "Puxe com as costas até a barra chegar às coxas", "Suba devagar até sentir o alongamento"],
 "supinada": ["Pegada supinada na largura dos ombros", "Puxe a barra até o alto do peito", "Peito alto, sem jogar o corpo para trás"],
 "terra": ["Barra colada nas canelas e coluna neutra", "Empurre o chão com as pernas e estenda o quadril", "Nunca arredonde a lombar para tirar mais uma repetição"],
 "extensora": ["Encosto ajustado: joelho alinhado ao eixo da máquina", "Segure 1 s em cima", "Desça devagar"],
 "legpress": ["Pés na largura dos ombros, no meio da plataforma", "Desça até onde a lombar não sai do encosto", "Não trave os joelhos em cima"],
 "flexora": ["Joelho alinhado ao eixo da máquina", "Puxe até o fim e segure 1 s", "Volte devagar, sem deixar o peso bater"],
 "panturrilha": ["Desça até alongar bem o calcanhar", "Pausa de 1–2 s embaixo, sem quicar", "Suba até a ponta dos pés"],
 "lateral": ["Cotovelos levemente dobrados", "Suba até a altura dos ombros, liderando com os cotovelos", "Desça devagar, sem embalo"],
 "inverso": ["Peito apoiado, braços quase estendidos", "Abra os braços para trás, liderando com os cotovelos", "Sem encolher os ombros"],
 "rosca": ["Cotovelos colados no corpo", "Suba sem jogar o tronco", "Desça devagar até o braço estender"],
 "pulley": ["Cotovelos colados no corpo", "Estenda o braço até o fim", "Volte só até 90°, devagar"],
 "paralela": ["Tronco reto para pegar mais tríceps", "Desça até o braço ficar paralelo ao chão", "Sem dor no ombro: se doer, troque pelo banco"],
 "remada": ["Peito alto, coluna neutra", "Puxe o cabo até o abdômen, cotovelos junto ao corpo", "Volte esticando os braços, sem arredondar"],
 "maquina_supino": ["Pegada na linha do meio do peito", "Escápulas presas no encosto", "Desça devagar até alongar o peito"],
 "desenvolvimento": ["Halteres na linha das orelhas", "Suba sem bater um halter no outro", "Desça até o cotovelo passar um pouco de 90°"],
 "hack": ["Pés no meio da plataforma", "Desça fundo mantendo a lombar no encosto", "Suba sem travar os joelhos"],
 "stiff": ["Joelhos levemente dobrados e fixos", "Leve o quadril para trás com a coluna neutra", "Desça até sentir os posteriores alongarem"],
 "pant_legpress": ["Só a ponta dos pés na plataforma", "Desça até alongar bem", "Joelhos estendidos, mas sem travar"],
}

PRE_TXT = "Pré-exaustão: o isolado cansa o músculo antes do composto, para ele, e não o braço, ser o limite no composto."

classico = {
  "nome": "Alta intensidade à moda de 1980",
  "titulo": "Estilo Mentzer clássico",
  "marca": "1 série até a falha · Pré-exaustão",
  "publico": "todos",
  "nivel": "Avançado",
  "categoria": "experimente",
  "dias": "2 dias por semana",
  "opcoesDias": [2],
  "resumo": "Uma única série de trabalho por exercício, até a falha, com pré-exaustão e 3 ou 4 dias de descanso entre os treinos. Treinos de 20 a 30 minutos.",
  "regras": [
    "Só 1 série de trabalho por exercício, até a falha (as séries leves de aquecimento não contam)",
    "Pré-exaustão: o isolado e, sem descanso, o composto",
    "Subida e descida lentas, uns 4 segundos cada, sem embalo",
    "3 a 4 dias de descanso entre os treinos",
  ],
  "progressao": "Bateu o topo da faixa de repetições? Suba a carga na próxima vez. Se não conseguiu mais repetições que na vez anterior, Mentzer mandava descansar mais um dia, não treinar mais.",
  "metodo": {
    "ilustracao": "metodos/mentzer-classico.svg",
    "epoca": "Anos 1970 e 80",
    "historia": [
      "Mike Mentzer foi um fisiculturista americano, Mr. Universo em 1978, o primeiro a ganhar com nota máxima. Ele levou adiante as ideias de Arthur Jones, criador das máquinas Nautilus: o que faz o músculo crescer é a intensidade do esforço, não a quantidade de séries.",
      "Numa época em que os campeões treinavam 2 a 3 horas por dia, ele defendia o contrário: poucas séries, levadas além da falha, e muito descanso. Chamou o método de Heavy Duty e o explicou em livros nos anos 1980 e 90.",
    ],
    "como": [
      "Uma série de trabalho por exercício, depois de 1 ou 2 leves de aquecimento.",
      "Até a falha: a repetição em que não sai mais nenhuma com boa forma. Mentzer às vezes ia além, com repetições forçadas (alguém ajuda a subir) ou negativas (só a descida, bem lenta).",
      "Pré-exaustão: um isolado logo antes do composto, sem descanso. O voador cansa o peito antes do supino.",
      "Execução lenta e controlada, sem embalo.",
      "Pouco volume e muito descanso: 3 a 7 dias entre os treinos; com o tempo, ele recomendava ainda mais.",
    ],
    "pros": [
      "Treinos curtos: 20 a 30 minutos.",
      "Uma série perto da falha já faz crescer, principalmente quem está começando ou voltando.",
      "Ensina a treinar com intensidade de verdade e anotar cada repetição.",
    ],
    "contras": [
      "Volume muito baixo: cada músculo recebe 1 a 3 séries a cada 4 a 7 dias. Os estudos mostram mais crescimento com 10 ou mais séries por semana (Schoenfeld et al., 2017; Pelland et al., 2026).",
      "Cada músculo treinado menos de 1 vez por semana. Treinar 2 vezes rende igual ou um pouco mais (Schoenfeld et al., 2016).",
      "Ir além da falha cansa muito e não mostrou ganho extra (Refalo et al., 2023). Em levantamento terra e agachamento, é arriscado.",
    ],
    "veredito": "Funciona, mas não é o caminho para o máximo de músculo. Bom para quem tem muito pouco tempo, para variar alguns meses ou para sentir como é treinar no limite.",
    "paraQuem": "Quem já treina há algum tempo, sabe a técnica dos exercícios e quer experimentar um treino curto e muito intenso.",
    "referencias": [
      "Mentzer, M. Heavy Duty (1993) e Heavy Duty II: Mind and Body (1996).",
      "Schoenfeld, B. J. et al. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass. J Sports Sci.",
      "Schoenfeld, B. J. et al. (2016). Effects of resistance training frequency on measures of muscle hypertrophy. Sports Med.",
      "Refalo, M. C. et al. (2023). Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy. Sports Med.",
      "Augustsson, J. et al. (2003). Effect of pre-exhaustion exercise on lower-extremity muscle activation during a leg press exercise. J Strength Cond Res.",
    ],
  },
  "treinos": [
    {"id": "mzc_a", "titulo": "PEITO E COSTAS", "foco": "Pré-exaustão de peito e de costas, e terra", "duracao": "~25 min", "extras": [], "exercicios": [
      ex("Voador (crucifixo na máquina)", "Butterfly", 1, "6–10", "0 (falha)", "3–4 min", ["Peitoral maior"], ["Deltoide anterior"],
         PRE_TXT + " Mentzer usava o voador da Nautilus antes do supino inclinado.", "ativacao", D["voador"], PRE("A"), True),
      ex("Supino inclinado com barra", "Barbell_Incline_Bench_Press_-_Medium_Grip", 1, "6–10", "0 (falha)", "3–4 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "Logo depois do voador, com o peito já cansado. Use alguém para ajudar ou máquina com trava se for até a falha.", "ativacao", D["inclinado"], PRE("A")),
      ex("Pulldown com braços estendidos", "Straight-Arm_Pulldown", 1, "6–10", "0 (falha)", "3–4 min", ["Dorsal"], ["Tríceps"],
         "No lugar do pullover da Nautilus, que quase nenhuma academia tem: trabalha o dorsal sem o bíceps limitar.", "ativacao", D["pullover"], PRE("B"), True),
      ex("Puxada supinada", "Underhand_Cable_Pulldowns", 1, "6–10", "0 (falha)", "3–4 min", ["Dorsal"], ["Bíceps", "Meio das costas"],
         "Pegada supinada, como Mentzer fazia, logo depois do pulldown com braços estendidos.", "ativacao", D["supinada"], PRE("B")),
      ex("Levantamento terra", "Barbell_Deadlift", 1, "5–8", "1", "—", ["Eretores da coluna", "Glúteo", "Posteriores de coxa"], ["Quadríceps", "Trapézio superior", "Meio das costas"],
         "Mentzer fechava o dia de costas com o terra. Aqui ele para 1 repetição antes da falha: no terra, a última repetição é onde a lombar arredonda.", "nao-testado", D["terra"], None, True),
    ]},
    {"id": "mzc_b", "titulo": "PERNAS", "foco": "Pré-exaustão de quadríceps, posteriores e panturrilha", "duracao": "~20 min", "extras": [], "exercicios": [
      ex("Cadeira extensora", "Leg_Extensions", 1, "8–12", "0 (falha)", "3–4 min", ["Quadríceps"], [],
         PRE_TXT + " Num estudo, a extensora antes do leg press diminuiu a ativação do quadríceps no leg press, em vez de aumentar (Augustsson et al., 2003).", "ativacao", D["extensora"], PRE("A"), True),
      ex("Leg press", "Leg_Press", 1, "8–12", "0 (falha)", "3–4 min", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa"],
         "Logo depois da extensora. Mentzer usava o agachamento ou o leg press; o leg press é mais seguro para ir até a falha.", "ativacao", D["legpress"], PRE("A")),
      ex("Mesa flexora sentada", "Seated_Leg_Curl", 1, "8–12", "0 (falha)", "2–3 min", ["Posteriores de coxa"], ["Panturrilha"],
         "Sentado, o posterior trabalha alongado e cresceu mais que deitado (Maeo et al., 2021).", "crescimento", D["flexora"], ALEM, True),
      ex("Panturrilha em pé", "Standing_Calf_Raises", 1, "12–20", "0 (falha)", "—", ["Gastrocnêmio", "Sóleo"], [],
         "Uma série longa até a falha; nas últimas, só a descida, bem lenta (negativas).", "nao-testado", D["panturrilha"], ALEM, True),
    ]},
    {"id": "mzc_c", "titulo": "OMBROS E BRAÇOS", "foco": "Deltoides, bíceps e tríceps com pré-exaustão", "duracao": "~20 min", "extras": [], "exercicios": [
      ex("Elevação lateral com halteres", "Side_Lateral_Raise", 1, "8–12", "0 (falha)", "2 min", ["Deltoide lateral"], ["Trapézio superior"],
         "O deltoide lateral quase não trabalha nos supinos: precisa de um exercício só dele.", "ativacao", D["lateral"], ALEM, True),
      ex("Crucifixo inverso na máquina", "Reverse_Machine_Flyes", 1, "8–12", "0 (falha)", "2 min", ["Deltoide posterior"], ["Meio das costas"],
         "A parte de trás do ombro, que os supinos não pegam.", "ativacao", D["inverso"], None),
      ex("Rosca direta com barra", "Barbell_Curl", 1, "6–10", "0 (falha)", "2 min", ["Bíceps"], ["Braquial", "Braquiorradial"],
         "Até a falha e, se tiver ajuda, 2 ou 3 negativas: alguém ajuda a subir e você desce em 4 a 5 segundos.", "nao-testado", D["rosca"], ALEM, True),
      ex("Tríceps no pulley", "Triceps_Pushdown", 1, "6–10", "0 (falha)", "2–3 min", ["Tríceps"], [],
         PRE_TXT, "ativacao", D["pulley"], PRE("A"), True),
      ex("Mergulho nas paralelas (tríceps)", "Dips_-_Triceps_Version", 1, "6–10", "0 (falha)", "—", ["Tríceps"], ["Peitoral maior", "Deltoide anterior"],
         "Mentzer fazia as paralelas logo depois do tríceps isolado. Peso do corpo; se passar de 10, pendure uma anilha.", "ativacao", D["paralela"], PRE("A")),
    ]},
  ],
}

moderno = {
  "nome": "Alta intensidade com o que a ciência sabe hoje",
  "titulo": "Estilo Mentzer moderno",
  "marca": "Pouco volume · Perto da falha · 2x por semana",
  "publico": "todos",
  "nivel": "Intermediário",
  "categoria": "experimente",
  "dias": "3 ou 4 dias por semana",
  "opcoesDias": [3, 4],
  "resumo": "A intensidade e a pré-exaustão do Mentzer, mas com 2 séries por exercício e cada músculo treinado 2 vezes por semana. Treinos de ~35 minutos.",
  "regras": [
    "2 séries de trabalho por exercício, a última perto da falha (0–1 repetição na reserva)",
    "Pré-exaustão nos pares marcados, sem descanso entre eles",
    "Rest-pause e drop-set só onde marcado",
    "Superior e inferior, cada um 2 vezes na semana",
  ],
  "progressao": "Bateu o topo da faixa nas 2 séries? Suba 2,5–5% da carga. Anote tudo: com pouco volume, a carga precisa subir.",
  "metodo": {
    "ilustracao": "metodos/mentzer-moderno.svg",
    "epoca": "Hoje",
    "historia": [
      "O Mentzer acertou em muita coisa: intensidade, controle e anotar cada repetição. Mas os estudos dos últimos 20 anos mostraram que volume e frequência importam mais do que ele achava.",
      "Esta versão guarda o espírito do Heavy Duty, com treinos curtos e intensos, e ajusta o que a ciência corrigiu: 2 séries em vez de 1, e cada músculo 2 vezes por semana em vez de a cada 7 dias.",
    ],
    "como": [
      "2 séries por exercício: a primeira a 1 ou 2 repetições da falha, a segunda a 0 ou 1.",
      "Pré-exaustão nos pares marcados, como no clássico.",
      "Rest-pause ou drop-set na última série de alguns isolados: mais estímulo sem mais tempo.",
      "Superior A, Inferior A, Superior B e Inferior B: cada músculo 2 vezes por semana.",
      "Cerca de 6 a 10 séries por músculo na semana, em treinos de uns 35 minutos.",
    ],
    "pros": [
      "Treinos curtos, com volume suficiente para crescer bem: mesmo poucas séries por semana já dão boa parte do ganho (Pelland et al., 2026).",
      "Frequência de 2 vezes por semana, que rende igual ou um pouco mais que 1 (Schoenfeld et al., 2016).",
      "Perto da falha, mas sem passar dela: quase todo o estímulo, com menos cansaço (Refalo et al., 2023).",
    ],
    "contras": [
      "Ainda é metade do volume dos programas de hipertrofia do app: para o máximo de músculo, 10 a 20 séries por semana rendem mais.",
      "Exige esforço de verdade em toda série; sem isso, o volume baixo não basta.",
    ],
    "veredito": "Um bom meio-termo: quase todo o ganho com metade do tempo. Ótimo para semanas corridas ou para quem gosta de treino curto e intenso.",
    "paraQuem": "Quem tem pouco tempo, mas treina com intensidade e quer crescer de forma consistente.",
    "referencias": [
      "Pelland, J. C. et al. (2026). The resistance training dose-response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gain. Sports Med.",
      "Schoenfeld, B. J. et al. (2016). Effects of resistance training frequency on measures of muscle hypertrophy. Sports Med.",
      "Refalo, M. C. et al. (2023). Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy. Sports Med.",
      "Prestes, J. et al. (2019). Strength and muscular adaptations after 6 weeks of rest-pause vs. traditional multiple-sets resistance training in trained subjects. J Strength Cond Res.",
    ],
  },
  "treinos": [
    {"id": "mzm_sup_a", "titulo": "SUPERIOR A", "foco": "Peito e costas com pré-exaustão", "duracao": "~35 min", "extras": [], "exercicios": [
      ex("Voador (crucifixo na máquina)", "Butterfly", 2, "8–12", "1", "2–3 min", ["Peitoral maior"], ["Deltoide anterior"],
         PRE_TXT, "ativacao", D["voador"], PRE("A"), True),
      ex("Supino inclinado com barra", "Barbell_Incline_Bench_Press_-_Medium_Grip", 2, "6–10", "0–1", "2–3 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "Com carga alta, o inclinado fez a parte de cima do peito crescer mais que o reto (Chaves et al., 2020). Aqui vem logo depois do voador.", "crescimento", D["inclinado"], PRE("A")),
      ex("Pulldown com braços estendidos", "Straight-Arm_Pulldown", 2, "10–15", "1", "2–3 min", ["Dorsal"], ["Tríceps"],
         PRE_TXT, "ativacao", D["pullover"], PRE("B"), True),
      ex("Puxada supinada", "Underhand_Cable_Pulldowns", 2, "6–10", "0–1", "2–3 min", ["Dorsal"], ["Bíceps", "Meio das costas"],
         "Logo depois do pulldown com braços estendidos.", "ativacao", D["supinada"], PRE("B")),
      ex("Elevação lateral com halteres", "Side_Lateral_Raise", 2, "10–15", "0–1", "1–2 min", ["Deltoide lateral"], ["Trapézio superior"],
         "Rest-pause na última série: mais repetições perto da falha sem mais séries.", "crescimento", D["lateral"], RP, True),
    ]},
    {"id": "mzm_inf_a", "titulo": "INFERIOR A", "foco": "Quadríceps com pré-exaustão e posteriores", "duracao": "~35 min", "extras": [], "exercicios": [
      ex("Cadeira extensora", "Leg_Extensions", 2, "10–15", "1", "2–3 min", ["Quadríceps"], [],
         PRE_TXT + " O agachamento não fez o reto femoral crescer (Kubo et al., 2019); a extensora fez (Ema et al., 2013).", "crescimento", D["extensora"], PRE("A"), True),
      ex("Leg press", "Leg_Press", 2, "8–12", "0–1", "2–3 min", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa"],
         "Seguro para ir perto da falha, logo depois da extensora.", "crescimento", D["legpress"], PRE("A")),
      ex("Mesa flexora sentada", "Seated_Leg_Curl", 2, "8–12", "0–1", "1–2 min", ["Posteriores de coxa"], ["Panturrilha"],
         "Sentado, o posterior trabalha alongado e cresceu mais que deitado (Maeo et al., 2021). Rest-pause na última série.", "crescimento", D["flexora"], RP, True),
      ex("Stiff (terra romeno)", "Romanian_Deadlift", 2, "6–10", "1–2", "2–3 min", ["Posteriores de coxa", "Glúteo"], ["Eretores da coluna"],
         "O posterior também trabalha pelo quadril, e alongado. Fica longe da falha: técnica primeiro.", "crescimento", D["stiff"], None, True),
      ex("Panturrilha em pé", "Standing_Calf_Raises", 2, "10–15", "0–1", "1 min", ["Gastrocnêmio", "Sóleo"], [],
         "Rest-pause na última série.", "nao-testado", D["panturrilha"], RP, True),
    ]},
    {"id": "mzm_sup_b", "titulo": "SUPERIOR B", "foco": "Empurrar, puxar e braços", "duracao": "~35 min", "extras": [], "exercicios": [
      ex("Supino na máquina", "Machine_Bench_Press", 2, "6–10", "0–1", "2–3 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "Máquina permite ir perto da falha sem precisar de ajuda.", "nao-testado", D["maquina_supino"], None, True),
      ex("Remada sentada no cabo", "Seated_Cable_Rows", 2, "8–12", "0–1", "2–3 min", ["Meio das costas", "Dorsal"], ["Bíceps", "Deltoide posterior"],
         "A puxada do Superior A é vertical; aqui, horizontal, para o meio das costas.", "ativacao", D["remada"], None, True),
      ex("Desenvolvimento com halteres", "Dumbbell_Shoulder_Press", 2, "6–10", "1", "2 min", ["Deltoide anterior"], ["Deltoide lateral", "Tríceps"],
         "Ombro já aquecido pelo supino.", "ativacao", D["desenvolvimento"], None),
      ex("Crucifixo inverso na máquina", "Reverse_Machine_Flyes", 2, "10–15", "0–1", "1 min", ["Deltoide posterior"], ["Meio das costas"],
         "Drop-set na última série.", "crescimento", D["inverso"], DROP),
      ex("Rosca direta com barra", "Barbell_Curl", 2, "6–10", "0–1", "1–2 min", ["Bíceps"], ["Braquial"],
         "Bi-set com o tríceps: os dois braços no tempo de um (Zhang et al., 2025).", "crescimento", D["rosca"], BI("C"), True),
      ex("Tríceps no pulley", "Triceps_Pushdown", 2, "8–12", "0–1", "1–2 min", ["Tríceps"], [],
         "Fecha o bi-set com a rosca.", "crescimento", D["pulley"], BI("C")),
    ]},
    {"id": "mzm_inf_b", "titulo": "INFERIOR B", "foco": "Hack, posteriores e panturrilha", "duracao": "~30 min", "extras": [], "exercicios": [
      ex("Agachamento hack", "Hack_Squat", 2, "6–10", "0–1", "2–3 min", ["Quadríceps", "Glúteo"], ["Adutores"],
         "Agachamento guiado: dá para ir perto da falha com segurança.", "nao-testado", D["hack"], None, True),
      ex("Mesa flexora sentada", "Seated_Leg_Curl", 2, "10–15", "0–1", "1–2 min", ["Posteriores de coxa"], ["Panturrilha"],
         "Segunda vez na semana para os posteriores.", "crescimento", D["flexora"], None, True),
      ex("Cadeira extensora", "Leg_Extensions", 1, "12–15", "0", "1 min", ["Quadríceps"], [],
         "Drop-set na única série: fecha o quadríceps em pouco tempo (Sødal et al., 2023).", "crescimento", D["extensora"], DROP),
      ex("Panturrilha no leg press", "Calf_Press_On_The_Leg_Press_Machine", 2, "12–20", "0–1", "1 min", ["Gastrocnêmio", "Sóleo"], [],
         "Segunda vez na semana para a panturrilha, com pausa no alongamento.", "nao-testado", D["pant_legpress"], None, True),
    ]},
  ],
}

for nome, p in [("programa_mentzer_classico.json", classico), ("programa_mentzer_moderno.json", moderno)]:
    (AQUI / nome).write_text(json.dumps(p, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("ok")
