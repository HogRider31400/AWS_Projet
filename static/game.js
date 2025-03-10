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
const socket = await io();
let playersData = {};
let otherPlayers = {}; 
let playersGroup;
let player;
let cursors;
const playerName = sessionStorage.getItem('playerName') || 'Joueur';
        
        

var game = new Phaser.Game(config)

  function preload() {
    // Charger les sprites correctement
    this.load.image('pickUpIcon', '/static/sprite_sheets/PickUp.png');
    this.load.image('tiles', 'static/tilemaps/TileSet_V2.png');
    this.load.image('vegetation', 'static/tilemaps/vegetation.png');
    //this.load.image('Water', 'static/tilemaps/water_animation_spritesheet.png');
    this.load.audio('grass_sound', '/static/sounds/grass.wav');
    this.load.audio('dirt_sound', '/static/sounds/dirt.wav');
    this.load.audio('sand_sound', '/static/sounds/sand.wav');
    this.load.tilemapTiledJSON('map', 'static/tilemaps/map_test.tmj')
    this.load.spritesheet('player', '/static/sprite_sheets/playerr.png', { frameWidth: 64, frameHeight: 64 });
  } 

  function create () {

    // On init le joueur avant tout
    this.player = new Player(this, 500,500, true)
    player = this.player;

    player.inventory = []; // Initialise un inventaire vide

    this.map = this.add.tilemap('map')
    const map = this.map
    console.log(map);
    //on créé le jeu de tuile avec son nom et l'image dont on a besoin
    const tileset1 = map.addTilesetImage('TileSet_V2', 'tiles');
    const tileset2 = map.addTilesetImage('vegetation', 'vegetation');
    //const tileset2 = map.addTilesetImage('water_animation_spritesheet', 'Water');
    this.layerEau = map.createLayer('island', [tileset1]); 
    this.sacs_couchages = map.createLayer('sacs_couchages', [tileset1]);
    this.campfire = map.createLayer('campfire', [tileset1]);  
    this.palmier = map.createLayer('palmier', [tileset1]); 
    this.mapElements = map.createLayer('elements', [tileset2]); 
    let layerEau = this.layerEau
    getAnimatedTiles(this);
    this.physics.world.setBounds(0, 0, 800 * 8, 600 * 8);

    let berryBushes = this.mapElements.filterTiles(tile => {
      return tile.properties && tile.properties.name == "berryBush";
    });

    let woodPiles = this.mapElements.filterTiles(tile => {
      return tile.properties && tile.properties.name == "woodPile";
    });

////////////OBJETS COLLISIONS////////////
    console.log(berryBushes)
    this.elements = [] //Ici tous les éléments avec lesquels on peut intéragir
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
    /*this.physics.add.collider(
      this.player,
      this.layerEau,
      null,
      null,
      this
    // );*/
    if (this.player.role == "impostor") {
      this.physics.add.collider(this.player, this.layerEau, this.player.onWaterCollision, null, this.player);
    } else {
      this.physics.add.collider(this.player, this.layerEau, null, null, this);
    }
    layerEau.setCollisionBetween(54,104)
    console.log(layerEau.body)
    //layerEau.setTint(0x3d3d29)
    // #999966 pluie ?
    // #3d3d29 nuit ?


///////////////SOCKET///////////////
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

    console.log(socket.id)
    fetch("/connect_to_game", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ socketId : socket.id })
    }).then((response) => {
      if(!response.ok) console.log("Vous n'avez pas été connecté.");
      else console.log("Vous avez été connecté")
    })


    ////ACTIONS DU JOUEUR ENREGISTREES DANS ONACTION////
    // this.player.onAction('pickUpBerry', (berry_id) => {
    //   socket.emit('action', {
    //     type : 'pickUp',
    //     item_type : "berryBush",
    //     item_id : berry_id,
    //     player : socket.id
    //   })
    //   console.log("onAction : pickUpBerry")
    // })

    // this.player.onAction('pickUpWood', (wood_id) => {
    //   socket.emit('action', {
    //     type : 'pickUp',
    //     item_type : "woodPlank",
    //     item_id : wood_id,
    //     player : socket.id
    //   })
    //   console.log("onAction : pickUpWood")
    // })

    
    // this.player.onAction('dropItem', () => {
    //   socket.emit('action', {
    //     type : 'berryBushDrop',
    //     item_type : "berryBush",
    //     item_id : "1", //id de n'importe quel objet
    //     player : socket.id
    //   })
    //   console.log("onAction : dropItem");
    // })

    ////ACTIONS DU JOUEUR ENREGISTREES DANS ONACTION////
this.player.onAction('pickUpBerry', (berry_id) => {
  socket.emit('action', {
      type : 'pickUp',
      item_type : "berryBush",
      item_id : berry_id,
      player : socket.id
  });
  console.log("onAction : pickUpBerry");
});

this.player.onAction('pickUpWood', (wood_id) => {
  socket.emit('action', {
      type : 'pickUp',
      item_type : "woodPlank",
      item_id : wood_id,
      player : socket.id
  });
  console.log("onAction : pickUpWood");
});

