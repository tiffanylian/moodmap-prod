import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const moodEmojis = {
  stressed: ['😰', '💦', '😵', '🌀', '😤'],
  tired: ['😴', '💤', '🛏️', '😪', '🌙'],
  vibes: ['😎', '✨', '🌟', '💫', '🤙'],
  hyped: ['🔥', '⚡', '💥', '🚀', '🎉'],
  mid: ['😐', '🫤', '😶', '🙄', '💭'],
  default: ['⭐', '✨', '💫', '🌟', '💖'],
};

export default function FloatingStars({ selectedMood }) {
  const emojis = moodEmojis[selectedMood] || moodEmojis.default;
  
  const particles = useMemo(() => {
    return [...Array(12)].map((_, i) => ({
      id: i,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      targetX: Math.random() * 100,
      targetY: Math.random() * 100,
      duration: 15 + Math.random() * 10,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
  }, [selectedMood]);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={`${particle.id}-${selectedMood}`}
          className="absolute text-2xl opacity-40"
          initial={{
            left: `${particle.initialX}%`,
            top: `${particle.initialY}%`,
          }}
          animate={{
            left: `${particle.targetX}%`,
            top: `${particle.targetY}%`,
            rotate: [0, 360],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}
    </div>
  );
}
