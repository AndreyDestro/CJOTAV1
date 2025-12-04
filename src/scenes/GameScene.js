import Phaser from 'phaser';

import Knight from '../objects/Knight.js';
import Gorgon from '../objects/Gorgon.js';
import { createStyledText } from '../utils/text.js';

// Cena principal onde ocorre a jogabilidade do cavaleiro contra as gorgonas
export default class GameScene extends Phaser.Scene {
  constructor(config) {
    super({ key: 'GameScene' });
    this.config = config;
  }

  init() {
    // Estados basicos que sao reiniciados toda vez que a cena comeca
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.healthBarFullWidth = 120;
    this.isAttacking = false;
    this.isHurt = false;
    this.isDead = false;
    this.isDefending = false;
    this.enemies = [];
    this.enemySpawnEvent = null;
    this.gameOverShown = false;
    this.score = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Cria o plano de fundo com o tamanho atual do jogo
    this.add.image(0, 0, 'background_stage').setOrigin(0, 0).setDisplaySize(width, height).setDepth(0);

    // Inicia a musica da fase de combate
    this.sound.stopAll();
    this.sound.play('music_gameplay', { loop: true, volume: 0.5 });

    // Painel com a pontuacao atual do jogador
    this.scoreText = createStyledText(this, 24, 24, 'Pontuacao: 0', {
      fontSize: '14px'
    }).setDepth(10);

    // Configura os controles principais
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.defendKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Registra todas as animacoes usadas por cavaleiro e gorgona
    this.createAnimations();

    const spawnY = height - 150;
    // Instancia o cavaleiro e posiciona a barra de vida acima do personagem
    this.knight = new Knight(this, width * 0.5, spawnY);
    this.healthBarBackground = this.add.rectangle(0, 0, this.healthBarFullWidth, 12, 0x222222).setOrigin(0.5);
    this.healthBar = this.add.rectangle(0, 0, this.healthBarFullWidth, 12, 0xff0000).setOrigin(0.5);
    this.healthBarContainer = this.add.container(this.knight.sprite.x, this.knight.sprite.y - 90, [
      this.healthBarBackground,
      this.healthBar
    ]);

    // Convoca a primeira gorgona e agenda respawns periodicos
    this.spawnGorgon(width + 50, spawnY);
    this.enemySpawnEvent = this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: () => {
        if (this.isDead) return;
        const spawnX = Phaser.Math.Between(0, 1) === 0 ? -50 : width + 50;
        this.spawnGorgon(spawnX, spawnY);
      }
    });
  }

  update() {
    const knight = this.knight?.sprite;
    if (!knight) {
      return;
    }

    // Mantem a barra de vida alinhada ao cavaleiro, ajustando a largura conforme o dano
    if (this.healthBarContainer) {
      const fillRatio = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
      const barY = knight.y - 90;
      this.healthBarContainer.setPosition(knight.x, barY);
      const currentWidth = this.healthBarFullWidth * fillRatio;
      this.healthBar.width = currentWidth;
      this.healthBar.displayWidth = currentWidth;
    }

    // Verifica se o jogador esta segurando a tecla de defesa
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

    // Filtra inimigos inativos e processa interacoes com cada um
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

    // Durante animacoes especificas, o cavaleiro nao pode receber novos comandos
    if (this.isDead || this.isHurt || this.isDefending || this.isAttacking) {
      return;
    }

    // Executa o ataque corpo a corpo quando o jogador aperta espaco
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      knight.setVelocityX(0);
      this.isAttacking = true;
      this.playSfxQuiet('sword_attack', 0.3);
      knight.play('attack1');
      knight.once('animationcomplete-attack1', () => {
        this.isAttacking = false;
        knight.play('idle');
      });

      // Seleciona automaticamente o inimigo mais perto dentro do alcance
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

    // Movimento horizontal do cavaleiro
    if (this.cursors.left.isDown) {
      knight.setVelocityX(-340);
      knight.flipX = true;
    } else if (this.cursors.right.isDown) {
      knight.setVelocityX(340);
      knight.flipX = false;
    } else {
      knight.setVelocityX(0);
    }

    // Estado de animacao baseado no teclado e na fisica
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
    // Cria uma nova gorgona e armazena a referencia para atualizacoes futuras
    const enemy = new Gorgon(this, x, y);
    this.enemies.push(enemy);
    return enemy;
  }

  addScore(amount) {
    this.score += amount;
    this.scoreText?.setText(`Pontuacao: ${this.score}`);
  }

  handleGameOver() {
    if (this.gameOverShown) {
      return;
    }
    this.gameOverShown = true;

    // Cancela novos spawns e pausa as fisicas para congelar a cena
    this.enemySpawnEvent?.remove(false);
    this.enemySpawnEvent = null;

    this.sound.stopAll();
    this.sound.play('music_gameover', { loop: false, volume: 0.6 });

    this.physics.world.pause();
    this.knight?.sprite?.setVelocity(0);
    this.enemies.forEach(enemy => {
      enemy.sprite?.setVelocity(0);
      enemy.isAttacking = false;
    });

    // Sobrepoe um painel escuro com informacoes de fim de jogo
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0, 0).setDepth(50);

    createStyledText(this, width / 2, height * 0.4, 'Fim de jogo', {
      fontSize: '28px',
      color: '#ff3b3b'
    }).setOrigin(0.5).setDepth(51);

    createStyledText(this, width / 2, height * 0.46, `Pontuacao: ${this.score}`, {
      fontSize: '16px'
    }).setOrigin(0.5).setDepth(51);

    const defeatLore = [
      'Sem o cristal do sol, a nevoa vence mais uma noite.',
      'Os gorgonas espalham seu veneno pelas plantacoes,',
      'e o povo de Campos aguarda, em silencio, por uma nova chance.'
    ].join('\n');

    createStyledText(this, width / 2, height * 0.75, defeatLore, {
      fontSize: '14px',
      color: '#fcee09',
      align: 'center'
    }).setOrigin(0.5).setDepth(51).setWordWrapWidth(width * 0.75).setLineSpacing(26);

    const restartText = createStyledText(this, width / 2, height * 0.55, 'Reiniciar', {
      fontSize: '18px',
      color: '#fcee09'
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
    restartText.on('pointerover', () => restartText.setTint(0xffffff));
    restartText.on('pointerout', () => restartText.clearTint());
    restartText.on('pointerdown', () => {
      this.physics.world.resume();
      this.scene.restart();
    });

    const menuText = createStyledText(this, width / 2, height * 0.6, 'Menu', {
      fontSize: '18px',
      color: '#fcee09'
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
    menuText.on('pointerover', () => menuText.setTint(0xffffff));
    menuText.on('pointerout', () => menuText.clearTint());
    menuText.on('pointerdown', () => {
      this.physics.world.resume();
      this.scene.start('TitleScene');
    });
  }

  createAnimations() {
    // Helper evita recriar animacoes quando a cena reinicia
    const maybeCreate = (key, config) => {
      if (this.anims.exists(key)) {
        return;
      }
      this.anims.create({ key, ...config });
    };

    maybeCreate('idle', {
      frames: this.anims.generateFrameNumbers('knight_idle', { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1
    });
    maybeCreate('walk', {
      frames: this.anims.generateFrameNumbers('knight_walk', { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1
    });
    maybeCreate('attack1', {
      frames: this.anims.generateFrameNumbers('knight_attack1', { start: 0, end: 4 }),
      frameRate: 12,
      repeat: 0
    });
    maybeCreate('jump', {
      frames: this.anims.generateFrameNumbers('knight_jump', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: 0
    });
    maybeCreate('knight_hurt', {
      frames: this.anims.generateFrameNumbers('knight_hurt', { start: 0, end: 1 }),
      frameRate: 6,
      repeat: 0
    });
    maybeCreate('knight_defend', {
      frames: this.anims.generateFrameNumbers('knight_defend', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1
    });
    maybeCreate('knight_dead', {
      frames: this.anims.generateFrameNumbers('knight_dead', { start: 0, end: 2 }),
      frameRate: 6,
      repeat: 0
    });

    maybeCreate('gorgon_idle', {
      frames: this.anims.generateFrameNumbers('gorgon_idle', { start: 0, end: 6 }),
      frameRate: 7,
      repeat: -1
    });
    maybeCreate('gorgon_walk', {
      frames: this.anims.generateFrameNumbers('gorgon_walk', { start: 0, end: 12 }),
      frameRate: 10,
      repeat: -1
    });
    maybeCreate('gorgon_attack1', {
      frames: this.anims.generateFrameNumbers('gorgon_attack1', { start: 0, end: 15 }),
      frameRate: 12,
      repeat: 0
    });
    maybeCreate('gorgon_dead', {
      frames: this.anims.generateFrameNumbers('gorgon_dead', { start: 0, end: 2 }),
      frameRate: 6,
      repeat: 0
    });
    maybeCreate('gorgon_hurt', {
      frames: this.anims.generateFrameNumbers('gorgon_hurt', { start: 0, end: 2 }),
      frameRate: 6,
      repeat: 0
    });
  }

  playSfxQuiet(name, volume = 0.35) {
    if (!name || !this.cache.audio.exists(name)) {
      return;
    }
    this.sound.play(name, { volume });
  }
}
