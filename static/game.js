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
      preload,
      create
    }
  }
  const socket = io();
  let playersData = {};
  let otherPlayers = {}; 
  let playersGroup;
  let player;
  let cursors;

  var game = new Phaser.Game(config)

  function preload() {
    // Charger les sprites correctement
    this.load.spritesheet('player', '/static/sprite_sheets/playerr.png', { frameWidth: 64, frameHeight: 64 });
  } 

  function create () {

    this.anims.create({
      key: 'down',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player', { start: 12, end: 14 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player', { start: 24, end: 26 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('player', { start: 36, end: 38 }),
        frameRate: 10,
        repeat: -1
    });


    this.berryBush = new BerryBush(this, 100, 100)
    this.oakPlank = new OakPlanks(this, 200, 200)
    this.player = new Player(this, 300,300, true)
    player = this.player;


    //this.player = this.physics.add.sprite(config.width / 2, config.height / 2, 'player');
    //player.setCollideWorldBounds(true);

    socket.on('positions', (data) => {
      playersData = data;
      console.log(data);
      updateOtherPlayers(this);
    });

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
    this.sendPlayerPosition = (x,y) => {
        socket.emit('mouvement', {
            x: player.x,
            y: player.y,
            direction: player.anims.currentAnim ? player.anims.currentAnim.key : 'down'
        });
    }
    this.sendPlayerPosition(300,300)

  }

  function updateOtherPlayers(scene) {
    for (let id in playersData) {
      if (id !== socket.id) {
        // Si le joueur existe déjà, mettez à jour sa position
        if (otherPlayers[id]) {
            const otherPlayer = otherPlayers[id];
            const newX = playersData[id].x;
            const newY = playersData[id].y;
            const newDirection = playersData[id].direction;

            // Mettre à jour la position
            otherPlayer.setPosition(newX, newY);

            // Vérifier si le joueur est en mouvement
            if (otherPlayer.oldX !== newX || otherPlayer.oldY !== newY) {
                otherPlayer.anims.play(newDirection, true);
            } else {
                otherPlayer.anims.stop();
                otherPlayer.setFrame(1); // Frame statique
            }

            // Stocker la position actuelle comme ancienne
            otherPlayer.oldX = newX;
            otherPlayer.oldY = newY;
          } else {
            // Sinon, créez le joueur
            const otherPlayer = new Player(scene, playersData[id].x, playersData[id].y, false)
            scene.add.existing(otherPlayer);
            otherPlayer.oldX = playersData[id].x;
            otherPlayer.oldY = playersData[id].y;
            otherPlayer.anims.play(playersData[id].direction, true);
            otherPlayers[id] = otherPlayer;
        }
      }
    }
    for (let id in otherPlayers) {
      if (!playersData[id]) {
          otherPlayers[id].destroy();
          delete otherPlayers[id];
      }
    }
  }