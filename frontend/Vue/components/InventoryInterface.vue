<script setup>
import { ref } from 'vue'

const inventoryItems = ref([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
  { id: 4, name: 'Item 4' },
  { id: 5, name: 'Item 5' },
  { id: 6, name: 'Item 6' },
  { id: 7, name: 'Item 7' },
  { id: 8, name: 'Item 8' },
])
</script>

<template>
  <div class="inventory">
    <div class="inventory-slots">
      <div v-for="item in inventoryItems" :key="item.id" class="inventory-slot">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.inventory {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(210, 210, 210, 0.842);
  padding: 5px;
  border-radius: 8px;
}

.inventory-slots {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.inventory-slot {
  width: 50px;
  height: 50px;
  background: (0, 0, 0, 0.1);
  border: 2px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.inventory-slot:hover {
  border-color: #3498db;
}
</style>