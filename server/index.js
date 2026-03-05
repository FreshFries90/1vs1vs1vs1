const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// ✅ Render setzt PORT als ENV
const PORT = process.env.PORT || 3001;

// ✅ Client-Origin per ENV (Render Static Site URL), plus localhost für dev
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// optional: Healthcheck
app.get("/", (_, res) => res.send("OK"));

let latestPlayers = [];
let latestWheelEntries = [];
let wheelVisible = false;

io.on("connection", (socket) => {
  console.log("Client verbunden:", socket.id);

  socket.emit("updatePlayers", latestPlayers);
  socket.emit("updateWheelEntries", latestWheelEntries);
  socket.emit("toggleWheel", { visible: wheelVisible });

  socket.on("updatePlayers", (players) => {
    latestPlayers = players;
    io.emit("updatePlayers", players);
  });

  socket.on("updateWheelEntries", (entries) => {
    latestWheelEntries = entries;
    io.emit("updateWheelEntries", entries);
  });

  socket.on("toggleWheel", ({ visible }) => {
    wheelVisible = visible;
    io.emit("toggleWheel", { visible });
  });

  socket.on("startWheel", () => {
    const entries = Array.isArray(latestWheelEntries) ? latestWheelEntries : [];
    if (entries.length === 0) return io.emit("startWheel", { winnerIndex: null });

    const weights = entries.map((e) => (typeof e.weight === "number" && e.weight > 0 ? e.weight : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let winnerIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) { winnerIndex = i; break; }
      r -= weights[i];
    }
    io.emit("startWheel", { winnerIndex });
  });

  socket.on("disconnect", () => console.log("Client getrennt:", socket.id));
});

server.listen(PORT, () => console.log(`✅ Server läuft auf :${PORT}`));