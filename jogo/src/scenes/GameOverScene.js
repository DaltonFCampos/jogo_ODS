export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data?.score || 0;
  }

  create() {
    // Overlay escuro
    this.overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0);

    // Título
    this.title = this.add.text(this.scale.width / 2, 150, 'FIM DE JOGO', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#ff4444',
    }).setOrigin(0.5);

    // Pontuação
    this.scoreText = this.add.text(this.scale.width / 2, 240, `Pontuação: ${this.finalScore}`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Botão voltar ao menu
    this.menuBtn = this.add.text(this.scale.width / 2, 340, '[ Voltar ao Menu ]', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#00ffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 6 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Efeito "pulse"
    this.tweens.add({
      targets: this.menuBtn,
      scale: { from: 1, to: 1.06 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // Hover (usar 'color')
    this.menuBtn.on('pointerover', () => this.menuBtn.setStyle({ color: '#ffff00' }));
    this.menuBtn.on('pointerout',  () => this.menuBtn.setStyle({ color: '#00ffff' }));
    this.menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    // Teclado
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'));
    this.input.keyboard.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    this.input.keyboard.on('keydown-R',     () => this.scene.start('MainScene'));

    // Responsivo
    this.scale.on('resize', this.onResize, this);

    // Dica de atalho
    this.hint = this.add.text(this.scale.width / 2, 400, 'ENTER/ESPAÇO: Menu  •  R: Reiniciar', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#cccccc',
    }).setOrigin(0.5);
  }

  onResize(gameSize) {
    const { width, height } = gameSize;
    if (!width || !height) return;

    this.overlay.setSize(width, height);
    this.title.setPosition(width / 2, 150);
    this.scoreText.setPosition(width / 2, 240);
    this.menuBtn.setPosition(width / 2, 340);
    this.hint.setPosition(width / 2, 400);
  }
}
