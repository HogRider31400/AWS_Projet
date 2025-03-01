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
    this.load.image('vegetation', 'static/tilemaps/vegetation.png');
    //this.load.image('Water', 'static/tilemaps/water_animation_spritesheet.png');
    this.load.tilemapTiledJSON('map', 'static/tilemaps/map_test5.tmj')
    this.load.spritesheet('player', '/static/sprite_sheets/playerr.png', { frameWidth: 64, frameHeight: 64 });
  } 

  function create () {

    // On init le joueur avant tout
    this.player = new Player(this, 300,300, true)
    player = this.player;


    const map = this.add.tilemap('map')
    console.log(map);
    //on créé le jeu de tuile avec son nom et l'image dont on a besoin
    const tileset1 = map.addTilesetImage('TileSet_V2', 'tiles');
    const tileset2 = map.addTilesetImage('vegetation', 'vegetation');
    //const tileset2 = map.addTilesetImage('water_animation_spritesheet', 'Water');
    this.layerEau = map.createLayer('island', [tileset1]); 
    this.mapElements = map.createLayer('elements', [tileset2]); 
    let layerEau = this.layerEau

    this.physics.world.setBounds(0, 0, 800 * 8, 600 * 8);

    let berryBushes = this.mapElements.filterTiles(tile => {
      return tile.properties && tile.properties.name == "berryBush";
    });

    let woodPiles = this.mapElements.filterTiles(tile => {
      return tile.properties && tile.properties.name == "woodPile";
    });

    console.log(berryBushes)
    this.elements = []
    for(let berryBush_i in berryBushes) {
      let berryBush = new BerryBush(this, berryBushes[berryBush_i].pixelX + 16, berryBushes[berryBush_i].pixelY + 16, berryBushes[berryBush_i].y + "/" + berryBushes[berryBush_i].x, berryBushes[berryBush_i])
      console.log(berryBushes[berryBush_i])
      this.elements.push(berryBush)
        
      this.physics.add.collider(this.player, berryBush, function() {
        console.log('Collision avec berry bush !');
      });

      this.add.existing(berryBush)
    }

    for(let woodPile_i in woodPiles) {
      let woodPile = new OakPlanks(this, woodPiles[woodPile_i].pixelX + 16, woodPiles[woodPile_i].pixelY + 16 , woodPiles[woodPile_i].y + "/" + woodPiles[woodPile_i].x, woodPiles[woodPile_i])
      this.elements.push(woodPile)
        
      this.physics.add.collider(this.player, woodPile, function() {
        console.log('Collision avec woodPile !');
      });

      this.add.existing(woodPile)
    }

    //this.berryBush = new BerryBush(this, 200, 200)
    //this.oakPlank = new OakPlanks(this, 250, 200)
    /*this.elements = [
      this.berryBush,
      this.oakPlank
    ]*/
    console.log(this.elements)

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
        for(let d_i in this.elements){
          let c_elem = this.elements[d_i]
          if(c_elem.id == data.item_id) c_elem.isNowDepleted()
        }
      }
    })

    this.player.onAction('pickUpBerry', (berry_id) => {
      socket.emit('action', {
        type : 'pickUp',
        item_type : "berryBush",
        item_id : berry_id,
        player : socket.id
      })
      console.log("siuuu")
    })

    this.player.onAction('pickUpWood', (wood_id) => {
      socket.emit('action', {
        type : 'pickUp',
        item_type : "woodPlank",
        item_id : wood_id,
        player : socket.id
      })
      console.log("siuuu")
    })
    
    


    //this.add.existing(this.berryBush)
    //this.add.existing(this.oakPlank)
    this.add.existing(this.player)
    this.player.initIndicator()

    //this.physics.add.collider(this.player, this.berryBush, function() {
    //  console.log('Collision avec berry bush !');
    //});
    //this.physics.add.collider(this.player, this.oakPlank, function() {
    //  console.log('Collision avec oak plank !');
    //});

    this.events.on('update', () => {
      this.player.canInteract = null;
      for(let cur of this.elements){
        const distance = Phaser.Math.Distance.Between(
            this.player.x, 
            this.player.y,
            cur.x, 
            cur.y
        );

        //console.log(distance,cur,this.player)

        if(distance < 50) 
          this.player.canInteract = cur;
      }}); 
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
            for(let elem_i of scene.elements) {
              scene.physics.add.collider(otherPlayer, scene.elements[elem_i])
            }
            scene.physics.add.collider(
              otherPlayer,
              scene.layerEau
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