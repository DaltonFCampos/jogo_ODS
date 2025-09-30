// src/scenes/MainScene.js
export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');

    // Player & tiros
    this.fireRate = 120;
    this.bulletSpeed = 650;
    this.lastShot = 0;
    this.bulletLifespan = 2000;

    // Inimigos
    this.enemySpawnRate = 800;   // ms entre spawns
    this.enemySpeedMin = 40;     // ↓ mais lento
    this.enemySpeedMax = 80;     // ↓ mais lento
    this.score = 0;
  }

  preload() {
    let g = null
    // Nave
    this.load.image('ship', 'assets/ship.png');
    // Bala
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x20d11d, 1);
    g.fillRect(0, 0, 3, 10);
    g.generateTexture('bullet', 3, 10);
    g.destroy();

    // Inimigo
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xff4d6d, 1);
    g.fillCircle(12, 12, 12);
    g.generateTexture('enemy', 24, 24);
    g.destroy();
  }

  create() {
    // Player
    this.player = this.physics.add.image(400, 500, 'ship')
      .setScale(0.5)
      .setCollideWorldBounds(true)
      .setDrag(800)
      .setMaxVelocity(400);
    
    this.player.hp = 5;


    // Controles
    this.keys = this.input.keyboard.addKeys({ up:'W', left:'A', down:'S', right:'D' });
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // Tecla para pausar
    this.keyPause = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.isPaused = false;

    // Grupos
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 120, // um pouco maior pra evitar saturar cedo
    });

    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 5,
    });

    // HUD
    this.add.text(10, 10, 'WASD para mover • SPACE para atirar', {
      color: 'red', fontFamily: 'monospace'
    });
    this.scoreText = this.add.text(10, 28, 'score: 0', {
      color: '#fff', fontFamily: 'monospace'
    });

    this.hpText = this.add.text(10, 46, 'HP: 5', {
      color: '#ff8888', fontFamily: 'monospace'
    });
    // Texto "PAUSADO"
    this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'PAUSADO', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffff00'
    }).setOrigin(0.5).setVisible(false);


    // Bounds + descarte só de BALAS por borda
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.physics.world.on('worldbounds', (body) => {
      const obj = body?.gameObject;
      if (!obj || !obj.active) return;
      if (obj.texture?.key === 'bullet') obj.disableBody(true, true);
    });

    // Overlap bala × inimigo
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);

    // Spawner
    this.enemySpawnEvent = this.time.addEvent({
      delay: this.enemySpawnRate,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.physics.add.overlap(this.player, this.enemies, this.onEnemyHitPlayer, null, this);

  }

  update(time) {

    if (Phaser.Input.Keyboard.JustDown(this.keyPause)) {
      this.isPaused = !this.isPaused;
      this.pauseText.setVisible(this.isPaused);

      if (this.isPaused) {
        this.physics.world.pause();
        this.enemySpawnEvent.paused = true;
      } else {
        this.physics.world.resume();
        this.enemySpawnEvent.paused = false;
      }
    }

    if (this.isPaused) return;

    // Movimento do player
    const speed = 260;
    let dx = 0, dy = 0;
    if (this.keys.left.isDown)  dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown)    dy -= 1;
    if (this.keys.down.isDown)  dy += 1;

    const len = Math.hypot(dx, dy) || 1;
    this.player.setVelocity((dx/len)*speed, (dy/len)*speed);

    if (dx || dy) {
      const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
      const currentAngle = this.player.rotation;

      // o terceiro argumento é a velocidade da interpolação
      this.player.rotation = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, 0.25);
    }

    // Tiro automático
    if (this.keySpace.isDown && time > this.lastShot + this.fireRate) {
      this.fireBullet();
      this.lastShot = time;
    }

    // Lifespan das balas
    this.bullets.children.iterate((b) => {
      if (!b || !b.active) return;
      if (time - (b.getData('born') || 0) > this.bulletLifespan) {
        b.disableBody(true, true);
      }
    });

    // Limpa inimigos que passaram do fundo (margem maior pra garantir)
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      if (e.y > this.scale.height + 40) e.disableBody(true, true);
    });
  }

  fireBullet() {
    // Direção da ponta
    const rot = this.player.rotation;
    const fx = Math.cos(rot - Math.PI / 2);
    const fy = Math.sin(rot - Math.PI / 2);

    const noseOffset = 16;
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

    // Sem gravidade/arrasto
    if (bullet.body.setAllowGravity) bullet.body.setAllowGravity(false);
    else bullet.body.allowGravity = false;
    bullet.body.setDrag(0, 0);

    // Worldbounds só para bala
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;

    // Velocidade e rotação
    bullet.setVelocity(fx * this.bulletSpeed, fy * this.bulletSpeed);
    bullet.setRotation(rot);

    bullet.setData('born', this.time.now);
  }

  spawnEnemy() {
    // Nasce um pouco acima do topo
    const x = Phaser.Math.Between(24, this.scale.width - 24);
    const y = -20;

    // Use get() para reusar do pool (ou criar até maxSize); pode retornar null se pool saturar
    let enemy = this.enemies.get(x, y, 'enemy');
    if (!enemy) return; // pool cheio -> evita erro

    // Garante corpo Arcade
    if (!enemy.body) this.physics.world.enable(enemy);

    // Reset/reativação
    enemy
      .setActive(true)
      .setVisible(true)
      .setDepth(3);

    enemy.body.enable = true;
    enemy.body.reset(x, y);
    enemy.hp = 2;

    // Sem gravidade
    if (enemy.body.setAllowGravity) enemy.body.setAllowGravity(false);
    else enemy.body.allowGravity = false;

    // Velocidade descendente mais lenta
    const vy = Phaser.Math.Between(this.enemySpeedMin, this.enemySpeedMax);
    enemy.setVelocity(0, vy);

    // NÃO usar collideWorldBounds pra eles não morrerem no topo
    // Limpeza ocorre no update() quando saem do fundo
  }

  onBulletHitEnemy(bullet, enemy) {
    bullet.disableBody(true, true);

    enemy.hp -= 1;

    if (enemy.hp <= 0) {
      enemy.disableBody(true, true);
      this.score += 10;
      this.scoreText.setText(`score: ${this.score}`);
      this.cameras.main.flash(80, 255, 255, 255);
    }
  }

  onEnemyHitPlayer(player, enemy) {
    enemy.disableBody(true, true);

    player.hp -= 1;
    this.hpText.setText(`HP: ${player.hp}`);

    this.cameras.main.shake(150, 0.01);

    if (player.hp <= 0) {
      this.scene.restart();
    }
  }
}
