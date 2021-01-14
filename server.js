require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server, {
  path: '/io/webrtc',
  transports: ['websocket', 'polling']
});
const cors = require('cors');

const rooms = {};
const socketToRoom = {};

app.use(cors());

io.on('connection', socket => {
  console.log('connected ', socket.id)
  var roomId = null;

  console.log(socket.id)
  socket.emit('connection-success', {
    success: socket.id,
  })

  socket.on("join room", (data) => {
    roomId = data["roomID"];
    var roomID = data["roomID"];
    if (rooms[roomID]) {
      const length = rooms[roomID].length;
      if (length === 2) {
        socket.emit("room full");
        return;
      }
      rooms[roomID].push(socket.id);
    } else {
      rooms[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    const otherUser = rooms[roomID].find(id => id !== socket.id);
    if (otherUser) {
      socket.emit("online-peer", { otherUser: otherUser });
      socket.to(otherUser).emit("joined peers", { otherUser: socket.id });
    }
  });

  socket.on('messager', (data) => {
    console.log(data["sdp"]);
  })

  socket.on('disconnect', () => {
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    if (room) {
      room = room.filter(id => id !== socket.id);
      rooms[roomID] = room;
    }
    console.log(`${socket.id} has disconnected!`);
    delete socketToRoom[socket.id];
  });

  socket.on('offer', function (data) {
    const otherUser = rooms[roomId].find(id => id !== socket.id);
    if (otherUser) {
      socket.to(otherUser).emit("offer", {
        sdp: data["sdp"],
        socketID: data["local"]
      });
    }
  })

  socket.on('answer', function (data) {
    const otherUser = rooms[roomId].find(id => id !== socket.id);
    if (otherUser) {
      socket.to(otherUser).emit("answer", {
        sdp: data["sdp"],
        socketID: data["local"]
      });
    }
  })

  socket.on('candidate', (data) => {
    const otherUser = rooms[roomId].find(id => id !== socket.id);
    if (otherUser) {
      socket.to(otherUser).emit("candidate", {
        candidate: data["candidate"],
        socketID: data["local"],
      });
    }
  });
});

if (process.env.NODE_ENV == 'production') {
  app.use(express.static(__dirname + '/build'));
  app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/build/index.html');
  });

  app.get('/:room', (req, res, next) => {
    res.sendFile(__dirname + '/build/index.html');
  });
}

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.log(`WebRTC app listening on port ${PORT}`));