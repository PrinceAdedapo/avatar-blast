import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { preloadImages } from '../utils/preloadAssets';
import { CHARACTER_IMG, CHARACTER_POWER_IMG } from '../data/characters';
import { BLAST_EFFECT_IMG } from '../data/effects';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Preload all game images during the splash hold time (non-blocking)
    const preload = () => preloadImages([
      ...Object.values(CHARACTER_IMG),
      ...Object.values(CHARACTER_POWER_IMG),
      ...Object.values(BLAST_EFFECT_IMG),
      '/assets/effects/spirit-portal.webp',
      '/assets/backgrounds/spirit-world.webp',
    ]);

    // Use requestIdleCallback if available to avoid blocking animations
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(preload);
    } else {
      setTimeout(preload, 100);
    }

    // Enter animation plays for ~800ms, then hold for 1.8s, then exit
    const holdTimer = setTimeout(() => setPhase('hold'), 800);
    const exitTimer = setTimeout(() => setPhase('exit'), 2600);
    const doneTimer = setTimeout(() => onComplete(), 3200);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <motion.div
            className="splash-logo-container"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src="/assets/splash/studio-logo.webp"
              alt="3X Game Studio"
              className="splash-logo"
            />
            <motion.div
              className="splash-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.3] }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
