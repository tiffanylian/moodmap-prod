import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPins } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { MoodPin } from "../types";
import MapView from "../components/MapView";

export default function MapPage() {
  const [pins, setPins] = useState<MoodPin[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<{ centerOnPin: (lat: number, lng: number, zoom?: number) => void } | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Fetch pins from Supabase
    const loadPins = async () => {
      try {
        const data = await fetchPins();
        setPins(data);
      } catch (err) {
        console.error("Failed to load pins:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPins();
  }, [user, navigate]);

  return (
    <div className="page">
      <div className="page-inner">
        <h2 className="page-title" style={{ marginBottom: 20 }}>
          Mood Map
        </h2>

        {/* Legend */}
        <div
          style={{
            background: "white",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 12,
            border: "1px solid #e5e7eb",
          }}
        >
          <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 600, color: "#1f2937" }}>
            Moods
          </h4>
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {[
              { mood: "HYPED", color: "#22c55e" },
              { mood: "VIBING", color: "#0ea5e9" },
              { mood: "MID", color: "#fbbf24" },
              { mood: "STRESSED", color: "#f97316" },
              { mood: "TIRED", color: "#6366f1" },
            ].map(({ mood, color }) => (
              <div key={mood} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: "2px solid white",
                    boxShadow: "0 0 0 1px rgba(15,23,42,0.2)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "12px", color: "#374151", whiteSpace: "nowrap" }}>
                  {mood}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mapbox map - reduced height */}
        <div style={{ height: 300, marginBottom: 16, borderRadius: 8, overflow: "hidden" }}>
          <MapView pins={pins} ref={mapRef} />
        </div>

        {/* Recent pins section - scrollable white box */}
        <div
          style={{
            background: "white",
            borderRadius: 8,
            padding: 16,
            border: "1px solid #e5e7eb",
            maxHeight: 300,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              gap: 8,
            }}
          >
            <h3 style={{ fontSize: "1rem", marginBottom: 0, marginTop: 0 }}>Recent pins</h3>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/submit")}
              style={{ padding: "6px 12px", fontSize: "0.9rem" }}
            >
              Add pin
            </button>
          </div>

          {loading && <p className="page-subtitle">Loading…</p>}

          {!loading && pins.length === 0 && (
            <p className="page-subtitle">No pins yet.</p>
          )}

          {!loading && pins.length > 0 && (
            <ul
              className="pin-list"
              style={{
                overflow: "auto",
                flex: 1,
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {pins.map((pin) => (
                <li
                  key={pin.id}
                  className="pin-item"
                  style={{
                    marginBottom: 8,
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "4px",
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.centerOnPin(pin.lat, pin.lng, 16);
                    }
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  <strong>{pin.mood}</strong>
                  {pin.message && ` — ${pin.message}`}
                  <div className="pin-meta">
                    {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)} ·{" "}
                    {new Date(pin.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
