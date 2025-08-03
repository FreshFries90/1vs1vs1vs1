const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite-Client
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// Zustand merken
let latestPlayers = [];
let latestWheelEntries = [];
let wheelVisible = false;

io.on("connection", (socket) => {
  console.log("Client verbunden:", socket.id);

  // 👉 Zustand direkt an neu verbundenen Client senden
  socket.emit("updatePlayers", latestPlayers);
  socket.emit("updateWheelEntries", latestWheelEntries);
  socket.emit("toggleWheel", { visible: wheelVisible });

  // 🔄 Spieler aktualisieren
  socket.on("updatePlayers", (players) => {
    latestPlayers = players;
    io.emit("updatePlayers", players);
  });

  // 🔄 Glücksrad-Einträge aktualisieren
  socket.on("updateWheelEntries", (entries) => {
    latestWheelEntries = entries;
    io.emit("updateWheelEntries", entries);
  });

  // 🎯 Glücksrad anzeigen/verstecken
  socket.on("toggleWheel", ({ visible }) => {
    wheelVisible = visible;
    io.emit("toggleWheel", { visible });
  });

  // 🌀 Glücksrad ausführen
  socket.on("startWheel", () => {
    io.emit("startWheel");
  });

  socket.on("disconnect", () => {
    console.log("Client getrennt:", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
