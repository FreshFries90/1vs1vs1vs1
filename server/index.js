const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://1vs1vs1vs1.vercel.app", // Vite-Client
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
    const entries = Array.isArray(latestWheelEntries) ? latestWheelEntries : [];
    if (entries.length === 0) {
      io.emit("startWheel", { winnerIndex: null }); // nichts zu drehen
      return;
    }

    // Gewichtete Auswahl (weight <= 0 -> 1)
    const weights = entries.map((e) =>
      typeof e.weight === "number" && e.weight > 0 ? e.weight : 1
    );
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let winnerIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) {
        winnerIndex = i;
        break;
      }
      r -= weights[i];
    }

    io.emit("startWheel", { winnerIndex });
  });

  socket.on("disconnect", () => {
    console.log("Client getrennt:", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
