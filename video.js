const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });
let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);
  console.log('Client connected');

  ws.on('message', (msg) => {
    // Broadcast to everyone else
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  });

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
    console.log('Client disconnected');
  });
});

console.log('🚀 Signaling server running at ws://localhost:3000');
