const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { randomUUID } = require('crypto');
const cookieParser = require('cookie-parser');
process.env['DATABASE_URL'] = 'file:./prisma/dev.db';

const saltRounds = 10;
const prisma = new PrismaClient();
const PORT = 80;
let players = {};


(async () => {
  try {
      await prisma.$connect();
      console.log("Connexion à SQLite réussie !");
  } catch (error) {
      console.error("Erreur de connexion à SQLite :", error);
  }
})();
app.use(express.json());
app.use(cookieParser());
//Ici on a la map, voir avec Nora pour le format et comment faire pour que le serveur l'ait
let map = {
  /*"6/6" : {
    name : "berryBush",
    capacity : 5,
    y : 6,
    x : 6
  },
  "6/7" : {
    name : "woodPile",
    capacity : 3,
    y : 6,
    x : 7
  }*/
}



let tilemap = JSON.parse(fs.readFileSync('./static/tilemaps/map_test.tmj', 'utf8'));
let cur_id = 3

let layers = tilemap.layers
/*
  Pour chaque tile ayant une propriété, la seule prop requise est son nom
  Le reste est en bonus et aux soins du codeur de vérifier 
*/

let tiles_props = []
let acc = 0;

for(let cur_tileset_id in tilemap.tilesets){
  let cur_tileset = tilemap.tilesets[cur_tileset_id]

  for(let c_id in cur_tileset.tiles) {
    let cur = cur_tileset.tiles[c_id]
    cur.id += cur_tileset.firstgid
    tiles_props.push(cur)
  }

}

//console.log(tiles_props)

for(let layer_id in layers) {
  let layer = layers[layer_id]
  for(let tile_id in layer.data) {
    let tile = layer.data[tile_id]
    //console.log(tile)
    let props_array = null;
    //Le pb c que les props sont sous array
    for(let p_tile_id in tiles_props){
      let p_tile = tiles_props[p_tile_id]
      if(p_tile.id == tile){
        props_array = p_tile.properties;
        break;
      }
    }
    if(props_array == null) continue;
    //console.log(props_array)
    let props = {}
    //Pareil donc on unwrap
    for(let cur_prop_id in props_array) {
      let cur_prop = props_array[cur_prop_id]
      props[cur_prop.name] = cur_prop.value
    }

    let x = Math.floor(tile_id/layer.width)
    let y = tile_id%layer.width

    let cur_id = x + "/" + y
    if(map[cur_id]){
      map[cur_id] = {...props, ...map[cur_id]}
    }
    else map[cur_id] = {...props} //là normalement on a récup les props à vérifier
    //On y ajoute aussi son x et son y
    if(props.name == "berryBush") console.log(props, map[cur_id])
    map[cur_id].x = x
    map[cur_id].y = y

    cur_id++;
  }
}

//console.log(map)

//En assumant des tiles de 32x32
function get_pos(item) {
  return [32*item.x,32*item.y]
}

function distance(ax,ay,bx,by) {
  return Math.sqrt(Math.pow(ax - bx,2) + Math.pow(ay - by,2))
}

async function isConnected(req){
  if(req.cookies.token){
    
    const token = await prisma.token.findUnique({ where : { token : req.cookies.token }})
    console.log(token)
    console.log((new Date() / 1000) - (new Date(token.createdAt) / 1000))
    if (token){
      const diff = (new Date() / 1000) - (new Date(token.createdAt) / 1000);
      if (diff <= (2 * 3600)) return true;
    }
  } 
  return false;
}

app.use('/static', express.static(__dirname + '/static'))

app.get('/', async function (req, res) {
  if(await isConnected(req)) 
    res.sendFile(__dirname + '/static/site/html/index1.html');
  else
    res.sendFile(__dirname + '/static/site/html/index.html');
});
app.get('/index', async function (req, res) {
  if(await isConnected(req)) 
    res.sendFile(__dirname + '/static/site/html/index1.html');
  else
    res.sendFile(__dirname + '/static/site/html/index.html');
});
app.get('/regle', async function (req, res) {
  res.sendFile(__dirname + '/static/site/html/regle.html');
});
app.get('/connexion', async function (req, res) {
  if(await isConnected(req)) 
    res.redirect('/');
  else
    res.sendFile(__dirname + '/static/site/html/connexion.html');
});
app.get('/inscription', async function (req, res) {
  if(await isConnected(req)) 
    res.redirect('/');
  else
    res.sendFile(__dirname + '/static/site/html/inscription.html');
});
app.get('/personnage', async function (req, res) {
  if(!await isConnected(req)) 
    res.redirect('/');
  else
    res.sendFile(__dirname + '/static/site/html/personnage.html');
});
app.get('/lobby', async function (req, res) {
  if(!await isConnected(req)) 
    res.redirect('/');
  else
    res.sendFile(__dirname + '/static/site/html/lobby.html');
});

