import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPin, getCurrentUser, logout } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { quickValidateText, checkContentQuality } from "../utils/qcValidator";
import mapboxgl from "mapbox-gl";
import { motion, AnimatePresence } from "framer-motion";
import type { Mood } from "../types";
import EmotionButton from "../components/EmotionButton";
import FloatingStars from "../components/FloatingStars";

const MOODS: Array<{ emoji: string; label: Mood; color: string }> = [
  { emoji: "🔥", label: "HYPED", color: "#FF9AA2" },
  { emoji: "😎", label: "VIBING", color: "#FFE17B" },
  { emoji: "😐", label: "MID", color: "#B4E7CE" },
  { emoji: "😴", label: "TIRED", color: "#B8B8B8" },
  { emoji: "😰", label: "STRESSED", color: "#A7C7E7" },
];

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
  const [showSuccess, setShowSuccess] = useState(false);

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

    if (!pinPlaced) {
      setError("Please click on the map to place your pin!");
      return;
    }

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
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/map");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit pin");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <FloatingStars selectedMood={mood} />

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-start mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <motion.h1
              className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              how r u feeling today?
            </motion.h1>
            <p className="text-gray-600 text-sm flex items-center gap-2">
              ✨ check in with yourself bestie ✨
            </p>
          </motion.div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full font-semibold text-sm hover:bg-white shadow-md transition-all"
              onClick={() => navigate("/map")}
            >
              view pins
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-200/80 backdrop-blur-sm rounded-full font-semibold text-sm hover:bg-red-300 text-red-800 shadow-md transition-all"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
            >
              logout
            </button>
          </div>
        </div>

        {todayPinCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl backdrop-blur-sm font-medium text-sm ${
              todayPinCount >= 5
                ? "bg-red-100/80 border-2 border-red-300 text-red-800"
                : "bg-blue-100/80 border-2 border-blue-300 text-blue-800"
            }`}
          >
            {todayPinCount >= 5 ? (
              <>🚫 daily limit reached! come back tomorrow bestie</>
            ) : (
              <>
                ✨ you have <strong>{5 - todayPinCount}</strong> vibe check
                {5 - todayPinCount === 1 ? "" : "s"} left today!
              </>
            )}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* Map Section */}
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-2xl border-2 border-white">
                <div className="absolute -top-4 left-8 w-20 h-8 bg-amber-200/80 rotate-[-8deg] shadow-md rounded-sm" />
                <div className="absolute -top-4 right-8 w-20 h-8 bg-amber-200/80 rotate-[8deg] shadow-md rounded-sm" />

                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📍 where u at?
                </label>
                <div
                  ref={containerRef}
                  className="w-full h-80 rounded-2xl overflow-hidden border-2 border-gray-200 mb-3"
                />
                {pinPlaced ? (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      ✓ pin placed at {lat.toFixed(4)}, {lng.toFixed(4)}
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 bg-white rounded-full text-xs font-semibold border border-gray-300 hover:bg-gray-50"
                      onClick={handleResetLocation}
                    >
                      change
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    click on the map to drop ur pin
                  </div>
                )}
              </div>

              {/* Emotion Selection */}
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-2xl border-2 border-white">
                <div className="absolute -bottom-4 right-8 w-20 h-8 bg-amber-200/80 rotate-[8deg] shadow-md rounded-sm" />

                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  what&apos;s the vibe?
                </label>
                <div className="flex flex-wrap justify-center gap-3">
                  {MOODS.map((m) => (
                    <EmotionButton
                      key={m.label}
                      {...m}
                      isSelected={mood === m.label}
                      onClick={() => setMood(m.label)}
                    />
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-3xl p-6 shadow-lg mb-6"
              >
                <label className="block text-sm font-semibold text-amber-900 mb-3">
                  wanna spill? (optional)
                </label>
                <textarea
                  value={message}
                  onChange={handleMessageChange}
                  maxLength={200}
                  placeholder="like, what's on your mind rn..."
                  className="w-full min-h-[100px] bg-white/50 border-2 border-amber-300/50 rounded-2xl p-3 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
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
                <div className="text-xs text-amber-700 mt-2 text-right">
                  {message.length}/200
                </div>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-100 border-2 border-red-300 rounded-2xl text-red-700 text-sm font-medium text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || todayPinCount >= 5}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    ✨
                  </motion.span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    log this vibe
                    <span className="text-xl">💖</span>
                  </span>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 0.5 }}
                className="text-8xl mb-4"
              >
                ✨
              </motion.div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                slay! logged ✓
              </h2>
              <p className="text-gray-600">your vibe has been captured</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
