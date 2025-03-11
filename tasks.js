document.addEventListener('DOMContentLoaded', () => {
    const tasks = [
      { id: 1, title: 'Chercher du bois', completed: false },
      { id: 2, title: 'Chercher de la pierre', completed: false },
      { id: 3, title: 'Trouver un sceau', completed: false },
      { id: 4, title: 'Trouver des coffres', completed: false },
    ];
  
    const toggleButton = document.getElementById('toggle-button');
    const taskListDiv = document.getElementById('task-list');
    let isOpen = false;
  
    function renderTasks() {
      taskListDiv.innerHTML = ''; 
      tasks.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.classList.add('task');
        if (task.completed) {
          taskDiv.classList.add('completed');
        }
        taskDiv.dataset.taskId = task.id; 
        const checkboxSpan = document.createElement('span');
        checkboxSpan.classList.add('checkbox');
        checkboxSpan.textContent = task.completed ? 'x' : '';
        taskDiv.appendChild(checkboxSpan);
        taskDiv.appendChild(document.createTextNode(task.title));
        taskDiv.addEventListener('click', () => {
          task.completed = !task.completed;
          renderTasks();
        });
  
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
  