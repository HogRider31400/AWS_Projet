var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#fffff0',
    physics: {
      default: 'arcade',
      arcade: {
        // debug: true,
        gravity: { y: 0 }
      }
    },
    scene: { }
  }
  
  var game = new Phaser.Game(config)