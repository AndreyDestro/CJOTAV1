import Phaser from 'phaser';

const BAR_WIDTH = 80;

// Classe que controla logica individual de cada gorgona
export default class Gorgon {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'gorgon_idle');
    this.sprite.setScale(2);
    this.sprite.setDepth(1);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.play('gorgon_idle');

    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.healthBarBg = scene.add.rectangle(x - BAR_WIDTH / 2, y - 90, BAR_WIDTH, 10, 0x222222).setOrigin(0, 0);
    this.healthBar = scene.add.rectangle(x - BAR_WIDTH / 2, y - 90, BAR_WIDTH, 10, 0xff0000).setOrigin(0, 0);

    // Controle de estado do comportamento ofensivo
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.hasDealtDamage = false;
    this.isDead = false;
    this.damageWindowActive = false;
    this.damageWindowEvent = null;
  }

  takeDamage(amount) {
    if (this.health <= 0 || this.isDead) {
      return;
    }

    // Atualiza vida restante e redimensiona a barra visual
    this.health = Math.max(this.health - amount, 0);
    const currentWidth = (this.health / this.maxHealth) * BAR_WIDTH;
    this.healthBar.width = currentWidth;
    this.healthBar.displayWidth = currentWidth;

    if (this.health > 0) {
      this.sprite.play('gorgon_hurt');
      this.sprite.once('animationcomplete-gorgon_hurt', () => {
        if (!this.isDead) {
          this.sprite.play('gorgon_idle');
        }
      });
      return;
    }

    if (this.isDead) {
      return;
    }

    this.isDead = true;
    this.scene.addScore?.(100);
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

  update(knight) {
    if (this.health <= 0 || this.isDead) {
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, knight.x, knight.y);
    if (dist > 80) {
      // Aproxima lentamente quando esta fora do alcance de ataque
      const dir = knight.x < this.sprite.x ? -1 : 1;
      this.sprite.setVelocityX(50 * dir);
      this.sprite.flipX = dir < 0;
      if (!this.isAttacking) {
        if (this.sprite.anims.currentAnim?.key !== 'gorgon_walk') {
          this.sprite.play('gorgon_walk', true);
        }
      }
    } else {
      // Quando perto o suficiente inicia animacao de ataque com janela de dano
      this.sprite.setVelocityX(0);
      if (!this.isAttacking && this.sprite.anims.currentAnim?.key !== 'gorgon_idle') {
        this.sprite.play('gorgon_idle', true);
      }
      if (!this.isAttacking && this.attackCooldown <= 0) {
        this.isAttacking = true;
        this.hasDealtDamage = false;
        this.damageWindowActive = false;

        if (this.damageWindowEvent) {
          this.damageWindowEvent.remove(false);
        }

        this.sprite.play('gorgon_attack1');
        this.damageWindowEvent = this.scene.time.delayedCall(320, () => {
          if (this.isDead) {
            return;
          }
          this.damageWindowActive = true;
          this.scene.time.delayedCall(180, () => {
            this.damageWindowActive = false;
          });
        });

        this.sprite.once('animationcomplete-gorgon_attack1', () => {
          this.isAttacking = false;
          this.attackCooldown = 60;
          this.hasDealtDamage = false;
          this.damageWindowActive = false;
          this.sprite.play('gorgon_idle');
        });
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Mantem a barra de vida acompanhando o movimento do sprite
    this.healthBarBg.x = this.sprite.x - BAR_WIDTH / 2;
    this.healthBarBg.y = this.sprite.y - 90;
    this.healthBar.x = this.sprite.x - BAR_WIDTH / 2;
    this.healthBar.y = this.sprite.y - 90;
  }
}