// Ajout du pistolet dans les sockets
this.player.onAction('pickUpGun', (gun_id) => {
  socket.emit('action', {
      type : 'pickUp',
      item_type : "gun",
      item_id : gun_id,
      player : socket.id
  });
  console.log("onAction : pickUpGun");
});

// Ajout du seau dans les sockets
this.player.onAction('pickUpBucket', (bucket_id) => {
  socket.emit('action', {
      type : 'pickUp',
      item_type : "bucket",
      item_id : bucket_id,
      player : socket.id
  });
  console.log("onAction : pickUpBucket");
});

/*this.player.onAction('dropItem', () => {
  if (player.inventory.length > 0) {
      let removedItem = player.inventory.pop();  // Retire le dernier objet ajouté
      socket.emit('action', {
          type : 'dropItem',
          item_type : removedItem,
          player : socket.id
      });
      console.log(`${removedItem} retiré de l'inventaire et envoyé au serveur.`);
  } else {
      console.log("L'inventaire est vide, impossible de déposer un objet.");
  }
});
const playerName = sessionStorage.getItem('playerName') || 'Joueur' + Math.floor(Math.random() * 1000);
const socket = io();*/

// ✅ Vue.js pour gérer la chatbox
const app = Vue.createApp({
  data() {
      return {
          messages: [], 
          newMessage: ""
      };
  },
  methods: {
      sendMessage() {
          if (this.newMessage.trim() !== "") {
              socket.emit("chat-message", { player: playerName, message: this.newMessage });
              this.newMessage = "";
          }
      }
  },
  mounted() {
      socket.on("chat-message", (data) => {
          this.messages.push(data);
          this.$nextTick(() => {
              const messagesContainer = document.getElementById("messages");
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
          });
      });
  }
});
app.mount("#app");

/*function updateInventoryUI() {
  const inventoryContainer = document.getElementById("inventory");
  if (!inventoryContainer) return; // Vérifie si l'élément existe

  inventoryContainer.innerHTML = ""; // Efface l'affichage précédent

  player.inventory.forEach(item => {
      let itemDiv = document.createElement("div");
      itemDiv.classList.add("inventory-item");

      // Associer chaque objet avec son image
      switch (item) {
          case "berryBush":
              itemDiv.style.backgroundImage = "url('/static/sprite_sheets/berry.png')";
              break;
          case "woodPile":
              itemDiv.style.backgroundImage = "url('/static/sprite_sheets/wood.png')";
              break;
          case "gun":
              itemDiv.style.backgroundImage = "url('/static/sprite_sheets/gun.png')";
              break;
          case "bucket":
              itemDiv.style.backgroundImage = "url('/static/sprite_sheets/bucket.png')";
              break;
          default:
              itemDiv.style.backgroundImage = "url('/static/sprite_sheets/default.png')";
              break;
      }

      inventoryContainer.appendChild(itemDiv);
  });
}
*/

    //this.add.existing(this.berryBush)
    //this.add.existing(this.oakPlank)
    this.add.existing(this.player)
    this.player.initIndicator()
    this.player.square = this.add.graphics();
    this.player.square.fillStyle(0xff0000, 1);
    const squareSize = 10;
    this.player.square.fillRect(-squareSize/2, -squareSize/2, squareSize, squareSize);
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
// Gestion de l'affichage de l'inventaire avec la touche "I"
/*this.input.keyboard.on('keydown-I', () => {
  const inventoryContainer = document.getElementById("inventory");
  if (inventoryContainer.style.display === "none") {
      inventoryContainer.style.display = "flex"; // Afficher
  } else {
      inventoryContainer.style.display = "none"; // Cacher
  }
});*/

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
  function update(time, delta) {
    this.physics.collide(this.player, this.layerEau);
    for(let cur_player in otherPlayers) {
      this.physics.collide(otherPlayers[cur_player],this.layerEau)
    }
    handleAnimatedTiles(this,delta)
  }

  function getAnimatedTiles(scene) {
    scene.animatedTiles = [];
  //console.log(scene.map)
    let tileData = scene.map.tilesets[0].tileData;
    console.log(tileData)
    for(let tileId in tileData) {
      scene.map.layers.forEach(layer => {
        layer.data.forEach(row => {
          row.forEach(tile => {
            //console.log(tile)
            if (tile.index - scene.map.tilesets[0].firstgid === parseInt(tileId)) {
              
              scene.animatedTiles.push({
                tile,
                tileAnimationData: tileData[tileId].animation,
                firstgid: scene.map.tilesets[0].firstgid,
                elapsedTime: 0
              });
            }
          })
        })
      })
    }
  }

  function handleAnimatedTiles(scene, delta) {
    scene.animatedTiles.forEach(animatedTile => {
      if(!animatedTile.tileAnimationData) return;
      let animationDuration = animatedTile.tileAnimationData[0].duration * animatedTile.tileAnimationData.length;

      animatedTile.elapsedTime += delta;
      animatedTile.elapsedTime %= animationDuration;

      const animationIndex = Math.floor(animatedTile.elapsedTime / animatedTile.tileAnimationData[0].duration);
      animatedTile.tile.index = animatedTile.tileAnimationData[animationIndex].tileid + animatedTile.firstgid;
    });
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