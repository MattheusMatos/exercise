# Treinos

| Arquivo | O que é |
|---|---|
| [`programa_ppl.md`](programa_ppl.md) | O programa PPL explicado, com as referências científicas |
| [`programa_ppl.json`](programa_ppl.json) | Os mesmos treinos em dados, usados pelo app e pelos vídeos |
| [`programa_feminino.md`](programa_feminino.md), [`programa_feminino.json`](programa_feminino.json) | Versão com foco em pernas e glúteo, explicada e em dados |
| [`programa_iniciante_m.md`](programa_iniciante_m.md), [`programa_iniciante_f.md`](programa_iniciante_f.md) | Corpo inteiro 3x por semana, para começar (com o `.json` de cada um) |
| [`programa_avancado_m.md`](programa_avancado_m.md), [`programa_avancado_f.md`](programa_avancado_f.md) | Avançados com bi-set, tri-set, cluster, rest-pause e drop-set |
| [`programa_mobilidade.md`](programa_mobilidade.md) | Duas rotinas de mobilidade, para todos |
| [`analise_hipertrofia.md`](analise_hipertrofia.md) | O que a literatura diz sobre volume, frequência e divisão do treino, e o volume de cada programa |
| [`index.html`](index.html), [`app.css`](app.css), [`app.js`](app.js) | App de cartões para seguir o treino no celular |
| [`semelhanca.js`](semelhanca.js) | Calcula o quanto um exercício se parece com outro, para sugerir trocas |
| [`ofensiva.js`](ofensiva.js) | Calcula a ofensiva (dias seguidos de treino), o nível e a fase do personagem |
| [`avatar.js`](avatar.js), [`personagens/`](personagens/) | Os 11 personagens, com descrição e imagens sem fundo (fases, descanso, comemoração), e o fogo da ofensiva |
| [`aerobico.js`](aerobico.js) | Opções de aeróbico (impacto nas articulações e calorias) e os pontos |
| [`manifest.webmanifest`](manifest.webmanifest), [`sw.js`](sw.js), [`icones/`](icones/) | Deixam o app instalável no celular e funcionando sem internet |
| [`fotos/`](fotos/) | Fotos dos exercícios do programa, usadas pelo app |
| [`biblioteca/`](biblioteca/) | 619 exercícios para trocar no app: dados em português e fotos em folhas |
| [`videos/`](videos/) | Um vídeo vertical por treino (1080×1920, ~1 min); o app mostra só o trecho de cada exercício |
| [`gerar_videos.py`](gerar_videos.py) | Gera os vídeos |
| [`copiar_fotos.py`](copiar_fotos.py) | Copia e reduz as fotos do programa para o app |
| [`gerar_biblioteca.py`](gerar_biblioteca.py) | Monta a biblioteca do app |

## App

Cada exercício é um cartão com as fotos animadas, séries, RIR, descanso e dicas de execução:

