import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MoodPin } from "../types";

// temporary mock data – replace with backend later
const MOCK_PINS: MoodPin[] = [
  {
    id: 1,
    lat: 39.9522,
    lng: -75.1932,
    mood: "HYPED",
    message: "Sun is out, vibes are good",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    lat: 39.9505,
    lng: -75.1900,
    mood: "STRESSED",
    message: "Midterms week…",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    lat: 39.953,
    lng: -75.197,
    mood: "MID",
    message: "",
    createdAt: new Date().toISOString(),
  },
];

export default function MapPage() {
  const [pins, setPins] = useState<MoodPin[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: replace with real fetch from backend
    setPins(MOCK_PINS);
    setLoading(false);
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>Mood Map</h2>
        <button
          type="button"
          onClick={() => navigate("/submit")}
          style={{
            padding: "8px 12px",
            borderRadius: 4,
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Add another pin
        </button>
      </div>

      {/* Mapbox placeholder */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          height: 320,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "repeating-linear-gradient(45deg, #fafafa, #fafafa 10px, #f0f0f0 10px, #f0f0f0 20px)",
        }}
      >
        <span style={{ color: "#555" }}>
          Map placeholder — Mapbox will render here
        </span>
      </div>

      <h3>Current pins</h3>

      {loading && <p>Loading pins…</p>}

      {!loading && pins.length === 0 && <p>No pins yet.</p>}

      {!loading && pins.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
          {pins.map((pin) => (
            <li
              key={pin.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #eee",
                fontSize: 14,
              }}
            >
              <strong>{pin.mood}</strong>
              {pin.message && ` — ${pin.message}`}
              <div style={{ color: "#777", fontSize: 12, marginTop: 2 }}>
                {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
