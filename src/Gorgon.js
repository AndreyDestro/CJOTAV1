import Phaser from 'phaser';

export class Gorgon {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'gorgon_idle');
    this.sprite.setScale(2);
    this.sprite.setDepth(1);
    this.sprite.play('gorgon_idle');
    this.sprite.setCollideWorldBounds(true);
    this.maxHealth = 100;
    this.health = 100;
    this.healthBarBg = scene.add.rectangle(x - 40, y - 90, 80, 10, 0x222222).setOrigin(0, 0);
    this.healthBar = scene.add.rectangle(x - 40, y - 90, 80, 10, 0xff0000).setOrigin(0, 0);
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.hasDealtDamage = false;
    this.isDead = false;
    this.damageWindowActive = false;
    this.damageWindowEvent = null;
  }

  takeDamage(amount) {
    if (this.health <= 0) return;
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    this.healthBar.width = (this.health / this.maxHealth) * 80;
    if (this.health > 0) {
      this.scene?.playSfxQuiet?.('gorgon_hurt_sfx', 0.35);
      this.sprite.play('gorgon_hurt');
      this.sprite.once('animationcomplete-gorgon_hurt', () => {
        this.sprite.play('gorgon_idle');
      });
    } else {
      if (!this.isDead) {
        this.isDead = true;
        this.scene.addScore?.(100);
        this.scene?.playSfxQuiet?.('gorgon_hurt_sfx', 0.35);
      }
      this.sprite.play('gorgon_dead');
      this.sprite.setVelocityX(0);
      this.isAttacking = false;
      this.hasDealtDamage = false;
      this.damageWindowActive = false;
      if (this.damageWindowEvent) {
        this.damageWindowEvent.remove(false);
        this.damageWindowEvent = null;
      }
      this.sprite.body.enable = false;
      this.sprite.once('animationcomplete-gorgon_dead', () => {
        this.sprite.disableBody(true, true);
        this.healthBar.destroy();
        this.healthBarBg.destroy();
      });
    }
  }

  update(knight) {
    if (this.health <= 0 || this.isDead) return;
    // Movimentação: segue o cavaleiro
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, knight.x, knight.y);
    if (dist > 80) {
      const dir = knight.x < this.sprite.x ? -1 : 1;
      this.sprite.setVelocityX(80 * dir);
      this.sprite.flipX = dir < 0;
      if (!this.isAttacking) this.sprite.play('gorgon_idle', true);
    } else {
      this.sprite.setVelocityX(0);
      // Ataque se estiver perto e cooldown
      if (!this.isAttacking && this.attackCooldown <= 0) {
        this.isAttacking = true;
        this.hasDealtDamage = false;
        this.damageWindowActive = false;
        if (this.damageWindowEvent) {
          this.damageWindowEvent.remove(false);
        }
        this.sprite.play('gorgon_attack1');
        this.damageWindowEvent = this.scene.time.delayedCall(320, () => {
          if (this.isDead) return;
          this.damageWindowActive = true;
          this.scene.time.delayedCall(180, () => {
            this.damageWindowActive = false;
          });
        });
        this.sprite.once('animationcomplete-gorgon_attack1', () => {
          this.isAttacking = false;
          this.attackCooldown = 60; // 1 segundo se frameRate=60
          this.hasDealtDamage = false;
          this.damageWindowActive = false;
          this.sprite.play('gorgon_idle');
          // Dano ao cavaleiro (implementar lógica no main.js se desejar)
        });
      }
    }
    if (this.attackCooldown > 0) this.attackCooldown--;
    // Atualiza barra de vida junto ao sprite
    this.healthBarBg.x = this.sprite.x - 40;
    this.healthBarBg.y = this.sprite.y - 90;
    this.healthBar.x = this.sprite.x - 40;
    this.healthBar.y = this.sprite.y - 90;
  }
}