- cada série é um cronômetro no pé do cartão: toque nele ao terminar a série e o descanso começa sozinho;
- anote a **carga** de cada exercício: ela fica salva para a próxima vez, junto com a data;
- ao tocar em **Começar treino**, abre a tela de **aquecimento**: mostra quais exercícios têm 6 repetições com 40% e 6 com 80% da carga anotada antes (Ribeiro et al., 2021), com a opção de pular o aquecimento daquele dia. Só aquece o primeiro exercício de cada região que ainda não trabalhou no treino, nem como músculo auxiliar: o supino já aquece tríceps e ombro;
- na tela inicial, toque num exercício da lista para ver a prévia: o vídeo dele (o trecho do vídeo do treino, em loop), séries, técnica e motivo. Durante o treino, **Ver vídeo** no cartão mostra o mesmo trecho;
- nos programas avançados, cada técnica aparece no cartão com como fazer e o estudo: no **bi-set** e no **tri-set**, marcar a série traz o próximo exercício do grupo sem descanso, e o descanso começa depois do último; **cluster** e **rest-pause** têm o botão **Mini-pausa**;
- o topo do treino mostra o tempo desde o começo, com os descansos;
- arraste o cartão para a direita quando terminar o exercício;
- arraste para a esquerda para deixar para depois (ele volta no fim da fila);
- logo depois de marcar Feito ou Depois, aparece **Desfazer** por 6 segundos;
- no topo, **A seguir** mostra os próximos exercícios; tocar num deles traz ele para a frente (o aparelho vagou, por exemplo);
- toque em **Trocar** para escolher outro exercício na biblioteca: os mais parecidos com o original vêm primeiro, com a porcentagem de semelhança numa escala de vermelho (pouco parecido) a verde (muito parecido);
- toque em **Adicionar exercício** (na tela inicial ou no **+** durante o treino) para incluir extras: cada treino tem recomendados com o motivo de cada um (campo `extras` de `programa_ppl.json`), e dá para escolher qualquer exercício da biblioteca, só na próxima vez (ou só hoje, durante o treino) ou sempre naquele treino;
- cada exercício do programa e cada recomendado mostra **Por quê**, com uma etiqueta da base do motivo (campos `porque`/`motivo` e `evidencia`): **Estudo de crescimento**, **Estudo de ativação** (EMG, que nem sempre prevê crescimento) ou **Princípios gerais** (nenhum estudo mediu o crescimento com o exercício em si; ele segue o que faz qualquer músculo crescer: carga, volume e séries perto da falha);
- o app lembra qual é o próximo treino, as trocas feitas e retoma um treino interrompido. Tudo fica salvo no navegador do celular, sem login.

### Primeira abertura e programas

Na primeira vez, o app pergunta como a pessoa quer ser chamada, se é homem ou mulher (só para ordenar as sugestões), depois o personagem, com a descrição de cada um, e por fim o treino. A lista mostra primeiro os recomendados, depois a mobilidade e por fim os do outro sexo, que qualquer pessoa pode escolher:

| Programa | Público sugerido | Nível | Dias |
|---|---|---|---|
| [Corpo Inteiro 3x](programa_iniciante_m.md) | Homens | Iniciante | 3 |
| [Treino PPL](programa_ppl.md) | Homens | Intermediário | 3 a 6 |
| [Avançado: Superior e Inferior](programa_avancado_m.md) | Homens | Avançado | 4 |
| [Corpo Inteiro com Glúteo](programa_iniciante_f.md) | Mulheres | Iniciante | 3 |
| [Pernas e Glúteo](programa_feminino.md) | Mulheres | Intermediário | 3 a 6 |
| [Avançado: Glúteo e Pernas](programa_avancado_f.md) | Mulheres | Avançado | 4 |
| [Mobilidade](programa_mobilidade.md) | Todos | Todos | antes do treino ou no descanso |

Cada `.md` explica as escolhas com os estudos; cada exercício tem o motivo e a base no app.

### Fim do treino

O fim mostra um cartão com o personagem comemorando, o tempo total de treino (com os descansos), as séries, os exercícios e uma estimativa de calorias: MET × peso × tempo, com 3,5 METs para musculação, 6,0 se o treino foi pesado e 2,3 para mobilidade (Compendium of Physical Activities, Ainsworth et al., 2011).

**Compartilhar treino** monta um card em formato de story (1080 × 1920) com o personagem comemorando, o treino, o tempo, as séries, as calorias, a ofensiva e o nome da pessoa, sem link. No celular, abre o menu de compartilhar (Instagram, WhatsApp e outros); onde isso não existe, dá para salvar a imagem.

Depois, **Como foi o treino?** (Leve, Na medida, Pesado ou No limite) dá uma sugestão:

- **Leve:** subir 2,5–5% da carga (ACSM, 2009) ou parar mais perto da falha (Robinson et al., 2024), com um botão para sugerir +5% no próximo treino igual;
- **Na medida** e **Pesado:** manter;
- **No limite:** botões para **+30 s de descanso** (Schoenfeld et al., 2016; Singer et al., 2024) e **baixar 10% da carga** no próximo treino igual. O ajuste aparece no treino, vale uma vez e pode ser desfeito.

