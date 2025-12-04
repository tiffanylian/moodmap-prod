import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPins, calculateStreak } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import type { MoodPin } from "../types";
import MapView from "../components/MapView";
import FloatingStars from "../components/FloatingStars";

export default function MapPage() {
  const [pins, setPins] = useState<MoodPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<{
    centerOnPin: (lat: number, lng: number, zoom?: number) => void;
  } | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Fetch pins and streak from Supabase
    const loadData = async () => {
      try {
        const data = await fetchPins();
        setPins(data);
        
        const userStreak = await calculateStreak();
        setStreak(userStreak);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <FloatingStars selectedMood="MID" />

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
              vibe map 🗺️
            </motion.h1>
            <p className="text-gray-600 text-sm flex items-center gap-2">
              ✨ see what everyone&apos;s feeling ✨
            </p>
          </motion.div>
          <button
            type="button"
            className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full font-semibold text-sm hover:bg-white shadow-md transition-all"
            onClick={() => navigate("/submit")}
          >
            add pin
          </button>
        </div>

        {/* Streak Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-gradient-to-r from-amber-200 to-orange-200 rounded-3xl p-4 mb-6 shadow-lg border-2 border-amber-300"
        >
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-4xl"
            >
              🔥
            </motion.div>
            <div>
              <div className="text-2xl font-bold text-amber-900">
                {streak} day streak
              </div>
              <p className="text-sm text-amber-800">
                Keep it up! Submit a pin daily to maintain your streak.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-2xl border-2 border-white"
        >
          <div className="absolute -top-4 left-8 w-20 h-8 bg-amber-200/80 rotate-[-8deg] shadow-md rounded-sm" />

          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            mood legend
          </h4>
          <div className="flex flex-wrap gap-4">
            {[
              { mood: "HYPED", color: "#22c55e", emoji: "🔥" },
              { mood: "VIBING", color: "#0ea5e9", emoji: "😎" },
              { mood: "MID", color: "#fbbf24", emoji: "😐" },
              { mood: "STRESSED", color: "#f97316", emoji: "😰" },
              { mood: "TIRED", color: "#6366f1", emoji: "😴" },
            ].map(({ mood, color, emoji }) => (
              <div key={mood} className="flex items-center gap-2">
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: "3px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                />
                <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
                  {emoji} {mood}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-2xl border-2 border-white"
        >
          <div className="absolute -top-4 right-8 w-20 h-8 bg-amber-200/80 rotate-[8deg] shadow-md rounded-sm" />

          <div className="h-80 rounded-2xl overflow-hidden border-2 border-gray-200">
            <MapView pins={pins} ref={mapRef} />
          </div>
        </motion.div>

        {/* Recent pins section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-3xl p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-amber-900">recent vibes</h3>
            <span className="text-sm text-amber-700 font-medium">
              {pins.length} {pins.length === 1 ? "pin" : "pins"}
            </span>
          </div>

          {loading && (
            <div className="text-center py-8">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="text-4xl inline-block"
              >
                ✨
              </motion.span>
            </div>
          )}

          {!loading && pins.length === 0 && (
            <div className="text-center py-8 text-amber-700">
              <p className="text-lg mb-2">📍</p>
              <p className="text-sm">no vibes logged yet... be the first!</p>
            </div>
          )}

          {!loading && pins.length > 0 && (
            <div className="max-h-80 overflow-auto space-y-2">
              {pins.map((pin) => (
                <motion.div
                  key={pin.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.centerOnPin(pin.lat, pin.lng, 18);
                    }
                  }}
                  className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 cursor-pointer hover:bg-white/80 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-bold text-gray-800 text-sm">
                      {pin.mood}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(pin.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {pin.message && (
                    <p className="text-sm text-gray-700 mb-2">{pin.message}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
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
