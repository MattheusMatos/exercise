"""Gera os programas da seção Experimente: estilo Mentzer clássico e moderno, 5×5, German Volume
Training, estilo Arnold, PHUL e estilo FST-7.

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


# ---------- outros métodos ----------

D.update({
 "agachamento": ["Pés na largura dos ombros", "Desça até a coxa passar do paralelo", "Coluna neutra, joelhos na direção dos pés"],
 "supino": ["Escápulas retraídas e deprimidas", "Barra desce até a linha do mamilo", "Pés firmes no chão"],
 "remada_barra": ["Tronco inclinado uns 45°, coluna neutra", "Puxe a barra até a parte de baixo do peito", "Desça controlando, sem soltar a postura"],
 "militar": ["Em pé, glúteo e abdômen firmes", "Barra sobe em linha reta, cabeça passa por baixo", "Sem arquear a lombar"],
 "barra_fixa": ["Pegada um pouco mais aberta que os ombros", "Puxe até o queixo passar a barra", "Desça até o braço quase estender"],
 "inclinado_halter": ["Banco a 30°", "Halteres descem até a altura do peito", "Suba sem bater um halter no outro"],
 "crossover": ["Tronco levemente inclinado à frente", "Feche os braços num arco, cotovelos fixos", "Volte devagar até alongar o peito"],
 "remada_unilateral": ["Joelho e mão apoiados no banco", "Puxe o halter em direção ao quadril", "Desça até alongar as costas"],
 "abdominal_polia": ["Ajoelhado, corda ao lado da cabeça", "Enrole o tronco levando o peito ao quadril", "Volte devagar, sem sentar nos calcanhares"],
 "rosca_inclinada": ["Banco a 45–60°, braços pendurados", "Suba sem tirar o cotovelo da linha do corpo", "Desça até esticar bem"],
 "arnold": ["Comece com as palmas viradas para você", "Gire as mãos enquanto sobe", "Desça girando de volta, devagar"],
 "crucifixo": ["Cotovelos levemente dobrados e fixos", "Abra até sentir o peito alongar", "Feche num arco, sem bater os halteres"],
 "pullover_halter": ["Deitado atravessado ou ao longo do banco", "Leve o halter para trás da cabeça com os cotovelos levemente dobrados", "Volte até a altura do peito"],
 "testa": ["Cotovelos apontando para o teto e fixos", "Desça a barra até a testa ou logo atrás da cabeça", "Estenda sem abrir os cotovelos"],
 "afundo": ["Passo para trás, tronco reto", "Desça até o joelho de trás quase tocar o chão", "Suba empurrando com a perna da frente"],
 "frontal": ["Barra apoiada na frente dos ombros, cotovelos altos", "Desça com o tronco bem reto", "Suba sem deixar os cotovelos caírem"],
 "pant_sentado": ["Joelhos a 90°, apoio sobre as coxas", "Desça até alongar bem o calcanhar", "Suba até a ponta dos pés e segure 1 s"],
 "flexora_deitado": ["Quadril colado no banco", "Puxe até o fim, sem tirar o quadril", "Volte devagar"],
 "scott": ["Axila encostada no banco", "Suba sem tirar o braço do apoio", "Desça até quase estender, devagar"],
 "lateral_polia": ["Cabo passando por trás ou pela frente do corpo", "Suba até a altura do ombro", "Desça devagar, sem embalo"],
})

FST = {"tipo": "fst7"}


def aquecer(treinos):
    """Aquecimento no primeiro exercício de cada treino que pega um músculo ainda não trabalhado no dia."""
    for t in treinos:
        vistos = set()
        for e in t["exercicios"]:
            if any(m not in vistos for m in e["primarios"]):
                e["aquecimento"] = True
            vistos.update(e["primarios"] + e["secundarios"])
    return treinos


cinco = {
  "nome": "Força com os exercícios básicos",
  "titulo": "5×5 clássico",
  "marca": "Agachamento toda vez · Carga sobe todo treino",
  "publico": "todos",
  "nivel": "Iniciante",
  "categoria": "experimente",
  "dias": "3 dias por semana",
  "opcoesDias": [3],
  "resumo": "Dois treinos alternados, só com os básicos: agachamento sempre, supino ou desenvolvimento, remada ou terra. 5 séries de 5, com a carga subindo a cada treino.",
  "regras": [
    "5 séries de 5 repetições com a mesma carga (o terra, 1 série de 5)",
    "Alterne A e B: segunda A, quarta B, sexta A; na outra semana, B, A, B",
    "Completou as 25 repetições? Suba 2,5 kg no próximo treino (5 kg no terra)",
    "Falhou 3 treinos seguidos na mesma carga? Volte 10% e suba de novo",
  ],
  "progressao": "Suba a carga sempre que completar as 5 séries de 5. Quando parar de subir mesmo voltando 10%, é hora de um programa intermediário.",
  "metodo": {
    "ilustracao": "metodos/cinco-por-cinco.svg",
    "epoca": "Anos 1960 a hoje",
    "historia": [
      "O 5×5 apareceu entre os levantadores e fisiculturistas dos anos 1950 e 60; o sul-africano Reg Park, ídolo do jovem Arnold, ajudou a popularizá-lo. Nos anos 70, o técnico americano Bill Starr usou o esquema com atletas de futebol americano.",
      "As versões de hoje deixaram o treino ainda mais simples: dois treinos alternados, agachamento em todos, e a carga subindo um pouco a cada vez.",
    ],
    "como": [
      "Treino A: agachamento, supino e remada curvada, 5×5.",
      "Treino B: agachamento e desenvolvimento 5×5, e levantamento terra 1×5.",
      "3 vezes por semana, alternando A e B.",
      "Descanso longo, 3 a 5 minutos, para levantar pesado de novo.",
      "A carga sobe a cada treino enquanto der: é a progressão linear.",
    ],
    "pros": [
      "Ótimo para ganhar força no começo: carga pesada é o que mais aumenta a força máxima (Schoenfeld et al., 2017).",
      "Poucos exercícios, fácil de aprender e de acompanhar o progresso.",
      "Com o mesmo volume, séries pesadas e moderadas fizeram crescer parecido (Schoenfeld et al., 2015).",
    ],
    "contras": [
      "Pouco volume para hipertrofia fora das pernas: peito e costas ficam com 7 a 8 séries por semana, e braços e ombro lateral quase sem nada.",
      "A progressão linear acaba em alguns meses; depois disso, a carga não sobe toda semana.",
      "Agachamento pesado 3 vezes por semana cansa; a técnica precisa estar boa antes da carga.",
    ],
    "veredito": "Excelente para os primeiros meses de quem quer ficar forte. Para crescer o máximo, depois vale passar para um programa com mais volume.",
    "paraQuem": "Iniciantes que querem força e aprender os exercícios básicos com barra.",
    "referencias": [
      "Starr, B. The Strongest Shall Survive (1976).",
      "Schoenfeld, B. J. et al. (2017). Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis. J Strength Cond Res.",
      "Schoenfeld, B. J. et al. (2015). Effects of low- vs. high-load resistance training on muscle strength and hypertrophy in well-trained men. J Strength Cond Res.",
    ],
  },
  "treinos": aquecer([
    {"id": "cxc_a", "titulo": "TREINO A", "foco": "Agachamento, supino e remada", "duracao": "~45 min", "extras": [], "exercicios": [
      ex("Agachamento livre", "Barbell_Full_Squat", 5, "5", "1–2", "3–5 min", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa", "Eretores da coluna"],
         "O exercício central do 5×5: em todos os treinos, com a carga subindo.", "crescimento", D["agachamento"]),
      ex("Supino reto com barra", "Barbell_Bench_Press_-_Medium_Grip", 5, "5", "1–2", "3 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "Alterna com o desenvolvimento: um treino sim, outro não.", "crescimento", D["supino"]),
      ex("Remada curvada com barra", "Bent_Over_Barbell_Row", 5, "5", "1–2", "3 min", ["Meio das costas", "Dorsal"], ["Bíceps", "Deltoide posterior", "Eretores da coluna"],
         "Equilibra o supino e fortalece as costas para o agachamento e o terra.", "ativacao", D["remada_barra"]),
    ]},
    {"id": "cxc_b", "titulo": "TREINO B", "foco": "Agachamento, desenvolvimento e terra", "duracao": "~40 min", "extras": [], "exercicios": [
      ex("Agachamento livre", "Barbell_Full_Squat", 5, "5", "1–2", "3–5 min", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa", "Eretores da coluna"],
         "De novo: no 5×5 o agachamento está em todos os treinos.", "crescimento", D["agachamento"]),
      ex("Desenvolvimento em pé com barra", "Standing_Military_Press", 5, "5", "1–2", "3 min", ["Deltoide anterior"], ["Deltoide lateral", "Tríceps"],
         "O empurrar acima da cabeça, alternando com o supino.", "ativacao", D["militar"]),
      ex("Levantamento terra", "Barbell_Deadlift", 1, "5", "1", "—", ["Eretores da coluna", "Glúteo", "Posteriores de coxa"], ["Quadríceps", "Trapézio superior", "Meio das costas"],
         "Só 1 série pesada: as pernas já vêm cansadas do agachamento. Sobe 5 kg por treino enquanto der.", "nao-testado", D["terra"]),
    ]},
  ]),
}

gvt = {
  "nome": "Dez séries de dez",
  "titulo": "German Volume Training (10×10)",
  "marca": "10 séries de 10 · Descanso curto",
  "publico": "todos",
  "nivel": "Avançado",
  "categoria": "experimente",
  "dias": "3 dias por semana",
  "opcoesDias": [3],
  "resumo": "Um exercício principal por músculo, 10 séries de 10 com a mesma carga e descanso curto, e dois complementos leves. Três treinos com dias de descanso entre eles.",
  "regras": [
    "10 séries de 10 com ~60% da carga máxima (uma carga que você faria umas 20 vezes)",
    "Descanso de 60 a 90 s entre as séries; no original, alternando os dois exercícios principais",
    "Só suba a carga quando completar as 10 séries de 10",
    "Ciclo de 5 dias: A, B, descanso, C, descanso",
  ],
  "progressao": "Completou as 10 séries de 10? Suba 4–5% na próxima vez. Depois de umas 6 semanas, o método recomenda voltar a um treino de menos volume.",
  "metodo": {
    "ilustracao": "metodos/german-volume.svg",
    "epoca": "Anos 1970 e 90",
    "historia": [
      "O treinador canadense Charles Poliquin popularizou o método nos anos 1990 e contava que ele vinha de técnicos de levantamento de peso da Alemanha dos anos 70, que o usavam para os atletas ganharem músculo fora da temporada.",
      "A ideia é simples e brutal: um exercício, 10 séries de 10, com uma carga que no começo parece leve demais.",
    ],
    "como": [
      "Um exercício principal por músculo, 10 séries de 10 com a mesma carga.",
      "Descanso curto, 60 a 90 s; no original, um exercício de peito e um de costas se alternam.",
      "Depois, 2 complementos de 3 séries de 10 a 12.",
      "Treino A: peito e costas. B: pernas. C: braços e ombros.",
    ],
    "pros": [
      "Muito volume em pouco tempo e com poucos exercícios.",
      "Bom para sair de uma estagnação por algumas semanas.",
      "Carga moderada: cansa o músculo sem castigar as articulações.",
    ],
    "contras": [
      "Nos dois estudos que testaram o método, 10 séries não fizeram crescer mais que 5; o grupo de 5 séries foi igual ou um pouco melhor (Amirthalingam et al., 2017; Hackett et al., 2018).",
      "As últimas séries saem com bem menos repetições ou exigem tirar carga: o estímulo se concentra no fim.",
      "Cada músculo treinado só 1 vez a cada 5 dias e quase nada fora do exercício principal.",
    ],
    "veredito": "Funciona por causa do volume, mas 10 séries não rendem mais que 5. Vale como choque por 4 a 6 semanas, não como treino de sempre.",
    "paraQuem": "Quem já treina há anos e quer um bloco curto de muito volume para variar.",
    "referencias": [
      "Poliquin, C. German Volume Training (artigos dos anos 1990).",
      "Amirthalingam, T. et al. (2017). Effects of a modified German volume training program on muscular hypertrophy and strength. J Strength Cond Res.",
      "Hackett, D. A. et al. (2018). Effects of a 12-week modified German volume training program on muscle strength and hypertrophy: a pilot study. Sports.",
    ],
  },
  "treinos": aquecer([
    {"id": "gvt_a", "titulo": "PEITO E COSTAS", "foco": "Supino inclinado e barra fixa, 10×10", "duracao": "~60 min", "extras": [], "exercicios": [
      ex("Supino inclinado com halteres", "Incline_Dumbbell_Press", 10, "10", "3–4 no começo", "60–90 s", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "O exercício principal de peito: 10×10 com a mesma carga. As primeiras séries parecem fáceis; as últimas, não.", "crescimento", D["inclinado_halter"]),
      ex("Barra fixa (ou puxada)", "Pullups", 10, "10", "3–4 no começo", "60–90 s", ["Dorsal"], ["Bíceps", "Meio das costas"],
         "O principal de costas. Sem conseguir 10 na barra, faça na puxada no cabo.", "ativacao", D["barra_fixa"]),
      ex("Crucifixo no cabo", "Cable_Crossover", 3, "10–12", "1–2", "60 s", ["Peitoral maior"], ["Deltoide anterior"],
         "Complemento leve para o peito.", "ativacao", D["crossover"]),
      ex("Remada unilateral com halter", "One-Arm_Dumbbell_Row", 3, "10–12", "1–2", "60 s", ["Dorsal", "Meio das costas"], ["Bíceps", "Deltoide posterior"],
         "Complemento leve para as costas.", "ativacao", D["remada_unilateral"]),
    ]},
    {"id": "gvt_b", "titulo": "PERNAS", "foco": "Agachamento e flexora, 10×10", "duracao": "~60 min", "extras": [], "exercicios": [
      ex("Agachamento livre", "Barbell_Full_Squat", 10, "10", "3–4 no começo", "90 s", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa", "Eretores da coluna"],
         "10×10 de agachamento é o coração do método, e o treino mais duro da semana.", "crescimento", D["agachamento"]),
      ex("Mesa flexora sentada", "Seated_Leg_Curl", 10, "10", "3–4 no começo", "60–90 s", ["Posteriores de coxa"], ["Panturrilha"],
         "O principal de posteriores. Sentado, o posterior trabalha alongado e cresceu mais (Maeo et al., 2021).", "crescimento", D["flexora"]),
      ex("Panturrilha em pé", "Standing_Calf_Raises", 3, "15–20", "1", "60 s", ["Gastrocnêmio", "Sóleo"], [],
         "Complemento.", "nao-testado", D["panturrilha"]),
      ex("Abdominal na polia", "Cable_Crunch", 3, "12–15", "1", "60 s", ["Abdômen"], [],
         "Complemento.", "nao-testado", D["abdominal_polia"]),
    ]},
    {"id": "gvt_c", "titulo": "BRAÇOS E OMBROS", "foco": "Paralelas e rosca inclinada, 10×10", "duracao": "~55 min", "extras": [], "exercicios": [
      ex("Mergulho nas paralelas (tríceps)", "Dips_-_Triceps_Version", 10, "10", "3–4 no começo", "60–90 s", ["Tríceps"], ["Peitoral maior", "Deltoide anterior"],
         "O principal de tríceps. Sem conseguir 10, faça no banco ou troque pelo tríceps no pulley.", "ativacao", D["paralela"]),
      ex("Rosca inclinada com halteres", "Incline_Dumbbell_Curl", 10, "10", "3–4 no começo", "60–90 s", ["Bíceps"], ["Braquial"],
         "O principal de bíceps, com o braço para trás e o bíceps alongado.", "crescimento", D["rosca_inclinada"]),
      ex("Crucifixo inverso na máquina", "Reverse_Machine_Flyes", 3, "10–12", "1–2", "60 s", ["Deltoide posterior"], ["Meio das costas"],
         "Complemento.", "ativacao", D["inverso"]),
      ex("Elevação lateral com halteres", "Side_Lateral_Raise", 3, "10–12", "1–2", "60 s", ["Deltoide lateral"], ["Trapézio superior"],
         "Complemento.", "ativacao", D["lateral"]),
    ]},
  ]),
}

arnold = {
  "nome": "A divisão da era de ouro",
  "titulo": "Estilo Arnold (6 dias)",
  "marca": "Peito e costas · Ombros e braços · Pernas",
  "publico": "todos",
  "nivel": "Avançado",
  "categoria": "experimente",
  "dias": "6 dias por semana",
  "opcoesDias": [5, 6],
  "resumo": "Peito com costas, ombros com braços e pernas, cada um 2 vezes por semana, com muito volume. A divisão que os campeões dos anos 70 usavam.",
  "regras": [
    "Peito e costas juntos: um empurra, o outro puxa, e um descansa enquanto o outro trabalha",
    "4 a 5 séries por exercício, de 6 a 12 repetições",
    "Cada treino 2 vezes por semana",
    "Muito volume: durma bem e coma o suficiente, ou diminua uma série de cada exercício",
  ],
  "progressao": "Suba a carga quando bater o topo da faixa em todas as séries. Se o desempenho cair duas semanas seguidas, tire uma série de cada exercício.",
  "metodo": {
    "ilustracao": "metodos/era-de-ouro.svg",
    "epoca": "Anos 1970",
    "historia": [
      "Nos anos 70, na Califórnia, os campeões de fisiculturismo treinavam 6 dias por semana, muitas vezes 2 vezes por dia. A divisão mais famosa juntava peito com costas, ombros com braços e pernas, cada uma 2 vezes na semana.",
      "Arnold Schwarzenegger a ensinou no livro Encyclopedia of Modern Bodybuilding, de 1985. É uma época anterior aos controles antidoping, e vários campeões da época, ele inclusive, admitiram o uso de esteroides, que ajudam a recuperar de tanto volume.",
    ],
    "como": [
      "Treino 1: peito e costas, alternando os dois.",
      "Treino 2: ombros e braços.",
      "Treino 3: pernas e panturrilha.",
      "Cada treino 2 vezes por semana: 6 dias seguidos, 1 de descanso.",
      "4 a 5 séries por exercício; cada músculo passa de 20 séries por semana.",
    ],
    "pros": [
      "Frequência de 2 vezes por semana para todos os músculos, como os estudos recomendam (Schoenfeld et al., 2016).",
      "Peito e costas juntos economizam tempo e equilibram empurrar e puxar.",
      "Volume alto, que ainda rende algo a mais em quem já treina há anos (Pelland et al., 2026).",
    ],
    "contras": [
      "Volume acima de 20 séries por músculo na semana: o ganho extra é pequeno e a recuperação pesa para quem não usa esteroides.",
      "6 dias por semana com treinos longos: difícil de manter com trabalho e família.",
      "Pouco descanso para as articulações do ombro e do cotovelo.",
    ],
    "veredito": "Uma ótima divisão, com volume para atleta da época. Para a maioria, a mesma estrutura com 3 séries por exercício rende quase o mesmo e recupera melhor.",
    "paraQuem": "Avançados com tempo, sono e alimentação em dia, que gostam de treinar todo dia.",
    "referencias": [
      "Schwarzenegger, A. Encyclopedia of Modern Bodybuilding (1985).",
      "Schoenfeld, B. J. et al. (2016). Effects of resistance training frequency on measures of muscle hypertrophy. Sports Med.",
      "Pelland, J. C. et al. (2026). The resistance training dose-response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gain. Sports Med.",
    ],
  },
  "treinos": aquecer([
    {"id": "arn_pc", "titulo": "PEITO E COSTAS", "foco": "Supinos, crucifixo, barra fixa, remada e pullover", "duracao": "~75 min", "extras": [], "exercicios": [
      ex("Supino reto com barra", "Barbell_Bench_Press_-_Medium_Grip", 5, "6–10", "1–2", "2–3 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "O básico do peito, pesado.", "crescimento", D["supino"]),
      ex("Barra fixa", "Pullups", 5, "8–12", "1–2", "2 min", ["Dorsal"], ["Bíceps", "Meio das costas"],
         "Alternando com o supino, como os campeões da época faziam.", "ativacao", D["barra_fixa"]),
      ex("Supino inclinado com barra", "Barbell_Incline_Bench_Press_-_Medium_Grip", 4, "8–10", "1–2", "2 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "Com carga alta, o inclinado fez a parte de cima do peito crescer mais que o reto (Chaves et al., 2020).", "crescimento", D["inclinado"]),
      ex("Remada curvada com barra", "Bent_Over_Barbell_Row", 4, "8–10", "1–2", "2 min", ["Meio das costas", "Dorsal"], ["Bíceps", "Deltoide posterior"],
         "A remada pesada da era de ouro.", "ativacao", D["remada_barra"]),
      ex("Crucifixo com halteres", "Dumbbell_Flyes", 4, "10–12", "1", "90 s", ["Peitoral maior"], ["Deltoide anterior"],
         "O peito alongado no fundo do movimento.", "ativacao", D["crucifixo"]),
      ex("Pullover com halter", "Bent-Arm_Dumbbell_Pullover", 3, "10–12", "1", "90 s", ["Peitoral maior", "Dorsal"], ["Tríceps"],
         "Clássico da época, entre peito e costas.", "nao-testado", D["pullover_halter"]),
    ]},
    {"id": "arn_ob", "titulo": "OMBROS E BRAÇOS", "foco": "Desenvolvimento, laterais, roscas e tríceps", "duracao": "~70 min", "extras": [], "exercicios": [
      ex("Desenvolvimento Arnold com halteres", "Arnold_Dumbbell_Press", 4, "8–10", "1–2", "2 min", ["Deltoide anterior"], ["Deltoide lateral", "Tríceps"],
         "O desenvolvimento com giro que ganhou o nome dele.", "ativacao", D["arnold"]),
      ex("Elevação lateral com halteres", "Side_Lateral_Raise", 4, "10–12", "1", "90 s", ["Deltoide lateral"], ["Trapézio superior"],
         "Para a largura dos ombros.", "ativacao", D["lateral"]),
      ex("Rosca direta com barra", "Barbell_Curl", 4, "8–10", "1–2", "90 s", ["Bíceps"], ["Braquial", "Braquiorradial"],
         "A rosca pesada, sem embalo.", "nao-testado", D["rosca"]),
      ex("Tríceps testa com barra W", "EZ-Bar_Skullcrusher", 4, "8–10", "1–2", "90 s", ["Tríceps"], [],
         "Alternando com a rosca: um braço descansa enquanto o outro trabalha.", "ativacao", D["testa"]),
      ex("Rosca inclinada com halteres", "Incline_Dumbbell_Curl", 3, "10–12", "1", "60–90 s", ["Bíceps"], ["Braquial"],
         "Com o bíceps alongado.", "crescimento", D["rosca_inclinada"]),
      ex("Tríceps no pulley", "Triceps_Pushdown", 3, "10–12", "1", "60–90 s", ["Tríceps"], [],
         "Para fechar os braços.", "ativacao", D["pulley"]),
    ]},
    {"id": "arn_pe", "titulo": "PERNAS", "foco": "Coxa, posteriores e panturrilha", "duracao": "~75 min", "extras": [], "exercicios": [
      ex("Agachamento livre", "Barbell_Full_Squat", 5, "8–12", "1–2", "3 min", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa", "Eretores da coluna"],
         "O exercício base das pernas.", "crescimento", D["agachamento"]),
      ex("Leg press", "Leg_Press", 4, "10–12", "1", "2 min", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa"],
         "Mais volume de coxa sem cansar a lombar.", "crescimento", D["legpress"]),
      ex("Cadeira extensora", "Leg_Extensions", 3, "12–15", "1", "90 s", ["Quadríceps"], [],
         "O agachamento não fez o reto femoral crescer (Kubo et al., 2019); a extensora fez (Ema et al., 2013).", "crescimento", D["extensora"]),
      ex("Mesa flexora deitada", "Lying_Leg_Curls", 4, "10–12", "1", "90 s", ["Posteriores de coxa"], ["Panturrilha"],
         "A flexora da época era deitada; sentada rende um pouco mais (Maeo et al., 2021), se tiver.", "crescimento", D["flexora_deitado"]),
      ex("Stiff (terra romeno)", "Romanian_Deadlift", 3, "8–10", "1–2", "2 min", ["Posteriores de coxa", "Glúteo"], ["Eretores da coluna"],
         "Posteriores pelo quadril.", "crescimento", D["stiff"]),
      ex("Panturrilha em pé", "Standing_Calf_Raises", 5, "12–15", "1", "60 s", ["Gastrocnêmio", "Sóleo"], [],
         "Os campeões da época treinavam panturrilha quase todo dia.", "nao-testado", D["panturrilha"]),
    ]},
  ]),
}

phul = {
  "nome": "Força e hipertrofia, superior e inferior",
  "titulo": "PHUL (força + hipertrofia)",
  "marca": "2 dias de força · 2 de hipertrofia",
  "publico": "todos",
  "nivel": "Intermediário",
  "categoria": "experimente",
  "dias": "4 dias por semana",
  "opcoesDias": [4],
  "resumo": "Superior e inferior 2 vezes por semana: um dia pesado (3 a 5 repetições) e um de hipertrofia (8 a 12) para cada metade do corpo.",
  "regras": [
    "Dias de força: 3 a 5 repetições, descanso longo, carga alta",
    "Dias de hipertrofia: 8 a 15 repetições, perto da falha",
    "Ordem sugerida: força superior, força inferior, descanso, hipertrofia superior, hipertrofia inferior",
  ],
  "progressao": "Nos dias de força, suba a carga quando fizer 5 repetições em todas as séries; nos de hipertrofia, quando bater o topo da faixa.",
  "metodo": {
    "ilustracao": "metodos/phul.svg",
    "epoca": "Anos 2010",
    "historia": [
      "O nome vem do inglês Power Hypertrophy Upper Lower: força e hipertrofia, superior e inferior. Ficou popular em sites e fóruns de musculação nos anos 2010, como um jeito de ganhar força e músculo ao mesmo tempo.",
      "Ele junta duas ideias que funcionam: a divisão superior e inferior, que treina cada músculo 2 vezes, e a alternância entre dias pesados e dias de mais repetições.",
    ],
    "como": [
      "Força superior: supino, remada e desenvolvimento pesados, mais braços.",
      "Força inferior: agachamento e terra pesados, leg press e flexora.",
      "Hipertrofia superior e inferior: exercícios variados de 8 a 15 repetições.",
      "Cada músculo 2 vezes por semana, uma pesada e uma de volume.",
    ],
    "pros": [
      "Frequência de 2 vezes por semana e volume de 10 a 20 séries por músculo, dentro do que os estudos recomendam.",
      "Força e músculo ao mesmo tempo: carga pesada aumenta mais a força, e o volume completa o crescimento (Schoenfeld et al., 2017).",
      "4 dias por semana, com fins de semana livres.",
    ],
    "contras": [
      "Os dias de força são longos, pelo descanso de 3 minutos.",
      "Não tem estudo do programa em si: é uma combinação de princípios que funcionam.",
    ],
    "veredito": "Um dos melhores da seção para quem quer força e músculo com 4 dias por semana. Muito parecido com o que a ciência recomenda hoje.",
    "paraQuem": "Intermediários que querem ficar mais fortes sem abrir mão da hipertrofia.",
    "referencias": [
      "Schoenfeld, B. J. et al. (2016). Effects of resistance training frequency on measures of muscle hypertrophy. Sports Med.",
      "Schoenfeld, B. J. et al. (2017). Strength and hypertrophy adaptations between low- vs. high-load resistance training. J Strength Cond Res.",
      "Pelland, J. C. et al. (2026). The resistance training dose-response. Sports Med.",
    ],
  },
  "treinos": aquecer([
    {"id": "phul_fs", "titulo": "FORÇA SUPERIOR", "foco": "Supino, remada e desenvolvimento pesados", "duracao": "~65 min", "extras": [], "exercicios": [
      ex("Supino reto com barra", "Barbell_Bench_Press_-_Medium_Grip", 4, "3–5", "1–2", "3 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "O empurrar pesado da semana.", "crescimento", D["supino"]),
      ex("Remada curvada com barra", "Bent_Over_Barbell_Row", 4, "3–5", "1–2", "3 min", ["Meio das costas", "Dorsal"], ["Bíceps", "Deltoide posterior"],
         "O puxar pesado da semana.", "ativacao", D["remada_barra"]),
      ex("Supino inclinado com halteres", "Incline_Dumbbell_Press", 3, "6–10", "1–2", "2 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "Mais peito, agora com halteres.", "crescimento", D["inclinado_halter"]),
      ex("Puxada aberta", "Full_Range-Of-Motion_Lat_Pulldown", 3, "6–10", "1–2", "2 min", ["Dorsal"], ["Bíceps", "Meio das costas"],
         "O puxar vertical.", "ativacao", D["supinada"]),
      ex("Desenvolvimento em pé com barra", "Standing_Military_Press", 3, "5–8", "1–2", "2 min", ["Deltoide anterior"], ["Deltoide lateral", "Tríceps"],
         "Ombro pesado.", "ativacao", D["militar"]),
      ex("Rosca direta com barra", "Barbell_Curl", 2, "6–10", "1", "90 s", ["Bíceps"], ["Braquial"],
         "Braços no fim.", "nao-testado", D["rosca"]),
      ex("Tríceps testa com barra W", "EZ-Bar_Skullcrusher", 2, "6–10", "1", "90 s", ["Tríceps"], [],
         "Braços no fim.", "ativacao", D["testa"]),
    ]},
    {"id": "phul_fi", "titulo": "FORÇA INFERIOR", "foco": "Agachamento e terra pesados", "duracao": "~60 min", "extras": [], "exercicios": [
      ex("Agachamento livre", "Barbell_Full_Squat", 4, "3–5", "1–2", "3–4 min", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa", "Eretores da coluna"],
         "As pernas pesadas da semana.", "crescimento", D["agachamento"]),
      ex("Levantamento terra", "Barbell_Deadlift", 3, "3–5", "1–2", "3–4 min", ["Eretores da coluna", "Glúteo", "Posteriores de coxa"], ["Quadríceps", "Trapézio superior", "Meio das costas"],
         "Pesado, sempre com a coluna neutra.", "nao-testado", D["terra"]),
      ex("Leg press", "Leg_Press", 3, "10–15", "1", "2 min", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa"],
         "Volume para a coxa depois do pesado.", "crescimento", D["legpress"]),
      ex("Mesa flexora sentada", "Seated_Leg_Curl", 3, "6–10", "1", "90 s", ["Posteriores de coxa"], ["Panturrilha"],
         "Sentado, o posterior trabalha alongado e cresceu mais (Maeo et al., 2021).", "crescimento", D["flexora"]),
      ex("Panturrilha em pé", "Standing_Calf_Raises", 4, "6–10", "1", "90 s", ["Gastrocnêmio", "Sóleo"], [],
         "Panturrilha pesada.", "nao-testado", D["panturrilha"]),
    ]},
    {"id": "phul_hs", "titulo": "HIPERTROFIA SUPERIOR", "foco": "Volume de peito, costas, ombros e braços", "duracao": "~60 min", "extras": [], "exercicios": [
      ex("Supino inclinado com barra", "Barbell_Incline_Bench_Press_-_Medium_Grip", 3, "8–12", "1", "2 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "Com carga alta, o inclinado fez a parte de cima do peito crescer mais que o reto (Chaves et al., 2020).", "crescimento", D["inclinado"]),
      ex("Crucifixo com halteres", "Dumbbell_Flyes", 3, "8–12", "1", "90 s", ["Peitoral maior"], ["Deltoide anterior"],
         "O peito alongado.", "ativacao", D["crucifixo"]),
      ex("Remada sentada no cabo", "Seated_Cable_Rows", 3, "8–12", "1", "90 s", ["Meio das costas", "Dorsal"], ["Bíceps", "Deltoide posterior"],
         "Costas com volume.", "ativacao", D["remada"]),
      ex("Remada unilateral com halter", "One-Arm_Dumbbell_Row", 3, "8–12", "1", "90 s", ["Dorsal", "Meio das costas"], ["Bíceps", "Deltoide posterior"],
         "Um lado de cada vez, com amplitude.", "ativacao", D["remada_unilateral"]),
      ex("Elevação lateral com halteres", "Side_Lateral_Raise", 3, "10–15", "0–1", "60 s", ["Deltoide lateral"], ["Trapézio superior"],
         "O deltoide lateral quase não trabalha nos supinos.", "ativacao", D["lateral"]),
      ex("Rosca inclinada com halteres", "Incline_Dumbbell_Curl", 3, "8–12", "0–1", "60 s", ["Bíceps"], ["Braquial"],
         "Bíceps alongado.", "crescimento", D["rosca_inclinada"]),
      ex("Tríceps acima da cabeça na corda", "Triceps_Overhead_Extension_with_Rope", 3, "8–12", "0–1", "60 s", ["Tríceps"], [],
         "Com o braço acima da cabeça, o tríceps cresceu cerca de 40% mais (Maeo et al., 2023).", "crescimento", ["Cotovelos apontando para a frente e fixos", "Estenda até o fim", "Volte até alongar bem o tríceps"]),
    ]},
    {"id": "phul_hi", "titulo": "HIPERTROFIA INFERIOR", "foco": "Volume de coxa, glúteo e panturrilha", "duracao": "~55 min", "extras": [], "exercicios": [
      ex("Agachamento frontal", "Front_Barbell_Squat", 3, "8–12", "1–2", "2–3 min", ["Quadríceps", "Glúteo"], ["Adutores", "Eretores da coluna"],
         "Mais quadríceps e menos lombar que o agachamento de costas.", "nao-testado", D["frontal"]),
      ex("Afundo posterior com halteres", "Dumbbell_Rear_Lunge", 3, "8–12", "1", "90 s", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa"],
         "Uma perna de cada vez.", "nao-testado", D["afundo"]),
      ex("Cadeira extensora", "Leg_Extensions", 3, "10–15", "0–1", "60 s", ["Quadríceps"], [],
         "O agachamento não fez o reto femoral crescer (Kubo et al., 2019); a extensora fez (Ema et al., 2013).", "crescimento", D["extensora"]),
      ex("Mesa flexora sentada", "Seated_Leg_Curl", 3, "10–15", "0–1", "60 s", ["Posteriores de coxa"], ["Panturrilha"],
         "Segunda vez na semana para os posteriores.", "crescimento", D["flexora"]),
      ex("Panturrilha sentado", "Seated_Calf_Raise", 4, "8–12", "0–1", "60 s", ["Sóleo"], ["Gastrocnêmio"],
         "Sentado, com o joelho dobrado, trabalha mais o sóleo.", "nao-testado", D["pant_sentado"]),
    ]},
  ]),
}

fst = {
  "nome": "Divisão por grupos com 7 séries no fim",
  "titulo": "Estilo FST-7",
  "marca": "7 séries finais · Descanso de 30–45 s",
  "publico": "todos",
  "nivel": "Intermediário",
  "categoria": "experimente",
  "dias": "4 ou 5 dias por semana",
  "opcoesDias": [4, 5],
  "resumo": "Um treino por grupo muscular, com os exercícios normais e, no fim, 7 séries de um isolado com descanso curto, buscando o máximo de \"pump\".",
  "regras": [
    "Exercícios normais primeiro, de 8 a 12 repetições",
    "No fim, 7 séries de 8 a 12 do exercício marcado, com 30 a 45 s de descanso",
    "Entre as 7 séries, alongue o músculo e beba água",
  ],
  "progressao": "Nos exercícios normais, suba a carga quando bater o topo da faixa. Nas 7 séries, mantenha a carga e tente fechar todas com 8 ou mais.",
  "metodo": {
    "ilustracao": "metodos/fst-7.svg",
    "epoca": "Anos 2000",
    "historia": [
      "O treinador americano Hany Rambod criou o FST-7 nos anos 2000 e ficou famoso por treinar vários campeões do Mr. Olympia. A sigla vem do inglês Fascia Stretch Training, treino de alongamento da fáscia, e o 7 são as 7 séries finais.",
      "A ideia dele: encher o músculo de sangue com as 7 séries curtas e alongar a fáscia, a película que envolve o músculo, para dar mais espaço para ele crescer.",
    ],
    "como": [
      "Um treino por grupo: peito e tríceps, costas e bíceps, pernas, ombros.",
      "Os exercícios de sempre, de 8 a 12 repetições.",
      "No fim de cada músculo, 7 séries de um isolado com 30 a 45 s de descanso.",
      "Alongar o músculo entre as séries.",
    ],
    "pros": [
      "As 7 séries somam volume em poucos minutos.",
      "Treino variado e motivante; o \"pump\" agrada muita gente.",
    ],
    "contras": [
      "Não há estudo mostrando que alongar a fáscia faz o músculo crescer mais: é a teoria do método, não um resultado medido.",
      "Descanso curto rende menos por série: 3 minutos fizeram crescer mais que 1 com as mesmas séries (Schoenfeld et al., 2016).",
      "Cada músculo treinado 1 vez por semana; 2 rende igual ou um pouco mais (Schoenfeld et al., 2016).",
    ],
    "veredito": "Funciona pelo volume das 7 séries, não pela fáscia. Ótimo como variação ou para músculos atrasados.",
    "paraQuem": "Quem gosta de treino por grupo muscular e de sentir o músculo cheio, ou quer dar atenção a um músculo atrasado.",
    "referencias": [
      "Schoenfeld, B. J. et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. J Strength Cond Res.",
      "Schoenfeld, B. J. et al. (2016). Effects of resistance training frequency on measures of muscle hypertrophy. Sports Med.",
    ],
  },
  "treinos": aquecer([
    {"id": "fst_pt", "titulo": "PEITO E TRÍCEPS", "foco": "Supinos, testa e 7 séries de crossover e pulley", "duracao": "~60 min", "extras": [], "exercicios": [
      ex("Supino inclinado com halteres", "Incline_Dumbbell_Press", 3, "8–12", "1", "2 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "O primeiro de peito, pesado.", "crescimento", D["inclinado_halter"]),
      ex("Supino na máquina", "Machine_Bench_Press", 3, "8–12", "1", "2 min", ["Peitoral maior"], ["Deltoide anterior", "Tríceps"],
         "Mais volume de peito.", "nao-testado", D["maquina_supino"]),
      ex("Crucifixo no cabo (FST-7)", "Cable_Crossover", 7, "8–12", "0–1", "30–45 s", ["Peitoral maior"], ["Deltoide anterior"],
         "As 7 séries finais de peito.", "nao-testado", D["crossover"], FST),
      ex("Tríceps testa com barra W", "EZ-Bar_Skullcrusher", 3, "8–12", "1", "90 s", ["Tríceps"], [],
         "O tríceps já vem cansado dos supinos.", "ativacao", D["testa"]),
      ex("Tríceps no pulley (FST-7)", "Triceps_Pushdown", 7, "8–12", "0–1", "30–45 s", ["Tríceps"], [],
         "As 7 séries finais de tríceps.", "nao-testado", D["pulley"], FST),
    ]},
    {"id": "fst_cb", "titulo": "COSTAS E BÍCEPS", "foco": "Barra, remada e 7 séries de pulldown e Scott", "duracao": "~60 min", "extras": [], "exercicios": [
      ex("Barra fixa (ou puxada)", "Pullups", 3, "8–12", "1", "2 min", ["Dorsal"], ["Bíceps", "Meio das costas"],
         "O puxar vertical.", "ativacao", D["barra_fixa"]),
      ex("Remada sentada no cabo", "Seated_Cable_Rows", 3, "8–12", "1", "2 min", ["Meio das costas", "Dorsal"], ["Bíceps", "Deltoide posterior"],
         "O puxar horizontal.", "ativacao", D["remada"]),
      ex("Pulldown com braços estendidos (FST-7)", "Straight-Arm_Pulldown", 7, "8–12", "0–1", "30–45 s", ["Dorsal"], ["Tríceps"],
         "As 7 séries finais de costas.", "nao-testado", D["pullover"], FST),
      ex("Rosca direta com barra", "Barbell_Curl", 3, "8–12", "1", "90 s", ["Bíceps"], ["Braquial"],
         "O bíceps pesado.", "nao-testado", D["rosca"]),
      ex("Rosca Scott (FST-7)", "Preacher_Curl", 7, "8–12", "0–1", "30–45 s", ["Bíceps"], ["Braquial"],
         "As 7 séries finais de bíceps.", "nao-testado", D["scott"], FST),
    ]},
    {"id": "fst_pe", "titulo": "PERNAS", "foco": "Hack, stiff, flexora e 7 séries de leg press", "duracao": "~65 min", "extras": [], "exercicios": [
      ex("Agachamento hack", "Hack_Squat", 4, "8–12", "1", "2–3 min", ["Quadríceps", "Glúteo"], ["Adutores"],
         "O principal de quadríceps.", "nao-testado", D["hack"]),
      ex("Stiff (terra romeno)", "Romanian_Deadlift", 3, "8–12", "1", "2 min", ["Posteriores de coxa", "Glúteo"], ["Eretores da coluna"],
         "Posteriores pelo quadril.", "crescimento", D["stiff"]),
      ex("Mesa flexora sentada", "Seated_Leg_Curl", 3, "8–12", "0–1", "90 s", ["Posteriores de coxa"], ["Panturrilha"],
         "Sentado, o posterior trabalha alongado e cresceu mais (Maeo et al., 2021).", "crescimento", D["flexora"]),
      ex("Leg press (FST-7)", "Leg_Press", 7, "10–12", "0–1", "30–45 s", ["Quadríceps", "Glúteo"], ["Adutores", "Posteriores de coxa"],
         "As 7 séries finais de coxa: o mais duro do método.", "nao-testado", D["legpress"], FST),
      ex("Panturrilha em pé", "Standing_Calf_Raises", 4, "10–15", "0–1", "60 s", ["Gastrocnêmio", "Sóleo"], [],
         "Para fechar.", "nao-testado", D["panturrilha"]),
    ]},
    {"id": "fst_om", "titulo": "OMBROS", "foco": "Desenvolvimento, crucifixo inverso e 7 séries de lateral", "duracao": "~45 min", "extras": [], "exercicios": [
      ex("Desenvolvimento com halteres", "Dumbbell_Shoulder_Press", 4, "8–12", "1", "2 min", ["Deltoide anterior"], ["Deltoide lateral", "Tríceps"],
         "O empurrar acima da cabeça.", "ativacao", D["desenvolvimento"]),
      ex("Crucifixo inverso na máquina", "Reverse_Machine_Flyes", 3, "10–12", "1", "90 s", ["Deltoide posterior"], ["Meio das costas"],
         "A parte de trás do ombro.", "ativacao", D["inverso"]),
      ex("Elevação lateral na polia (FST-7)", "Cable_Seated_Lateral_Raise", 7, "10–12", "0–1", "30–45 s", ["Deltoide lateral"], ["Trapézio superior"],
         "As 7 séries finais de ombro.", "nao-testado", D["lateral_polia"], FST),
      ex("Abdominal na polia", "Cable_Crunch", 3, "12–15", "1", "60 s", ["Abdômen"], [],
         "Abdômen no fim.", "nao-testado", D["abdominal_polia"]),
    ]},
  ]),
}

PROGRAMAS = [
    ("programa_mentzer_classico.json", classico), ("programa_mentzer_moderno.json", moderno),
    ("programa_cinco_por_cinco.json", cinco), ("programa_german_volume.json", gvt), ("programa_arnold.json", arnold),
    ("programa_phul.json", phul), ("programa_fst7.json", fst),
]
for nome, p in PROGRAMAS:
    (AQUI / nome).write_text(json.dumps(p, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("ok", len(PROGRAMAS))
