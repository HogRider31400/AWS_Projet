
const sleep = ms => new Promise(r => setTimeout(r, ms));

window.addEventListener('DOMContentLoaded', async () => {
    let socket = await io();

    socket.on('players', data => {
      console.log(data)

      let elem = document.getElementById("player-list")

      for(let selem of elem.children)
        selem.remove()

      for(let pseudo of data){
        let nelem = document.createElement('li')
        nelem.innerHTML = pseudo
        elem.appendChild(nelem)
      }
      
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
    
    if (result) {
      document.getElementById("lobby-text-main").innerHTML = "Lobby : " + roomData.room;
      let elem = document.getElementById("lobby-text-flavor")
      elem.innerHTML = result.gamemode + " | " + result.nb_players
      if(result.nb_players == 1)
        elem.innerHTML += " joueur"
      else
        elem.innerHTML += " joueurs"
    }

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