
const sleep = ms => new Promise(r => setTimeout(r, ms));

window.addEventListener('DOMContentLoaded', async () => {
    let socket = await io();

    socket.on('players', data => {
      console.log(data)
    })

    socket.on('go_to_game', data => {
      console.log("on lance !!")
      window.location.href = '/game'
    })

    await sleep(500)
    console.log(socket.id)
    const roomData = JSON.parse(localStorage.getItem('roomData'));
    const response = await fetch("/room", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
        room_id : roomData.room,
        socket_id : socket.id,
        player : roomData.pseudo
      })
    });

    const result = await response.json();
    
    if (roomData) {
      const modeDisplay = document.createElement('div');
      modeDisplay.style.position = 'absolute';
      modeDisplay.style.top = '10px';
      modeDisplay.style.right = '10px';
      modeDisplay.style.background = 'rgba(255, 255, 255, 0.8)';
      modeDisplay.style.padding = '5px 10px';
      modeDisplay.style.borderRadius = '8px';
      modeDisplay.innerHTML = `Mode: ${roomData.difficulty} | Joueurs: ${roomData.players}`;
      document.body.appendChild(modeDisplay);
      
      const playersGrid = document.querySelector('.players-grid');
      playersGrid.innerHTML = ''; 
      for(let i = 0; i < roomData.players; i++){
        const cell = document.createElement('div');
        cell.classList.add('player');
        cell.dataset.empty = "true";
        playersGrid.appendChild(cell);
      }
    }


     
    document.querySelector('.lobby-btn').addEventListener('click', () => {
      console.log("ptnnn")
        const roomData = JSON.parse(localStorage.getItem('roomData'));
        if (roomData) {
            const playersGrid = document.querySelector('.players-grid');
            const alreadyJoined = Array.from(playersGrid.children).some(cell => cell.textContent.includes(roomData.pseudo));
            if (alreadyJoined) {
                alert("Vous avez déjà rejoint le lobby !");
                return;
            }
            
            const emptyCell = Array.from(playersGrid.children).find(cell => cell.dataset.empty === "true");
            if (emptyCell) {
                emptyCell.innerHTML = `
                  <img src="${roomData.characterBg}" alt="Character" style="width:100%; height:auto;">
                  <p style="text-align: center; margin: 5px 0;">${roomData.pseudo}</p>
                `;
                emptyCell.dataset.empty = "false";
            } else {
                alert("Toutes les cases sont déjà occupées !");
            }
        }
    });
});         

document.getElementById('launch-button').addEventListener('click', async function (e) {
  e.preventDefault();
  const roomData = JSON.parse(localStorage.getItem('roomData'));
  console.log("ptnnn")
  const response = await fetch("/launch_room", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({room_id : roomData.room})
  });
  const result = await response.json();
})