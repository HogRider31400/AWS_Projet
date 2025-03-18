document.addEventListener("DOMContentLoaded", function() {
    const roleModal = document.getElementById('roleModal');
    const roleText = document.getElementById('roleText');
    const closeRoleModal = document.getElementById('closeRoleModal');
  
    socket.on('game', (data) => {
      if(data.type === "assign_role" && data.role) {
        roleText.textContent = "Vous êtes " + data.role;
        roleModal.style.display = "flex";
      }
    });
    closeRoleModal.addEventListener('click', () => {
      roleModal.style.display = "none";
    });
  });
  