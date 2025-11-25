
import Phaser from 'phaser';
import { Knight } from './Knight.js';
import { Gorgon } from './Gorgon.js';

const margem = 0.9;
const largura = Math.floor(window.innerWidth * margem);
const altura = Math.floor(window.innerHeight * margem);

const FONT_FAMILY = '"Press Start 2P", monospace';
const SHADOW_SETTINGS = { offsetX: 6, offsetY: 6, color: '#000000', blur: 0, strokeThickness: 6 };

// Centraliza a aplicação de sombra e contorno para manter a identidade visual retrô.
function applyTextEffects(text, overrides = {}) {
  const shadow = { ...SHADOW_SETTINGS, ...overrides };
  text.setShadow(shadow.offsetX, shadow.offsetY, shadow.color, shadow.blur, true, true);
  text.setStroke(shadow.color, shadow.strokeThickness);
  return text;
}

// Usa um único ponto de criação de textos para garantir tipografia e cores consistentes.
function createStyledText(scene, x, y, message, styleOverrides = {}, shadowOverrides = {}) {
  const style = { fontFamily: FONT_FAMILY, color: '#ffffff', ...styleOverrides };
  const text = scene.add.text(x, y, message, style);
  applyTextEffects(text, shadowOverrides);
  return text;
}

class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    this.load.image('background_start', 'background_start.png');
    this.load.audio('music_title', 'audio/title.mp3');
    this.load.audio('music_gameplay', 'audio/gameplay.mp3');
    this.load.audio('music_gameover', 'audio/gameover.mp3');
  }

  create() {
    const { width, height } = this.scale;
    const bg = this.add.image(0, 0, 'background_start');
    bg.setOrigin(0, 0);
    bg.setDisplaySize(width, height);

    this.sound.stopAll();
    this.sound.play('music_title', { loop: true, volume: 0.5 });

    const title = createStyledText(this, width / 2, height * 0.35, 'Cavaleiro de Campos', {
      fontSize: '48px',
      color: '#fcee09'
    });
    title.setOrigin(0.5);

    const startText = createStyledText(this, width / 2, height * 0.55, 'Começar', {
      fontSize: '28px',
      color: '#fcee09'
    });
    startText.setOrigin(0.5);
    startText.setInteractive({ useHandCursor: true });
    startText.on('pointerover', () => startText.setTint(0xffffff));
    startText.on('pointerout', () => startText.clearTint());
    startText.on('pointerdown', () => {
      this.sound.stopAll();
      this.scene.start('LoreScene');
    });

    const exitText = createStyledText(this, width / 2, height * 0.65, 'Sair', {
      fontSize: '28px',
      color: '#fcee09'
    });
    exitText.setOrigin(0.5);
    exitText.setInteractive({ useHandCursor: true });
    exitText.on('pointerover', () => exitText.setTint(0xffffff));
    exitText.on('pointerout', () => exitText.clearTint());
    exitText.on('pointerdown', () => {
      this.sound.stopAll();
      const message = 'Obrigado por jogar Cavaleiro de Campos!';
      alert(message);
    });

    const footerText = createStyledText(this, width / 2, height - 40, '2025 · Desenvolvido por Andrey Destro', {
      fontSize: '18px'
    });
    footerText.setOrigin(0.5);
  }
}

class LoreScene extends Phaser.Scene {
  constructor() {
    super('LoreScene');
  }

  preload() {
    this.load.image('background_lore', 'background_lore.png');
  }

  create() {
    const { width, height } = this.scale;
    const bg = this.add.image(0, 0, 'background_lore');
    bg.setOrigin(0, 0);
    bg.setDisplaySize(width, height);

    this.sound.stopAll();
    const playTitleMusic = () => this.sound.play('music_title', { loop: true, volume: 0.45 });
    if (!this.cache.audio.exists('music_title')) {
      this.load.audio('music_title', 'audio/title.mp3');
      this.load.once(Phaser.Loader.Events.COMPLETE, playTitleMusic);
      this.load.start();
    } else {
      playTitleMusic();
    }

    const loreText = [
      'Nas fazendas de Campos, o cristal do sol foi roubado por hordas de Gorgons que emergiram da mata amaldiçoada.',
      'Sem a luz do cristal, as colheitas apodrecem e o frio domina as noites.',
      'O cavaleiro guardião foi convocado para atravessar o vale sombrio, derrotar os monstros e recuperar o brilho que sustenta o povo de Campos.'
    ].join('\n');

    const loreDisplay = createStyledText(this, width / 2, height * 0.25, loreText, {
      fontSize: '22px',
      color: '#fcee09',
      align: 'center'
    });
    loreDisplay.setOrigin(0.5, 0);
    loreDisplay.setWordWrapWidth(width * 0.8);
    loreDisplay.setLineSpacing(22);

    const promptText = createStyledText(this, width / 2, height * 0.75, 'Pressione ENTER ou clique para avançar', {
      fontSize: '16px'
    });
    promptText.setOrigin(0.5);

    const continueToGame = () => {
      this.sound.stopAll();
      this.scene.start('MainScene');
    };

    this.input.keyboard.once('keydown-ENTER', continueToGame);
    this.input.once('pointerdown', continueToGame);
  }
}