app.get('/disconnect', async function (req, res) {
  if(await isConnected(req)) 
    res.cookie('token', '' , { maxAge: 900000, httpOnly: true });
  res.redirect('/');

});

//Ici on met socketId : token je pense (ou l'inverse en fonction des besoins)
connected_players = {}

app.post("/connect_to_game", async (req,res) => {
  if(!await isConnected(req)) {
    res.status(400).json({ error: "Token inconnu ou trop ancien." });
    return;
  }
  console.log(req.body)

  const {socketId} = req.body;
  if(!connected_players[socketId]) connected_players[socketId] = {}
  connected_players[socketId].token = req.cookies.token;
  console.log(connected_players)
  res.status(201).json({ message: "Connexion réussie" });
})

app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({ message: "Inscription réussie !" });
    } catch (error) {
        res.status(400).json({ error: "Email déjà utilisé." });
    }
});
app.post("/login", async (req, res) => {
    console.log(req.body);
    console.log(req.cookies);
    if (await isConnected(req)) return;
    

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const token = await bcrypt.hash(randomUUID(), 2);
    res.cookie('token',token , { maxAge: 900000, httpOnly: true, sameSite:"strict"});
    await prisma.token.create({
      data: {
          token,
          email,
      },
    });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(400).json({ error: "Mot de passe incorrect" });
    }

    res.json({ message: "Connexion réussie !" });
});

app.get('/game', function (req, res) {
  res.sendFile(__dirname + '/index_jeu.html');
});

//Les constantes de tâches
const GATHER_BERRIES = "Récolter des baies";
const GATHER_WOOD = "Récolter des branches";
const GATHER_STONE = "Récolter des cailloux";
const OPEN_CHEST = "Ouvrir un coffre";
const EQUIP_BUCKET = "Equiper un seau";
const FILL_BUCKET = "Remplir un seau d'eau";

const T_THROW_RES = "Jeter des ressources";
const T_SET_ONFIRE = "Mettre le feu";
const T_EQUIP_GUN = "Equiper un pistoler";
//La fonction de jeu

const tasks = {
  castaways: [
    {
      name : GATHER_BERRIES,
      item_type : "berry",
      qte : 5
    },
    {
      name : GATHER_WOOD,
      item_type : "wood",
      qte : 5
    },
    {
      name : GATHER_STONE,
      item_type : "stone",
      qte : 3
    },
    {
      name : OPEN_CHEST,
      item_type : "chest",
      qte : 1
    },
    {
      name : EQUIP_BUCKET,
      item_type : "bucket",
      qte : 1
    },
    {
      name : FILL_BUCKET,
      item_type : "bucket",
      qte : 1
    },
  ],
  traitors: [
    {
      name : T_THROW_RES,
      item_type : "any",
      qte : 3
    },
    {
      name : T_SET_ONFIRE,
      item_type : "any",
      qte : 3
    },
    {
      name : T_EQUIP_GUN,
      item_type : "gun",
      qte : 1
    },
  ]
};

//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
const sleep = ms => new Promise(r => setTimeout(r, ms));
//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}


let votes = {}

const g_broadcast = msg => 
  io.emit('game', {
    type : "broadcast",
    message : msg
  })

