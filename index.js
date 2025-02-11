const express = require('express');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 8080;

// Stocker les positions des joueurs
let players = {};


app.use('/static', express.static(__dirname + '/static'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log(`Joueur connecté : ${socket.id}`);

    // Initialisation de la position du joueur
    players[socket.id] = {
        x: Math.floor(Math.random() * 800), // Position aléatoire au départ
        y: Math.floor(Math.random() * 600),
        direction: 'down'
    };

    // Envoyer la liste initiale des joueurs au nouvel utilisateur
    socket.emit('positions', players);

    // Diffuser les mises à jour de la position du joueur
    socket.on('mouvement', (data) => {
        players[socket.id] = { ...data };
        //console.log(data);
        io.emit('positions', players); // Mettre à jour les positions pour tous les joueurs
    });
//**Gestion des messages de chat**

    socket.on('chat-message', (data) => {   // si on veut enlever le chat on supprime ces deux ligne 
        io.emit('chat-message', data); // Diffuser à tous les joueurs
    });
    // Gérer la déconnexion
    socket.on('disconnect', () => {
        console.log(`Joueur déconnecté : ${socket.id}`);
        delete players[socket.id]; // Retirer le joueur de la liste
        io.emit('positions', players); // Mettre à jour la liste pour tous
    });
});

server.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
