import Phaser from 'phaser';

import { createStyledText } from '../utils/text.js';

// Cena que apresenta a historia antes do combate principal
export default class LoreScene extends Phaser.Scene {
  constructor(config) {
    super({ key: 'LoreScene' });
    this.config = config;
  }

  create() {
    const { width, height } = this.scale;

    // Plano de fundo ilustrado que ocupa toda a tela
    const background = this.add.image(0, 0, 'background_lore');
    background.setOrigin(0, 0);
    background.setDisplaySize(width, height);

    // Trilha sonora reaproveitada do menu para manter continuidade
    this.sound.stopAll();
    this.sound.play('music_title', { loop: true, volume: 0.45 });

    // Texto da narrativa principal com quebra de linhas automatica
    const loreText = [
      'Nas fazendas de Campos, o cristal do sol foi roubado por hordas de gorgonas vindas da mata maldita.',
      'Sem a luz do cristal, as colheitas apodrecem e o frio domina as noites.',
      'O cavaleiro guardiao foi convocado para atravessar o vale sombrio e recuperar o brilho que sustenta o povo de Campos.'
    ].join('\n');

    const loreDisplay = createStyledText(this, width / 2, height * 0.22, loreText, {
      fontSize: '18px',
      color: '#fcee09',
      align: 'center'
    });
    loreDisplay.setOrigin(0.5, 0);
    loreDisplay.setWordWrapWidth(width * 0.8);
    loreDisplay.setLineSpacing(22);

    // Orientacao para o jogador continuar a narrativa
    const promptText = createStyledText(this, width / 2, height * 0.78, 'Pressione ENTER ou clique para avancar', {
      fontSize: '14px'
    });
    promptText.setOrigin(0.5);

    const continueToGame = () => {
      this.sound.stopAll();
      this.scene.start('GameScene');
    };

    // Permite avancar com teclado ou clique
    this.input.keyboard.once('keydown-ENTER', continueToGame);
    this.input.once('pointerdown', continueToGame);
  }
}
