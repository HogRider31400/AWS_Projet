<script setup>
import Inventory from './components/InventoryInterface.vue'
import TaskMenu from './components/TaskMenu.vue'
import Chatbox from './components/ChatBox.vue'
</script>

<template>
  <div class="game-interface">
    <Inventory />
    <Chatbox />
    <TaskMenu />
  </div>
</template>

<style>
.game-interface {
  width: 100vw;
  height: 100vh;
  position: relative;
}
</style>