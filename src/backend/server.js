const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Store active connections and their call pairs
const activeConnections = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send the user's ID to the client
  socket.emit("me", socket.id);

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Get the peer ID if exists
    const peerId = activeConnections.get(socket.id);
    if (peerId) {
      // Remove both connections from the map
      activeConnections.delete(socket.id);
      activeConnections.delete(peerId);
    }

    socket.broadcast.emit("callEnded");
  });

  // Handle call initiation
  socket.on("callUser", (data) => {
    // Store the connection pair
    activeConnections.set(socket.id, data.userToCall);
    activeConnections.set(data.userToCall, socket.id);

    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  // Handle call acceptance
  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  // Handle transcription updates
  socket.on("sendTranscription", (data) => {
    console.log("Transcription received from client:", data);

    // Get the peer ID from our active connections
    const peerId = activeConnections.get(socket.id);

    if (peerId) {
      // Send to specific peer in the call
      io.to(peerId).emit("transcription", data);
    }
  });
});

// Start the server
server.listen(5000, () => console.log("Server is running on port 5000"));
