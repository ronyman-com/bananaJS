// src/main.js
const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'update') {
    console.log(`Reloading ${message.file}`);
    // Implement module reloading logic here
  }
});