<script setup>
import { ref } from 'vue';


const messages = ref([]);
const newMessage = ref('');
const isOpen = ref(false);

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.value.push(newMessage.value);
    newMessage.value = '';
  }
};
</script>

<template>
  <div class="chatbox" :class="{ 'open': isOpen }">
    <button class="toggle-button" @click="isOpen = !isOpen">
      {{ isOpen ? 'X' : 'chat' }}
    </button>
    <div class="chat-content">
      <div class="messages">
        <div v-for="(message, index) in messages" :key="index" class="message">
          {{ message }}
        </div>
      </div>
      <div class="input-area">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage"
          placeholder="Écrivez votre message..."
        />
        <button @click="sendMessage">Envoyer</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chatbox {
  position: fixed;
  bottom: 80px;
  left: -300px;
  width: 300px;
  height: 200px;
  background: rgba(204, 204, 204, 0.8);
  border-radius: 0 8px 8px 0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: left 0.3s ease;
}

.chatbox.open {
  left: 0;
}

.toggle-button {
  position: absolute;
  right: -40px;
  bottom: 0;
  width: 40px;
  height: 40px;
  background: rgba(141, 137, 137, 0.8);
  border: none;
  border-radius: 0 8px 8px 0;
  color: white;
  cursor: pointer;
  font-size: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  color: white;
}

.message {
  margin: 5px 0;
  word-wrap: break-word;
  text-align: left;
}

.input-area {
  padding: 10px;
  display: flex;
  gap: 5px;
}

input {
  flex-grow: 1;
  padding: 5px;
  border-radius: 4px;
  border: none;
  background: white;
  color: black;
}

button {
  padding: 5px 10px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #2980b9;
}
</style>