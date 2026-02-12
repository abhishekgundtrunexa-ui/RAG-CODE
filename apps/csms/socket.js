const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { registerHelpers } = require("./socket.helper");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }, // configure origin in production
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET); // replace with env secret
      socket.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  // Connection event
  io.on("connection", (socket) => {
    console.log("User connected:", socket.userId);

    // Each user joins their personal room
    socket.join(socket.userId);

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.userId, reason);
    });
  });

  // Register helper functions
  registerHelpers(io);
};

const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized!");
  return io;
};

module.exports = { initSocket, getIO };
