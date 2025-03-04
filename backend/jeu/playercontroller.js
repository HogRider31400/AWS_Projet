
const Player = require('../player.js');
const tasks = require('../task.js');

const players = [];

/**
 * Fonction utilitaire pour assigner des tâches à un joueur
 * @param {Player} player 
*/
const assignTasks = (player) => {
  const roleTasks = player.role === 'traitre' ? tasks.traitors : tasks.castaways;
  let availableTasks = roleTasks.filter(task => !player.taskHistory.includes(task));
  if (availableTasks.length < 2) {
    player.taskHistory = [];
    availableTasks = [...roleTasks];
  }
  const assignedTasks = [];
  for (let i = 0; i < 2 && availableTasks.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableTasks.length);
    assignedTasks.push(availableTasks[randomIndex]);
    availableTasks.splice(randomIndex, 1); 
  }
  
  player.tasks = assignedTasks;
  player.taskHistory.push(...assignedTasks);
};

/**
 * Endpoint pour qu'un joueur rejoigne la partie.
 * Il se voit attribuer un identifiant, un rôle aléatoire et une position de spawn.
*/
const joinPlayer = (req, res) => {
  const id = players.length + 1;
  const assignRole = () => (Math.random() < 0.25 ? 'traitre' : 'naufragé');
  const role = assignRole();
  const spawn = getRandomSpawn();
  
  const newPlayer = new Player(id, role, spawn);
  assignTasks(newPlayer);
  
  players.push(newPlayer);
  res.json(newPlayer);
};

/**
 * Endpoint pour récupérer les tâches assignées à un joueur.
*/
const getPlayerTasks = (req, res) => {
  const playerId = parseInt(req.params.playerId);
  const player = players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Joueur non trouvé" });
  }
  res.json({ tasks: player.tasks });
};

function getRandomSpawn() {
    return {
      x: Math.floor(Math.random() * 500),
      y: Math.floor(Math.random() * 500)
    };
  }

module.exports= {
  joinPlayer,
  getPlayerTasks,
  getRandomSpawn
};