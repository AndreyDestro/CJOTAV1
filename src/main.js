import Phaser from 'phaser';

import PreloadScene from './scenes/PreloadScene.js';
import TitleScene from './scenes/TitleScene.js';
import LoreScene from './scenes/LoreScene.js';
import GameScene from './scenes/GameScene.js';

// Calcula o tamanho base do jogo de forma responsiva, mas evita dimensoes muito pequenas
const WIDTH = Math.max(Math.floor(window.innerWidth * 0.9), 900);
const HEIGHT = Math.max(Math.floor(window.innerHeight * 0.9), 600);

// Configuracao compartilhada entregue a cada cena no construtor
const SHARED_CONFIG = {
  width: WIDTH,
  height: HEIGHT,
  debug: false
};

// Lista as cenas na ordem em que o Phaser deve carrega-las
const SCENES = [
  PreloadScene,
  TitleScene,
  LoreScene,
  GameScene
];

// Cria instancias das cenas aplicando a mesma configuracao base
const createScene = Scene => new Scene(SHARED_CONFIG);
const initScenes = () => SCENES.map(createScene);

// Configuracao global do Phaser.Game que representa o aplicativo
const config = {
  type: Phaser.AUTO,
  ...SHARED_CONFIG,
  parent: 'game-container',
  backgroundColor: '#000000',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: SHARED_CONFIG.debug
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: initScenes()
};

// Aguarda o carregamento da fonte personalizada antes de iniciar o jogo
const startGame = () => new Phaser.Game(config);

const ensureFontsLoaded = async () => {
  if (!document.fonts || !document.fonts.load) {
    startGame();
    return;
  }

  try {
    await Promise.all([
      document.fonts.load('16px "Press Start 2P"'),
      document.fonts.ready
    ]);
  } catch (error) {
    // Se a fonte falhar, ainda assim iniciamos o jogo com fallback padrao
    console.warn('Falha ao carregar fonte Press Start 2P:', error);
  }

  startGame();
};

ensureFontsLoaded();
