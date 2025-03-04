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
         debug: true,
        gravity: { y: 0 }
      }
    },
    scene: { 
      preload,
      create,
      update
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
    this.load.image('pickUpIcon', '/static/sprite_sheets/PickUp.png');
    this.load.image('tiles', 'static/tilemaps/TileSet_V2.png');
    //this.load.image('Water', 'static/tilemaps/water_animation_spritesheet.png');
    this.load.tilemapTiledJSON('map', 'static/tilemaps/map_test5.tmj')
    this.load.spritesheet('player', '/static/sprite_sheets/playerr.png', { frameWidth: 64, frameHeight: 64 });
  } 

  function create () {

    const map = this.add.tilemap('map')
    console.log(map);
    //on créé le jeu de tuile avec son nom et l'image dont on a besoin
    const tileset1 = map.addTilesetImage('TileSet_V2', 'tiles');
    //const tileset2 = map.addTilesetImage('water_animation_spritesheet', 'Water');
    this.layerEau = map.createLayer('island', [tileset1]); 
    let layerEau = this.layerEau

    this.physics.world.setBounds(0, 0, 800 * 8, 600 * 8);

    this.berryBush = new BerryBush(this, 200, 200)
    this.oakPlank = new OakPlanks(this, 250, 200)
    this.player = new Player(this, 300,300, true)
    player = this.player;

    this.elements = [
      this.berryBush,
      this.oakPlank
    ]

    this.cameras.main.startFollow(this.player, true);
    this.physics.add.collider(
      this.player,
      this.layerEau,
      null,
      null,
      this
    );
    layerEau.setCollisionBetween(54,104)
    console.log(layerEau.body)
    //layerEau.setTint(0x3d3d29)
    // #999966 pluie ?
    // #3d3d29 nuit ?

    socket.on('positions', (data) => {
      playersData = data;
      //console.log(data);
      updateOtherPlayers(this);
    });

    socket.on('action', (data) => {
      /*
      Format de data : un dico avec quelques clés dont 1 systématique "type"
      type : berryBushPickUp -> un joueur a récup un berry bush, les clés sont alors 
       - player : le joueur qui l'a fait
       (- delete : un booléen pour savoir si le bush doit être suppr ?)
      */
      if(!data.type) return;
      if(data.type == "berryBushPickUp") {
        //On fait l'action ici
        //Pour l'instant : rien
        console.log(data.player + " a recup une baie rouge")
      }
    })

    socket.on('remove', (data) => {
      if(data.item_id) {
        if(data.item_id == "1") {
          this.berryBush.isNowDepleted()
        }
      }
    })

    this.player.onAction('pickUpBerry', () => {
      socket.emit('action', {
        type : 'pickUp',
        item_type : "berryBush",
        item_id : "1",
        player : socket.id
      })
    })
    

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
            direction: player.direction
        });
    }
    this.sendPlayerPosition(300,300)


    //Def animations
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', { start: 117, end: 125 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', { start: 143, end: 151 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
      key: 'down',
      frames: this.anims.generateFrameNumbers('player', { start: 130, end: 138 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('player', { start: 104, end: 112 }),
        frameRate: 10,
        repeat: -1
    });

  }
  function update() {
    this.physics.collide(this.player, this.layerEau);
    for(let cur_player in otherPlayers) {
      this.physics.collide(otherPlayers[cur_player],this.layerEau)
    }
  }

  function updateOtherPlayers(scene) {
    for (let id in playersData) {
      if (id !== socket.id) {

        if (otherPlayers[id]) {
            const otherPlayer = otherPlayers[id];
            const newX = playersData[id].x;
            const newY = playersData[id].y;
            const newDirection = playersData[id].direction;

            const distance = Phaser.Math.Distance.Between(
              otherPlayer.x, 
              otherPlayer.y,
              newX, 
              newY
            );
            //if(newDirection.x == "n" && newDirection.y == "n")//(distance > 10)
              otherPlayer.setPosition(newX, newY);
            otherPlayer.direction = newDirection;

          } else {
            const otherPlayer = new Player(scene, playersData[id].x, playersData[id].y, false)
            console.log(otherPlayer)
            scene.add.existing(otherPlayer);
            console.log("on ajoute joueur et on a " + otherPlayer.active)
            otherPlayer.oldX = playersData[id].x;
            otherPlayer.oldY = playersData[id].y;
            //otherPlayer.anims.play(playersData[id].direction, true);
            otherPlayers[id] = otherPlayer;
            scene.physics.add.collider(
              otherPlayer,
              scene.layerEau
            );
            scene.physics.add.collider(
              otherPlayer,
              scene.oakPlank
            );
            scene.physics.add.collider(
              otherPlayer,
              scene.berryBush
            );
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