const express = require('express');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 80;

let players = {};

//Ici on a la map, voir avec Nora pour le format et comment faire pour que le serveur l'ait
let map = {
  "1" : {
    name : "berryBush",
    capacity : 5
  },
  "2" : {
    name : "woodPile",
    capacity : 3
  }
}

function distance(ax,ay,bx,by) {
  return Math.sqrt(Math.pow(ax - bx,2) + Math.pow(ay - by,2))
}

app.use('/static', express.static(__dirname + '/static'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.get('/opti', function (req, res) {
  res.sendFile(__dirname + '/index opti.html');
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

    socket.on('action', (data) => {
        /*
        Format de data : un dico avec quelques clés dont 1 systématique "type"
        type : berryBushPickUp -> un joueur a récup un berry bush, les clés sont alors 
         - player : le joueur qui l'a fait
         (- delete : un booléen pour savoir si le bush doit être suppr ?)
        */
        if(!data.type) return;
        if(data.type == "pickUp") {
          if (!map[data.item_id]) return;
          if (!map[data.item_id].capacity) return;
          if (map[data.item_id].capacity == 0) return;

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
