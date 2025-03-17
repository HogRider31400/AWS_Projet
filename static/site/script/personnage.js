let images = ["/static/site/images/perso1.png", "/static/site/images/perso2.jpg"];
let index = 0;
const characterCircle = document.getElementById("character-circle");

function updateCharacter() {
    characterCircle.style.backgroundImage = `url(${images[index]})`;
    characterCircle.classList.add("change");
    setTimeout(() => characterCircle.classList.remove("change"), 300);
}

document.getElementById("right-arrow").addEventListener("click", function() {
    index = (index + 1) % images.length;
    updateCharacter();
});

document.getElementById("left-arrow").addEventListener("click", function() {
    index = (index - 1 + images.length) % images.length;
    updateCharacter();
});

document.querySelector('.create-room').addEventListener('click', async function(e) {
    e.preventDefault();
    
    const pseudo = document.getElementById('pseudo').value;
    const difficulty = document.getElementById('difficulty').value;
    const players = parseInt(document.getElementById('players').value, 10);
    
    const characterElement = document.getElementById('character-circle');
    let characterBg = window.getComputedStyle(characterElement).backgroundImage;
    
    characterBg = characterBg.replace(/url\(["']?/, '').replace(/["']?\)$/, '');
    
    
    const response = await fetch("/create_room", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({difficulty, players, player : pseudo})
    });
    const result = await response.json();
    if(result.room){
        const roomData = { pseudo, difficulty, players, characterBg, room : result.room};
        localStorage.setItem('roomData', JSON.stringify(roomData));
        window.location.href = "/lobby"
    }

});

document.querySelector('.join-button').addEventListener('click', async function (e) {
    e.preventDefault();

    const pseudo = document.getElementById('pseudo').value;
    const room = document.getElementById('room-code').value;
    const characterElement = document.getElementById('character-circle');
    let characterBg = window.getComputedStyle(characterElement).backgroundImage;
    
    characterBg = characterBg.replace(/url\(["']?/, '').replace(/["']?\)$/, '');
    const roomData = { pseudo, difficulty : null, players : null, characterBg, room : room};
    localStorage.setItem('roomData', JSON.stringify(roomData));
    window.location.href = "/lobby"
})
  