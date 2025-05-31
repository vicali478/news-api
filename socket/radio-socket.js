module.exports = (io) => {
  const onlineUsers = new Set(); // Better performance for lookups/removals
  const onlineUsersSockets = {}; // Better performance for lookups/removals
const listenersDB = require('../listeners');
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    let currentRoom = null;
    let currentUserId = null;

    // Join a room (roomId = radio channel)
    socket.on('join-room', async (roomId, userId) => {
      currentRoom = roomId;
      currentUserId = userId;
      socket.userId = userId;

      socket.join(roomId);
      console.log(`${userId} joined room ${roomId}`);

    // Check if this user is already counted
    const existing = await listenersDB.findOne({ roomId, userId });

    if (!existing) {
      await listenersDB.insert({ roomId, userId, joinedAt: new Date() });
    }

    // Optionally: broadcast number of current listeners
    const count = await listenersDB.count({ roomId });
      // Inform the joining user about other online users
      for (const user of onlineUsers) {
        if (user !== userId) {
          io.to(socket.id).emit('user-connected', user);
        }
      }

      onlineUsersSockets[userId] = socket.id;
      // Add to online users
      onlineUsers.add(userId);

      // Notify others in the room
      socket.to(roomId).emit('user-connected', userId);

      // Relay WebRTC signaling data
      socket.on('signal', ({ userId: targetId, data }) => {
        io.to(onlineUsersSockets[targetId]).emit('signal', { userId: socket.userId, data });
      });

      // Handle client message to admin
      socket.on('client-message', ({ fromId, message }) => {
        const adminSocket = [...io.sockets.adapter.rooms.get(roomId) || []]
          .map(id => io.sockets.sockets.get(id))
          .find(s => s && s.userId === 'admin');

        if (adminSocket) {
          adminSocket.emit('client-message', { fromId, message });
        } else {
          io.to(roomId).emit('client-message', { fromId, message });
        }
      });
    });

    // Handle disconnect globally
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      if (currentUserId) {
        onlineUsers.delete(currentUserId);
      }

      if (currentRoom && currentUserId) {
        socket.to(currentRoom).emit('user-disconnected', currentUserId);
        console.log(`${currentUserId} disconnected from room ${currentRoom}`);
      }
    });
  });
};
