import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
  const [players, setPlayers] = useState([]);
  const [wheelEntries, setWheelEntries] = useState([]);
  const [wheelVisible, setWheelVisible] = useState(false);

  // Spielerfunktionen
  const addPlayer = () => {
    setPlayers([...players, { name: "", points: 0, color: "#ffffff" }]);
  };

  const removePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handlePlayerChange = (index, field, value) => {
    const updated = [...players];
    updated[index][field] = field === "points" ? parseInt(value) || 0 : value;
    setPlayers(updated);
  };

  // Glücksradfunktionen
  const addWheelEntry = () => {
    setWheelEntries([
      ...wheelEntries,
      { text: "", weight: 0, color: "#cccccc" },
    ]);
  };

  const removeWheelEntry = (index) => {
    setWheelEntries(wheelEntries.filter((_, i) => i !== index));
  };

  const handleWheelChange = (index, field, value) => {
    const updated = [...wheelEntries];
    updated[index][field] = field === "weight" ? parseFloat(value) || 0 : value;
    setWheelEntries(updated);
  };

  // 🚀 Bei jeder Änderung der Glücksrad-Einträge automatisch senden
  useEffect(() => {
    const validEntries = wheelEntries.filter((e) => e.text.trim() !== "");
    socket.emit("updateWheelEntries", validEntries);
  }, [wheelEntries]);

  // An Viewer senden (nur Spieler)
  const sendToViewer = () => {
    const validPlayers = players.filter((p) => p.name.trim() !== "");
    socket.emit("updatePlayers", validPlayers);
  };

  const toggleWheelVisibility = () => {
    const newState = !wheelVisible;
    setWheelVisible(newState);

    const validEntries = wheelEntries.filter((e) => e.text.trim() !== "");
    socket.emit("updateWheelEntries", validEntries); // ← immer senden

    socket.emit("toggleWheel", { visible: newState });
  };

  const startWheel = () => {
    socket.emit("startWheel");
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>Regieansicht</h1>

      {/* Spieler */}
      <h2>Spieler</h2>
      {players.map((player, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Spielername"
            value={player.name}
            onChange={(e) => handlePlayerChange(index, "name", e.target.value)}
            style={{ flex: 2, padding: "0.5rem" }}
          />
          <input
            type="number"
            min="0"
            value={player.points}
            onChange={(e) =>
              handlePlayerChange(index, "points", e.target.value)
            }
            style={{ width: "80px", padding: "0.5rem" }}
          />
          <input
            type="color"
            value={player.color}
            onChange={(e) => handlePlayerChange(index, "color", e.target.value)}
            style={{
              width: "40px",
              height: "40px",
              border: "none",
              cursor: "pointer",
            }}
          />
          <button
            onClick={() => removePlayer(index)}
            style={{
              background: "#c00",
              color: "#fff",
              border: "none",
              padding: "0.5rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <button onClick={addPlayer} style={{ marginBottom: "2rem" }}>
        + Spieler hinzufügen
      </button>

      {/* Glücksrad */}
      <h2>Glücksrad-Einträge</h2>
      {wheelEntries.map((entry, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Eintrag"
            value={entry.text}
            onChange={(e) => handleWheelChange(index, "text", e.target.value)}
            style={{ flex: 3, padding: "0.5rem" }}
          />
          <input
            type="number"
            min="0"
            value={entry.weight}
            onChange={(e) => handleWheelChange(index, "weight", e.target.value)}
            style={{ width: "80px", padding: "0.5rem" }}
          />
          <input
            type="color"
            value={entry.color}
            onChange={(e) => handleWheelChange(index, "color", e.target.value)}
            style={{
              width: "40px",
              height: "40px",
              border: "none",
              cursor: "pointer",
            }}
          />
          <button
            onClick={() => removeWheelEntry(index)}
            style={{
              background: "#c00",
              color: "#fff",
              border: "none",
              padding: "0.5rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <button onClick={addWheelEntry} style={{ marginBottom: "2rem" }}>
        + Glücksrad-Eintrag hinzufügen
      </button>

      {/* Aktionen */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button
          onClick={sendToViewer}
          style={{
            background: "#28a745",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            border: "none",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          An Zuschauer senden
        </button>

        <button
          onClick={toggleWheelVisibility}
          style={{
            background: "#ffc107",
            color: "#000",
            padding: "0.75rem 1.5rem",
            border: "none",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Glücksrad {wheelVisible ? "verstecken" : "anzeigen"}
        </button>

        <button
          onClick={startWheel}
          style={{
            background: "#007bff",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            border: "none",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Glücksrad ausführen
        </button>
      </div>
    </div>
  );
}

export default App;