async function launch_game(){
  await sleep(1000)
  g_broadcast("La partie va commencer")
  await sleep(1000)
  //Déroulement du début de la partie
  //On assigne les rôles, ça s'arrête là un peu
  let roles = ["Traître", "Survivant", "Survivant", "Survivant"]
  shuffle(roles)
  let cur_idx = 0;


  Object.keys(players).forEach((socketId) =>  {
    let cur = players[socketId]
    let role = roles[cur_idx]
    players[socketId].role = role
    players[socketId].tasks = []
    players[socketId].previousTasks = []
    connected_players[socketId].socket.emit('game',{
      type : "assign_role",
      role : role
    })
    cur_idx++;
    console.log("On file le rôle " + role + " à " + socketId)
  })

  for(let nb_jours = 1; nb_jours <= 5; nb_jours++){
    //Déroulement de l'orga d'un jour :
    //On dit à tout le monde que c'est le jour
    io.emit('game',{
      type: 'set_time',
      cur_day : nb_jours,
      time : 'day'
    })
    //On donne les tâches

    shuffle(tasks.castaways)
    shuffle(tasks.traitors)
    let cur_c = 0;
    Object.keys(players).forEach((socketId) => {
      let cur = players[socketId]
      let role = cur.role

      Object.values(players[socketId].tasks).forEach(val => players[socketId].previousTasks.push(val))
      players[socketId].tasks = []
      if(role == "Traître"){
        players[socketId].tasks = [{
            ...structuredClone(tasks.traitors[0]),
            completed : false
          }]
        }
      else {
        for(let _ = 0; _ < 2; _++){
          players[socketId].tasks.push({
            ...structuredClone(tasks.castaways[cur_c]),
            completed : false
          })
            cur_c++;
        }
      }

      connected_players[socketId].socket.emit('game',{
        type : "assign_tasks",
        tasks : players[socketId].tasks
      })
    })

    //Ici on met le sleep, 3 minutes par exemple
    await sleep(1000 * 60 * 3)

    //Orga de la nuit
    //On dit à tlm que c'est la nuit
    //On demande à tlm de voter
    //On passe au jour, on peut mettre les checks de ressources etc ici aussi !
    io.emit('game',{
      type: 'set_time',
      cur_night : nb_jours,
      time : 'night'
    })
    //On reset les votes
    votes = {}
    //On met chez players que personne n'a voté, pour vérif dans websocket ensuite
    Object.keys(players).forEach(socketId => {
      players[socketId].hasVoted = false;
    })

    //On met le sleep pour laisser les gens voter
    //await sleep(1000*60*0.5) //30s par ex

    //On récup le max dans votes
    let player_id = -1;
    let max_votes = -1;

    Object.keys(votes).forEach(socketId => {
      if(max_votes < votes[socketId]){
        player_id = socketId;
        max_votes = votes[socketId]
      }
    })

    //On fait un deuxième check pour savoir si il y a égalité
    let found_eq = false;
    Object.keys(votes).forEach(socketId => {
      if(max_votes == votes[socketId] && player_id != socketId) found_eq = true;
    })

    if(found_eq){
      g_broadcast("Il y a eu égalité, personne n'a été éliminé")
    }
    else {
      //On reveal son rôle ou pas ?
      io.emit('game', {
        type : "elimination",
        player_id : player_id
      })
    }


  }

}

//Pas de lobby on met tout sur une partie
//On va dire que quelqu'un qui se connecte veut qu'on lance la partie, va falloir que je réécrive tout quand y'aura les lobbys pg

