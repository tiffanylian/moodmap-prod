import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPin, getCurrentUser } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import mapboxgl from "mapbox-gl";
import type { Mood } from "../types";

const MOODS: Mood[] = ["HYPED", "VIBING", "MID", "STRESSED", "TIRED"];

// Set Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export default function SubmitPinPage() {
  const [mood, setMood] = useState<Mood>("MID");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [lat, setLat] = useState(39.9522);
  const [lng, setLng] = useState(-75.1932);
  const [pinPlaced, setPinPlaced] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Redirect if not logged in and check daily submission
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Check if user already submitted today
    getCurrentUser().then((currentUser) => {
      if (currentUser?.hasSubmittedPin) {
        setHasSubmittedToday(true);
      }
    });
  }, [user, navigate]);

  // Initialize interactive map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 14,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    const map = mapRef.current;

    // Handle map clicks to place pin (only one pin allowed)
    map.on("click", (e) => {
      // Don't place another pin if one already exists
      if (pinPlaced) {
        return;
      }

      const clickedLng = e.lngLat.lng;
      const clickedLat = e.lngLat.lat;

      // Create new marker at clicked location
      const markerEl = document.createElement("div");
      markerEl.style.width = "24px";
      markerEl.style.height = "24px";
      markerEl.style.borderRadius = "50%";
      markerEl.style.backgroundColor = "#ef4444";
      markerEl.style.border = "3px solid white";
      markerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
      markerEl.style.cursor = "pointer";

      const _newMarker = new mapboxgl.Marker(markerEl)
        .setLngLat([clickedLng, clickedLat])
        .addTo(map);
      void _newMarker; // Marker is added to map via side effect

      setLng(clickedLng);
      setLat(clickedLat);
      setPinPlaced(true);
    });
  }, [pinPlaced]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createPin({ lat, lng, mood, message: message || undefined });
      navigate("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit pin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-inner">
        <h2 className="page-title">Submit mood pin</h2>
        <p className="page-subtitle">
          Click on the map to place your pin, then select how you&apos;re feeling.
        </p>

        {hasSubmittedToday && (
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fbbf24",
              padding: 12,
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            You&apos;ve already submitted a pin today. You can submit up to 5
            pins per day.
          </div>
        )}

        {/* Interactive Mapbox map */}
        <div ref={containerRef} className="mapbox-container" style={{ marginBottom: 16 }} />

        {pinPlaced ? (
          <div style={{ fontSize: 14, color: "#16a34a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            ✓ <strong>Pin placed at {lat.toFixed(4)}, {lng.toFixed(4)}</strong>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
            📍 Click on the map to place your pin
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label className="auth-label">How are you feeling?</label>
            <div className="mood-row">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={
                    "mood-pill" + (m === mood ? " mood-pill--selected" : "")
                  }
                  onClick={() => setMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="auth-label">
              Add a short note{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (optional, up to 200 characters)
              </span>
            </label>
            <textarea
              className="auth-input"
              maxLength={200}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Today I feel..."
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 4 }}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit mood"}
          </button>
        </form>
      </div>
    </div>
  );
}
