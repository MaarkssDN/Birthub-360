import { motion, useReducedMotion } from 'framer-motion';
import type React from 'react';
import { useRef, useState } from 'react';
import { SoundFX } from '../../../../lib/soundEffects.js';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  strength?: number;
  playSound?: boolean;
}

export function MagneticButton({
  children,
  onClick,
  className = '',
  type = 'button',
  strength = 0.28,
  playSound = true,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const reduceMotion = Boolean(useReducedMotion());

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduceMotion || !buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * strength, y: middleY * strength });
  };

  const handleMouseEnter = () => {
    if (playSound) {
      SoundFX.play('hover');
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const handleClick = () => {
    if (playSound) {
      SoundFX.play('click');
    }
    onClick?.();
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', damping: 15, stiffness: 220, mass: 0.1 }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      {children}
    </motion.button>
  );
}
