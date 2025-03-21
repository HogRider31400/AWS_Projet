document.addEventListener("DOMContentLoaded", function() {
  if (typeof socket === "undefined") {
    console.error("La variable socket n'est pas définie.");
  }
  
  const roleModal = document.getElementById('roleModal');
  const roleText = document.getElementById('roleText');
  const closeRoleModal = document.getElementById('closeRoleModal');

  socket.on('game', (data) => {
    console.log("Événement 'game' reçu :", data);
    if ((data.type === "assign_role" || data.type === "game_state") && data.role) {
      roleText.textContent = "Vous êtes " + data.role;
    }
  });

  closeRoleModal.addEventListener('click', () => {
    roleModal.style.display = "none";
  });
});
