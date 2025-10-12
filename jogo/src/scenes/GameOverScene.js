export default class GameOverScene extends Phaser.Scene {
    constructor() {
      super('GameOverScene');
    }
  
    init(data) {
      this.finalScore = data?.score || 0;
    }
  
    create() {
      this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7).setOrigin(0);
  
      this.add.text(this.scale.width / 2, 150, 'FIM DE JOGO', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#ff4444'
      }).setOrigin(0.5);
  
      this.add.text(this.scale.width / 2, 240, `Pontuação: ${this.finalScore}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff'
      }).setOrigin(0.5);
  
      const restartBtn = this.add.text(this.scale.width / 2, 340, '[ Voltar ao Menu ]', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#00ffff',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
  
      restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#ffff00' }));
      restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#00ffff' }));
      restartBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
  }