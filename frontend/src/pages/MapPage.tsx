import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchPins,
  calculateStreak,
  logout,
  reportPin,
  checkUserSuspension,
} from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import type { MoodPin } from "../types";
import MapView from "../components/MapView";
import FloatingStars from "../components/FloatingStars";
import ConfirmDialog from "../components/ConfirmDialog";
import FlagButton from "../components/FlagButton";

export default function MapPage() {
  const [pins, setPins] = useState<MoodPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [flaggedPinId, setFlaggedPinId] = useState<number | null>(null);
  const [userSuspended, setUserSuspended] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
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

        // Check if user is suspended
        const suspended = await checkUserSuspension();
        setUserSuspended(suspended);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  // Auto-dismiss error message after 5 seconds
  useEffect(() => {
    if (reportError) {
      const timer = setTimeout(() => setReportError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [reportError]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <FloatingStars selectedMood="MID" />

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative z-10 container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        {userSuspended && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-100/80 backdrop-blur-sm border-2 border-red-400 rounded-2xl"
          >
            <p className="text-red-800 font-semibold text-sm">
              ⚠️ Your account has been suspended due to multiple policy
              violations. You can no longer submit pins.
            </p>
          </motion.div>
        )}

        {showReportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-4 right-4 p-4 bg-gradient-to-r from-green-400/90 to-emerald-400/90 backdrop-blur-xl border-2 border-green-300 rounded-2xl shadow-lg z-50"
          >
            <p className="text-white font-bold text-base">
              ✅ Report sent! Thanks for helping keep MoodMap safe.
            </p>
          </motion.div>
        )}

        {reportError && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-4 right-4 p-4 bg-gradient-to-r from-red-400/90 to-pink-400/90 backdrop-blur-xl border-2 border-red-300 rounded-2xl shadow-lg z-50"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-white font-bold text-base flex-1">
                ⚠️ {reportError}
              </p>
              <button
                onClick={() => setReportError(null)}
                className="text-white hover:text-red-100 text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <motion.h1
              className="text-3xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              mood map 🗺️
            </motion.h1>
            <p className="text-gray-600 text-sm flex items-center gap-2">
              ✨ see what everyone&apos;s feeling ✨
            </p>
          </motion.div>
          <div className="flex gap-2 flex-shrink-0 self-end sm:self-start">
            <button
              type="button"
              className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full font-semibold text-sm hover:bg-white shadow-md transition-all"
              onClick={() => navigate("/submit")}
            >
              add pin
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gradient-to-r from-purple-400 to-blue-400 backdrop-blur-sm rounded-full font-semibold text-sm hover:from-purple-500 hover:to-blue-500 text-white shadow-md transition-all"
              onClick={() => setShowLogoutConfirm(true)}
            >
              logout
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          title="Sign out?"
          message="Are you sure you want to sign out? You can always sign back in."
          confirmText="Sign out"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={async () => {
            setShowLogoutConfirm(false);
            await logout();
            navigate("/");
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />

        {/* Report Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showReportConfirm}
          title="Report this post?"
          message="Are you reporting this for inappropriate language or self-harm content? Community reports help keep MoodMap safe for everyone."
          confirmText="Report"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={async () => {
            try {
              if (flaggedPinId) {
                const result = await reportPin(flaggedPinId);

                // If pin was deleted due to reaching report threshold, remove it from list
                if (result.pinDeleted) {
                  setPins((prevPins) =>
                    prevPins.filter((pin) => pin.id !== flaggedPinId)
                  );
                }

                // If user was suspended, show alert
                if (result.userSuspended) {
                  alert(
                    "This user's account has been suspended due to multiple policy violations."
                  );
                }

                // Show success message
                setShowReportSuccess(true);
                setTimeout(() => setShowReportSuccess(false), 3000);
              }

              setShowReportConfirm(false);
              setFlaggedPinId(null);
            } catch (error) {
              console.error("Error reporting pin:", error);
              let errorMessage = "Failed to report pin. Please try again.";

              if (error instanceof Error) {
                const msg = error.message.toLowerCase();
                if (
                  msg.includes("already reported") ||
                  msg.includes("have already reported")
                ) {
                  errorMessage =
                    "You've already reported this pin. You can only report each pin once.";
                } else if (
                  msg.includes("pin not found") ||
                  msg.includes("not found")
                ) {
                  errorMessage = "This pin no longer exists.";
                } else if (msg.includes("not authenticated")) {
                  errorMessage = "Please log in to report pins.";
                } else if (msg.includes("suspended")) {
                  errorMessage = "This user's account is already suspended.";
                } else {
                  errorMessage = error.message;
                }
              }

              setReportError(errorMessage);
              setShowReportConfirm(false);
              setFlaggedPinId(null);
            }
          }}
          onCancel={() => {
            setShowReportConfirm(false);
            setFlaggedPinId(null);
          }}
        />

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
            <div className="max-h-80 overflow-auto space-y-2 scrollbar-hide">
              {pins.map((pin) => {
                // Get color for mood to match the map
                const moodColors: Record<string, string> = {
                  HYPED: "#22c55e",
                  VIBING: "#0ea5e9",
                  MID: "#fbbf24",
                  STRESSED: "#f97316",
                  TIRED: "#6366f1",
                };
                const color = moodColors[pin.mood] || "#0ea5e9";

                return (
                  <motion.div
                    key={pin.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.centerOnPin(pin.lat, pin.lng, 18);
                      }
                    }}
                    className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 cursor-pointer hover:bg-white/80 transition-all group"
                    style={{
                      borderLeft: `4px solid ${color}`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: color,
                            boxShadow: `0 0 8px ${color}66`,
                          }}
                        />
                        <span className="font-bold text-gray-800 text-sm">
                          {pin.mood}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(pin.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {pin.message && (
                      <p className="text-sm text-gray-700 mb-1">
                        {pin.message}
                      </p>
                    )}
                    <div className="flex items-end justify-between">
                      <div className="text-xs text-gray-500">
                        📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <FlagButton
                          onFlag={() => {
                            setFlaggedPinId(pin.id);
                            setShowReportConfirm(true);
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
