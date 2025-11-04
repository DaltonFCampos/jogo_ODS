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
    this.enemySpawnRate = 900;
    this.enemySpeedMin = 20;
    this.enemySpeedMax = 40;
    this.score = 0;
    this.enemyHeartDropChance = 0.25;

    // Poluição
    this.pollutionLevel = 0;
    this.maxPollution = 100;
    this.pollutionDropRate = 5000;
    this.pollutionDropJitter = 1800;
    this.pollutionPerDrop = 2;
    this.maxActivePollution = 30;
    this.pollutionCollectAmount = 10;

    // Tartaruga
    this.turtle = null;
    this.turtleSpeed = 80;
    this.turtleTarget = new Phaser.Math.Vector2();
    this.turtleRetargetInterval = 2500;
    this._nextTurtleRetarget = 0;

    this.isPaused = false;
  }

  preload() {
    // Sprites
    this.load.image('ship', 'assets/ship.png');
    this.load.image('enemy', 'assets/enemy.png');

    // Tartaruga procedural
    let g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2e7d32, 1); g.fillCircle(16, 16, 14);
    g.fillStyle(0x43a047, 1); g.fillCircle(16, 3, 5);
    g.fillCircle(5, 12, 4); g.fillCircle(27, 12, 4);
    g.fillCircle(7, 24, 4); g.fillCircle(25, 24, 4);
    g.generateTexture('turtle', 32, 32); g.destroy();

    // Coração procedural
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xff2d55, 1);
    g.fillCircle(8, 8, 6); g.fillCircle(16, 8, 6);
    g.beginPath(); g.moveTo(2, 10); g.lineTo(12, 22); g.lineTo(22, 10); g.closePath(); g.fillPath();
    g.generateTexture('heart', 24, 24); g.destroy();

    this.load.image('water', 'assets/water-tile2-seamless.png');
    this.load.image('cannonball', 'assets/cannonBall.png');
    this.load.image('pollution', 'assets/pollution.png');

    // Áudio
    this.load.audio('bg_game',       ['assets/audio/bg_game.mp3']);
    this.load.audio('sfx_shoot',     ['assets/audio/sfx_shoot.mp3']);
    this.load.audio('sfx_enemy_die', ['assets/audio/sfx_enemy_die.mp3']);
    this.load.audio('sfx_collect',   ['assets/audio/sfx_collect.mp3']);
    this.load.audio('sfx_hit',       ['assets/audio/sfx_hit.mp3']);
    this.load.audio('sfx_pickup',    ['assets/audio/sfx_pickup.mp3']);
    this.load.audio('sfx_gameover',  ['assets/audio/sfx_gameover.mp3']);
  }

  create() {
    // Música de fundo
    this.bgMusic = this.sound.add('bg_game', { loop: true, volume: 0.4 });
    if (!this.bgMusic.isPlaying) this.bgMusic.play();

    // Água original
    this.water = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'water')
      .setOrigin(0).setDepth(-1);

    // Player
    this.player = this.physics.add.image(400, 500, 'ship')
      .setScale(0.5).setCollideWorldBounds(true).setDrag(800).setMaxVelocity(400);
    this.player.maxHp = 5;
    this.player.hp = this.player.maxHp;

    // Controles
    this.keys = this.input.keyboard.addKeys({ up: 'W', left: 'A', down: 'S', right: 'D' });
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyPause = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyEsc   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Grupos
    this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 120 });
    this.enemies = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 8 });
    this.pollutionGroup = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: this.maxActivePollution });
    this.pickups = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 6 });

    // Tartaruga
    this.turtle = this.physics.add.image(400, 350, 'turtle').setDepth(2).setCollideWorldBounds(true);
    this.turtle.hp = 3;

    // HUD (ajustado sem peixe)
    this.add.text(10, 10, 'WASD: mover • SPACE: atirar • P/ESC: pausar', { color: '#ffffff', fontFamily: 'monospace' });
    this.scoreText = this.add.text(10, 28, 'score: 0', { color: '#ffffff', fontFamily: 'monospace' });
    this.hpText = this.add.text(10, 46, `HP: ${this.player.hp}`, { color: '#ff4d4d', fontFamily: 'monospace' });
    this.turtleHpText = this.add.text(10, 64, `Tartaruga HP: ${this.turtle.hp}`, { color: '#00e676', fontFamily: 'monospace' });
    this.pollutionText = this.add.text(10, 82, 'Poluição: 0%', { color: '#80deea', fontFamily: 'monospace' });

    // Texto "PAUSADO" (acima de tudo)
    this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'PAUSADO', {
      fontFamily: 'monospace', fontSize: '32px', color: '#ffff00'
    }).setOrigin(0.5).setVisible(false).setDepth(9998);

    // Mundo/bounds
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.physics.world.on('worldbounds', (body) => {
      const obj = body?.gameObject;
      if (!obj || !obj.active) return;
      if (obj.texture?.key === 'cannonball') obj.disableBody(true, true);
    });

    // Overlaps
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.pollutionGroup, this.collectPollution, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyHitPlayer, null, this);
    this.physics.add.overlap(this.turtle, this.enemies, this.onEnemyHitTurtle, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.onCollectHeart, null, this);

    // Spawner
    this.enemySpawnEvent = this.time.addEvent({ delay: this.enemySpawnRate, loop: true, callback: () => this.spawnEnemy() });

    // Destinos
    this.setNewTurtleTarget();

    // Resize
    this.scale.on('resize', this.onResize, this);

    // Limpeza
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bgMusic?.stop();
      this.bgMusic?.destroy();
      this.enemies?.children?.iterate((e) => {
        if (e?.pollutionTimer) { e.pollutionTimer.remove(); e.pollutionTimer = null; }
      });
      this.scale.off('resize', this.onResize, this);
    });

    // Modal de PAUSA acima de tudo
    this.pauseBackdrop = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0x000000, 0.55)
      .setOrigin(0.5).setVisible(false).setDepth(9999).setInteractive();

    this.pauseMenuContainer = this.add.container(this.scale.width/2, this.scale.height/2).setVisible(false).setDepth(10000);
    const bg = this.add.rectangle(0, 0, 300, 180, 0x0b1020, 0.95).setOrigin(0.5).setStrokeStyle(2, 0x00ffcc);
    const title = this.add.text(0, -60, 'PAUSADO', { fontFamily: 'monospace', fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

    const btnContinue = this.add.text(0, -10, 'Continuar', {
      fontFamily: 'monospace', fontSize: '24px', color: '#00ffcc', backgroundColor: '#00000080', padding: { x:10, y:6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnContinue.on('pointerdown', () => { this.togglePause(false); });

    const btnMenu = this.add.text(0, 40, 'Menu Principal', {
      fontFamily: 'monospace', fontSize: '24px', color: '#00ffcc', backgroundColor: '#00000080', padding: { x:10, y:6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnMenu.on('pointerdown', () => { this.scene.start('MenuScene'); });

    this.pauseMenuContainer.add([bg, title, btnContinue, btnMenu]);
  }

  update(time) {
    // Pause
    if (Phaser.Input.Keyboard.JustDown(this.keyPause) || Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.togglePause(!this.isPaused);
    }
    if (this.isPaused) return;

    // Movimento
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

    // Tiro
    if (this.keySpace.isDown && time > this.lastShot + this.fireRate) {
      this.fireBullet();
      this.lastShot = time;
    }

    // Expira balas
    this.bullets.children.iterate((b) => {
      if (!b || !b.active) return;
      if (time - (b.getData('born') || 0) > this.bulletLifespan) {
        b.disableBody(true, true);
      }
    });

    // Limpa inimigos fora
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      if (e.y > this.scale.height + 40) this.disableEnemy(e);
    });

    // Água
    this.water.tilePositionY += 0.15;
    this.water.tilePositionX += 0.07;

    // Vida marinha
    this.updateTurtle(time);
  }

  // Disparo
  fireBullet() {
    const rot = this.player.rotation;
    const fx = Math.cos(rot - Math.PI / 2);
    const fy = Math.sin(rot - Math.PI / 2);
    const noseOffset = 16;

    const bx = this.player.x + fx * noseOffset;
    const by = this.player.y + fy * noseOffset;

    const bullet = this.bullets.get(bx, by, 'cannonball');
    if (!bullet) return;

    bullet.setActive(true).setVisible(true).setDepth(5).setScale(1);
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

    this.sound.play('sfx_shoot', { volume: 0.35 });
  }

  // Inimigos
  spawnEnemy() {
    const margin = 30;
    const bounds = { left: -margin, right: this.scale.width + margin, top: -margin, bottom: this.scale.height + margin };
    const side = Phaser.Utils.Array.GetRandom(['top', 'bottom', 'left', 'right']);

    let x, y;
    if (side === 'top')      { x = Phaser.Math.Between(0, this.scale.width);  y = bounds.top; }
    else if (side === 'bottom'){ x = Phaser.Math.Between(0, this.scale.width);  y = bounds.bottom; }
    else if (side === 'left'){ x = bounds.left;  y = Phaser.Math.Between(0, this.scale.height); }
    else                     { x = bounds.right; y = Phaser.Math.Between(0, this.scale.height); }

    let enemy = this.enemies.get(x, y, 'enemy');
    if (!enemy) return;
    if (!enemy.body) this.physics.world.enable(enemy);

    enemy.setActive(true).setVisible(true).setDepth(3);
    enemy.setScale(0.15);
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

    // Timer de poluição com jitter
    const jitter = Phaser.Math.Between(-this.pollutionDropJitter, this.pollutionDropJitter);
    enemy.pollutionTimer = this.time.addEvent({
      delay: Math.max(1200, this.pollutionDropRate + jitter),
      loop: true,
      callback: () => {
        if (enemy.active && this.isInScreen(enemy)) this.dropPollution(enemy.x, enemy.y);
      }
    });
  }

  isInScreen(sprite) {
    return sprite.x >= 0 && sprite.x <= this.scale.width && sprite.y >= 0 && sprite.y <= this.scale.height;
  }

  // Poluição
  dropPollution(x, y) {
    if (this.pollutionGroup.countActive(true) >= this.maxActivePollution) return;

    const p = this.pollutionGroup.get(x, y, 'pollution');
    if (!p) return;

    p.setActive(true).setVisible(true);
    p.body.enable = true;
    p.setDepth(2); // baixo o suficiente para não passar do modal
    p.setScale(0.08);
    p.setAlpha(0);

    p.body.reset(x, y);
    if (p.body.setAllowGravity) p.body.setAllowGravity(false);

    this.tweens.add({
      targets: p,
      alpha: { from: 0, to: 1 },
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: p,
          y: { from: p.y, to: p.y + Phaser.Math.Between(-6, 6) },
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    });

    this.addPollution(this.pollutionPerDrop);
  }

  togglePause(state) {
    this.isPaused = state;

    // Modal acima de tudo
    this.pauseBackdrop.setVisible(state).setDepth(9999);
    this.pauseMenuContainer.setVisible(state).setDepth(10000);
    this.pauseText.setVisible(state).setDepth(9998);

    if (state) {
      this.physics.world.pause();
      if (this.enemySpawnEvent) this.enemySpawnEvent.paused = true;
      this.bgMusic?.pause();
      this.tweens.timeScale = 0;
    } else {
      this.physics.world.resume();
      if (this.enemySpawnEvent) this.enemySpawnEvent.paused = false;
      this.bgMusic?.resume();
      this.tweens.timeScale = 1;
    }
  }

  addPollution(amount) {
    this.pollutionLevel = Math.min(this.maxPollution, this.pollutionLevel + amount);
    this.pollutionText.setText(`Poluição: ${this.pollutionLevel}%`);
    if (this.pollutionLevel >= this.maxPollution) this.gameOverByPollution();
  }

  collectPollution(_player, pollution) {
    if (!pollution?.active) return;
    pollution.disableBody(true, true);
    this.pollutionLevel = Math.max(0, this.pollutionLevel - this.pollutionCollectAmount);
    this.pollutionText.setText(`Poluição: ${this.pollutionLevel}%`);
    this.sound.play('sfx_collect', { volume: 0.5 });
  }

  gameOverByPollution() {
    this.addCenteredMessage('Oceano poluído! Fim de jogo.');
    this.sound.play('sfx_gameover', { volume: 0.6 });
    this.time.delayedCall(1200, () => {
      this.scene.start('GameOverScene', { score: this.score });
    });
  }

  addCenteredMessage(msg) {
    const t = this.add.text(this.scale.width / 2, this.scale.height / 2, msg, {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
      backgroundColor: '#00000088', padding: { x: 8, y: 6 }
    }).setOrigin(0.5).setDepth(5000);
    this.tweens.add({ targets: t, alpha: 0, duration: 1000, delay: 800 });
  }

  // Util
  disableEnemy(enemy) {
    if (!enemy) return;
    if (enemy.pollutionTimer) { enemy.pollutionTimer.remove(); enemy.pollutionTimer = null; }
    enemy.disableBody?.(true, true);
  }

  // Dano/colisão
  onBulletHitEnemy(bullet, enemy) {
    bullet.disableBody(true, true);
    enemy.hp -= 1;
    if (enemy.hp <= 0) {
      this.disableEnemy(enemy);

      if (Math.random() < this.enemyHeartDropChance) this.spawnHeart(enemy.x, enemy.y);

      this.score += 10;
      this.scoreText.setText(`score: ${this.score}`);
      this.sound.play('sfx_enemy_die', { volume: 0.5 });
    }
  }

  onEnemyHitPlayer(player, enemy) {
    this.disableEnemy(enemy);

    player.hp -= 1;
    this.hpText.setText(`HP: ${player.hp}`);
    this.cameras.main.shake(150, 0.01);
    this.sound.play('sfx_hit', { volume: 0.5 });

    if (player.hp <= 0) {
      this.addCenteredMessage('Você foi derrotado!');
      this.sound.play('sfx_gameover', { volume: 0.6 });
      this.time.delayedCall(1000, () => {
        this.scene.start('GameOverScene', { score: this.score });
      });
    }
  }

  onEnemyHitTurtle(turtle, enemy) {
    this.disableEnemy(enemy);

    turtle.hp -= 1;
    this.turtleHpText.setText(`Tartaruga HP: ${turtle.hp}`);
    this.cameras.main.shake(150, 0.008);
    this.sound.play('sfx_hit', { volume: 0.45 });

    if (turtle.hp <= 0) {
      this.addCenteredMessage('A tartaruga foi ferida fatalmente! Proteja melhor da próxima vez.');
      this.sound.play('sfx_gameover', { volume: 0.6 });
      this.time.delayedCall(1200, () => {
        this.scene.start('GameOverScene', { score: this.score });
      });
    }
  }

  // Coração
  spawnHeart(x, y) {
    const heart = this.pickups.get(x, y, 'heart');
    if (!heart) return;

    heart.setActive(true).setVisible(true).setDepth(4);
    heart.body.enable = true;
    heart.body.reset(x, y);
    if (heart.body.setAllowGravity) heart.body.setAllowGravity(false);

    this.tweens.add({
      targets: heart,
      y: { from: y, to: y - 8 },
      angle: { from: -6, to: 6 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  onCollectHeart(player, heart) {
    if (!heart?.active) return;
    heart.disableBody(true, true);

    player.hp = Math.min(player.maxHp, player.hp + 1);
    this.hpText.setText(`HP: ${player.hp}`);
    this.sound.play('sfx_pickup', { volume: 0.55 });

    const plus = this.add.text(player.x, player.y - 20, '+1 ❤', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff99aa',
    }).setOrigin(0.5).setDepth(5000);
    this.tweens.add({ targets: plus, y: plus.y - 20, alpha: 0, duration: 600, onComplete: () => plus.destroy() });
  }

  // Tartaruga
  setNewTurtleTarget() {
    const pad = 40;
    const tx = Phaser.Math.Between(pad, this.scale.width - pad);
    const ty = Phaser.Math.Between(pad, this.scale.height - pad);
    this.turtleTarget.set(tx, ty);
  }
  updateTurtle(time) {
    if (!this.turtle?.active) return;
    if (time > this._nextTurtleRetarget ||
        Phaser.Math.Distance.Between(this.turtle.x, this.turtle.y, this.turtleTarget.x, this.turtleTarget.y) < 24) {
      this.setNewTurtleTarget();
      this._nextTurtleRetarget = time + this.turtleRetargetInterval;
    }
    const dir = new Phaser.Math.Vector2(this.turtleTarget.x - this.turtle.x, this.turtleTarget.y - this.turtle.y).normalize();
    this.turtle.setVelocity(dir.x * this.turtleSpeed, dir.y * this.turtleSpeed);
    const angle = Math.atan2(dir.y, dir.x) + Math.PI / 2;
    this.turtle.rotation = Phaser.Math.Angle.RotateTo(this.turtle.rotation, angle, 0.05);
  }

  // Resize
  onResize(gameSize) {
    const { width, height } = gameSize;
    if (!width || !height) return;

    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);

    if (this.water) this.water.setDisplaySize(width, height);

    this.pauseBackdrop.setPosition(width/2, height/2).setSize(width, height);
    this.pauseMenuContainer.setPosition(width / 2, height / 2);
    this.pauseText.setPosition(width / 2, height / 2);
  }
}
