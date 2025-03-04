<script setup>
import { ref } from 'vue'

const isOpen = ref(false)
const tasks = ref([
  { id: 1, title: 'Chercher du bois', completed: false },
  { id: 2, title: 'Chercher de la pierre', completed: false },
  { id: 3, title: 'Trouver de la pierre', completed: false },
  { id: 4, title: 'Trouver des coffres', completed: false },
])

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function toggleTask(task) {
  task.completed = !task.completed
}
</script>

<template>
  <div class="task-menu" :class="{ 'is-open': isOpen }">
    <button class="toggle-button" @click="toggleMenu">
      {{ isOpen ? 'Fermer' : 'Ouvrir' }} les tâches
    </button>
    <div class="task-list" v-if="isOpen">
      <div 
        v-for="task in tasks" 
        :key="task.id" 
        class="task"
        :class="{ 'completed': task.completed }"
        @click="toggleTask(task)"
      >
        <span class="checkbox">{{ task.completed ? 'x' : '' }}</span>
        {{ task.title }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-menu {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #ababab;
  border-radius: 8px;
  overflow: hidden;
}

.toggle-button {
  width: 100%;
  padding: 10px 20px;
  background: #3498db;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-button:hover {
  background: #2980b9;
}

.task-list {
  padding: 10px;
}

.task {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  color: white;
  transition: background-color 0.2s;
}

.task:hover {
  background: #34495e;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.task.completed {
  opacity: 0.7;
  text-decoration: line-through;
}
</style>