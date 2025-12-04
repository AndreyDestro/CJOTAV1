import Phaser from 'phaser';

// Cena responsavel por carregar todos os assets antes do jogo comecar
export default class PreloadScene extends Phaser.Scene {
  constructor(config) {
    super({ key: 'PreloadScene' });
    this.config = config;
  }

  preload() {
    // Exibe feedback visual enquanto os arquivos sao carregados
    this.displayProgressBar();
    // Define o caminho raiz para evitar repeticao em cada asset
    this.load.setPath('assets');

    // Cenarios
    this.load.image('background_start', 'images/backgrounds/background_start.png');
    this.load.image('background_lore', 'images/backgrounds/background_lore.png');
    this.load.image('background_stage', 'images/backgrounds/background_stage.png');

    // Sprites do cavaleiro
    this.load.spritesheet('knight_idle', 'images/sprites/knight/Idle.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_walk', 'images/sprites/knight/Walk.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_attack1', 'images/sprites/knight/Attack 1.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_jump', 'images/sprites/knight/Jump.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_defend', 'images/sprites/knight/Defend.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_hurt', 'images/sprites/knight/Hurt.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_dead', 'images/sprites/knight/Dead.png', { frameWidth: 128, frameHeight: 128 });

    // Sprites da gorgona
    this.load.spritesheet('gorgon_idle', 'images/sprites/gorgon/Idle.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('gorgon_walk', 'images/sprites/gorgon/Walk.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('gorgon_attack1', 'images/sprites/gorgon/Attack_1.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('gorgon_dead', 'images/sprites/gorgon/Dead.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('gorgon_hurt', 'images/sprites/gorgon/Hurt.png', { frameWidth: 128, frameHeight: 128 });

    // Audio
    this.load.audio('music_title', 'audio/title.mp3');
    this.load.audio('music_gameplay', 'audio/gameplay.mp3');
    this.load.audio('music_gameover', 'audio/gameover.mp3');
    this.load.audio('gorgon_attack', 'audio/gorgon_attack.mp3');
    this.load.audio('sword_attack', 'audio/sword_attack.mp3');
  }

  create() {
    // Assim que tudo estiver carregado, avancamos para o menu inicial
    this.scene.start('TitleScene');
  }

  // Desenha uma barra de progresso e ajusta a largura conforme o carregamento avanca
  displayProgressBar() {
    const { width, height } = this.cameras.main;

    const progressBarBg = this.add.graphics();
    progressBarBg.fillStyle(0x222222, 0.8);
    progressBarBg.fillRect(width / 4 - 2, height / 2 - 12, width / 2 + 4, 24);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Carregando...', {
      fontFamily: 'Press Start 2P',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', value => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 4, height / 2 - 10, (width / 2) * value, 20);
    });

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      progressBar.destroy();
      progressBarBg.destroy();
      loadingText.destroy();
    });
  }
}
