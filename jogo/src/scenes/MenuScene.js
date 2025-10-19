export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.image('menuBg', 'assets/menu-background.png');
  }

  create() {
    // Fundo
    this.bg = this.add
      .image(0, 0, 'menuBg')
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height);

    // Botão iniciar
    this.btn = this.add
      .text(this.scale.width / 2, this.scale.height - 100, '[ INICIAR JOGO ]', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#00ffcc',
        backgroundColor: '#000000',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Efeito pulse
    this.tweens.add({
      targets: this.btn,
      scale: { from: 1, to: 1.06 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // Hover
    this.btn.on('pointerover', () => this.btn.setStyle({ color: '#ffff00' }));
    this.btn.on('pointerout', () => this.btn.setStyle({ color: '#00ffcc' }));

    // Clique/teclado
    this.btn.on('pointerdown', () => this.startGame());
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());

    // Responsivo
    this.scale.on('resize', this.onResize, this);
  }

  startGame() {
    this.scene.start('MainScene');
  }

  onResize(gameSize) {
    const { width, height } = gameSize;
    if (!width || !height) return;

    this.bg.setDisplaySize(width, height);
    this.title.setPosition(width / 2, height * 0.25);
    this.btn.setPosition(width / 2, height - 100);
  }
}