io.on('connection', (socket) => {
    console.log(`Joueur connecté : ${socket.id}`);
    players[socket.id] = {
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600),
        direction: 'down',
    };

    if(!connected_players[socket.id]) connected_players[socket.id] = {}
    connected_players[socket.id].socket = socket;

    socket.emit('positions', players);
    
    //Ici on va mettre la logique de début de partie
    console.log("Un joueur a rejoint : 1")
    let nb_players = Object.keys(players).length
    console.log("Un joueur a rejoint : " + nb_players)
    //On va dire qu'on doit être 4 ?
    if(nb_players == 2){
      g_broadcast("4/4 joueurs, la partie va commencer")
      launch_game().then(r => console.log("partie finie gg"))
    }
    else if (nb_players < 2) {
      g_broadcast(nb_players + "/4 joueurs, la partie va commencer")
    }


    socket.on('mouvement', (data) => {
      
      if(players[socket.id]) {
        //On regarde si le temps parcouru est cohérent
        c_time = Date.now()
        player = players[socket.id]
        d_parcourue = distance(player.x,player.y, data.x,data.y)
        if(c_time - player.time_last_mvt < 10) return;
        //console.log(c_time - player.time_last_mvt)
        if(d_parcourue/(c_time - player.time_last_mvt)*1000 > 1000){
          console.log(socket.id + " violation vitesse de déplacement " + d_parcourue/(c_time - player.time_last_mvt) + "px/s")
          return;
        }
      }
        players[socket.id].time_last_mvt = Date.now()
        players[socket.id].x = data.x
        players[socket.id].y = data.y
        players[socket.id].direction = data.direction
        //console.log(data);
        io.emit('positions', players);
    });
    socket.on('open_chest', (data) => {
      if(!map[data.item_id]) return;
      //On peut mettre un check en disant qu'il peut être ouvert qu'une fois
      //En fait on doit le faire, mais j'ai trop la flemme
      if(!players[data.player].inventory) players[data.player].inventory = []
      players[data.player].inventory.push(data.item_type)
    })
    socket.on('action', (data) => {
        /*
        Format de data : un dico avec quelques clés dont 1 systématique "type"
        type : berryBushPickUp -> un joueur a récup un berry bush, les clés sont alors 
        - player : le joueur qui l'a fait
        - item_type : le type d'item (un bush ? des planches ? autre chose ?)
        -item_id : l'id de l'item dans le jeu
         (- delete : un booléen pour savoir si le bush doit être suppr ?)
        */
        if(!data.type) return;
        if(data.type == "vote") {
          if(!players[data.player]) return;
          if(players[data.player].hasVoted) return;
          if(!data.vote) return;
          if(!votes[data.vote]) 
            votes[data.vote] = 1;
          else
            votes[data.vote] += 1;
          players[data.player].hasVoted = true;
        }
        if(data.type == "dropItem"){
          if(!players[data.player].inventory) return;
          
          let item_id = -1;
          Object.keys(players[data.player].inventory).forEach(i => {
            if(players[data.player].inventory[i] == data.item_type) {
              //On peut jeter
              item_id = i;
            }
          })
          if(item_id == -1) return;
          //On regarde si on complète une task avec
          Object.values(players[data.player].tasks).forEach(val => {
            if(val.name == T_THROW_RES && !val.completed){
              val.qte--;
              if(val.qte == 0){ 
                val.completed = true
                socket.emit('game',{
                  type : 'completed_task',
                  name : val.name
                })
              }
            }
          })
          //Et ciaooo
          players[data.player].inventory.splice(item_id, 1);

        }
        if(data.type == "pickUp") {
          console.log(data.item_type, data.item_id, map[data.item_id])
          if (!map[data.item_id]) return;
          if (!map[data.item_id].capacity) return;
          if (map[data.item_id].capacity == 0) return;
          if (!players[data.player]) return;

          let px = players[data.player].x
          let py = players[data.player].y
          let ix, iy = get_pos(map[data.item_id]) 
          if (distance(px,py,ix,iy) > 100) return; //il est trop loin pour le faire
          //console.log("ahouuuu")
          //On regarde si le joueur a une tâche à faire en rapport avec l'objet récup
          Object.values(players[data.player].tasks).forEach(val => {
            if(val.item_type == data.item_type && !val.completed){
              val.qte--;
              if(val.qte == 0){
                //console.log("Le joueur " + data.player + " a fait la tâche " + val.name);
                socket.emit('game',{
                  type : "completed_task",
                  name : val.name
                })
                val.completed = true;
              }
            }
          })

          //On l'ajoute à l'inventaire
          if(!players[data.player].inventory) players[data.player].inventory = []
          players[data.player].inventory.push(data.item_type)
          
          map[data.item_id].capacity--;
          io.emit('action', data)
          if(map[data.item_id].capacity == 0){
            io.emit('remove', {
              item_id : data.item_id
            })
          }
        }
      })
  //Gestion de chat 
  socket.on("chat-message", (data) => {
            console.log(`Message reçu de ${data.player}: ${data.message}`);
            io.emit("chat-message", data); // Envoie le message à tous les joueurs
        });

    // Gérer la déconnexion
    socket.on('disconnect', () => {
        console.log(`Joueur déconnecté : ${socket.id}`);
        delete players[socket.id];
        delete connected_players[socket.id];
        io.emit('positions', players); // Mettre à jour la liste pour tous
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
