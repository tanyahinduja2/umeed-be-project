const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const PORT = process.env.PORT || 5000;

let users = []; // Track connected users

app.get('/', (req, res) => {
  res.send('Running');
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  users.push(socket.id);
  console.log("Connected users:", users);

  socket.emit("me", socket.id);

  socket.on('getMe', () => {
    socket.emit('me', socket.id);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    users = users.filter(id => id !== socket.id); // ✅ REMOVE disconnected socket
    console.log("Connected users after disconnect:", users);
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("callUser", { signal: signalData, from, name });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
