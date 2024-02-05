const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const joinedUsers = [];
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data.room);

    if (!joinedUsers.includes(socket.id)) {
      io.to(data.room).emit("user_joined", { username: data.username });
      joinedUsers.push(socket.id);
    }

    onlineUsers[socket.id] = data.username;
    io.emit("user_online", { username: data.username });
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);

    io.emit("user_online", { username: onlineUsers[socket.id] });
  });

  socket.on("message_received", (data) => {
    socket.to(data.room).emit("message_read", {
      index: data.index,
      recipient: socket.id,
    });
  });

  socket.on("rejoin_room", (data) => {
    const { room, username } = data;
    socket.join(room);

    if (!joinedUsers.includes(socket.id)) {
      io.to(room).emit("user_joined", { username });
      joinedUsers.push(socket.id);
    }

    onlineUsers[socket.id] = username;
    io.emit("user_online", { username });

    io.to(room).emit("user_online", { username });
  });

  socket.on("disconnect", () => {
    const username = onlineUsers[socket.id];
    if (username) {
      delete onlineUsers[socket.id];
      io.emit("user_offline", { username });
    }
  });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
