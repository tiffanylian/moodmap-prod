import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Mood } from "../types";

const MOODS: Mood[] = ["HYPED", "VIBING", "MID", "STRESSED", "TIRED"];

export default function SubmitPinPage() {
  const [mood, setMood] = useState<Mood>("MID");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // placeholder coords for now
  const lat = 39.9522;
  const lng = -75.1932;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: replace with real backend call
    console.log("Submitting pin:", { lat, lng, mood, message });

    navigate("/map");
  };

  return (
    <div className="page">
      <div className="page-inner">
        <h2 className="page-title">Submit mood pin</h2>
        <p className="page-subtitle">
          Share how you&apos;re feeling somewhere on campus to unlock the map.
        </p>

        {/* Map placeholder */}
        <div className="map-shell">
          Map placeholder — pin will be dropped around{" "}
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 4 }}>
            Submit mood
          </button>
        </form>
      </div>
    </div>
  );
}
