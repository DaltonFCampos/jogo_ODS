// src/scenes/MainScene.js
export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');

    // Player & tiros
    this.fireRate = 600;
    this.bulletSpeed = 650;
    this.lastShot = 0;
    this.bulletLifespan = 2000;

    // Inimigos
    this.enemySpawnRate = 800;
    this.enemySpeedMin = 20;
    this.enemySpeedMax = 40;
    this.score = 0;

    // Poluição
    this.pollutionLevel = 0;
    this.maxPollution = 100;
    this.pollutionRate = 2;
    this.pollutionDropRate = 4000;

    // Tartaruga (aliada)
    this.turtle = null;
    this.turtleSpeed = 80;
    this.turtleTarget = new Phaser.Math.Vector2();
    this.turtleRetargetInterval = 2500; // ms para trocar destino
    this._nextTurtleRetarget = 0;
  }

  preload() {
    let g = null;
    // Nave do player
    this.load.image('ship', 'assets/ship.png');

    // Bala (textura canhão)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x20d11d, 1);
    g.fillRect(0, 0, 3, 10);
    g.generateTexture('bullet', 3, 10);
    g.destroy();

    // Inimigo (círculo rosa)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xff4d6d, 1);
    g.fillCircle(12, 12, 12);
    g.generateTexture('enemy', 24, 24);
    g.destroy();

    // Tartaruga (gera uma textura simples aqui)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    // casco
    g.fillStyle(0x2e7d32, 1);
    g.fillCircle(16, 16, 14);
    // cabeça
    g.fillStyle(0x43a047, 1);
    g.fillCircle(16, 3, 5);
    // nadadeiras
    g.fillCircle(5, 12, 4);
    g.fillCircle(27, 12, 4);
    g.fillCircle(7, 24, 4);
    g.fillCircle(25, 24, 4);
    g.generateTexture('turtle', 32, 32);
    g.destroy();

    this.load.image('water', 'assets/water-tile2-seamless.png');
    this.load.image('cannonball', 'assets/cannonBall.png');
    this.load.image('pollution', 'assets/pollution.png');
  }

  create() {
    // Player
    this.player = this.physics.add.image(400, 500, 'ship')
      .setScale(0.5)
      .setCollideWorldBounds(true)
      .setDrag(800)
      .setMaxVelocity(400);

    this.player.hp = 5;

    // Fundo (água)
    this.water = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'water')
      .setOrigin(0)
      .setDepth(-1);

    // Controles
    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', down: 'S', right: 'D' });
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyPause = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.isPaused = false;

    // Grupos
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 120,
    });

    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 5,
    });

    this.pollutionGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 50,
    });

    // Tartaruga aliada
    this.turtle = this.physics.add.image(400, 350, 'turtle')
      .setDepth(2)
      .setCollideWorldBounds(true);
    this.turtle.hp = 3;

    // HUD
    this.add.text(10, 10, 'WASD: mover • SPACE: atirar • P: pausar', {
      color: '#ffffff',
      fontFamily: 'monospace'
    });

    this.scoreText = this.add.text(10, 28, 'score: 0', {
      color: '#ffffff', fontFamily: 'monospace'
    });

    this.hpText = this.add.text(10, 46, 'HP: 5', {
      color: '#ff4d4d', fontFamily: 'monospace'
    });

    this.turtleHpText = this.add.text(10, 64, 'Tartaruga HP: 3', {
      color: '#00e676', fontFamily: 'monospace'
    });

    this.pollutionLevel = 0;
    this.maxPollution = 100;
    this.pollutionText = this.add.text(10, 82, 'Poluição: 0%', {
      color: '#80deea', fontFamily: 'monospace'
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
      if (obj.texture?.key === 'cannonball') obj.disableBody(true, true);
    });

    // Overlaps
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.pollutionGroup, this.collectPollution, null, this);

    // Enemigos batem no player
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyHitPlayer, null, this);
    // Enemigos batem na tartaruga
    this.physics.add.overlap(this.turtle, this.enemies, this.onEnemyHitTurtle, null, this);
    // Tartaruga coleta poluição (ajuda a limpar)
    this.physics.add.overlap(this.turtle, this.pollutionGroup, this.onTurtleCollectPollution, null, this);

    // Spawner de inimigos
    this.enemySpawnEvent = this.time.addEvent({
      delay: this.enemySpawnRate,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    // Primeiro destino da tartaruga
    this.setNewTurtleTarget();
  }

  update(time) {
    // Pause
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
    if (this.keys.left.isDown) dx -= 1;
    if (this.keys.right.isDown) dx += 1;
    if (this.keys.up.isDown) dy -= 1;
    if (this.keys.down.isDown) dy += 1;

    const len = Math.hypot(dx, dy) || 1;
    this.player.setVelocity((dx / len) * speed, (dy / len) * speed);

    if (dx || dy) {
      const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
      const currentAngle = this.player.rotation;
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

    // Limpa inimigos fora da tela
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      if (e.y > this.scale.height + 40) e.disableBody(true, true);
    });

    // Fundo
    this.water.tilePositionY += 0.2;
    this.water.tilePositionX += 0.1;

    // Movimento da tartaruga (nada pelo mar)
    this.updateTurtle(time);
  }

  // ----------- Disparo -----------
  fireBullet() {
    const rot = this.player.rotation;
    const fx = Math.cos(rot - Math.PI / 2);
    const fy = Math.sin(rot - Math.PI / 2);

    const noseOffset = 16;
    const bx = this.player.x + fx * noseOffset;
    const by = this.player.y + fy * noseOffset;

    const bullet = this.bullets.get(bx, by, 'cannonball');
    if (!bullet) return;

    bullet
      .setActive(true)
      .setVisible(true)
      .setDepth(5)
      .setScale(1);

    bullet.body.enable = true;
    bullet.body.reset(bx, by);

    if (bullet.body.setAllowGravity) bullet.body.setAllowGravity(false);
    else bullet.body.allowGravity = false;
    bullet.body.setDrag(0, 0);

    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;

    bullet.setVelocity(fx * this.bulletSpeed, fy * this.bulletSpeed);
    bullet.setRotation(rot);

    bullet.setData('born', this.time.now);
  }

  // ----------- Inimigos -----------
  spawnEnemy() {
    const margin = 30;
    const bounds = {
      left: -margin,
      right: this.scale.width + margin,
      top: -margin,
      bottom: this.scale.height + margin
    };

    const sides = ['top', 'bottom', 'left', 'right'];
    const side = Phaser.Utils.Array.GetRandom(sides);

    let x, y;
    if (side === 'top') {
      x = Phaser.Math.Between(0, this.scale.width);
      y = bounds.top;
    } else if (side === 'bottom') {
      x = Phaser.Math.Between(0, this.scale.width);
      y = bounds.bottom;
    } else if (side === 'left') {
      x = bounds.left;
      y = Phaser.Math.Between(0, this.scale.height);
    } else {
      x = bounds.right;
      y = Phaser.Math.Between(0, this.scale.height);
    }

    let enemy = this.enemies.get(x, y, 'enemy');
    if (!enemy) return;

    if (!enemy.body) this.physics.world.enable(enemy);

    enemy
      .setActive(true)
      .setVisible(true)
      .setDepth(3);

    enemy.body.enable = true;
    enemy.body.reset(x, y);
    enemy.hp = 2;

    if (enemy.body.setAllowGravity) enemy.body.setAllowGravity(false);
    else enemy.body.allowGravity = false;

    const target = new Phaser.Math.Vector2(this.player.x, this.player.y);
    const from = new Phaser.Math.Vector2(x, y);
    const direction = target.subtract(from).normalize();

    const speed = Phaser.Math.Between(this.enemySpeedMin, this.enemySpeedMax);
    enemy.setVelocity(direction.x * speed, direction.y * speed);

    enemy.pollutionTimer = this.time.addEvent({
      delay: this.pollutionDropRate,
      loop: true,
      callback: () => {
        if (enemy.active && this.isInScreen(enemy)) {
          this.dropPollution(enemy.x, enemy.y);
        }
      }
    });
  }

  isInScreen(sprite) {
    return (
      sprite.x >= 0 &&
      sprite.x <= this.scale.width &&
      sprite.y >= 0 &&
      sprite.y <= this.scale.height
    );
  }

  // ----------- Poluição -----------
  dropPollution(x, y) {
    const p = this.pollutionGroup.get(x, y, 'pollution');
    if (!p) return;

    p.setActive(true).setVisible(true);
    p.body.enable = true;
    p.setDepth(2);
    p.setScale(0.1);

    p.body.reset(x, y);
    if (p.body.setAllowGravity) p.body.setAllowGravity(false);

    this.addPollution(5); // aumenta ao spawnar
  }

  addPollution(amount) {
    this.pollutionLevel += amount;
    if (this.pollutionLevel > this.maxPollution) {
      this.pollutionLevel = this.maxPollution;
    }

    this.pollutionText.setText(`Poluição: ${this.pollutionLevel}%`);

    if (this.pollutionLevel >= this.maxPollution) {
      this.gameOverByPollution();
    }
  }

  collectPollution(_player, pollution) {
    pollution.disableBody(true, true);
    this.pollutionLevel -= 10;
    if (this.pollutionLevel < 0) this.pollutionLevel = 0;
    this.pollutionText.setText(`Poluição: ${this.pollutionLevel}%`);
  }

  onTurtleCollectPollution(_turtle, pollution) {
    pollution.disableBody(true, true);
    // Tartaruga ajuda a limpar: reduz mais e dá ponto
    this.pollutionLevel -= 12;
    if (this.pollutionLevel < 0) this.pollutionLevel = 0;
    this.pollutionText.setText(`Poluição: ${this.pollutionLevel}%`);
    this.score += 2;
    this.scoreText.setText(`score: ${this.score}`);
  }

  gameOverByPollution() {
    this.addCenteredMessage('Oceano poluído! Fim de jogo.');
    this.time.delayedCall(1200, () => this.scene.restart());
  }

  addCenteredMessage(msg) {
    const t = this.add.text(this.scale.width / 2, this.scale.height / 2, msg, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 6 }
    }).setOrigin(0.5);
    this.tweens.add({ targets: t, alpha: 0, duration: 1000, delay: 800 });
  }

  // ----------- Dano/colisão -----------
  onBulletHitEnemy(bullet, enemy) {
    bullet.disableBody(true, true);
    enemy.hp -= 1;

    if (enemy.hp <= 0) {
      if (enemy.pollutionTimer) {
        enemy.pollutionTimer.remove();
        enemy.pollutionTimer = null;
      }
      enemy.disableBody(true, true);
      this.score += 10;
      this.scoreText.setText(`score: ${this.score}`);
      this.cameras.main.flash(80, 255, 255, 255);
    }
  }

  onEnemyHitPlayer(player, enemy) {
    enemy.disableBody(true, true);
    if (enemy.pollutionTimer) {
      enemy.pollutionTimer.remove();
      enemy.pollutionTimer = null;
    }

    player.hp -= 1;
    this.hpText.setText(`HP: ${player.hp}`);
    this.cameras.main.shake(150, 0.01);

    if (player.hp <= 0) {
      this.addCenteredMessage('Você foi derrotado!');
      this.time.delayedCall(1000, () => this.scene.restart());
    }
  }

  onEnemyHitTurtle(turtle, enemy) {
    enemy.disableBody(true, true);
    if (enemy.pollutionTimer) {
      enemy.pollutionTimer.remove();
      enemy.pollutionTimer = null;
    }

    turtle.hp -= 1;
    this.turtleHpText.setText(`Tartaruga HP: ${turtle.hp}`);
    this.cameras.main.shake(150, 0.008);

    if (turtle.hp <= 0) {
      this.addCenteredMessage('A tartaruga foi ferida fatalmente! Proteja melhor da próxima vez.');
      this.time.delayedCall(1200, () => this.scene.restart());
    }
  }

  // ----------- Tartaruga: movimento "natural" -----------
  setNewTurtleTarget() {
    const pad = 40;
    const tx = Phaser.Math.Between(pad, this.scale.width - pad);
    const ty = Phaser.Math.Between(pad, this.scale.height - pad);
    this.turtleTarget.set(tx, ty);
  }

  updateTurtle(time) {
    if (!this.turtle?.active) return;

    // de tempos em tempos, escolhe novo destino
    if (time > this._nextTurtleRetarget || Phaser.Math.Distance.Between(this.turtle.x, this.turtle.y, this.turtleTarget.x, this.turtleTarget.y) < 24) {
      this.setNewTurtleTarget();
      this._nextTurtleRetarget = time + this.turtleRetargetInterval;
    }

    // direção ao destino
    const dir = new Phaser.Math.Vector2(this.turtleTarget.x - this.turtle.x, this.turtleTarget.y - this.turtle.y).normalize();
    this.turtle.setVelocity(dir.x * this.turtleSpeed, dir.y * this.turtleSpeed);

    // gira levemente para "apontar" o nado
    const angle = Math.atan2(dir.y, dir.x) + Math.PI / 2;
    this.turtle.rotation = Phaser.Math.Angle.RotateTo(this.turtle.rotation, angle, 0.05);
  }
}
