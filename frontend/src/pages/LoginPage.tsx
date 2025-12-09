import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signUpWithPassword,
  signInWithPassword,
  requestPasswordReset,
} from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import FloatingStars from "../components/FloatingStars";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/submit", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isForgotPassword) {
        await requestPasswordReset(email);
        setSuccess("Password reset email sent! Check your inbox.");
        setEmail("");
      } else if (isSignUp) {
        await signUpWithPassword(email, password);
      } else {
        await signInWithPassword(email, password);
      }
      // User is now signed in, will be redirected by useEffect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
        <FloatingStars selectedMood="MID" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        <div className="relative z-10 h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <FloatingStars selectedMood="MID" />

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.h1
              className="text-5xl font-black mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              mood map 🗺️
            </motion.h1>
            <p className="text-gray-600 text-lg">check in with your mood</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Penn email
                </label>
                <input
                  type="email"
                  value={email}
                  placeholder="name@upenn.edu"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-full border-2 border-transparent bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {!isForgotPassword && (
                <div>
                  <div className="flex items-end justify-between gap-2 mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError("");
                          setSuccess("");
                          setPassword("");
                        }}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline transition-all"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    placeholder={
                      isSignUp
                        ? "Create a password (6+ chars)"
                        : "Enter password"
                    }
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-full border-2 border-transparent bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-100 border-2 border-red-300 rounded-2xl text-red-700 text-sm font-medium text-center"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-100 border-2 border-green-300 rounded-2xl text-green-700 text-sm font-medium text-center"
                >
                  {success}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                ) : isForgotPassword ? (
                  "Send reset email"
                ) : isSignUp ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>

              {!isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full text-center text-sm hover:cursor-pointer transition-all font-medium"
                >
                  {isSignUp ? (
                    <>
                      Already have an account?{" "}
                      <span className="text-purple-600 hover:text-purple-700">
                        Sign in
                      </span>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <span className="text-purple-600 hover:text-purple-700">
                        Create one
                      </span>
                    </>
                  )}
                </button>
              )}

              {isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError("");
                    setSuccess("");
                    setEmail("");
                  }}
                  className="w-full text-center text-xs hover:cursor-pointer transition-all text-purple-600 hover:text-purple-700 font-medium"
                >
                  Back to sign in
                </button>
              )}
            </form>

            <p className="text-center text-xs text-gray-500 mt-6">
              MoodMap @ Penn · anonymous mood pins, one campus
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
