import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import EmotionButton from './components/EmotionButton';
import FloatingStars from './components/FloatingStars';
import { Sparkles, Heart, MapPin, TrendingUp, AlertCircle, Eye, Flag, Users, MessageSquare } from 'lucide-react';
import { toast, Toaster } from 'sonner@2.0.3';

interface MoodPin {
  id: string;
  emotion: 'stressed' | 'tired' | 'vibes' | 'hyped' | 'mid';
  emoji: string;
  message?: string;
  position: { x: number; y: number };
  timestamp: number;
  hidden: boolean;
  reports: number;
}

const emotions = [
  { emoji: '😰', label: 'stressed', color: '#A7C7E7' },
  { emoji: '😴', label: 'tired', color: '#B8B8B8' },
  { emoji: '😎', label: 'vibes', color: '#FFE17B' },
  { emoji: '🔥', label: 'hyped', color: '#FF9AA2' },
  { emoji: '😐', label: 'mid', color: '#B4E7CE' },
];

const PROFANITY_LIST = ['damn', 'hell', 'crap', 'shit', 'fuck', 'ass', 'bitch'];

export default function App() {
  const [moodPins, setMoodPins] = useState<MoodPin[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dailyPinCount, setDailyPinCount] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MoodPin | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);

  useEffect(() => {
    const savedPins = localStorage.getItem('moodPins');
    if (savedPins) {
      try {
        setMoodPins(JSON.parse(savedPins));
      } catch (e) {
        console.error('Error loading pins', e);
      }
    }

    const today = new Date().toDateString();
    const lastPinDate = localStorage.getItem('lastPinDate');
    const count = parseInt(localStorage.getItem('dailyPinCount') || '0');
    
    if (lastPinDate === today) {
      setDailyPinCount(count);
    } else {
      setDailyPinCount(0);
      localStorage.setItem('dailyPinCount', '0');
      localStorage.setItem('lastPinDate', today);
    }

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filterProfanity = (text: string): string => {
    let filtered = text;
    PROFANITY_LIST.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    return filtered;
  };

  const handleSave = () => {
    if (!selectedEmotion) {
      toast.error('pick a vibe first!');
      return;
    }

    if (dailyPinCount >= 5) {
      toast.error('daily limit reached bestie 😭');
      return;
    }

    const emotionData = emotions.find(e => e.label === selectedEmotion);
    if (!emotionData) return;

    const position = {
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    };

    const newPin: MoodPin = {
      id: Date.now().toString(),
      emotion: selectedEmotion as MoodPin['emotion'],
      emoji: emotionData.emoji,
      message: notes ? filterProfanity(notes) : undefined,
      position,
      timestamp: Date.now(),
      hidden: false,
      reports: 0
    };

    const updatedPins = [...moodPins, newPin];
    setMoodPins(updatedPins);
    localStorage.setItem('moodPins', JSON.stringify(updatedPins));

    const newCount = dailyPinCount + 1;
    setDailyPinCount(newCount);
    localStorage.setItem('dailyPinCount', newCount.toString());
    
    setShowSuccess(true);
    toast.success('mood logged! ✨');
    
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedEmotion(null);
      setNotes('');
    }, 2000);
  };

  const handleReportPin = (pinId: string) => {
    const updatedPins = moodPins.map(pin => {
      if (pin.id === pinId) {
        const newReports = pin.reports + 1;
        return {
          ...pin,
          reports: newReports,
          hidden: newReports >= 3
        };
      }
      return pin;
    });
    setMoodPins(updatedPins);
    localStorage.setItem('moodPins', JSON.stringify(updatedPins));
    setSelectedPin(null);
    toast.success('reported! thanks for keeping it real 🙏');
  };

  const handleHidePin = (pinId: string) => {
    const updatedPins = moodPins.map(pin =>
      pin.id === pinId ? { ...pin, hidden: true } : pin
    );
    setMoodPins(updatedPins);
    localStorage.setItem('moodPins', JSON.stringify(updatedPins));
    setSelectedPin(null);
    toast.success('hidden from your view ✓');
  };

  const visiblePins = moodPins.filter(p => !p.hidden);
  const moodCounts = visiblePins.reduce((acc, pin) => {
    acc[pin.emotion] = (acc[pin.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const totalPins = visiblePins.length;

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <FloatingStars />
        
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-12 shadow-2xl border-2 border-white w-full max-w-md text-center"
        >
          {/* Tape decoration */}
          <div className="absolute -top-4 left-8 md:left-12 w-20 h-6 md:w-24 md:h-8 bg-amber-200/80 rotate-[-8deg] shadow-md rounded-sm" />
          
          <motion.h1
            className="mb-4 text-2xl md:text-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            MoodMap@Penn
          </motion.h1>
          <p className="text-gray-600 mb-6 md:mb-8 flex items-center justify-center gap-2 text-sm md:text-base">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
            share your real mood anonymously
            <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
          </p>
          <Button
            onClick={() => setIsAuthenticated(true)}
            className="w-full h-12 md:h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-sm md:text-base"
          >
            <span className="flex items-center gap-2">
              🔐 enter anonymously
            </span>
          </Button>
          <p className="mt-4 md:mt-6 text-gray-500 text-xs md:text-sm">
            crisis? CAPS: 215-898-7021 (24/7)
          </p>
        </motion.div>

        <style jsx>{`
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
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <Toaster position="top-center" />
      <FloatingStars />
      
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-64 h-64 md:w-96 md:h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      {/* Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm border-b-2 border-white shadow-lg">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="flex items-center gap-4">
            <div>
              <motion.h1
                className="text-xl md:text-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                MoodMap@Penn
              </motion.h1>
              <p className="text-gray-600 text-sm md:text-base flex items-center gap-1">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                {totalPins} mood{totalPins !== 1 ? 's' : ''} shared
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="text-gray-700 text-sm md:text-base">
                {dailyPinCount}/5 today
              </span>
            </div>
            <Button
              onClick={() => setIsAuthenticated(false)}
              variant="outline"
              size="sm"
              className="rounded-full text-sm md:text-base"
            >
              logout
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 md:p-6 mb-6 md:mb-8 shadow-2xl border-2 border-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 flex items-center gap-2 text-lg md:text-xl">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
              current mood overview
            </h2>
            <div className="text-gray-500 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          {totalPins === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-500 text-sm md:text-base">
                no mood pins yet. be the first to share!
              </p>
            </div>
          ) : (
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6`}>
              {emotions.map(emotion => {
                const count = moodCounts[emotion.label] || 0;
                const percentage = totalPins > 0 ? (count / totalPins) * 100 : 0;
                return (
                  <motion.div
                    key={emotion.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 md:p-6 rounded-2xl border-2 shadow-lg backdrop-blur-sm"
                    style={{
                      backgroundColor: `${emotion.color}15`,
                      borderColor: `${emotion.color}40`
                    }}
                  >
                    <div className="text-3xl md:text-5xl mb-2 md:mb-3">{emotion.emoji}</div>
                    <div className="mb-1">
                      <div className="text-2xl md:text-3xl font-semibold mb-1" style={{ color: emotion.color }}>
                        {count}
                      </div>
                      <div className="text-gray-600 text-sm md:text-base capitalize">{emotion.label}</div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: emotion.color }}
                        />
                      </div>
                      <div className="text-gray-500 text-xs md:text-sm mt-1">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Main Layout */}
        <div className={`flex flex-col ${isDesktop ? 'lg:flex-row' : 'flex-col'} gap-6 md:gap-8`}>
          {/* Left Sidebar - Mood Submission */}
          <div className={`space-y-4 md:space-y-6 ${isDesktop ? 'lg:w-[450px] xl:w-[500px]' : 'w-full'}`}>
            <AnimatePresence mode="wait">
              {!showSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-6"
                >
                  {/* Form Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-3"
                  >
                    <div className="relative">
                      <motion.h2
                        className="text-2xl md:text-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        how r u feeling today?
                      </motion.h2>
                      <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3">
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm md:text-base">
                      check in with yourself bestie 💫
                    </p>
                  </motion.div>

                  {/* Emotion Selection Card */}
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-white">
                    {/* Decorative Corner */}
                    <div className="absolute -top-2 -left-2 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-md opacity-50" />
                    
                    <div className="relative space-y-4">
                      <div className="grid grid-cols-3 gap-3 md:gap-4">
                        {emotions.slice(0, 3).map((emotion) => (
                          <EmotionButton
                            key={emotion.label}
                            {...emotion}
                            isSelected={selectedEmotion === emotion.label}
                            onClick={() => setSelectedEmotion(emotion.label)}
                            size={isMobile ? 'small' : 'medium'}
                          />
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 md:gap-4 justify-center max-w-[240px] md:max-w-[280px] mx-auto">
                        {emotions.slice(3).map((emotion) => (
                          <EmotionButton
                            key={emotion.label}
                            {...emotion}
                            isSelected={selectedEmotion === emotion.label}
                            onClick={() => setSelectedEmotion(emotion.label)}
                            size={isMobile ? 'small' : 'medium'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 md:p-6 shadow-lg border-2 border-amber-100"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                      <label className="block text-amber-800 text-sm md:text-base font-medium">
                        wanna spill? (optional)
                      </label>
                    </div>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="like, what's on your mind rn..."
                      maxLength={100}
                      className="w-full min-h-[100px] md:min-h-[120px] bg-white/70 border-2 border-amber-200/50 rounded-2xl text-gray-700 placeholder:text-amber-400/60 focus:ring-2 focus:ring-amber-400 resize-none text-sm md:text-base"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-amber-600 text-xs">
                        share what's on your heart 💭
                      </div>
                      <div className="text-gray-500 text-sm">
                        {notes.length}/100
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <Button
                      onClick={handleSave}
                      disabled={dailyPinCount >= 5}
                      className="w-full h-12 md:h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm md:text-base group"
                    >
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={selectedEmotion ? { rotate: [0, 10, -10, 0] } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          💫
                        </motion.span>
                        log this vibe
                        <Heart className="w-4 h-4 md:w-5 md:h-5 fill-current group-hover:scale-110 transition-transform" />
                      </span>
                    </Button>

                    {dailyPinCount >= 5 && (
                      <div className="text-center p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200">
                        <p className="text-amber-700 text-sm">
                          daily limit reached! come back tomorrow bestie 💖
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-emerald-100 text-center"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 0.5 }}
                    className="text-6xl md:text-8xl mb-4"
                  >
                    ✨
                  </motion.div>
                  <h2 className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2 text-xl md:text-2xl">
                    mood logged! ✓
                  </h2>
                  <p className="text-emerald-700 text-sm md:text-base">
                    your vibe is now part of the campus energy 💫
                  </p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-3 bg-white/50 rounded-2xl"
                  >
                    <p className="text-gray-600 text-sm">
                      pins today: <span className="font-semibold">{dailyPinCount}/5</span>
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* How It Works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 md:p-6 shadow-lg border-2 border-white"
              >
                <h3 className="mb-3 text-gray-800 flex items-center gap-2 text-base md:text-lg">
                  <AlertCircle className="w-5 h-5 text-purple-500" />
                  how it works
                </h3>
                <ul className="text-gray-600 space-y-2 text-sm md:text-base">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">✨</span>
                    <span>choose your mood & share</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">🎯</span>
                    <span>5 pins per day limit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">🔒</span>
                    <span>all pins are anonymous</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">🚩</span>
                    <span>report inappropriate content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">👁️</span>
                    <span>pins auto-hide after 3 reports</span>
                  </li>
                </ul>
              </motion.div>

              {/* Crisis Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-5 md:p-6 shadow-lg border-2 border-red-100"
              >
                <h3 className="mb-3 text-red-800 flex items-center gap-2 text-base md:text-lg">
                  <span className="text-2xl">💙</span>
                  need support?
                </h3>
                <div className="space-y-3">
                  <div className="bg-white/70 rounded-2xl p-4">
                    <p className="text-red-700 font-semibold mb-1">
                      CAPS Crisis Line
                    </p>
                    <p className="text-red-600 text-sm">
                      215-898-7021 (24/7)
                    </p>
                  </div>
                  <p className="text-red-600 text-xs">
                    free & confidential support for Penn students
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Main Area - Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl border-2 border-white flex-1"
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-gray-800 flex items-center gap-2 text-lg md:text-xl">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                campus mood map
              </h2>
              <div className="text-gray-500 text-sm">
                {visiblePins.length} pin{visiblePins.length !== 1 ? 's' : ''} visible
              </div>
            </div>
            
            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl overflow-hidden">
              {/* Grid Background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px),
                    linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }}
              />
              
              {/* Campus Background Elements */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="text-[200px] md:text-[300px]">🏫</div>
              </div>
              
              {/* Mood Pins */}
              {visiblePins.map(pin => (
                <motion.div
                  key={pin.id}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  whileHover={{ scale: 1.3, zIndex: 50 }}
                  onClick={() => setSelectedPin(selectedPin?.id === pin.id ? null : pin)}
                  className="absolute cursor-pointer z-10 transform -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${pin.position.x}%`,
                    top: `${pin.position.y}%`,
                    fontSize: isMobile ? '28px' : isTablet ? '32px' : '36px',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                  }}
                >
                  {pin.emoji}
                  
                  {/* Pin Tooltip */}
                  {selectedPin?.id === pin.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 -translate-y-full bg-white rounded-2xl p-4 shadow-2xl min-w-[260px] md:min-w-[300px] border-2 backdrop-blur-sm"
                      style={{ 
                        borderColor: emotions.find(e => e.label === pin.emotion)?.color,
                        backgroundColor: `${emotions.find(e => e.label === pin.emotion)?.color}05`
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Emotion Header */}
                      <div className="mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{pin.emoji}</span>
                          <div>
                            <div className="font-semibold capitalize" style={{ color: emotions.find(e => e.label === pin.emotion)?.color }}>
                              {pin.emotion}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {new Date(pin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Message */}
                      {pin.message && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-gray-700 text-sm italic">
                            "{pin.message}"
                          </p>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReportPin(pin.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-full text-xs md:text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          <Flag className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          report
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHidePin(pin.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-full text-xs md:text-sm hover:bg-gray-50"
                        >
                          <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          hide
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
              
              {/* Empty State */}
              {visiblePins.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4">
                  <div className="text-8xl mb-6 opacity-20">📍</div>
                  <p className="text-lg md:text-xl text-center text-gray-500 mb-2">
                    the map is empty...
                  </p>
                  <p className="text-sm md:text-base text-center text-gray-400">
                    be the first to share your mood! ✨
                  </p>
                </div>
              )}
            </div>
            
            {/* Map Legend */}
            <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-3 justify-center">
              {emotions.map(emotion => (
                <div key={emotion.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 rounded-full border border-gray-200">
                  <span className="text-lg">{emotion.emoji}</span>
                  <span className="text-gray-600 text-xs md:text-sm capitalize">{emotion.label}</span>
                  <span className="text-gray-400 text-xs">({moodCounts[emotion.label] || 0})</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
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
