document.addEventListener("DOMContentLoaded", function () {
  const voteModal = document.getElementById("voteModal");
  const voteOptions = document.getElementById("voteOptions");
  const submitVote = document.getElementById("submitVote");
  const closeVoteModal = document.getElementById("closeVoteModal");

  let selectedPlayerId = null;

  function showVoteModal(players) {
    voteOptions.innerHTML = ""; 
    players.forEach(player => {
      const label = document.createElement("label");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "vote";
      radio.value = player.id;
      radio.addEventListener("change", () => {
        selectedPlayerId = player.id;
      });
      label.appendChild(radio);
      label.appendChild(document.createTextNode(player.name));
      voteOptions.appendChild(label);
    });

    voteModal.style.display = "flex";
  }
  submitVote.addEventListener("click", () => {
    if (selectedPlayerId) {
      socket.emit("action", {
        type: "vote",
        vote: selectedPlayerId,
        player: socket.id
      });
      voteModal.style.display = "none";
    } else {
      alert("Veuillez sélectionner un joueur à éliminer.");
    }
  });
  closeVoteModal.addEventListener("click", () => {
    voteModal.style.display = "none";
  });
  showVoteModal([{ id: "player1", name: "Joueur 1" }, { id: "player2", name: "Joueur 2" }]);
});