import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import FloatingStars from "../components/FloatingStars";

// Helper function to validate Penn email
const isPennEmail = (email: string): boolean => {
  const pennDomains = [
    "@upenn.edu",
    "@wharton.upenn.edu",
    "@sas.upenn.edu",
    "@seas.upenn.edu",
    "@nursing.upenn.edu",
  ];
  const lowerEmail = email.toLowerCase();
  return pennDomains.some((domain) => lowerEmail.endsWith(domain));
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, loading: authLoading, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/submit");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    if (!isPennEmail(email)) {
      setError("Please use a valid Penn email address (@upenn.edu)");
      return;
    }

    // Login and navigate
    login(email);
    navigate("/submit");
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
          className="text-6xl"
        >
          ✨
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
      <FloatingStars selectedMood="VIBING" />

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-white">
          <div className="absolute -top-4 left-8 w-20 h-8 bg-amber-200/80 rotate-[-8deg] shadow-md rounded-sm" />
          <div className="absolute -top-4 right-8 w-20 h-8 bg-amber-200/80 rotate-[8deg] shadow-md rounded-sm" />

          <motion.h1
            className="text-4xl font-black mb-2 text-center bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            welcome to moodmap ✨
          </motion.h1>
          <p className="text-gray-600 text-center mb-8">
            check in with ur penn fam
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                penn email
              </label>
              <input
                className="w-full px-4 py-3 bg-white/50 border-2 border-purple-200 rounded-2xl text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
                type="email"
                value={email}
                placeholder="yourname@upenn.edu"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-100 border-2 border-red-300 rounded-2xl text-red-700 text-sm font-medium text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              let&apos;s go! 🚀
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            MoodMap @ Penn · anonymous mood pins, one campus
          </div>
        </div>
      </motion.div>

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
