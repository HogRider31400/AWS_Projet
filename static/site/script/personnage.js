let images = ["/static/site/images/perso1.png", "/static/site/images/perso2.jpg"];
let index = 0;

document.addEventListener("DOMContentLoaded", async function() {
    const response = await fetch("/get_rooms", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const result = await response.json();
    if(result.rooms){
        let cdiv = document.getElementById('listeLobbys')
        Object.values(result.rooms).forEach(val => {
            let cur_elem = document.createElement('li')
            
            let room_label = document.createElement('label')
            room_label.innerHTML = val.id + " : " + val.cur_players + "/" + val.nb_players
            let room_btn = document.createElement('button')
            room_btn.innerHTML = "Rejoindre"
            
            room_btn.addEventListener('click', async function(e) {
                e.preventDefault();

                const pseudo = document.getElementById('pseudo').value;
                const room = val.id;

                if(pseudo == "") return;
                
                const roomData = { pseudo, difficulty : null, players : null, room : room};
                localStorage.setItem('roomData', JSON.stringify(roomData));
                window.location.href = "/lobby"
            })

            cur_elem.appendChild(room_label)
            cur_elem.appendChild(room_btn)

            cdiv.appendChild(cur_elem)
        })
    }
});


document.querySelector('.create-room').addEventListener('click', async function(e) {
    e.preventDefault();
    
    const pseudo = document.getElementById('pseudo').value;
    const gamemode = document.getElementById('gamemode').value;
    const players = parseInt(document.getElementById('players').value, 10);
    if(pseudo == "") return;
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
    if(pseudo == "") return;
    const roomData = { pseudo, difficulty : null, players : null, room : room};
    localStorage.setItem('roomData', JSON.stringify(roomData));
    window.location.href = "/lobby"
})
  