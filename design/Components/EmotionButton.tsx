import React from 'react';
import { motion } from 'framer-motion';

export default function EmotionButton({ emoji, label, color, onClick, isSelected }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-28 h-28 rounded-3xl transition-all duration-300 ${
        isSelected ? 'ring-4 ring-white shadow-2xl' : 'shadow-lg hover:shadow-xl'
      }`}
      style={{ backgroundColor: color }}
    >
      <motion.span
        className="text-5xl mb-1"
        animate={isSelected ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        {emoji}
      </motion.span>
      <span className="text-sm font-bold text-white drop-shadow-md lowercase tracking-wide">
        {label}
      </span>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="text-xs">✨</span>
        </motion.div>
      )}
    </motion.button>
  );
}
