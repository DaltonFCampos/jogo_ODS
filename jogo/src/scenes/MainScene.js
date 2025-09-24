export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.fireRate = 120;     // ms entre tiros
    this.bulletSpeed = 650;
    this.lastShot = 0;
    this.bulletLifespan = 2000;
  }

  preload() {
    // Nave (triângulo apontando para cima)
    let g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x4ade80, 1);
    g.fillTriangle(0, 24, 12, 0, 24, 24);
    g.generateTexture('ship', 24, 24);
    g.destroy();

    // Bala (retângulo fino)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x20d11d, 1);
    g.fillRect(0, 0, 3, 10);
    g.generateTexture('bullet', 3, 10);
    g.destroy();
  }

  create() {
    // Player
    this.player = this.physics.add.image(400, 500, 'ship')
      .setCollideWorldBounds(true)
      .setDrag(800)
      .setMaxVelocity(400);

    // Teclas
    this.keys = this.input.keyboard.addKeys({ up:'W', left:'A', down:'S', right:'D' });
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Grupo de balas (pool)
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 80,
      runChildUpdate: false,
    });

    this.add.text(10, 10, 'WASD para mover • SPACE para atirar', {
      color: 'red', fontFamily: 'monospace'
    });

    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    // Mata qualquer bala que bater na borda
    this.physics.world.on('worldbounds', (body) => {
      const obj = body?.gameObject;
      if (obj && obj.active && obj.texture?.key === 'bullet') {
        obj.disableBody(true, true);
      }
    });
  }

  update(time) {
    // Movimento
    const speed = 260;
    let dx = 0, dy = 0;
    if (this.keys.left.isDown)  dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown)    dy -= 1;
    if (this.keys.down.isDown)  dy += 1;

    const len = Math.hypot(dx, dy) || 1;
    this.player.setVelocity((dx/len)*speed, (dy/len)*speed);

    // Gira a nave na direção do movimento (se houver)
    if (dx || dy) {
      // + PI/2 porque a textura "ship" já aponta para cima por padrão
      this.player.rotation = Math.atan2(dy, dx) + Math.PI / 2;
    }

    // Auto-fire
    if (this.keySpace.isDown && time > this.lastShot + this.fireRate) {
      this.fireBullet();
      this.lastShot = time;
    }

    // Limpa balas fora da tela
    this.bullets.children.iterate(b => {
      if (!b) return;
      if (b.active && (b.y < -20 || b.y > 620 || b.x < -20 || b.x > 820)) {
        b.disableBody(true, true);
      }
    });

    // Limpeza por lifespan (fallback)
    this.bullets.children.iterate((b) => {
      if (!b || !b.active) return;
      if (time - (b.getData('born') || 0) > this.bulletLifespan) {
        b.disableBody(true, true);
      }
    });

  }

  fireBullet() {
    // Vetor "forward" da nave baseado na rotação atual.
    // A textura aponta para cima, então o forward é (rot - PI/2).
    const rot = this.player.rotation;
    const fx = Math.cos(rot - Math.PI / 2);
    const fy = Math.sin(rot - Math.PI / 2);

    // Posição do "nariz" da nave (um pouco à frente do centro)
    const noseOffset = 16; // ajuste fino pra sair da ponta
    const bx = this.player.x + fx * noseOffset;
    const by = this.player.y + fy * noseOffset;

    const bullet = this.bullets.get(bx, by, 'bullet');
    if (!bullet) return;

    bullet
      .setActive(true)
      .setVisible(true)
      .setDepth(5);

    bullet.body.enable = true;
    bullet.body.reset(bx, by);

    // sem gravidade/arrasto
    if (bullet.body.setAllowGravity) {
      bullet.body.setAllowGravity(false);
    } else {
      bullet.body.allowGravity = false;
    }
    bullet.body.setDrag(0, 0);

    // colidir com bordas e emitir evento
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;

    // velocidade e rotação
    bullet.setVelocity(fx * this.bulletSpeed, fy * this.bulletSpeed);
    bullet.setRotation(rot);

    // lifespan
    bullet.setData('born', this.time.now);
  }
}
