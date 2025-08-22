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

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