### Personagem, ofensiva e treino

Ao lado do personagem fica uma frase do dia com o nome, como "Bora, Ana! Dia bom pra treinar." ou "Vencendo o cara do espelho, João." Ela muda a cada dia e conforme a ofensiva: treino feito, ofensiva em risco ou volta depois de dias parado. O nome se troca na aba **Personagem**.

Na tela inicial fica o personagem escolhido com a **ofensiva**, os dias seguidos de treino, como no Duolingo:

- cada dia com treino soma 1, e dia de descanso não apaga;
- a ofensiva apaga quando não dá mais para bater a meta da semana (semana sem meta pede 1 treino). No dia em que é preciso treinar para não apagar, o fogo pisca e o app avisa;
- são 11 personagens ([`personagens/`](personagens/)), cada um com 4 imagens: **começando**, **no auge** (15 dias de ofensiva ou mais), **afastado** (4 dias ou mais sem treinar) e **de volta** (até uma semana depois de voltar). A fase vem de `fase()` em `ofensiva.js`;
- as imagens não têm fundo, e o personagem fica parado;
- **bloqueio de ofensiva:** todo usuário ganha 2 de presente; depois, na aba Personagem, cada um custa 50 pontos e dá para guardar até 2. Dá para usar na hora ("Usar um bloqueio hoje", na aba ou no cartão do personagem quando a ofensiva está em risco) e devolver no mesmo dia se der para treinar. Se esquecer e a ofensiva fosse apagar (viagem, doença), o app usa o bloqueio sozinho: o dia sem treino conta para a meta da semana, sem somar dia de ofensiva, e aparece com 🧊 na semana. Se os bloqueios guardados não bastam para salvar a semana, nenhum é gasto (`aplicarBloqueios` em `ofensiva.js`). Os pontos mostrados são os que sobram para gastar;
- o personagem aparece também no topo do treino, no descanso e no fim do treino. O descanso abre num cartão laranja de tela cheia, com o personagem descansando, o tempo, o que vem a seguir, **+30 s** e **Pular**; quando acaba, fica verde e ele comemora. **Minimizar** reduz o descanso a uma barra para ver o cartão do exercício, e marcar o exercício como **Feito** encerra o descanso.

### Aeróbico e pontos

**Armário do dia:** uma vez por dia, a tela inicial tem um armário para abrir. Ele dá +5, +10 ou +20 pontos, pontos do treino em dobro ou em triplo naquele dia (se treinar) ou um bloqueio de ofensiva (vira pontos se já houver 2 guardados). Abrindo 7 dias seguidos, vem o armário VIP, só com os prêmios melhores: triplo, +30 pontos ou bloqueio.

**Loja** (terceira aba da folha do personagem; tocar nos pontos abre ela):

- **Bloqueio de ofensiva**, 50 pontos, até 2 guardados;
- **Reparar ofensiva**, 150 pontos: se a ofensiva apagou sem bloqueio, dá para recuperá-la em até 2 dias. Os dias que faltaram para a meta ficam protegidos (`diasParaSalvar` em `ofensiva.js`);
- **Dobro ou nada**, 50 pontos: com a ofensiva acesa por 14 dias, recebe 100; se ela apagar, perde a aposta.

**Bordas da ofensiva:** o cartão do personagem e o card de compartilhar ganham borda conforme os dias de ofensiva: Madeira (3), Ferro (7), Bronze (15), Prata (30), Ouro (60) e Diamante (100). Se a ofensiva apagar, a borda volta junto. As cores do card de compartilhar (Laranja, Noite, Neon, Rosa e Dourado) são grátis, à escolha.

Cada dia de treino vale **10 pontos**. No fim do treino, o cartão **ADD aeróbico e ganhe + pontos** abre seis opções com foto: caminhada e corrida na esteira, bicicleta, elíptico, escada e remo. Cada uma mostra o impacto nas articulações e as calorias de 30 minutos para o peso da pessoa, e a tela mostra os minutos de aeróbico da semana contra os 150 recomendados pela OMS.

