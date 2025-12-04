# Game Design Document (GDD) - Cavaleiro de Campos

## 1. Identidade do jogo
- Titulo: Cavaleiro de Campos
- Genero: Arcade de acao 2D em visao lateral, combates curtos e reativos contra hordas
- Plataforma alvo: navegadores desktop modernos (Chrome, Edge, Firefox) com teclado
- Publico alvo: jogadores a partir de 12 anos interessados em fantasia medieval com estetica retro
- Modelo de distribuicao: experiencia single-player gratuita executada diretamente no navegador

## 2. Visao e pilares
- Pitch: Um cavaleiro guardiao precisa recuperar o cristal do sol tomado por gorgonas para preservar as colheitas de Campos
- Fantasia central: mistura de mitologia e cotidiano rural paulista, com clima frio constante quando o cristal desaparece
- Pilares de design: combate responsivo com comandos acessiveis; atmosfera retro com paleta e tipografia consistentes; narrativa curta que contextualiza cada cena
- Metas de experiencia: transmitir urgencia na defesa das lavouras, recompensar dominio mecanico via pontuacao crescente, estimular replays leves

## 3. Narrativa e ambientacao
- Contexto: o cristal do sol, fonte de calor para as lavouras, foi roubado; a nevoa toma conta da noite e as gorgonas invadem os campos
- Protagonista: cavaleiro guardiao tradicional da regiao, equipado com espada e escudo
- Antagonistas: gorgonas oriundas da mata maldita, responsaveis por espalhar veneno e frio
- Estrutura narrativa: introducao no menu, explicacao do conflito na cena de lore, confrontos infinitos na gameplay, epilogo de derrota em tela de game over
- Objetivo tematico: manter as colheitas saudaveis e resgatar o cristal simbolicamente pela resistencia do heroi

## 4. Estrutura de cenas e fluxo
- PreloadScene: apresenta barra de carregamento, importa imagens, spritesheets e audio a partir de public/assets
- TitleScene: exibe logo, botoes Comecar e Sair, rodape com credito, trilha de menu
- LoreScene: mostra texto diegetico, orienta pressionar Enter ou clicar para seguir
- GameScene: combate principal com HUD, spawn ciclico de inimigos, deteccao de game over e opcoes Reiniciar/Menu
- Fluxo completo: Preload -> Title -> Lore -> Game -> Game Over (retorno a Game ou Title conforme escolha)

## 5. Entidades e atributos

### 5.1 Cavaleiro (jogador)
- Recursos: 100 pontos de vida, barra visual alinhada ao sprite, animacoes idle/walk/jump/attack/defend/hurt/dead
- Habilidades: movimentacao lateral, salto, ataque corpo a corpo, defesa que bloqueia dano frontal
- Estados chave: isAttacking (trava input), isDefending (cancela movimento), isHurt (anima dano), isDead (encerra rodada)
- Conduta: retoma animacao idle apos ataques caso esteja vivo e nao defendendo

### 5.2 Gorgona (inimigo padrao)
- Atributos: 100 pontos de vida, barra individual, animacoes idle/walk/attack/hurt/dead
- IA: aproxima com velocidade baixa ate 80 px do cavaleiro, dispara ataque com janela de dano controlada a cada 60 frames
- Recompensa: concede 100 pontos, remove-se da cena ao morrer e destroi barra de vida vinculada

## 6. Mecanicas principais
- Loop de combate: posicionar o cavaleiro, avaliar distancia, atacar gorgonas para remover ameacas e marcar pontos antes que a proxima onda surja
- Controles principais: setas esquerda/direita para mover; seta cima para saltar; barra de espaco para atacar; tecla shift para defender
- Ataque: atinge automaticamente o inimigo mais proximo dentro de 150 px, causa 25 de dano, reproduz efeito sword_attack
- Defesa: segurar shift para manter animacao defend e neutralizar dano; cancela movimento horizontal enquanto ativa
- Dano recebido: cada golpe nao bloqueado retira 10 pontos de vida e ativa animacao knight_hurt
- Progressao de dificuldade: gorgonas adicionais geradas a cada 6 segundos alternando lados de entrada, acumulando pressao constante
- Falha: vida reduzida a zero provoca animacao knight_dead, pausa fisica e abre painel de game over
- Pontuacao: texto "Pontuacao: X" no topo esquerdo, incrementado em 100 por inimigo derrotado

## 7. Sistemas de suporte
- HUD: barra de vida do cavaleiro centralizada acima do sprite, cores cinza (fundo) e vermelho (preenchimento)
- Game Over overlay: painel semitransparente com titulo "Fim de jogo", pontuacao final, texto diegetico de derrota e botoes interativos Reiniciar e Menu
- Audio: music_title para menu e lore, music_gameplay em loop na batalha, music_gameover no fim; efeitos sword_attack e gorgon_attack
- Texto estilizado: utilitario createStyledText aplica fonte Press Start 2P, sombra e stroke coerentes
- Fisica: Arcade Physics com gravidade Y=600, colisoes com limites, pixelArt ativo para preservacao de sprites

