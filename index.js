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



let tilemap = JSON.parse(fs.readFileSync('./static/tilemaps/map_test5.tmj', 'utf8'));
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

    map[cur_id] = {...props} //là normalement on a récup les props à vérifier
    //On y ajoute aussi son x et son y
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
  connected_players[req.cookies.token] = socketId;
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
    res.cookie('token',token , { maxAge: 900000, httpOnly: true });
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


io.on('connection', (socket) => {
    console.log(`Joueur connecté : ${socket.id}`);

    players[socket.id] = {
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600),
        direction: 'down'
    };

    socket.emit('positions', players);

    socket.on('mouvement', (data) => {
      
      if(players[socket.id]) {
        //On regarde si le temps parcouru est cohérent
        c_time = Date.now()
        player = players[socket.id]
        d_parcourue = distance(player.x,player.y, data.x,data.y)
        if(c_time - player.time_last_mvt < 10) return;
        console.log(c_time - player.time_last_mvt)
        if(d_parcourue/(c_time - player.time_last_mvt)*1000 > 1000){
          console.log(socket.id + " violation vitesse de déplacement " + d_parcourue/(c_time - player.time_last_mvt) + "px/s")
          return;
        }
      }
        players[socket.id] = { ...data, time_last_mvt : Date.now()};
        console.log(data);
        io.emit('positions', players);
    });

    //gestion des Chats 
    socket.on("chat-message", (data) => {
      io.emit("chat-message", data);
   });
   
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
        if(data.type == "pickUp") {
          console.log(data.item_id,map)
          if (!map[data.item_id]) return;
          if (!map[data.item_id].capacity) return;
          if (map[data.item_id].capacity == 0) return;
          if (!players[data.player]) return;

          let px = players[data.player].x
          let py = players[data.player].y
          let ix, iy = get_pos(map[data.item_id]) 
          if (distance(px,py,ix,iy) > 100) return; //il est trop loin pour le faire


          map[data.item_id].capacity--;
          io.emit('action', data)
          if(map[data.item_id].capacity == 0){
            io.emit('remove', {
              item_id : data.item_id
            })
          }
        }
      })

    // Gérer la déconnexion
    socket.on('disconnect', () => {
        console.log(`Joueur déconnecté : ${socket.id}`);
        delete players[socket.id]; // Retirer le joueur de la liste
        io.emit('positions', players); // Mettre à jour la liste pour tous
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
