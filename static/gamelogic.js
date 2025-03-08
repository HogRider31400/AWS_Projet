const { players, assignTasks } = require('../playercontroller');

/**
 * Traite les votes reçus et détermine quel joueur est éliminé.
 * @param {Object} votes - Objet contenant les votes (clé = id du votant, valeur = id voté)
 * @returns {Number|null} - L'identifiant du joueur éliminé ou null s'il n'y a pas de candidat dominant.
 */
const processVotes = (votes) => {
  const voteCounts = {};
  for (const voter in votes) {
    const votedFor = votes[voter];
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
  }
  let maxVotes = 0;
  let candidate = null;
  for (const candidateId in voteCounts) {
    if (voteCounts[candidateId] > maxVotes) {
      maxVotes = voteCounts[candidateId];
      candidate = parseInt(candidateId);
    }
  }
  return candidate;
};


const assignTasksToAllPlayers = () => {
  players.forEach(player => {
    assignTasks(player);
  });
};

module.exports = {
  processVotes,
  assignTasksToAllPlayers
};
