import Phaser from 'phaser';

import { createStyledText } from '../utils/text.js';

// Cena do menu inicial que apresenta o jogo e direciona o jogador
export default class TitleScene extends Phaser.Scene {
  constructor(config) {
    super({ key: 'TitleScene' });
    this.config = config;
  }

  create() {
    const { width, height } = this.scale;

    // Plano de fundo ocupa toda a tela, independentemente da resolucao atual
    const background = this.add.image(0, 0, 'background_start');
    background.setOrigin(0, 0);
    background.setDisplaySize(width, height);

    // Reinicia o audio e executa a trilha do menu
    this.sound.stopAll();
    this.sound.play('music_title', { loop: true, volume: 0.5 });

    // Titulo principal do jogo
    const title = createStyledText(this, width / 2, height * 0.32, 'Cavaleiro de Campos', {
      fontSize: '42px',
      color: '#fcee09'
    });
    title.setOrigin(0.5);

    // Opcao que leva o jogador para a cena de historia
    const startText = createStyledText(this, width / 2, height * 0.55, 'Comecar', {
      fontSize: '24px',
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

    // Opcao para encerrar o jogo no navegador
    const exitText = createStyledText(this, width / 2, height * 0.65, 'Sair', {
      fontSize: '24px',
      color: '#fcee09'
    });
    exitText.setOrigin(0.5);
    exitText.setInteractive({ useHandCursor: true });
    exitText.on('pointerover', () => exitText.setTint(0xffffff));
    exitText.on('pointerout', () => exitText.clearTint());
    exitText.on('pointerdown', () => {
      this.sound.stopAll();
      alert('Obrigado por jogar Cavaleiro de Campos!');
    });

    // Assinatura exibida no rodape do menu
    const footerText = createStyledText(this, width / 2, height - 40, '2025 - Desenvolvido por Andrey Destro', {
      fontSize: '14px'
    });
    footerText.setOrigin(0.5);
  }
}
