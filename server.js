const connectDB = require('./config/db');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = require('./app');
// Start server after DB connect so background jobs (dispatcher)
// can safely access DB and socket.io without circular requires.
(async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    // Setup socket.io
    const { Server } = require('socket.io');
    const io = new Server(server, {
      cors: {
        origin: ["https://digital-menu-tau-five.vercel.app", "http://localhost:5173","http://localhost:5174", "https://your-backend-name.onrender.com", "https://digital-menu-backend-73fs.onrender.com/api/v1"],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingInterval: 25000,
      pingTimeout: 6000,
      allowEIO3: true,
    });

    // Attach io to express so controllers can use it
    app.set('io', io);

    // Export io and server for other modules that `require` this file
    module.exports = { io, server };

    // Load dispatcher AFTER io is available and DB is connected
    try {
      require('./utils/dispatcher')(io);
    } catch (err) {
      console.error('Failed to load dispatcher:', err);
    }

    // Handle socket connections
    io.on('connection', (socket) => {
      console.log('🟢 New client connected:', socket.id);

      socket.on('joinRestaurant', (restaurantId) => {
        try {
          if (!restaurantId) return;
          const room = `restaurant_${String(restaurantId)}`;
          socket.join(room);
          console.log(`🔔 Socket ${socket.id} joined room: ${room}`);
        } catch (err) {
          console.error('[server] Error joining restaurant room:', err);
        }
      });

      socket.on('leaveRestaurant', (restaurantId) => {
        try {
          if (!restaurantId) return;
          const room = `restaurant_${String(restaurantId)}`;
          socket.leave(room);
          console.log(`🔕 Socket ${socket.id} left room: ${room}`);
        } catch (err) {
          console.error('[server] Error leaving restaurant room:', err);
        }
      });

      socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`🔔 Socket ${socket.id} joined room: ${userId}`);
      });

      socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
})();
