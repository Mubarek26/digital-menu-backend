const connectDB = require('./config/db'); 
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = require('./app'); 
const server = http.createServer(app);

connectDB();

// Setup socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "*", // for dev; later set to your frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Attach io to express so controllers can use it
app.set('io', io);

// Handle socket connections
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // Allow clients to join a restaurant-specific room so emits can be targeted.
  socket.on("joinRestaurant", (restaurantId) => {
    try {
      if (!restaurantId) return;
      const room = `restaurant_${String(restaurantId)}`;
      socket.join(room);
      console.log(`🔔 Socket ${socket.id} joined room: ${room}`);
    } catch (err) {
      console.error("[server] Error joining restaurant room:", err);
    }
  });

  socket.on("leaveRestaurant", (restaurantId) => {
    try {
      if (!restaurantId) return;
      const room = `restaurant_${String(restaurantId)}`;
      socket.leave(room);
      console.log(`🔕 Socket ${socket.id} left room: ${room}`);
    } catch (err) {
      console.error("[server] Error leaving restaurant room:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
