let images = ["/static/site/images/perso1.png", "/static/site/images/perso2.jpg"];
let index = 0;


document.querySelector('.create-room').addEventListener('click', async function(e) {
    e.preventDefault();
    
    const pseudo = document.getElementById('pseudo').value;
    const gamemode = document.getElementById('gamemode').value;
    const players = parseInt(document.getElementById('players').value, 10);
    
    const response = await fetch("/create_room", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({gamemode, players, player : pseudo})
    });
    const result = await response.json();
    if(result.room){
        const roomData = { pseudo, gamemode, players, room : result.room};
        localStorage.setItem('roomData', JSON.stringify(roomData));
        window.location.href = "/lobby"
    }

});

document.querySelector('.join-button').addEventListener('click', async function (e) {
    e.preventDefault();

    const pseudo = document.getElementById('pseudo').value;
    const room = document.getElementById('room-code').value;
    
    const roomData = { pseudo, difficulty : null, players : null, room : room};
    localStorage.setItem('roomData', JSON.stringify(roomData));
    window.location.href = "/lobby"
})
  