



  // jai supprimé le tableau qui etait dans ce  code de thushant car on en aura pas besoin  , 
  // jai rajoueté  const tasks = JSON.parse(localStorage.getItem("tasks")) || []; pour afficher les taches recu 
document.addEventListener('DOMContentLoaded', () => {
  const taskListDiv = document.getElementById('task-list');
  const toggleButton = document.getElementById('toggle-button');
  let isOpen = false;

  function renderTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    taskListDiv.innerHTML = ''; // Vider la liste actuelle

    tasks.forEach((task, index) => {
        const taskDiv = document.createElement('div');
        taskDiv.classList.add('task');

        if (task.completed) {
            taskDiv.classList.add('completed'); // Barrer si terminé ( cette ligne concerne quand la tache terminé) 
        }

        const checkboxSpan = document.createElement('span');
        checkboxSpan.classList.add('checkbox');
        checkboxSpan.textContent = task.completed ? '✔' : '';

        
        taskDiv.addEventListener('click', () => {
            tasks[index].completed = !tasks[index].completed; // Inverser l'état
            localStorage.setItem('tasks', JSON.stringify(tasks)); // Sauvegarder
            renderTasks(); // Re-render
        });

        taskDiv.appendChild(checkboxSpan);
        taskDiv.appendChild(document.createTextNode(task.name));
        taskListDiv.appendChild(taskDiv);
    });
}


renderTasks();

toggleButton.addEventListener('click', () => {
  isOpen = !isOpen;
  if (isOpen) {
    taskListDiv.style.display = 'block';
    toggleButton.textContent = 'Fermer les tâches';
  } else {
    taskListDiv.style.display = 'none';
    toggleButton.textContent = 'Ouvrir les tâches';
  }
});
});


