const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { randomUUID, createHash, randomBytes } = require('crypto');
const cookieParser = require('cookie-parser');
process.env['DATABASE_URL'] = 'file:./prisma/dev.db';

const saltRounds = 10;
const prisma = new PrismaClient();
const PORT = process.env.PORT || 80;
let players = {};
let rooms = {};
let socketId_socket = {};
let votes = {};
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
    map[cur_id].x = x
    map[cur_id].y = y
    map[cur_id].tile_id = tile;
    if(props.name == "woodPile") console.log(props, map[cur_id])
    cur_id++;
  }
}

room_maps = {}

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
    //console.log(token)
    //console.log((new Date() / 1000) - (new Date(token.createdAt) / 1000))
    if (token){
      const diff = (new Date() / 1000) - (new Date(token.createdAt) / 1000);
      if (diff <= 3600) return true;
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
    res.cookie('token', '' , { maxAge: 3600000, httpOnly: true });
  res.redirect('/');

});
// https://stackoverflow.com/questions/73915546/how-to-generate-a-random-5-letter-code-and-give-filters
function generate(len = 5){
  let charset = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM!@#$%^&*()"
  let result = ""
  for(let i = 0; i<len;i++ ){
    let charsetlength = charset.length
    result+=charset.charAt(Math.floor(Math.random() * charsetlength))
  }
  return result;
}

app.post('/create_room', async function (req, res){
  //console.log("aaaaa")
  if(!await isConnected(req))
    res.redirect('/')
  //console.log("aaaaa")
  
  let {gamemode, players, player} = req.body;
  let is_private = false;
  if(gamemode == "ClassiqueP"){
    is_private = true;
    gamemode = "Classique"
  }
  let room_code = generate()
  rooms[room_code] = {
    owner : req.cookies.token,
    nb_players : players,
    players : [],
    gamemode : gamemode,
    pause : false,
    want_skip : false,
    private : is_private
  };

  room_maps[room_code] = structuredClone(map)

  //console.log(rooms)
  console.log("la room est", room_code)
  res.status(201).json({ room: room_code });

})

app.post('/launch_room', async function (req, res){
  if(!await isConnected(req))
    return
  let {room_id} = req.body;
  console.log("slt", room_id)
  if(!rooms[room_id]) return;
  //console.log(rooms[room_id].owner, req.cookies.token)
  //console.log(rooms[room_id].players.length, rooms[room_id].nb_players)
  if(rooms[room_id].owner != req.cookies.token) return;
  if(rooms[room_id].players.length < rooms[room_id].nb_players) return;
  rooms[room_id].launched = true;
  io.to(room_id+"/lobby").emit('go_to_game',{})
})

app.post('/room', async function (req, res){
  if(!await isConnected(req))
    return
  //Faudra penser à vérif qu'on est pas déjà dedans
  let {room_id, socket_id, player} = req.body;
  //console.log("aaa " + room_id + " " + socket_id);
  //console.log(rooms)
  if(rooms[room_id] == undefined) return
  if(rooms[room_id].players == undefined) return
  if(game_started[room_id]) return;
  if(rooms[room_id].players.length > rooms[room_id].nb_players) return;
  //rooms[room_id].players.push(req.cookies.token)
  //console.log(socketId_socket)
  //console.log(req.body)
  let socket = null;
  Object.keys(socketId_socket).forEach(id => {
    if(id == socket_id) socket = socketId_socket[id].socket;
  })

  if(!socket) return;
  socket.join(room_id + "/lobby");
  rooms[room_id].players.push(
      {
        token : req.cookies.token,
        player : player,
        socketId : socket_id,
        socket : socket
      }
  )
  
  let room_players = [];
  Object.values(rooms[room_id].players).forEach(val => {
    if(val.player == undefined) return;
    room_players.push(val.player);
  })

  io.to(room_id+"/lobby").emit("players", room_players);
  console.log(room_players)

  res.send({
    nb_players : rooms[room_id].nb_players,
    gamemode : rooms[room_id].gamemode
  })

})

//Utiliser no traitre avec PARCIMONIE !!!!!!
//Sinon juste ça crash ??
function get_alive_players(room_id, no_traitre=false){
  let p_count = 0
  Object.keys(players).forEach(id => {
    if(connected_players[id].room_id != room_id) return;
    if(!players[id].alive) return;
    if(no_traitre && players[id].role != "Survivant") return;
    p_count++;
  })

  return p_count;
}

