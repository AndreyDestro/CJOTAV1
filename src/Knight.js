export class Knight {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'knight_idle');
    this.sprite.setScale(2);
    this.sprite.setDepth(1);
    this.sprite.play('idle');
    this.sprite.setCollideWorldBounds(true);
  }
}
