const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Handle new socket connections
io.on("connection", (socket) => { // Add 'socket' as a parameter to the callback
    console.log(`User connected: ${socket.id}`);
    
    socket.emit("me", socket.id);

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });
});

server.listen(5000, () => console.log("server is running on port 5000"));