//Ici on met socketId : token je pense (ou l'inverse en fonction des besoins)
connected_players = {}
old_players = {}
app.post("/connect_to_game", async (req,res) => {
  console.log("ça essaye")
  if(!await isConnected(req)) {
    res.status(400).json({ error: "Token inconnu ou trop ancien." });
    return;
  }
  //On récup sa room !!
  console.log("ça essaye2")
  let room_id = null;
  let pseudo = null
  Object.keys(rooms).forEach(id => {
    Object.values(rooms[id].players).forEach(val => {
      if(val.token == req.cookies.token){
        room_id = id;
        pseudo = val.player
      }
    })
  })

  //Le frr est pas co
  if(room_id == null) return;
  console.log("il est là dans la room", room_id)
  const {socketId} = req.body;
  if(!connected_players[socketId]) connected_players[socketId] = {}
  //if(!connected_players[socketId]) connected_players[socketId] = {}
  //On va chercher si un joueur a un token associé
  let other_id = null;
  Object.keys(connected_players).forEach(id => {
    if(id == socketId) return;
    if(connected_players[id].token == req.cookies.token){
      other_id = id;
      return;
    }
  })
  connected_players[socketId].socket.join(room_id+"/game")
  connected_players[socketId].room_id = room_id;
  players[socketId].pseudo = pseudo
  console.log("il c co et il a", pseudo)
  if(other_id){
    let o = connected_players[other_id];
    connected_players[socketId].inventory = o.inventory
    connected_players[socketId].token = o.token
    delete connected_players[other_id];
    if(old_players[other_id]) {
      console.log("youhou")
      players[socketId].x = old_players[other_id].x
      players[socketId].y = old_players[other_id].y
      players[socketId].tasks = old_players[other_id].tasks
      players[socketId].role = old_players[other_id].role
      players[socketId].alive = old_players[other_id].alive
    }
    else if (players[other_id]) {
      players[socketId].x = players[other_id].x
      players[socketId].y = players[other_id].y
      players[socketId].tasks = players[other_id].tasks
      players[socketId].role = players[other_id].role
      players[socketId].alive = players[other_id].alive
      delete players[other_id] //A voir si ça supprime le ref vers tasks, j'espère pas
    }
    if(votes[other_id]) votes[socketId] = votes[other_id]
    console.log(players[socketId])
    connected_players[socketId].socket.emit('game',{
      type : "game_state",
      inventory : connected_players[socketId].inventory,
      map: room_maps[room_id],
      started : game_started[room_id],
      pseudo : pseudo,
      tasks : players[socketId].tasks,
      pos : { x : players[socketId].x, y : players[socketId].y},
      role : players[socketId].role,
      alive : players[socketId].alive
    })
    return;
  }
  connected_players[socketId].socket.emit('game',{
    type : "game_state",
    inventory : connected_players[socketId].inventory,
    map: room_maps[room_id],
    position : null,
    tasks : null,
    pseudo : pseudo,
    started : null,
    pos : { x : players[socketId].x, y : players[socketId].y},
    role : players[socketId].role,
    alive : true
  })
  connected_players[socketId].token = req.cookies.token;

  //Ici on va mettre la logique de début de partie
  let p_count = get_alive_players(room_id);
  console.log("Un joueur a rejoint on est : " + p_count)
  //On va dire qu'on doit être 4 ? 
  //Finalement j'ai mis le truc générique
  if(p_count == rooms[room_id].nb_players){
    g_broadcast("Tous les joueurs sont là, la partie va commencer", room_id)
    launch_game(room_id).then(r => console.log("partie finie gg"))
  }
  else if (p_count < rooms[room_id].nb_players) {
    g_broadcast(p_count + "/"+ rooms[room_id].nb_players +" joueurs, la partie va commencer", room_id)
  }

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
        const token = createHash('sha256').update(randomUUID() + randomBytes(117)).digest('hex');
        await prisma.token.create({
          data: {
              token,
              email,
          },
        });
        res.cookie('token',token , { maxAge: 3600000, httpOnly: true, sameSite:"strict"});
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

    const token = createHash('sha256').update(randomUUID() + randomBytes(256)).digest('hex');
    res.cookie('token',token , { maxAge: 3600000, httpOnly: true, sameSite:"strict"});

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

app.get("/get_rooms", function (req, res) {
  let v_rooms = [];

  Object.keys(rooms).forEach(id => {
    let room = rooms[id]
    if(room.private == true) return;
    if(room.players.length < room.nb_players){
      v_rooms.push({
        id : id, 
        nb_players : room.nb_players,
        cur_players : room.players.length,
        gamemode : room.gamemode
      })
    }
  })

  res.status(201).json({
    rooms : v_rooms
  })

})

app.get('/game', function (req, res) {
  res.sendFile(__dirname + '/index_jeu.html');
});

//Les constantes de tâches
const GATHER_BERRIES = "Récolter des baies";
const GATHER_WOOD = "Récolter des branches";
const OPEN_CHEST = "Ouvrir un coffre";
const EQUIP_BUCKET = "Equiper un seau";
const FILL_BUCKET = "Remplir un seau d'eau";

const T_THROW_RES = "Jeter des ressources";
const T_SET_ONFIRE = "Mettre le feu";
//La fonction de jeu

const tasks = {
  castaways: [
    {
      name : GATHER_BERRIES,
      item_type : "berry",
      qte : 4
    },
    {
      name : GATHER_WOOD,
      item_type : "wood",
      qte : 4
    },
    {
      name : EQUIP_BUCKET,
      item_type : "seau",
      qte : 1
    },
    {
      name : FILL_BUCKET,
      item_type : "seau_plein",
      qte : 1
    },
  ],
  traitors: [
    {
      name : T_THROW_RES,
      item_type : "any",
      qte : 1
    },
    {
      name : T_SET_ONFIRE,
      item_type : "any",
      qte : 1
    },
    // {
    //   name : T_EQUIP_KNIFE,
    //   item_type : "knife",
    //   qte : 1
    // },
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

let game_started = {};

const g_broadcast = (msg,room_id) => 
  io.to(room_id + "/game").emit('chat-message', {
    player : "[SYSTEME]",
    message : msg
  })

function end_game(room_id, ending=0){
  g_broadcast("La partie est finie", room_id);
  let side = "Traître"
  if(ending == 0){
    g_broadcast("Vous avez survécu 3 jours, félicitations", room_id)
    side = "Survivant"
  }
  else if (ending == 1){
    g_broadcast("Le traître a réussi à vous retenir suffisamment longtemps, le kraken vous englouti", room_id)
  }
  else if (ending == 2){
    g_broadcast("L'un de vous n'a pas fait ses tâches, vous ne parvenez pas à subsister et la faim vous emporte", room_id)
  }
  else if (ending == 3){
    g_broadcast("Le traître a été éliminé, félicitations !", room_id)
  }

  io.to(room_id+"/game").emit('game',{
    type: 'end_game',
    side : side
  })
  rooms[room_id].game_started = false;
  rooms[room_id].launched = false;

  let to_del = []

  Object.values(rooms[room_id].players).forEach(val => {
    Object.keys(connected_players).forEach(id => {
      if(connected_players[id].token == val.token)
        to_del.push(id)
    })
  })

  to_del.forEach((val, i) =>{
    delete connected_players[val]
  })

  delete rooms[room_id]
}

async function launch_game(room_id){
  await sleep(1000)
  g_broadcast("La partie va commencer", room_id)
  io.to(room_id+"/game").emit('game',{
    type : 'started'
  })
  game_started[room_id] = true;
  await sleep(1000)
  if(rooms[room_id].gamemode == "Sandbox") return;
  //Déroulement du début de la partie
  //On assigne les rôles, ça s'arrête là un peu
  //Faut faire en fonction du nb de joueurs, on met 1 traître le reste de générique
  let roles = ["Traître"];
  for(let i = 1; i < rooms[room_id].nb_players; i++){
    roles.push("Survivant")
  }
  //let roles = ["Traître", "Survivant", "Survivant", "Survivant"]
  shuffle(roles)
  let cur_idx = 0;


  Object.keys(players).forEach((socketId) =>  {
    if(connected_players[socketId].room_id != room_id) return;
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

  //3 jours, comme ça c'est une partie de 3/4 min
  for(let nb_jours = 1; nb_jours <= 3; nb_jours++){
    //Déroulement de l'orga d'un jour :
    //On dit à tout le monde que c'est le jour
    io.to(room_id+"/game").emit('game',{
      type: 'set_time',
      cur_day : nb_jours,
      time : 'day'
    })
    g_broadcast("Le jour "+ nb_jours +" commence", room_id)
    //On donne les tâches
    shuffle(tasks.castaways)
    shuffle(tasks.traitors)
    let cur_c = 0;
    Object.keys(players).forEach((socketId) => {
      if(connected_players[socketId].room_id != room_id) return;
      let cur = players[socketId]
      let role = cur.role

      Object.values(players[socketId].tasks).forEach(val => players[socketId].previousTasks.push(val))
      players[socketId].tasks = []
      if(role == "Traître"){
        //C'est un traître on lui donne qu'un truc à faire
        players[socketId].tasks = [{
            ...structuredClone(tasks.traitors[0]),
            completed : false
          }]
        }
      else {
        //Le survivant a 2 tâches pour le jour, à voir si on change c'est déjà pas mal ?
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
    //On va itérer toutes les secondes pour voir si tlm est mort (dans ce cas RIP)
    //Aussi on va faire en sorte que ça dure ~~ 60 secondes voire plus court
    let nb_iters = 0;
    while(nb_iters < 60){
      if(get_alive_players(room_id, true) == 0){
        end_game(room_id, 1)
        return;
      }
      if(rooms[room_id].want_skip == true){
        rooms[room_id].want_skip = false;
        nb_iters = 99999999 //ça en fait de l'attente woooowoiwowiqsopi uyfhqs dfoi^hqsdfgpiujqsdfgoimqdfs A LAIDE
      }
      if(rooms[room_id].pause == false){
        nb_iters++;
        if(nb_iters == 30)
          g_broadcast("Moitié du jour", room_id)
      }
      await sleep(1000);
    }
    //await sleep(1000 * 60 * 3)

    //Orga de la nuit
    //On dit à tlm que c'est la nuit
    //On demande à tlm de voter
    //On passe au jour, on peut mettre les checks de ressources etc ici aussi !
    io.to(room_id+"/game").emit('game',{
      type: 'set_time',
      cur_night : nb_jours,
      time : 'night'
    })
    g_broadcast("La nuit "+ nb_jours +" commence", room_id)

    //Est-ce que les joueurs n'ont pas fait leurs tâches ?
    //Si oui alors c perdu ! (p-ê un peu sévère ?)
    //Sauf le traître il a un passe droit
    let found_one = false;
    Object.keys(players).forEach(id => {
      if(connected_players[id].room_id != room_id) return;
      if(!players[id].alive) return;
      if(players[id].role == "Traître") return;
      Object.values(players[id].tasks).forEach(val => {
        if(!val.completed) found_one = true;
      })
    })
    if(found_one){
      end_game(room_id, 2)
      return;
    }

    //On reset les votes
    //On met chez players que personne n'a voté, pour vérif dans websocket ensuite
    Object.keys(players).forEach(socketId => {
      if(connected_players[socketId].room_id != room_id) return;
      players[socketId].hasVoted = false;
      votes[socketId] = 0
    })

    //On met le sleep pour laisser les gens voter
    g_broadcast("Aux joueurs de voter, qui est le traître ? Vous avez 30 secondes !", room_id)
    await sleep(1000*15) //30s par ex
    g_broadcast("Moitié du temps de vote écoulé !", room_id)
    await sleep(1000*15) //30s par ex
    //On récup le max dans votes
    let player_id = -1;
    let max_votes = -1;

    Object.keys(votes).forEach(socketId => {
      if(connected_players[socketId].room_id != room_id) return;
      if(max_votes < votes[socketId]){
        player_id = socketId;
        max_votes = votes[socketId]
      }
    })

    //On fait un deuxième check pour savoir si il y a égalité
    let found_eq = false;
    Object.keys(votes).forEach(socketId => {
      if(connected_players[socketId].room_id != room_id) return;
      if(max_votes == votes[socketId] && player_id != socketId) found_eq = true;
    })

    if(found_eq){
      g_broadcast("Il y a eu égalité, personne n'a été éliminé", room_id)
    }
    else {
      //On reveal son rôle ou pas ?
      io.to(room_id + "/game").emit('game', {
        type : "kill",
        player_id : player_id
      })
      players[player_id].alive = false
      if(players[player_id].role == "Traître"){
        end_game(room_id,)
        return
      }
    }

    //Vous avez éliminé tous les survivants sauf un ? Fini !! (p-ê mettre 0 ?)
    if(get_alive_players(room_id, true) == 0){
      end_game(room_id,1)
      return;
    }

  }

  //Fin de la partie les gens viennent vous sauver
  end_game(room_id, 0);

}

//Pas de lobby on met tout sur une partie
//On va dire que quelqu'un qui se connecte veut qu'on lance la partie, va falloir que je réécrive tout quand y'aura les lobbys pg

io.on('connection', (socket) => {
  if(!socketId_socket[socket.id]) socketId_socket[socket.id] = {};
  socketId_socket[socket.id].socket = socket;

  socket.on('connect_game', (data) => {
    console.log(`Joueur connecté : ${socket.id}`);
    players[socket.id] = {
        x: 500,
        y: 500,
        direction: 'down',
        alive : true
    };

    if(!connected_players[socket.id]) connected_players[socket.id] = {}
    connected_players[socket.id].socket = socket;

    if(!connected_players[socket.id]) connected_players[socket.id] = {}
    connected_players[socket.id].socket = socket;

    //socket.emit('positions', players);
  })

    


  socket.on('mouvement', (data) => {
    if(!data.player) return;
    if(!connected_players[data.player]) return;
    if(!connected_players[data.player].room_id) return;
    if(!game_started[connected_players[data.player].room_id]) return;
    let map = room_maps[connected_players[data.player].room_id]
    if(players[socket.id]) {
      //Vivant ?
      if(!players[socket.id].alive) return;
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
      //Et si on cherchait à voir si il avait traversé un bloc INTERDIT ??
      //Attention j'hardcode les IDs !
      let forbidden_IDs = [196, 241, 242, 493, 458, 502, 503, 485, 486]

      //Y'a un petit pb sur l'envoi des directions, il est pas complet
      //Et de toute façon on peut pas faire confiance au client
      //Donc on va devoir retrouver la direction
      let dir_x = 0;
      let dir_y = 0;
      if(player.x - data.x < 0)
        dir_x = -1;
      else if (player.x - data.x > 0)
        dir_x = 1;

      if(player.y - data.y < 0)
        dir_y = -1;
      else if (player.y - data.y > 0)
        dir_y = 1;

      //On va se placer sur la tile de départ, et pour chaque morceau on va avancer d'une tile et regarder son id
      //C'est tout !
      let x_dep = Math.floor(player.x/32)
      let y_dep = Math.floor(player.y/32)
      let x_arr = Math.ceil(data.x/32)
      let y_arr = Math.ceil(data.y/32)
      let x_ratio = Math.abs(player.x/data.x)
      let y_ratio = Math.abs(player.y/data.y)
      
      

      //On va se dire qu'on fait au plus 1000 iters sinon : comportement non cohérent ?
      let nb_iter = 1;
      let x_cur = x_dep
      let y_cur = y_dep
      while(Math.abs(x_cur - x_arr) >= 2 && Math.abs(y_cur - y_arr) >= 2){
        x_cur = x_dep + Math.floor(nb_iter * dir_x * x_ratio)
        y_cur = y_dep + Math.floor(nb_iter * dir_y * y_ratio)
        
        console.log(x_cur,x_arr,y_cur,y_arr)
        //Est-ce qu'on passe par le vide ?
        //Le pire c'est que je sais même pas si c undefined ou null, je mets les 2
        if(map[x_cur + "/" + y_cur] != undefined && map[x_cur + "/" + y_cur] != null) {
          //console.log("on est sur une vraie tile")
          //Est-ce que l'id est dans forbidden_IDs ?
          let cur_id = map[x_cur + "/" + y_cur].tile_id;
          //console.log("on est sur",cur_id)
          if(forbidden_IDs.includes(cur_id)) return;
          //console.log("on est sur une bonne tile")
        }
        //C long
        if(nb_iter > 10) return;
        //console.log("c'est pas trop long")
        nb_iter++;
      }
      //console.log("on s'en sort")

    }
    players[socket.id].time_last_mvt = Date.now()
    players[socket.id].x = data.x
    players[socket.id].y = data.y
    players[socket.id].direction = data.direction
    //console.log(data);
    let r_players = {};
    Object.keys(players).forEach(id => {
      if(connected_players[id].room_id != connected_players[socket.id].room_id) return;
      if(!players[id].alive) return;
      r_players[id] = players[id]
    }) 
    //console.log(r_players)
    io.to(connected_players[socket.id].room_id+"/game").emit('positions', r_players);
  });
  socket.on('open_chest', (data) => {
    if(!data.player) return;
    if(!connected_players[data.player]) return;
    if(!connected_players[data.player].room_id) return;
    if(!game_started[connected_players[data.player].room_id]) return;
    let map = room_maps[connected_players[data.player].room_id]
    if(!map[data.item_id]) return;
    if(!players[data.player]) return;
    if(!players[data.player].alive) return;
    //On peut mettre un check en disant qu'il peut être ouvert qu'une fois
    //En fait on doit le faire, mais j'ai trop la flemme
    if(!connected_players[data.player].inventory) connected_players[data.player].inventory = []
    connected_players[data.player].inventory.push(data.item_type)
    //On se dit qu'on récup 1 objet et qu'on récup que des objets de tâches à qte 1
    //Ce qui est le cas
    if(players[data.player].tasks != null)
      Object.values(players[data.player].tasks).forEach(val => {
        console.log(val.item_type, data.item_type, val.completed)
        if(val.item_type == data.item_type && !val.completed){
          val.qte--;
          console.log("Le joueur " + data.player + " a fait la tâche " + val.name);
          socket.emit('game',{
            type : "completed_task",
            name : val.name
          })
          val.completed = true;
        }
      })
  })
  socket.on('action', (data) => {
    if(!data.player) return;
    if(!connected_players[data.player]) return;
    if(!connected_players[data.player].room_id) return;
    if(!game_started[connected_players[data.player].room_id]) return;
    let map = room_maps[connected_players[data.player].room_id]
    if(!players[data.player]) return;
    if(!players[data.player].alive) return;
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
      if(players[data.player].hasVoted) return;
      if(!data.vote) return;
      if(!votes[data.vote]) 
        votes[data.vote] = 1;
      else
        votes[data.vote] += 1;
      players[data.player].hasVoted = true;
    }
    if(data.type == "kill"){
      if(!data.victim) return;
      if(!connected_players[socket.id]) return;
      console.log("ça tue")
      players[data.victim].alive = false;
      io.to(connected_players[socket.id].room_id + "/game").emit('game', {
        type : "remove_player",
        id : data.victim
      })

    }
    if(data.type == "fill_bucket"){
      console.log("on a rempli un seau ouaiis")
      let bucket_id = -1;
      Object.keys(connected_players[data.player].inventory).forEach(i => {
        if(connected_players[data.player].inventory[i] == "seau")
          bucket_id = i;
      })
      console.log("c passé")
      connected_players[data.player].inventory.splice(bucket_id, 1);
      connected_players[data.player].inventory.push("seau_plein");
      //On regarde si il devait fill un bucket
      if(players[data.player].tasks != null)
        Object.values(players[data.player].tasks).forEach(val => {
          if(val.item_type == "seau_plein" && !val.completed){
            val.qte--;
            console.log("Le joueur " + data.player + " a fait la tâche " + val.name);
            socket.emit('game',{
              type : "completed_task",
              name : val.name
            })
            val.completed = true;
          }
        })
    }
    if(data.type == "dropItem"){
      if(!connected_players[data.player].inventory) return;
      console.log("ça essaye de jeter")
      console.log("On a", data.item_type)
      console.log("L'inv est", connected_players[data.player].inventory)
      let item_id = -1;
      Object.keys(connected_players[data.player].inventory).forEach(i => {
        if(connected_players[data.player].inventory[i] == data.item_type) {
          //On peut jeter
          item_id = i;
        }
      })
      console.log("On a trouvé du wood à l'indice", item_id)
      if(item_id == -1) return;
      //On regarde si on complète une task avec
      if(players[data.player].tasks != null)
        Object.values(players[data.player].tasks).forEach(val => {
          console.log("La task actuelle est", val.name)
          if((val.name == T_THROW_RES || val.name == T_SET_ONFIRE) && !val.completed){
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
      connected_players[data.player].inventory.splice(item_id, 1);

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
      if(players[data.player].tasks != null)
      Object.values(players[data.player].tasks).forEach(val => {
        console.log(val.item_type, data.item_type, val.completed)
        if(val.item_type == data.item_type && !val.completed){
          if(data.item_type == "wood")
            val.qte-=4;
          else val.qte -= 5;
          if(val.qte <= 0){
            console.log("Le joueur " + data.player + " a fait la tâche " + val.name);
            socket.emit('game',{
              type : "completed_task",
              name : val.name
            })
            val.completed = true;
          }
        }
        })

      //On l'ajoute à l'inventaire
      if(!connected_players[data.player].inventory) connected_players[data.player].inventory = []
      let nb_add = 5;
      if(data.item_type == "wood")
        nb_add = 4;
      for(let i = 0; i < nb_add; i++)
        connected_players[data.player].inventory.push(data.item_type)
      console.log(connected_players[data.player].inventory)
      if(data.item_type == "wood")
        map[data.item_id].capacity-=4;
      else 
        map[data.item_id].capacity-=5;
      io.to(connected_players[socket.id].room_id).emit('action', data)
      if(map[data.item_id].capacity == 0){
        io.to(connected_players[socket.id].room_id + "/game").emit('remove', {
          item_id : data.item_id
        })
      }
    }
  })
  //Gestion de chat 
  socket.on("chat-message", (data) => {
    console.log(`Message reçu de ${data.player}: ${data.message}`);
  
    if (!connected_players[socket.id] || !connected_players[socket.id].room_id) {
        console.error("Erreur : le joueur n'est pas dans une room.");
        return;
    }
    const room_id = connected_players[socket.id].room_id;
    const room = connected_players[socket.id].room_id + "/game";
    if(data.message == "/pause"){
      rooms[room_id].pause = true
      console.log("ouais puauuause")
      g_broadcast("Le jeu a été mis en pause", room_id)
      return;
    }
    if(data.message == "/unpause"){
      rooms[room_id].pause = false
      console.log("ouais unpuauuause")
      g_broadcast("Fin de la pause", room_id)
      return;
    }
    if(data.message == "/complete"){
      Object.values(players[socket.id].tasks).forEach(val => {
        if(!val.completed){
          console.log("Le joueur " + socket.id + " a fait la tâche " + val.name);
          socket.emit('game',{
            type : "completed_task",
            name : val.name
          })
          val.completed = true;
        }
      })
    }
    if(data.message == "/skip"){
      rooms[room_id].want_skip = true;
    }
    //console.log(`Message transmis à la room : ${room}`);
  
    io.to(room).emit("chat-message", {
        player: data.player, // On utilise bien le pseudo reçu
        message: data.message
    });
  });
  socket.on('disconnect', () => {
      console.log(`Joueur déconnecté : ${socket.id}`);
      //Le joueur est parti, on va le garder dans old_players si jamais il se reco
      //Mais on le dégage
      old_players[socket.id] = structuredClone(players[socket.id])
      delete players[socket.id];
      delete socketId_socket[socket.id];

      let rooms_to_del = [];

      //Accessoirement on l'enlève des rooms QUE si la partie n'a pas commencée
      Object.keys(rooms).forEach(room_id => {
        let room = rooms[room_id]
        if(room.launched == true) return;
        let id = -1;
        Object.keys(room.players).forEach(c_id => {
          if(room.players[c_id].socketId == socket.id)
            id = c_id;
        })
        if(id != -1){
          rooms[room_id].players.splice(id,1);
        }
        let room_players = [];
        Object.values(rooms[room_id].players).forEach(val => {
          room_players.push(val.player);
        })
        io.to(room_id+"/lobby").emit("players", room_players)
        if(rooms[room_id].players.length == 0) rooms_to_del.push(room_id);
      })

      rooms_to_del.forEach((val, id) => {
        delete rooms[val]
      })


        //delete connected_players[socket.id];
        //io.emit('positions', players); // Mettre à jour la liste pour tous
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