**Abrir cronômetro** leva a uma tela cheia em que a pessoa escolhe o tempo (atalhos de 15, 20, 30 e 45 min, ou − e + de 1 em 1 minuto, até 3 horas), começa, pausa e termina quando quiser. O cronômetro continua mesmo se o app for fechado. Ao acabar, apita, vibra e registra os minutos feitos: cada 2 minutos vale 1 ponto, somando até 30 minutos (+15) por dia de treino.

| Aeróbico | METs | Impacto |
|---|---|---|
| Caminhada na esteira (5,6 km/h) | 4,3 | baixo: 1 a 1,5 vez o peso do corpo por passo |
| Corrida na esteira (8 km/h) | 8,3 | alto: 2 a 3 vezes o peso do corpo por passada |
| Bicicleta ergométrica (moderado) | 6,8 | nenhum |
| Elíptico (moderado) | 5,0 | baixo |
| Escada (simulador) | 9,0 | baixo, com o joelho trabalhando dobrado |
| Remo ergométrico (moderado) | 7,0 | nenhum |

Calorias = MET × peso (kg) × horas, com os METs do Compendium of Physical Activities (Ainsworth et al., 2011). O app explica, em **O que dizem os estudos**:

- a OMS (2020) recomenda 150 a 300 min por semana de aeróbico moderado, ou 75 a 150 de intenso;
- numa revisão de 43 estudos, juntar aeróbico e musculação não diminuiu o ganho de músculo nem de força máxima, com corrida ou bicicleta, no mesmo dia ou em dias separados; só a força explosiva ganhou um pouco menos (Schumann et al., 2022);
- aeróbico logo antes da musculação diminui as repetições do treino de força por algumas horas (Sporer e Wenger, 2003), por isso fica no fim;
- a corrida diminuiu um pouco o crescimento das fibras do tipo I, e a bicicleta não (Lundberg et al., 2022, evidência preliminar), por isso o app sugere evitar corrida em dia de perna.

Toque no personagem para trocar: a folha tem duas abas, **Treino** (primeiro homem ou mulher, que só muda a ordem das sugestões, e depois a lista de programas) e **Personagem** (o escolhido aparece grande, com a descrição). Cada programa lembra o próprio próximo treino; a ofensiva, o histórico, as cargas e a semana planejada continuam os mesmos.

### Semana

A semana começa no domingo, pela data do celular. Na primeira abertura de cada semana o app pergunta quantos dias a pessoa pretende treinar (3, 4, 5 ou 6) e distribui os treinos da sequência nos dias:

| Meta | Dias sugeridos |
|---|---|
| 3 | segunda, quarta e sexta |
| 4 | segunda, terça, quinta e sexta |
| 5 | segunda a sexta |
| 6 | segunda a sábado |

A tira **D S T Q Q S S** mostra o treino de cada dia. Tocar num dia troca entre treino e descanso, e terminar um treino marca o dia em verde. Um dia planejado que passou sem treino aparece como "faltou", e a sequência continua no dia seguinte. A tela inicial então pergunta: **começar o treino que faltou** (recomendado, porque o que mais pesa no crescimento é o volume de cada músculo na semana, e treinar um dia depois quase não muda o resultado: Pelland et al., 2026; Schoenfeld, Grgic & Krieger, 2019) ou **pular para o seguinte**. Faltar um dia não tira o que foi ganho: quem parou 3 semanas recuperou rápido e cresceu igual a quem não parou (Ogasawara et al., 2013).

**Lembrete de domingo:** um site sem servidor não consegue mandar notificação sozinho. Por isso o botão **Lembrete todo domingo** cria um evento semanal na agenda do celular: um link para o Google Agenda (Android) e o arquivo [`lembrete-domingo.ics`](lembrete-domingo.ics) para o Calendário do iPhone, com aviso todo domingo às 9h.

### Como a semelhança é calculada

[`semelhanca.js`](semelhanca.js) compara o exercício original com cada opção da biblioteca:

