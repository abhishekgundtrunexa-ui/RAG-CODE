let ioInstance;

const registerHelpers = (io) => {
  ioInstance = io;
};

// Send charger update to a specific user
const sendChargerUpdate = (userId, chargerData) => {
  if (!ioInstance) throw new Error("Socket.IO not initialized!");
  ioInstance.to(userId).emit("charger:update", chargerData);
};

// Generic event helper
const emitToUser = (userId, event, data) => {
  if (!ioInstance) throw new Error("Socket.IO not initialized!");
  ioInstance.to(userId).emit(event, data);
};

module.exports = { registerHelpers, sendChargerUpdate, emitToUser };
