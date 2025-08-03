import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./Viewer.css";

const socket = io("https://onevs1vs1vs1.onrender.com");

// 🎨 Farben für Segmente (Türkis, Gelb, Pink)
const defaultColors = ["#00C9A7", "#FFD166", "#EF476F"];

export default function Viewer() {
  const [players, setPlayers] = useState([]);
  const [wheelEntries, setWheelEntries] = useState([]);
  const [showWheel, setShowWheel] = useState(false);
  const [winnerText, setWinnerText] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    socket.on("updatePlayers", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("updateWheelEntries", (entries) => {
      setWheelEntries(entries);
    });

    socket.on("toggleWheel", ({ visible }) => {
      setShowWheel(visible);
      setWinnerText(null);

      if (visible && canvasRef.current && wheelEntries.length > 0) {
        const ctx = canvasRef.current.getContext("2d");
        const center = canvasRef.current.width / 2;
        drawWheel(ctx, center, 0);
      }
    });

    socket.on("startWheel", () => {
      console.log("StartWheel empfangen");
      spinWheel();
    });

    return () => {
      socket.off("updatePlayers");
      socket.off("updateWheelEntries");
      socket.off("toggleWheel");
      socket.off("startWheel");
    };
  }, [wheelEntries]);

  const spinWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || wheelEntries.length === 0) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const center = width / 2;

    let totalWeight = wheelEntries.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight <= 0) totalWeight = wheelEntries.length;

    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    let selectedIndex = 0;

    for (let i = 0; i < wheelEntries.length; i++) {
      cumulative += wheelEntries[i].weight || 1;
      if (rand <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    const segmentAngle = 360 / wheelEntries.length;
    const stopAngle = segmentAngle * selectedIndex + segmentAngle / 2;
    const fullSpins = 5;
    const finalRotation = 360 * fullSpins + stopAngle + 90;

    const duration = 3000;
    let start = null;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);

      const currentRotation = finalRotation * eased;
      drawWheel(ctx, center, currentRotation);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        drawWheel(ctx, center, finalRotation);

        // Gewinner korrekt bestimmen
        const normalizedRotation = finalRotation % 360;
        const angleFromTop = (360 - normalizedRotation + 90) % 360;
        const winnerIndex = Math.floor(
          (angleFromTop / 360) * wheelEntries.length
        );
        const winner = wheelEntries[winnerIndex];
        setWinnerText(winner?.text || "???");
      }
    };

    requestAnimationFrame(animate);
  };

  const drawWheel = (ctx, center, rotation) => {
    ctx.clearRect(0, 0, center * 2, center * 2);

    const total = wheelEntries.length;
    const arcSize = (2 * Math.PI) / total;

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotation * Math.PI) / 180);

    wheelEntries.forEach((entry, i) => {
      const start = i * arcSize;
      const end = start + arcSize;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, center - 10, start, end);
      ctx.closePath();
      ctx.fillStyle = defaultColors[i % defaultColors.length]; // 🔥 Farben automatisch
      ctx.fill();

      ctx.save();
      ctx.rotate(start + arcSize / 2);
      ctx.fillStyle = "#000";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(entry.text, center - 20, 5);
      ctx.restore();
    });

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || wheelEntries.length === 0 || !showWheel) return;

    const ctx = canvas.getContext("2d");
    const center = canvas.width / 2;
    drawWheel(ctx, center, 0);
  }, [wheelEntries, showWheel]);

  return (
    <div
      style={{
        backgroundColor: "transparent",
        color: "#fff",
        height: "100vh",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <img
        src="/logo.png"
        alt="Challenge Logo"
        style={{ maxWidth: "250px", marginBottom: "2rem" }}
      />

      <div className="spielerliste" style={{ marginBottom: "2rem" }}>
        {players.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.5rem",
              fontSize: "1.5rem",
            }}
          >
            <span style={{ color: p.color }}>{p.name}</span>
            <span>{p.points}</span>
          </div>
        ))}
      </div>

      {showWheel && (
        <>
          {/* 🔺 Zeiger */}
          <div
            style={{
              position: "absolute",
              top: "calc(50% + 80px)",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "15px solid transparent",
              borderRight: "15px solid transparent",
              borderBottom: "30px solid red",
              zIndex: 10,
            }}
          />
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            style={{ borderRadius: "50%" }}
          />
          {winnerText && (
            <div
              style={{
                marginTop: "2rem",
                fontSize: "2rem",
                fontWeight: "bold",
                backgroundColor: "#000",
                padding: "1rem 2rem",
                borderRadius: "1rem",
                border: "2px solid #fff",
              }}
            >
              Gewinner: {winnerText}
            </div>
          )}
        </>
      )}
    </div>
  );
}