| Parte | Peso | O que mede |
|---|---|---|
| Músculos | 50% | Quanto a opção cobre os músculos principais do original e quanto os músculos coincidem no todo (principal vale 1, auxiliar 0,5) |
| Movimento | 30% | Mesmo padrão de movimento vale 100%; padrões parecidos valem uma parte (agachamento e afundo, 80%) |
| Tipo | 10% | Multiarticular ou isolado |
| Equipamento | 10% | Mesmo equipamento |

Exemplos: leg press no lugar do agachamento dá 87%; cadeira extensora, 46%. O padrão de movimento vem do nome do exercício (`gerar_biblioteca.py`) e também separa o deltoide: a base chama todo exercício de ombro de "ombros", e o padrão diz se é anterior, lateral ou posterior. Algumas trocas têm a nota reduzida com base em estudos: tríceps na polia no lugar do tríceps acima da cabeça (Maeo et al., 2023), mesa flexora deitada no lugar da sentada (Maeo et al., 2021) e panturrilha sentada no lugar da em pé (Kinoshita et al., 2023). Nessas trocas, e entre cabo e halteres na elevação lateral (Larsen et al., 2025) ou entre máquina e peso livre (Haugen et al., 2023), a tela da troca mostra o que o estudo encontrou (`estudo()` em `semelhanca.js`).

Para testar no computador:

```bash
python3 -m http.server -d treinos 8000
# abra http://localhost:8000
```

## Publicar como site (GitHub Pages)

O app é um site estático: não precisa de servidor, banco de dados nem login.

1. No GitHub, abra o repositório e vá em **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Escolha a branch com estes arquivos e a pasta **/ (root)**, e clique em **Save**.
4. Em um ou dois minutos o site fica no ar em `https://mattheusmatos.github.io/exercise/` (a raiz leva direto ao app).

Cada push nessa branch atualiza o site sozinho.

## Instalar no celular

- **Android (Chrome):** abra o link e toque em **Instalar como app**, na tela inicial do app, ou em **Instalar app** no menu do Chrome.
- **iPhone (Safari):** abra o link, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.

Instalado, ele abre em tela cheia pelo ícone e funciona sem internet depois da primeira abertura (`sw.js` guarda o app e as fotos do programa; os vídeos precisam de internet). O progresso fica no aparelho: no iPhone, o app instalado e o Safari guardam o progresso separado, então instale antes de começar a usar.

Ao trocar fotos ou a biblioteca, mude `VERSAO` em `sw.js` para os celulares baixarem tudo de novo. Mudanças em código e no programa chegam sozinhas na próxima abertura com internet.

## Como gerar os vídeos e as fotos

Requisitos: Python 3 com Pillow, e ffmpeg (com libx264) para os vídeos.

```bash
git clone --depth 1 https://github.com/MattheusMatos/free-exercise-db ../free-exercise-db
python3 treinos/gerar_videos.py --fotos ../free-exercise-db           # todos os vídeos
python3 treinos/gerar_videos.py --fotos ../free-exercise-db pull_b    # só um
python3 treinos/copiar_fotos.py --fotos ../free-exercise-db           # fotos do app
# versão feminina: os mesmos comandos com --programa treinos/programa_feminino.json

git clone --depth 1 https://github.com/MattheusMatos/exercicios-bd-ptbr ../exercicios-bd-ptbr
python3 treinos/gerar_biblioteca.py --fotos ../free-exercise-db --ptbr ../exercicios-bd-ptbr
```

Para mudar um exercício do programa, edite `programa_ppl.json` (ou `programa_feminino.json`) e rode `gerar_videos.py` e `copiar_fotos.py` de novo. O campo `imagem` é o nome da pasta do exercício em `free-exercise-db/exercises/`; para achar pelo nome em português, procure no [`exercicios-bd-ptbr`](https://github.com/MattheusMatos/exercicios-bd-ptbr), que usa os mesmos ids.

As fotos são do [free-exercise-db](https://github.com/yuhonas/free-exercise-db), em domínio público (Unlicense).
