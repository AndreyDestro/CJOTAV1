// Objeto utilitario que encapsula o sprite e configuracoes do cavaleiro
export default class Knight {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'knight_idle');
    this.sprite.setScale(2);
    this.sprite.setDepth(1);
    // Mantem o heroi dentro dos limites definidos pelo Phaser
    this.sprite.setCollideWorldBounds(true);
    this.sprite.play('idle');
  }
}
