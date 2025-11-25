import { useEffect, useState } from "react";
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <h2 className="page-title" style={{ marginBottom: 0 }}>
            Mood Map
          </h2>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/submit")}
          >
            Add pin
          </button>
        </div>

        {/* Mapbox map */}
        <MapView pins={pins} />

        <h3 style={{ fontSize: "1rem", marginBottom: 8 }}>Recent pins</h3>

        {loading && <p className="page-subtitle">Loading…</p>}

        {!loading && pins.length === 0 && (
          <p className="page-subtitle">No pins yet.</p>
        )}

        {!loading && pins.length > 0 && (
          <ul className="pin-list">
            {pins.map((pin) => (
              <li key={pin.id} className="pin-item">
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
  );
}
