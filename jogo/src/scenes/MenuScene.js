// src/scenes/MenuScene.js
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.image('menuBg', 'assets/menu-background.png');

    // Áudio
    this.load.audio('bg_menu',   ['assets/audio/bg_menu.mp3']);
    this.load.audio('ui_hover',  ['assets/audio/ui_hover.mp3']);
    this.load.audio('ui_select', ['assets/audio/ui_select.mp3']);
  }

  create() {
    // --- Volume global (persistido) ---
    const savedVol = parseFloat(localStorage.getItem('volume'));
    const startVolume = Number.isFinite(savedVol) ? Phaser.Math.Clamp(savedVol, 0, 1) : 0.7;
    this.sound.volume = startVolume;

    // Música do menu
    this.menuMusic = this.sound.add('bg_menu', { loop: true, volume: 0.45 });
    if (!this.menuMusic.isPlaying) this.menuMusic.play();

    // Fundo
    this.bg = this.add.image(0, 0, 'menuBg').setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height);

    // Título
    // this.title = this.add.text(this.scale.width / 2, this.scale.height * 0.22, 'EcoNavio', {
    //   fontFamily: 'monospace', fontSize: '56px', color: '#ffffff',
    // }).setOrigin(0.5).setShadow(2, 2, '#000', 4, true, true);

    // ---------- BOTÃO INICIAR ----------
    const btnY = this.scale.height - 110;
    const btnWidth = 320;
    const btnHeight = 48;

    this.startHit = this.add.rectangle(this.scale.width / 2, btnY, btnWidth, btnHeight, 0x000000, 0.35)
      .setStrokeStyle(2, 0x00ffcc)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.startHit.setDepth(20);

    this.btn = this.add.text(this.scale.width / 2, btnY, '[ INICIAR JOGO ]', {
      fontFamily: 'monospace', fontSize: '24px', color: '#00ffcc',
    }).setOrigin(0.5);
    this.btn.setDepth(21);

    this.tweens.add({
      targets: [this.btn, this.startHit],
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    const hoverOn  = () => { this.playSfx('ui_hover', { volume: 0.5 }); this.btn.setStyle({ color: '#ffff00' }); this.startHit.setStrokeStyle(2, 0xffff00); };
    const hoverOff = () => { this.btn.setStyle({ color: '#00ffcc' });  this.startHit.setStrokeStyle(2, 0x00ffcc); };
    this.startHit.on('pointerover', hoverOn);
    this.startHit.on('pointerout',  hoverOff);
    this.startHit.on('pointerdown', () => this.safeStartGame());
    this.input.keyboard.on('keydown-ENTER', () => this.safeStartGame());
    this.input.keyboard.on('keydown-SPACE', () => this.safeStartGame());

    // ---------- BOTÃO CONFIGURAÇÕES (TOP-RIGHT) ----------
    this.settingsBtn = this.add.text(this.scale.width - 16, 16, '⚙ Configurações', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      backgroundColor: '#00000055', padding: { x: 10, y: 6 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.settingsBtn.setDepth(40);

    this.settingsBtn.on('pointerover', () => {
      this.playSfx('ui_hover', { volume: 0.4 });
      this.settingsBtn.setStyle({ color: '#ffff00' });
    });
    this.settingsBtn.on('pointerout', () => this.settingsBtn.setStyle({ color: '#ffffff' }));
    this.settingsBtn.on('pointerdown', () => {
      this.playSfx('ui_select', { volume: 0.5 });
      this.toggleSettings(true);
    });

    // ---------- PAINEL DE CONFIGURAÇÕES (INICIALMENTE OCULTO) ----------
    this.createSettingsPanel(startVolume);
    this.toggleSettings(false); // escondido ao iniciar
    this.input.keyboard.on('keydown-ESC', () => this.toggleSettings(false));

    // Responsivo
    this.scale.on('resize', this.onResize, this);

    // Limpeza ao sair
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.menuMusic?.stop();
      this.menuMusic?.destroy();
    });
  }

  // ------- Painel de Configurações -------
  createSettingsPanel(startValue) {
    // dimensões
    this.panelW = 360;
    this.panelH = 180;
    this.panelX = (this.scale.width  - this.panelW) / 2;
    this.panelY = (this.scale.height - this.panelH) / 2;

    // fundo do painel
    this.settingsBg = this.add.graphics();
    this.settingsBg.setDepth(50);
    const drawPanel = () => {
      this.settingsBg.clear();
      this.settingsBg.fillStyle(0x000000, 0.8);
      this.settingsBg.fillRoundedRect(this.panelX, this.panelY, this.panelW, this.panelH, 12);
      this.settingsBg.lineStyle(2, 0x00ffcc, 1);
      this.settingsBg.strokeRoundedRect(this.panelX, this.panelY, this.panelW, this.panelH, 12);
    };
    drawPanel();

    // título
    this.settingsTitle = this.add.text(this.panelX + this.panelW / 2, this.panelY + 20, 'Configurações', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(51);

    // botão fechar (X)
    this.settingsClose = this.add.text(this.panelX + this.panelW - 10, this.panelY + 10, '✕', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffcccc',
      backgroundColor: '#00000055', padding: { x: 6, y: 2 },
    }).setOrigin(1, 0).setDepth(51).setInteractive({ useHandCursor: true });
    this.settingsClose.on('pointerover', () => this.settingsClose.setStyle({ color: '#ffff00' }));
    this.settingsClose.on('pointerout',  () => this.settingsClose.setStyle({ color: '#ffcccc' }));
    this.settingsClose.on('pointerdown', () => {
      this.playSfx('ui_select', { volume: 0.5 });
      this.toggleSettings(false);
    });

    // label volume
    const cx = this.panelX + this.panelW / 2;
    const cy = this.panelY + 90;
    this.volLabel = this.add.text(cx, cy - 28, 'Volume', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(51);

    // slider
    this.slider = { x: cx - 120, y: cy, width: 240, height: 6, knobRadius: 10, value: Phaser.Math.Clamp(startValue, 0, 1) };

    // barra
    this.sliderBar = this.add.graphics().setDepth(51);
    const drawBar = () => {
      const s = this.slider;
      this.sliderBar.clear();
      this.sliderBar.fillStyle(0x222222, 0.9);
      this.sliderBar.fillRoundedRect(s.x, s.y - s.height / 2, s.width, s.height, 3);
      const fillW = s.width * s.value;
      this.sliderBar.fillStyle(0x00ffcc, 1);
      this.sliderBar.fillRoundedRect(s.x, s.y - s.height / 2, fillW, s.height, 3);
    };
    drawBar();

    // knob
    const knobX = () => this.slider.x + this.slider.width * this.slider.value;
    this.sliderKnob = this.add.circle(knobX(), cy, this.slider.knobRadius, 0xffff00, 1).setStrokeStyle(2, 0x222222);
    this.sliderKnob.setDepth(52).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(this.sliderKnob);

    // valor %
    this.volValueText = this.add.text(cx, cy + 16, `${Math.round(this.slider.value * 100)}%`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#cccccc',
    }).setOrigin(0.5).setDepth(51);

    // interações
    this.sliderBar.setInteractive(
      new Phaser.Geom.Rectangle(this.slider.x, this.slider.y - this.slider.height / 2, this.slider.width, this.slider.height),
      Phaser.Geom.Rectangle.Contains
    );

    this.sliderKnob.on('drag', (_pointer, dragX) => {
      const s = this.slider; const minX = s.x; const maxX = s.x + s.width;
      const nx = Phaser.Math.Clamp(dragX, minX, maxX);
      s.value = (nx - s.x) / s.width;
      this.sliderKnob.x = nx;
      drawBar();
      this.applyVolume(s.value);
    });

    this.sliderBar.on('pointerdown', (pointer) => {
      const s = this.slider;
      const nx = Phaser.Math.Clamp(pointer.x, s.x, s.x + s.width);
      s.value = (nx - s.x) / s.width;
      this.sliderKnob.x = nx;
      drawBar();
      this.applyVolume(s.value);
    });

    // armazenar elementos para show/hide
    this.settingsElems = [
      this.settingsBg, this.settingsTitle, this.settingsClose,
      this.volLabel, this.sliderBar, this.sliderKnob, this.volValueText
    ];
  }

  toggleSettings(show) {
    const visible = !!show;
    this.settingsElems.forEach(el => el.setVisible(visible).setActive(visible));
  }

  applyVolume(v) {
    const vol = Phaser.Math.Clamp(v, 0, 1);
    this.sound.volume = vol;
    localStorage.setItem('volume', String(vol));
    this.volValueText.setText(`${Math.round(vol * 100)}%`);
    this.playSfx('ui_hover', { volume: Math.max(0.15, vol * 0.35) });
  }

  safeStartGame() {
    this.playSfx('ui_select', { volume: 0.6 });
    if (this.menuMusic?.isPlaying) this.menuMusic.stop();
    if (this._starting) return;
    this._starting = true;
    this.time.delayedCall(40, () => this.scene.start('MainScene'));
  }

  // Reproduzir SFX com verificação de cache (evita crash se faltar arquivo)
  playSfx(key, cfg) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, cfg);
    } else {
      // console.warn(`[SFX] '${key}' não encontrado no cache de áudio.`);
    }
  }

  onResize(gameSize) {
    const { width, height } = gameSize;
    if (!width || !height) return;

    // Fundo e título
    this.bg.setDisplaySize(width, height);
    this.title.setPosition(width / 2, height * 0.22);

    // Iniciar
    const btnY = height - 110;
    this.startHit.setPosition(width / 2, btnY);
    this.btn.setPosition(width / 2, btnY);

    // Botão Configurações
    this.settingsBtn.setPosition(width - 16, 16);

    // Painel (recentraliza)
    this.panelW = 360; this.panelH = 180;
    this.panelX = (width  - this.panelW) / 2;
    this.panelY = (height - this.panelH) / 2;

    // redesenha painel
    this.settingsBg && (this.settingsBg.clear(),
      this.settingsBg.fillStyle(0x000000, 0.8),
      this.settingsBg.fillRoundedRect(this.panelX, this.panelY, this.panelW, this.panelH, 12),
      this.settingsBg.lineStyle(2, 0x00ffcc, 1),
      this.settingsBg.strokeRoundedRect(this.panelX, this.panelY, this.panelW, this.panelH, 12)
    );

    this.settingsTitle?.setPosition(this.panelX + this.panelW / 2, this.panelY + 20);
    this.settingsClose?.setPosition(this.panelX + this.panelW - 10, this.panelY + 10);

    // reposiciona slider
    const cx = this.panelX + this.panelW / 2;
    const cy = this.panelY + 90;
    if (this.slider) {
      this.slider.x = cx - 120;
      this.slider.y = cy;

      // redesenha barra e move knob
      this.sliderBar.setPosition(0, 0);
      this.sliderBar.clear();
      this.sliderBar.fillStyle(0x222222, 0.9);
      this.sliderBar.fillRoundedRect(this.slider.x, this.slider.y - this.slider.height / 2, this.slider.width, this.slider.height, 3);
      const fillW = this.slider.width * this.slider.value;
      this.sliderBar.fillStyle(0x00ffcc, 1);
      this.sliderBar.fillRoundedRect(this.slider.x, this.slider.y - this.slider.height / 2, fillW, this.slider.height, 3);

      this.sliderKnob.setPosition(this.slider.x + this.slider.width * this.slider.value, cy);
      this.volLabel.setPosition(cx, cy - 28);
      this.volValueText.setPosition(cx, cy + 16);

      // atualizar área interativa da barra
      this.sliderBar.setInteractive(
        new Phaser.Geom.Rectangle(this.slider.x, this.slider.y - this.slider.height / 2, this.slider.width, this.slider.height),
        Phaser.Geom.Rectangle.Contains
      );
    }
  }
}
