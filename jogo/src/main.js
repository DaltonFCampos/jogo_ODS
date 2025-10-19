import MenuScene from './scenes/MenuScene.js';
import MainScene from './scenes/MainScene.js';
import GameOverScene from './scenes/GameOverScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#0b1020',
  parent: 'game-container',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
  scene: [MenuScene, MainScene, GameOverScene],
});