## 8. Parametros numericos principais

| Elemento                           | Valor ou comportamento                                      |
| ---------------------------------- | ----------------------------------------------------------- |
| Vida maxima do cavaleiro           | 100                                                         |
| Dano do ataque do cavaleiro        | 25 por execucao                                             |
| Velocidade horizontal do cavaleiro | 340 px/s                                                    |
| Velocidade de salto                | -350 px no eixo Y                                           |
| Vida da gorgona                    | 100                                                         |
| Velocidade de aproximacao gorgona  | 50 px/s                                                     |
| Janela de dano da gorgona          | ativa 320 ms apos iniciar ataque, dura 180 ms               |
| Dano por golpe da gorgona          | 10                                                          |
| Cooldown do ataque gorgona         | 60 frames (aprox. 1 s)                                      |
| Intervalo de spawn                 | 6000 ms em loop enquanto o jogador esta vivo                |
| Alcance de ataque do jogador       | 150 px (seleciona inimigo mais proximo dentro desse raio)   |
| Margem para aplicar dano ao jogador | 90 px de distancia do inimigo que esta atacando           |

## 9. Arte e assets
- Estilo visual: pixel art com escala 2x, paleta inspirada em retro 16-bit, backgrounds dedicados para cada cena
- Fonte: Press Start 2P carregada via CSS e garantida antes de iniciar Phaser
- Diretoria de assets: imagens e audio em public/assets/images e public/assets/audio
- Spritesheets: cavaleiro (Idle, Walk, Attack 1, Jump, Defend, Hurt, Dead) e gorgona (Idle, Walk, Attack_1, Hurt, Dead) com frames 128x128
- Backgrounds dedicados: background_start, background_lore, background_stage
- Efeitos de interface: barra de carregamento composta por graficos em PreloadScene

## 10. Tecnologia e pipeline
- Engine: Phaser 3 com modulacao ES para scenes e objetos
- Infraestrutura web: Vite para desenvolvimento e build, npm scripts padrao (`npm install`, `npm run dev`, `npm run build`, `npm run preview`)
- Configuracoes de escala: largura e altura calculadas como 90% da viewport com limites minimos 900x600; modo Phaser.Scale.FIT com autoCenter
- Fisica: Arcade default com debug opcional via SHARED_CONFIG
- Estrutura de codigo: src/main.js instancia jogo; scenes em src/scenes; entidades em src/objects; utilitarios em src/utils; assets staticos em public/assets
- Requisitos de execucao: navegador com suporte a ES modules, AudioContext desbloqueado pelo usuario, hardware capaz de renderizar 60 fps

## 11. Conteudo atual x backlog
- Implementado: ciclo completo de jogo ate game over, spawn infinito de gorgonas, HUD, trilhas dedicadas, telas de menu e lore, IA basica de perseguicao
- Melhorias planejadas (inspiradas nas recomendacoes do relatorio):
  1. Novos cenarios e fases com variacao de fundos e layouts
  2. Diversificacao de inimigos incluindo ataques a distancia
  3. Sistema de power-ups temporarios para ataque, defesa ou cura
  4. Leaderboard local ou online para registrar pontuacoes altas
  5. Cutscenes animadas para abertura e encerramento
  6. Ajustes de interface para suporte a toque e navegacao mobile

## 12. Testes e qualidade
- Estrategia atual: testes manuais por cena apos cada implementacao, verificando carregamento de assets, controles, sincronizacao do HUD e audio
- Monitorar regressao: assegurar que novas animacoes adicionadas as listas do Phaser nao dupliquem registros (createAnimations ja previne com anims.exists)
- Futuras necessidades: adicionar testes de reproducao de audio em multiplas abas, validar desempenho com multiplas gorgonas em tela, incluir checklist de acessibilidade basica (contraste, instrucoes textuais)

## 13. Riscos e mitigacoes
- Escopo infinito: adicionar criterios de vitoria ou ciclos curtos para evitar desgaste; documentar limites de spawn
- Dependencia de teclado: mapear alternativas para gamepad ou toque em iteracoes futuras
- Direitos de assets: manter registro das fontes (CraftPix, Gemini, MusicGPT) e assegurar licencas adequadas antes de distribuicao publica
- Performance em navegadores: otimizar spritesheets e audio, considerar sprites packing caso novos personagens sejam incluidos

## 14. Metricas de sucesso
- Taxa de conclusao de uma sessao (ate game over) superior a 80% para novos jogadores
- Tempo medio de sessao alvo: 3 a 5 minutos por tentativa
- Pontuacao maxima esperada na versao atual: 1500 a 2500 pontos apos pratica
- Feedback qualitativo: jogadores relatam clareza nos controles e entendimento rapido do objetivo narrativo
