import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPin, getCurrentUser } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { quickValidateText, checkContentQuality } from "../utils/qcValidator";
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
  const [qcWarning, setQcWarning] = useState("");
  const [todayPinCount, setTodayPinCount] = useState(0);
  const [lat, setLat] = useState(39.9522);
  const [lng, setLng] = useState(-75.1932);
  const [pinPlaced, setPinPlaced] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const currentMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Redirect if not logged in and check daily submission
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Check if user already submitted today
    getCurrentUser().then((currentUser) => {
      if (currentUser) {
        setTodayPinCount(currentUser.todayPinCount);
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

    // Handle map clicks to place pin
    map.on("click", (e) => {
      const clickedLng = e.lngLat.lng;
      const clickedLat = e.lngLat.lat;

      // Remove previous marker if it exists
      if (currentMarkerRef.current) {
        currentMarkerRef.current.remove();
      }

      // Create new marker at clicked location
      const markerEl = document.createElement("div");
      markerEl.style.width = "24px";
      markerEl.style.height = "24px";
      markerEl.style.borderRadius = "50%";
      markerEl.style.backgroundColor = "#ef4444";
      markerEl.style.border = "3px solid white";
      markerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
      markerEl.style.cursor = "pointer";

      const newMarker = new mapboxgl.Marker(markerEl)
        .setLngLat([clickedLng, clickedLat])
        .addTo(map);

      currentMarkerRef.current = newMarker;
      setLng(clickedLng);
      setLat(clickedLat);
      setPinPlaced(true);
    });
  }, []);

  const handleResetLocation = () => {
    // Remove the current marker
    if (currentMarkerRef.current) {
      currentMarkerRef.current.remove();
      currentMarkerRef.current = null;
    }
    setPinPlaced(false);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Perform quick client-side validation
    const { hasIssues, warningMessage } = quickValidateText(newMessage);
    if (hasIssues) {
      setQcWarning(warningMessage);
    } else {
      setQcWarning("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Perform full QC check on message before submission
      if (message) {
        const qcResult = await checkContentQuality(message);
        
        // If content is blocked, don't submit
        if (qcResult.status === "blocked") {
          setError(qcResult.message);
          setLoading(false);
          return;
        }
      }

      // Proceed with submission
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 className="page-title" style={{ marginBottom: 8 }}>
              Submit mood pin
            </h2>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Click on the map to place your pin, then select how you&apos;re
              feeling.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/map")}
            style={{ flexShrink: 0, marginLeft: 16 }}
          >
            View other pins
          </button>
        </div>

        {todayPinCount > 0 && (
          <div
            style={{
              background: todayPinCount >= 5 ? "#fee2e2" : "#f0f9ff",
              border:
                todayPinCount >= 5 ? "1px solid #ef4444" : "1px solid #0ea5e9",
              padding: 6,
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {todayPinCount >= 5 ? (
              <>
                🚫 You&apos;ve reached your daily limit of 5 pins. Come back
                tomorrow!
              </>
            ) : (
              <>
                You have <strong>{5 - todayPinCount}</strong> pin
                {5 - todayPinCount === 1 ? "" : "s"} left today!
              </>
            )}
          </div>
        )}

        {/* Interactive Mapbox map */}
        <div
          ref={containerRef}
          className="mapbox-container"
          style={{ marginBottom: 16 }}
        />

        {pinPlaced ? (
          <div
            style={{
              fontSize: 14,
              color: "#16a34a",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              ✓{" "}
              <strong>
                Pin placed at {lat.toFixed(4)}, {lng.toFixed(4)}
              </strong>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleResetLocation}
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              Change
            </button>
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
              onChange={handleMessageChange}
              placeholder="Today I feel..."
              style={{ resize: "vertical" }}
            />
            {qcWarning && (
              <div
                style={{
                  color: "#f97316",
                  fontSize: 13,
                  marginTop: 8,
                  padding: "8px 12px",
                  backgroundColor: "#ffedd5",
                  borderRadius: 4,
                  border: "1px solid #fed7aa",
                }}
              >
                ⚠️ {qcWarning}
              </div>
            )}
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