class MainScene extends Phaser.Scene {
  maxHealth = 100;
  health = 100;
  healthBarBg = null;
  healthBar = null;
  healthBarContainer = null;
  healthBarFullWidth = 0;
  knight;
  cursors;
  attackKey;
  defendKey;
  isAttacking = false;
  isHurt = false;
  isDead = false;
  isDefending = false;
  enemies = [];
  enemySpawnEvent;
  gameOverShown = false;
  score = 0;
  scoreText;

  constructor() {
    super('MainScene');
  }

  preload() {
    // Sprites e efeitos do inimigo
    this.load.spritesheet('gorgon_idle', 'sprites/Gorgon_1/Idle.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('gorgon_attack1', 'sprites/Gorgon_1/Attack_1.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('gorgon_dead', 'sprites/Gorgon_1/Dead.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('gorgon_hurt', 'sprites/Gorgon_1/Hurt.png', { frameWidth: 128, frameHeight: 128 });
    this.load.audio('gorgon_attack', 'audio/gorgon_attack.mp3');
    this.load.audio('gorgon_hurt_sfx', 'audio/gorgon_hurt.wav');

    // Cenário e sprites do cavaleiro
    this.load.image('background', 'background_stage.png');
    this.load.spritesheet('knight_idle', 'sprites/Knight/Idle.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_walk', 'sprites/Knight/Walk.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_attack1', 'sprites/Knight/Attack 1.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_jump', 'sprites/Knight/Jump.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_defend', 'sprites/Knight/Defend.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_hurt', 'sprites/Knight/Hurt.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('knight_dead', 'sprites/Knight/Dead.png', { frameWidth: 128, frameHeight: 128 });
    this.load.audio('sword_attack', 'audio/sword_attack.mp3');
    this.load.audio('knight_hurt_sfx', 'audio/knight_hurt.wav');
  }

  create() {
    this.health = this.maxHealth;
    this.isDead = false;
    this.isHurt = false;
    this.isAttacking = false;
    this.isDefending = false;
    this.gameOverShown = false;
    this.enemies = [];
    this.score = 0;

    const { width, height } = this.scale;
    this.bg = this.add.image(0, 0, 'background').setOrigin(0, 0).setDepth(0).setDisplaySize(width, height);

    this.sound.stopAll();
    const playGameplayMusic = () => this.sound.play('music_gameplay', { loop: true, volume: 0.5 });
    if (!this.cache.audio.exists('music_gameplay')) {
      this.load.audio('music_gameplay', 'audio/gameplay.mp3');
      this.load.once(Phaser.Loader.Events.COMPLETE, playGameplayMusic);
      this.load.start();
    } else {
      playGameplayMusic();
    }

    this.scoreText = createStyledText(this, 20, 20, 'Pontuação: 0', {
      fontSize: '18px'
    }).setScrollFactor(0).setDepth(10);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.defendKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Animações do cavaleiro
    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('knight_idle', { start: 0, end: 1 }), frameRate: 2, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('knight_walk', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'attack1', frames: this.anims.generateFrameNumbers('knight_attack1', { start: 0, end: 4 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('knight_jump', { start: 0, end: 5 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'knight_hurt', frames: this.anims.generateFrameNumbers('knight_hurt', { start: 0, end: 1 }), frameRate: 6, repeat: 0 });
    this.anims.create({ key: 'knight_defend', frames: this.anims.generateFrameNumbers('knight_defend', { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
    this.anims.create({ key: 'knight_dead', frames: this.anims.generateFrameNumbers('knight_dead', { start: 0, end: 2 }), frameRate: 6, repeat: 0 });

    // Cavaleiro e barra de vida centralizada
    this.knight = new Knight(this, largura / 2, altura - 150);
    this.healthBarFullWidth = 120;
    this.healthBarBg = this.add.rectangle(0, 0, this.healthBarFullWidth, 12, 0x222222).setOrigin(0.5, 0.5);
    this.healthBar = this.add.rectangle(0, 0, this.healthBarFullWidth, 12, 0xff0000).setOrigin(0.5, 0.5);
    this.healthBarContainer = this.add.container(this.knight.sprite.x, this.knight.sprite.y - 90, [this.healthBarBg, this.healthBar]);

    // Animações do Gorgon
    this.anims.create({ key: 'gorgon_idle', frames: this.anims.generateFrameNumbers('gorgon_idle', { start: 0, end: 6 }), frameRate: 7, repeat: -1 });
    this.anims.create({ key: 'gorgon_attack1', frames: this.anims.generateFrameNumbers('gorgon_attack1', { start: 0, end: 15 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'gorgon_dead', frames: this.anims.generateFrameNumbers('gorgon_dead', { start: 0, end: 2 }), frameRate: 6, repeat: 0 });
    this.anims.create({ key: 'gorgon_hurt', frames: this.anims.generateFrameNumbers('gorgon_hurt', { start: 0, end: 2 }), frameRate: 6, repeat: 0 });

    // Primeira onda e respawns periódicos
    const spawnY = this.scale.height - 150;
    this.spawnGorgon(this.scale.width + 50, spawnY);
    this.enemySpawnEvent = this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: () => {
        if (this.isDead) return;
        const spawnX = Phaser.Math.Between(0, 1) === 0 ? -50 : this.scale.width + 50;
        this.spawnGorgon(spawnX, spawnY);
      }
    });
  }

  update() {
    if (this.knight?.sprite && this.healthBarContainer) {
      const fillRatio = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
      const barY = this.knight.sprite.y - 90;
      this.healthBarContainer.setPosition(this.knight.sprite.x, barY);
      this.healthBar.width = this.healthBarFullWidth * fillRatio;
    }

    const knight = this.knight?.sprite;
    if (!knight) return;

    const defendPressed = this.defendKey?.isDown;
    if (defendPressed && !this.isDead && !this.isHurt) {
      if (!this.isDefending) {
        this.isDefending = true;
        this.isAttacking = false;
        if (knight.anims.currentAnim?.key !== 'knight_defend') {
          knight.play('knight_defend');
        }
      }
      knight.setVelocityX(0);
    } else if (this.isDefending && !defendPressed) {
      this.isDefending = false;
    }

    this.enemies = this.enemies.filter(enemy => enemy && enemy.sprite && enemy.sprite.active);
    this.enemies.forEach(enemy => {
      enemy.update(knight);
      const canDealDamage = enemy.damageWindowActive ?? true;
      if (
        enemy.isAttacking &&
        canDealDamage &&
        !enemy.hasDealtDamage &&
        Phaser.Math.Distance.Between(knight.x, knight.y, enemy.sprite.x, enemy.sprite.y) < 90 &&
        this.health > 0 &&
        !this.isHurt &&
        !this.isDead
      ) {
        enemy.hasDealtDamage = true;
        if (!this.isDefending) {
          this.isAttacking = false;
          this.playSfxQuiet('gorgon_attack', 0.35);
          enemy.damageWindowActive = false;
          this.health = Math.max(this.health - 10, 0);

          if (this.health > 0) {
            this.isHurt = true;
            this.playSfxQuiet('knight_hurt_sfx', 0.35);
            knight.play('knight_hurt');
            knight.once('animationcomplete-knight_hurt', () => {
              this.isHurt = false;
              if (this.isDead) {
                knight.play('knight_dead');
              } else if (this.isDefending) {
                knight.play('knight_defend');
              } else {
                knight.play('idle');
              }
            });
          } else {
            this.isDead = true;
            knight.play('knight_dead');
            knight.setVelocityX(0);
            this.handleGameOver();
          }
        }
      }
    });

    if (this.isDead || this.isHurt || this.isDefending || this.isAttacking) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      knight.setVelocityX(0);
      this.isAttacking = true;
      this.playSfxQuiet('sword_attack', 0.3);
      knight.play('attack1');
      knight.once('animationcomplete-attack1', () => {
        this.isAttacking = false;
        knight.play('idle');
      });

      let target = null;
      let smallestDist = Infinity;
      this.enemies.forEach(enemy => {
        if (!enemy?.sprite || enemy.health <= 0) return;
        const dist = Phaser.Math.Distance.Between(knight.x, knight.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < 150 && dist < smallestDist) {
          smallestDist = dist;
          target = enemy;
        }
      });
      if (target) {
        target.takeDamage(25);
      }
      return;
    }

    if (this.cursors.left.isDown) {
      knight.setVelocityX(-340);
      knight.flipX = true;
    } else if (this.cursors.right.isDown) {
      knight.setVelocityX(340);
      knight.flipX = false;
    } else {
      knight.setVelocityX(0);
    }

    if (!knight.body.onFloor()) {
      knight.play('jump', true);
    } else if (this.cursors.up.isDown && knight.body.onFloor()) {
      knight.setVelocityY(-350);
      knight.play('jump', true);
    } else if (this.cursors.left.isDown || this.cursors.right.isDown) {
      knight.play('walk', true);
    } else {
      knight.play('idle', true);
    }
  }

  spawnGorgon(x, y) {
    const enemy = new Gorgon(this, x, y);
    this.enemies.push(enemy);
    return enemy;
  }

  addScore(amount) {
    this.score += amount;
    this.scoreText?.setText(`Pontuação: ${this.score}`);
  }

  handleGameOver() {
    if (this.gameOverShown) return;
    this.gameOverShown = true;

    this.enemySpawnEvent?.remove(false);
    this.enemySpawnEvent = undefined;

    this.sound.stopAll();
    const playGameOverMusic = () => this.sound.play('music_gameover', { loop: false, volume: 0.6 });
    if (!this.cache.audio.exists('music_gameover')) {
      this.load.audio('music_gameover', 'audio/gameover.mp3');
      this.load.once(Phaser.Loader.Events.COMPLETE, playGameOverMusic);
      this.load.start();
    } else {
      playGameOverMusic();
    }

    this.physics.world.pause();
    this.knight?.sprite?.setVelocity(0);
    this.enemies.forEach(enemy => {
      enemy.sprite?.setVelocity(0);
      enemy.isAttacking = false;
    });

    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0, 0).setDepth(50);

    createStyledText(this, width / 2, height * 0.4, 'Fim de Jogo', {
      fontSize: '32px',
      color: '#ff3b3b'
    }).setOrigin(0.5).setDepth(51);

    createStyledText(this, width / 2, height * 0.46, `Pontuação: ${this.score}`, {
      fontSize: '18px'
    }).setOrigin(0.5).setDepth(51);

    const defeatLore = [
      'Sem o cristal do sol, a névoa vence mais uma noite.',
      'Os Gorgons espalham seu veneno pelas plantações,',
      'e o povo de Campos aguarda, em silêncio, por uma nova chance.'
    ].join('\n');

    createStyledText(this, width / 2, height * 0.75, defeatLore, {
      fontSize: '16px',
      color: '#fcee09',
      align: 'center'
    }).setOrigin(0.5).setDepth(51).setWordWrapWidth(width * 0.75).setLineSpacing(26);

    const restartText = createStyledText(this, width / 2, height * 0.55, 'Reiniciar', {
      fontSize: '20px',
      color: '#fcee09'
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
    restartText.on('pointerover', () => restartText.setTint(0xffffff));
    restartText.on('pointerout', () => restartText.clearTint());
    restartText.on('pointerdown', () => {
      this.physics.world.resume();
      this.scene.restart();
    });

    const menuText = createStyledText(this, width / 2, height * 0.6, 'Menu', {
      fontSize: '20px',
      color: '#fcee09'
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
    menuText.on('pointerover', () => menuText.setTint(0xffffff));
    menuText.on('pointerout', () => menuText.clearTint());
    menuText.on('pointerdown', () => {
      this.physics.world.resume();
      this.scene.start('TitleScene');
    });
  }

  // Mantém todos os SFX em volumes moderados sem duplicar verificações.
  playSfxQuiet(name, volume = 0.35) {
    if (!name || !this.cache.audio.exists(name)) return;
    this.sound.play(name, { volume });
  }
}



const config = {
  type: Phaser.AUTO,
  width: largura,
  height: altura,
  scene: [TitleScene, LoreScene, MainScene],
  parent: 'app',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  }
};

new Phaser.Game(config);
