import MainScene from './scenes/MainScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#0b1020',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
  scene: [MainScene],
});
