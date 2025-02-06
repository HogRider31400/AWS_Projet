import { BerryBush } from "./sprites/berry_bush.js"
import { OakPlanks } from "./sprites/oak_planks.js"
import { Player } from './sprites/player.js'

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
    scene: { 
      create
    }
  }
  
  var game = new Phaser.Game(config)

  function create () {

    this.berryBush = new BerryBush(this, 100, 100)
    this.oakPlank = new OakPlanks(this, 200, 200)
    this.player = new Player(this, 300,300)

    this.add.existing(this.berryBush)
    this.add.existing(this.oakPlank)
    this.add.existing(this.player)

    this.physics.add.collider(this.player, this.berryBush, function() {
      console.log('Collision avec berry bush !');
    });
    this.physics.add.collider(this.player, this.oakPlank, function() {
      console.log('Collision avec oak plank !');
    });

    this.events.on('update', () => {
        const distance = Phaser.Math.Distance.Between(
            this.player.x, 
            this.player.y,
            this.berryBush.x, 
            this.berryBush.y
        );

        if(distance < 50) 
          this.player.canInteract = "berryBush";
        else
        this.player.canInteract = false; 
  }); 

  }