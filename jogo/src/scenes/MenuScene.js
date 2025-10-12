export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.image('menuBg', 'assets/menu-background.png');

  }

  create() {
    // Fundo
    this.add.image(0, 0, 'menuBg').setOrigin(0).setDisplaySize(this.scale.width, this.scale.height);

    // Botão para iniciar
    const btn = this.add.text(this.scale.width / 2, this.scale.height - 100, '[ INICIAR JOGO ]', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#00ffcc',
      backgroundColor: '#00000080',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ fill: '#ffff00' }));
    btn.on('pointerout', () => btn.setStyle({ fill: '#00ffcc' }));
    btn.on('pointerdown', () => {
      this.scene.start('MainScene');
    });
  }
}
