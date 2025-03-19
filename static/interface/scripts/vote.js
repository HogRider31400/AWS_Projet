
function showVoteModal(players) {
    const modal = document.getElementById('voteModal');
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = "";
    players.forEach(player => {
      let btn = document.createElement('button');
      btn.innerText = player.name; 
      btn.onclick = function() {
        socket.emit('action', {
          type: 'vote',
          vote: player.socketId,
          player: socket.id  
        });
        modal.style.display = 'none';
      };
      playersList.appendChild(btn);
    });
    modal.style.display = 'block';
  }
  
  document.getElementById('cancelVote').onclick = function() {
    document.getElementById('voteModal').style.display = 'none';
  };
  
  socket.on('game', (data) => {
    if (data.type === 'set_time' && data.time === 'night') {
  // Ici on doit ajouter un moyen de recupere la liste des joueurs dans la partie
      showVoteModal(playersListData);
    }
  });
  