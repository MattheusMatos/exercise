# Treinos

| Arquivo | O que é |
|---|---|
| [`programa_ppl.md`](programa_ppl.md) | O programa PPL explicado, com as referências científicas |
| [`programa_ppl.json`](programa_ppl.json) | Os mesmos treinos em dados, usados pelo app e pelos vídeos |
| [`programa_feminino.md`](programa_feminino.md), [`programa_feminino.json`](programa_feminino.json) | Versão com foco em pernas e glúteo, explicada e em dados |
| [`index.html`](index.html), [`app.css`](app.css), [`app.js`](app.js) | App de cartões para seguir o treino no celular |
| [`semelhanca.js`](semelhanca.js) | Calcula o quanto um exercício se parece com outro, para sugerir trocas |
| [`ofensiva.js`](ofensiva.js) | Calcula a ofensiva (dias seguidos de treino), o nível e a fase do personagem |
| [`avatar.js`](avatar.js), [`personagens/`](personagens/) | Os 11 personagens, com descrição e imagens sem fundo (fases, descanso, comemoração), e o fogo da ofensiva |
| [`aerobico.js`](aerobico.js) | Opções de aeróbico (impacto nas articulações e calorias) e os pontos |
| [`manifest.webmanifest`](manifest.webmanifest), [`sw.js`](sw.js), [`icones/`](icones/) | Deixam o app instalável no celular e funcionando sem internet |
| [`fotos/`](fotos/) | Fotos dos exercícios do programa, usadas pelo app |
| [`biblioteca/`](biblioteca/) | 619 exercícios para trocar no app: dados em português e fotos em folhas |
| [`videos/`](videos/) | Um vídeo vertical por treino (1080×1920, ~1 min) |
| [`gerar_videos.py`](gerar_videos.py) | Gera os vídeos |
| [`copiar_fotos.py`](copiar_fotos.py) | Copia e reduz as fotos do programa para o app |
| [`gerar_biblioteca.py`](gerar_biblioteca.py) | Monta a biblioteca do app |

## App

Cada exercício é um cartão com as fotos animadas, séries, RIR, descanso e dicas de execução:

- toque numa anilha ao terminar cada série e o cronômetro de descanso começa sozinho;
- arraste o cartão para a direita quando terminar o exercício;
- arraste para a esquerda para deixar para depois (ele volta no fim da fila);
- toque em **Trocar** para escolher outro exercício na biblioteca: os mais parecidos com o original vêm primeiro, com a porcentagem de semelhança numa escala de vermelho (pouco parecido) a verde (muito parecido);
- toque em **Adicionar exercício** (na tela inicial ou no **+** durante o treino) para incluir extras: cada treino tem recomendados com o motivo de cada um (campo `extras` de `programa_ppl.json`), e dá para escolher qualquer exercício da biblioteca, só para hoje ou sempre naquele treino;
- cada exercício do programa e cada recomendado mostra **Por quê**, com uma etiqueta da base do motivo (campos `porque`/`motivo` e `evidencia`): **Estudo de crescimento**, **Estudo de ativação** (EMG, que nem sempre prevê crescimento) ou **Não testado** (anatomia ou estudos com exercícios parecidos);
- o app lembra qual é o próximo treino, as trocas feitas e retoma um treino interrompido. Tudo fica salvo no navegador do celular, sem login.

### Personagem, ofensiva e treino

Na tela inicial fica o personagem escolhido com a **ofensiva**, os dias seguidos de treino, como no Duolingo:

- cada dia com treino soma 1, e dia de descanso não apaga;
- a ofensiva apaga quando não dá mais para bater a meta da semana (semana sem meta pede 1 treino). No dia em que é preciso treinar para não apagar, o fogo pisca e o app avisa;
- são 11 personagens ([`personagens/`](personagens/)), cada um com 4 imagens: **começando**, **no auge** (15 dias de ofensiva ou mais), **afastado** (4 dias ou mais sem treinar) e **de volta** (até uma semana depois de voltar). A fase vem de `fase()` em `ofensiva.js`;
- as imagens não têm fundo e o personagem se mexe conforme a fase: balança animado começando e de volta, estufa o peito no auge e se arrasta afastado (sem animação se o celular pedir menos movimento);
- o personagem aparece também no topo do treino, no descanso e no fim do treino. O descanso abre num cartão de tela cheia, com o personagem descansando, o tempo, o que vem a seguir, **+30 s** e **Pular**; quando acaba, ele comemora. **Minimizar** reduz o descanso a uma barra para ver o cartão do exercício.

### Aeróbico e pontos

Cada dia de treino vale **10 pontos**. No fim do treino, o cartão **ADD aeróbico e ganhe + pontos** abre seis opções com foto: caminhada e corrida na esteira, bicicleta, elíptico, escada e remo. Cada uma mostra o impacto nas articulações e as calorias para o tempo escolhido (10, 20 ou 30 min) e o peso da pessoa. Marcar o aeróbico soma 1 ponto a cada 2 minutos (até +15), uma vez por dia de treino.

| Aeróbico | METs | Impacto |
|---|---|---|
| Caminhada na esteira (5,5 km/h) | 4,3 | baixo: 1 a 1,5 vez o peso do corpo por passo |
| Corrida na esteira (8 km/h) | 8,3 | alto: 2 a 3 vezes o peso do corpo por passada |
| Bicicleta ergométrica (moderado) | 6,8 | nenhum |
| Elíptico (moderado) | 5,0 | baixo |
| Escada (simulador) | 9,0 | baixo, com o joelho trabalhando dobrado |
| Remo ergométrico (moderado) | 7,0 | nenhum |

Calorias = MET × peso (kg) × horas, com os METs do Compendium of Physical Activities (Ainsworth et al., 2011). Feito depois da musculação, o aeróbico não atrapalha o ganho de músculo (Schumann et al., 2022); corrida atrapalha mais que bicicleta (Wilson et al., 2012), por isso o app sugere evitar corrida em dia de perna.

Toque no personagem para trocar: o escolhido aparece grande, com uma descrição. Na mesma tela se escolhe o treino, separado do personagem: **Treino PPL** ou **Pernas e glúteo** ([`programa_feminino.md`](programa_feminino.md)). Cada programa lembra o próprio próximo treino; a ofensiva, o histórico e a semana planejada continuam os mesmos.

### Semana

A semana começa no domingo, pela data do celular. Na primeira abertura de cada semana o app pergunta quantos dias a pessoa pretende treinar (3, 4, 5 ou 6) e distribui os treinos da sequência nos dias:

| Meta | Dias sugeridos |
|---|---|
| 3 | segunda, quarta e sexta |
| 4 | segunda, terça, quinta e sexta |
| 5 | segunda a sexta |
| 6 | segunda a sábado |

A tira **D S T Q Q S S** mostra o treino de cada dia. Tocar num dia troca entre treino e descanso, e terminar um treino marca o dia em verde. Um dia planejado que passou sem treino aparece como "faltou", e a sequência continua no dia seguinte.

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
