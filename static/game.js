import { BerryBush } from "./sprites/berry_bush.js"
import { OakPlanks } from "./sprites/oak_planks.js"
import { Chest } from "./sprites/chest.js"
import { Player } from './sprites/player.js'
import { WaterWell } from "./sprites/waterWell.js"

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

function renderTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const taskListDiv = document.getElementById('task-list');
  taskListDiv.innerHTML = ''; // Vider la liste actuelle

  tasks.forEach((task, index) => {
      const taskDiv = document.createElement('div');
      taskDiv.classList.add('task');

      if (task.completed) {
          taskDiv.classList.add('completed'); // Barrer si terminé ( cette ligne concerne quand la tache terminé) 
      }

      const checkboxSpan = document.createElement('span');
      checkboxSpan.textContent = task.completed ? '✔' : '';


      taskDiv.appendChild(checkboxSpan);
      taskDiv.appendChild(document.createTextNode(task.name));
      taskListDiv.appendChild(taskDiv);
  });
}

function openVote(otherPlayers){
  const modal = document.getElementById("voteModal")
  modal.showModal()
  const playersOpt = document.getElementById("playersVote")
  playersOpt.innerHTML = "";
  console.log("salut")
  console.log(otherPlayers)
  Object.values(otherPlayers).forEach(val => {
    const curP = document.createElement("option")
    curP.innerText = val.id
    curP.value = val.id
    console.log("une val")
    console.log(curP)
    playersOpt.appendChild(curP)
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const socket = await io();
window.socket = socket;
await socket.emit('connect_game');
await sleep(500);
let playersData = {};
let otherPlayers = {}; 
let playersGroup;
let player;
let cursors;

var game = new Phaser.Game(config)

  function preload() {
    // Charger les sprites correctement
    this.load.image('pickUpIcon', '/static/sprite_sheets/PickUp.png');
    this.load.image('openChestIcon', '/static/sprite_sheets/OpenChest.png');
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
    this.player = new Player(this, 500,500, true, "impostor")
    player = this.player;
    
    this.map = this.add.tilemap('map')
    const map = this.map
    console.log(map);
    /////////TILESET/////////
    //on créé le jeu de tuile avec son nom et l'image dont on a besoin
    const tileset1 = map.addTilesetImage('TileSet_V2', 'tiles');
    const tileset2 = map.addTilesetImage('vegetation', 'vegetation');
    /////////LAYER/////////
    //const tileset2 = map.addTilesetImage('water_animation_spritesheet', 'Water');
    this.layerIle = map.createLayer('island', [tileset1]); 
    this.layerEau = map.createLayer('sea', [tileset1]); 
    this.sacs_couchages = map.createLayer('sacs_couchages', [tileset1]);
    this.campfire = map.createLayer('campfire', [tileset1]);  
    this.palmier = map.createLayer('palmier', [tileset1]); 
    this.bamboo = map.createLayer('bamboo', [tileset1]); 
    this.mapElements = map.createLayer('elements', [tileset2]); 
    this.game_started = false;
    let layerEau = this.layerEau
    
    getAnimatedTiles(this);
    this.physics.world.setBounds(0, 0, 800 * 8, 600 * 8);

    let berryBushes = this.mapElements.filterTiles(tile => {
      return tile.properties && tile.properties.name == "berryBush";
    });
    let woodPiles = this.mapElements.filterTiles(tile => {
      return tile.properties && tile.properties.name == "woodPile";
    });
    let chests = this.mapElements.filterTiles(tile => {
      return tile.properties && tile.properties.name == "chest";
    });
    let topLeftChests = chests.filter(tile => {
      return tile.properties.numero == 1;
    });
    let waterWells = this.mapElements.filterTiles(tile => {
      return tile.properties && tile.properties.name == "waterWell";
    });
    let topLeftWaterWells = waterWells.filter(tile => {
      return tile.properties.numero == 1;
    });

////////////OBJETS COLLISIONS////////////
    this.elements = [] //Ici tous les éléments avec lesquels on peut intéragir
    for(let berryBush_i in berryBushes) {
      let berryBush = new BerryBush(this, berryBushes[berryBush_i].pixelX + 16, berryBushes[berryBush_i].pixelY + 16, berryBushes[berryBush_i].y + "/" + berryBushes[berryBush_i].x, berryBushes[berryBush_i])
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

    for(let chest_i in topLeftChests) {
      let chest = new Chest(this, chests[chest_i].pixelX + 32, chests[chest_i].pixelY + 32 , chests[chest_i].y + "/" + chests[chest_i].x, chests[chest_i])
      this.elements.push(chest)
        
      this.physics.add.collider(this.player, chest, function() {
        console.log('Collision avec chest !');
      });
      this.add.existing(chest)
    }

    for(let waterWell_i in topLeftWaterWells) {
      let waterWell = new WaterWell(this, waterWells[waterWell_i].pixelX + 32, waterWells[waterWell_i].pixelY + 32 , waterWells[waterWell_i].y + "/" + waterWells[waterWell_i].x, waterWells[waterWell_i])
      this.elements.push(waterWell)
        
      this.physics.add.collider(this.player, waterWell, function() {
        console.log('Collision avec waterWell !');
      });
      this.add.existing(waterWell)
    }



    this.cameras.main.startFollow(this.player, true);

    if (this.player.role == "impostor") {
      this.physics.add.collider(this.player, this.layerEau, this.player.onWaterCollision, null, this.player);
      this.physics.add.collider(this.player, this.campfire, this.player.fireCollision, null, this.player);
    } else {
      this.physics.add.collider(this.player, this.layerEau, null, null, this);
      this.physics.add.collider(this.player, this.campfire, null, null, this);
    }
    this.layerEau.setCollisionBetween(196,196)
    this.campfire.setCollisionBetween(225,247)
    console.log(this.layerEau.body)
    //layerEau.setTint(0x3d3d29)
    // #999966 pluie ?
    // #3d3d29 nuit ?


///////////////SOCKET///////////////
    //Fonction qui gère ce que la partie te dit
    //On reçoit avant tout le type dans data et on avise ensuite
    socket.on('game', (data) => {
      if(data.type == "game_state") {
        //On a inventory et map
        let inventory = data.inventory
        let map = data.map;
        let started = data.started;
        let pos = data.pos;
        console.log(pos.x, pos.y, "aouuu")
        this.player.x = pos.x
        this.player.y = pos.y
        if(data.inventory)
          this.player.inventory = data.inventory
        const tasks = data.tasks || [];
        localStorage.setItem('tasks', JSON.stringify(data.tasks)); // ici on Sauvegarde les taches recu de  serv dans le localStorage
        renderTasks();
        document.getElementById("role").innerHTML = "Votre rôle est : " + data.role;
        console.log(data.tasks)
        if(started)
          this.game_started = true;
        console.log(map)
        Object.keys(map).forEach(id => {
          if(!map[id].name) return; 
          if(map[id].capacity != 0) return; //Rien à faire avec pour l'instant je pense
          Object.values(this.elements).forEach(elem => {
            if(elem.id != id) return;
            elem.isNowDepleted();
          })
        })

  
      }
      if(data.type == "remove_player"){
        if(!data.id) return;
        console.log("Faut remove le joueur " + data.id, "après je crois c déjà fait")
        //On met le mode spectateur sur le joueur si il est mort
        if(data.id != socket.id) {
          console.log(otherPlayers[data.id])
          otherPlayers[data.id].destroy()
          delete otherPlayers[data.id]
          
          return
        };
        this.player.ghost = true;
        this.player.tint = 0xFF0000
        this.player.interactionIndicator.visible = true;
        this.player.interactionIndicator2.visible = false;
        this.player.square.x = -1
        this.player.square.y = -1
        console.log("ct nous !!")
      }
      if(data.type == "broadcast") {
        console.log("On a reçu : " + data.message)
      }
      if(data.type == "started")
        this.game_started = true;
      if(data.type == "assign_role") {
        //Ici data.role c'est soit Traître soit Survivant
        console.log("Vous avez été assigné le rôle : " + data.role)
        document.getElementById("role").innerHTML = "Votre rôle est : " + data.role;
      }
      if(data.type == "assign_tasks") {
        console.log("Vous avez reçu les tâches suivantes")
        console.log(data.tasks)
        localStorage.setItem('tasks', JSON.stringify(data.tasks)); // ici on Sauvegarde les taches recu de  serv dans le localStorage
        renderTasks(); // puis ici on Met à jour l'affichage
      }
      if(data.type == "completed_task") {
        const tasks = JSON.parse(localStorage.getItem("tasks"))
        console.log("Vous avez complété : " + data.name)
        Object.values(tasks).forEach(val => {
          if(val.name == data.name) val.completed = true;
        })
        //tasks[data.name].completed = true;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
      }
      if(data.type == "end_game") {
        if(side == "Survivant"){
          const sModal = document.getElementById("sWin");
          const rButton = document.getElementById("retourIndex1");
          rButton.addEventListener("click", () => {
            document.location.href = "/"
          })
          sModal.showModal();
        }
        else {
          const tModal = document.getElementById("tWin");
          const rButton = document.getElementById("retourIndex2");
          rButton.addEventListener("click", () => {
            document.location.href = "/"
          })
          tModal.showModal();
        }
      }
      if(data.type == "set_time") {
        console.log("On a reçu des infos sur le temps")
        if(data.time == "day"){
          console.log("C'est le jour " + data.cur_day)
        }
        if(data.time == "night"){
          console.log("C'est la nuit " + data.cur_night)
          openVote(otherPlayers)
          //Ici on doit s'occuper de faire en sorte que les gens votent
        }
      }
      if(data.type == "elimination"){
        console.log("Le joueur " + data.player_id + " a été eliminé")
      }
    })


    socket.on('positions', (data) => {
      window.playersData = data;
      playersData = data;
      //console.log(data);
      updateOtherPlayers(this);
    });

    //On init le bouton
    const btn = document.getElementById("voteBtn")
    btn.addEventListener('click', () => {
      const voteV = document.getElementById('playersVote').value;
      console.log("ça vote " + voteV)
      socket.emit("action", {
        type: "vote",
        vote: voteV,
        player: socket.id
      });
      document.getElementById("voteModal").close()
    })


    socket.on('action', (data) => {
      /*
      Format de data : un dico avec quelques clés dont 1 systématique "type"
      type : berryBushPickUp -> un joueur a récup un berry bush, les clés sont alors 
       - player : le joueur qui l'a fait
       (- delete : un booléen pour savoir si le bush doit être suppr ?)
      */
      if(!data.type) return;
      
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
    this.player.onAction('pickUpBerry', (berry_id) => {
      socket.emit('action', {
        type : 'pickUp',
        item_type : "berry",
        item_id : berry_id,
        player : socket.id
      })
      console.log("onAction : pickUpBerry")
    })

    this.player.onAction('pickUpWood', (wood_id) => {
      socket.emit('action', {
        type : 'pickUp',
        item_type : "wood",
        item_id : wood_id,
        player : socket.id
      })
      console.log("onAction : pickUpWood")
    })
    
    this.player.onAction('dropItem', (item) => {
      //console.log("Item.type : ", item.type, " Item.id : ", item.id)
      socket.emit('action', {
        type : 'dropItem', //drop n'importe quel item
        item_type : item.type,
        item_id : item.id, //id de n'importe quel objet
        player : socket.id
      })
      console.log("onAction : dropItem");
    })

    this.player.onAction('openChest', (chest_id) => {
      const items = [
        { type: 'seau', id: '1' },
        { type: 'couteau', id: '2' },
        { type: 'hache', id: '3' }
      ];
      const randomIndex = Math.floor(Math.random() * items.length);
      const item = items[randomIndex];
      if (this.player.inventory.length + 1 > 8) {
        console.log("L'inventaire est déjà plein ! ");
        return;
      }
      this.player.inventory.push(item.type);
      this.player.updateInventory();

      socket.emit('open_chest', { 
        type : 'openChest',
        item_type : item.type,
        item_id : chest_id,
        player: socket.id 
      });
      console.log("onAction : openChest");
      console.log(`Le joueur a trouvé ${item.type}`);
    })

    this.player.onAction('fillBucket', (waterWell_i) => {
      socket.emit('action', {
        type : 'fill_bucket',
        item_id : waterWell_i,
        player : socket.id
      })
      console.log("onAction : fillBucket");
    })

    this.player.onAction('killByKnife', (victim_i) => {
      socket.emit('action', {
        type : 'kill',
        victim : victim_i,
        player : socket.id
      })
      console.log("onAction : killByKnife");
    })


    this.add.existing(this.player)
    this.player.initIndicator()
    this.player.square = this.add.graphics();
    this.player.square.fillStyle(0xff0000, 1);
    const squareSize = 10;
    this.player.square.fillRect(-squareSize/2, -squareSize/2, squareSize, squareSize);

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
          this.player.canInteract = cur; //cur a des objets de la liste elements
      }}); 
    this.sendPlayerPosition = (x,y) => {
        socket.emit('mouvement', {
            x: player.x,
            y: player.y,
            direction: player.direction,
            player : socket.id
        });
    }
    this.sendPlayerPosition(300,300)


/////////////////ANIMATIONS/////////////////
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

//Vue.js pour gérer la chatbox

const roomData = JSON.parse(localStorage.getItem("roomData")) || {};
const playerName = roomData.pseudo || "Joueur"; //  on récuper le pseudo

const app = Vue.createApp({
  data() {
      return {
          messages: [], 
          newMessage: ""
      };
  },
  methods: {
      sendMessage() {
          if (!socket) {
              console.error("Socket.io non initialisé !");
              return;
          }

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
            const otherPlayer = new Player(scene, playersData[id].x, playersData[id].y, false, "player", id)
            console.log(otherPlayer.id)
            scene.elements.push(otherPlayer); //player doit interagir avec otherplayer
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
