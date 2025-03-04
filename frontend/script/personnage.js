let images = ["/frontend/images/perso1.png", "/frontend/images/perso2.jpg"];
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

document.querySelector('.create-room').addEventListener('click', function(e) {
    e.preventDefault();
    
    const pseudo = document.getElementById('pseudo').value;
    const difficulty = document.getElementById('difficulty').value;
    const players = parseInt(document.getElementById('players').value, 10);
    
    const characterElement = document.getElementById('character-circle');
    let characterBg = window.getComputedStyle(characterElement).backgroundImage;
    
    characterBg = characterBg.replace(/url\(["']?/, '').replace(/["']?\)$/, '');
    
    const roomData = { pseudo, difficulty, players, characterBg };
    
    localStorage.setItem('roomData', JSON.stringify(roomData));
    
    window.location.href = 'lobby.html';
  });
  