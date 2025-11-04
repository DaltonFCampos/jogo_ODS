// src/main.js
import MenuScene from './scenes/MenuScene.js';
import MainScene from './scenes/MainScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// Usando Phaser global (carregado via <script src="./phaser.js">)
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0b1020',

  width: 800,
  height: 600,

  // Centraliza e adapta a tela ao centro da página
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },

  scene: [MenuScene, MainScene, GameOverScene],
};

new Phaser.Game(config);
