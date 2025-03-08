window.addEventListener('DOMContentLoaded', () => {
    const roomData = JSON.parse(localStorage.getItem('roomData'));
    
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
  