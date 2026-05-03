import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from './stores/useGameStore';
import { HomeScreen } from './components/HomeScreen';
import { GameScreen } from './components/GameScreen';
import { LevelCompleteModal, GameOverModal } from './components/Modals';
import { GoalModal } from './components/HomeScreen';
import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { AnimatePresence, motion } from 'framer-motion';
import { playMusic, getMusicKeyForLevel } from './audio/sounds';
import { StatusBar, Style } from '@capacitor/status-bar';
import { preloadImages } from './utils/preloadAssets';
import { HOME_BACKGROUND } from './data/backgrounds';
import { CHARACTER_IMG } from './data/characters';

// Hide status bar for immersive fullscreen
StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
StatusBar.hide().catch(() => {});
StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

type AppPhase = 'splash' | 'menu' | 'loading' | 'game';

const LOADING_TIPS = [
  'Preparing the Four Nations...',
  'Channeling the Avatar State...',
  'Gathering elemental energy...',
  'Uncle Iroh is brewing tea...',
  'Summoning bending masters...',
  'Balancing the elements...',
  'Awakening ancient spirits...',
];

/* ── Loading Screen Component (CODM-style) ── */
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    const assets = [
      HOME_BACKGROUND,
      ...Object.values(CHARACTER_IMG),
    ];
    preloadImages(assets);

    const start = performance.now();
    const duration = 2500;
    let raf: number;

    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // Stepped easing - simulates real loading pauses
      let eased: number;
      if (t < 0.3) eased = (t / 0.3) * 0.4;
      else if (t < 0.5) eased = 0.4 + ((t - 0.3) / 0.2) * 0.15;
      else if (t < 0.7) eased = 0.55 + ((t - 0.5) / 0.2) * 0.2;
      else eased = 0.75 + ((t - 0.7) / 0.3) * 0.25;
      
      setProgress(eased * 100);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    };
    raf = requestAnimationFrame(tick);

    const tipTimer = setInterval(() => {
      setTipIndex(i => (i + 1) % LOADING_TIPS.length);
    }, 1400);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(tipTimer);
    };
  }, [onComplete]);

  return (
    <div className="loading-screen">
      {/* Full-screen character image background (video removed for perf) */}
      <img
        className="loading-char-bg"
        src="/assets/characters/zuko-power.avif"
        alt=""
        draggable={false}
      />
      <div className="loading-overlay" />

      {/* Top-left branding */}
      <div className="loading-brand">
        <span className="loading-brand-title">AVATAR BLAST</span>
        <span className="loading-brand-sub">SEASON 1</span>
      </div>

      {/* Decorative corner lines */}
      <div className="loading-corner loading-corner-tl" />
      <div className="loading-corner loading-corner-br" />

      {/* Bottom section */}
      <div className="loading-bottom">
        {/* Tip text */}
        <div className="loading-tip-row">
          <div className="loading-tip-icon" />
          <span className="loading-tip">{LOADING_TIPS[tipIndex]}</span>
        </div>

        {/* Progress bar */}
        <div className="loading-progress-section">
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
            <div className="loading-bar-glow" style={{ left: `${progress}%` }} />
          </div>
          <span className="loading-percent">{Math.round(progress)}%</span>
        </div>

        {/* Bottom info row */}
        <div className="loading-info-row">
          <span className="loading-info-left">MATCH • BLAST • CONQUER</span>
          <span className="loading-info-right">3X GAME STUDIO</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const screen = useGameStore(s => s.screen);
  const showGoalModal = useGameStore(s => s.showGoalModal);
  const currentLevel = useGameStore(s => s.currentLevel);
  const dismissGoalModal = useGameStore(s => s.dismissGoalModal);
  const closeGoalModal = useGameStore(s => s.closeGoalModal);
  const isGame = screen === 'game' || screen === 'levelComplete' || screen === 'gameOver';

  const handleSplashComplete = useCallback(() => setPhase('menu'), []);
  const handleStartGame = useCallback(() => setPhase('loading'), []);
  const handleLoadingComplete = useCallback(() => setPhase('game'), []);
  const handleBackToMenu = useCallback(() => setPhase('menu'), []);

  // Background music management
  useEffect(() => {
    if (screen === 'home') {
      playMusic('home');
    } else if (screen === 'game') {
      playMusic(getMusicKeyForLevel(currentLevel));
    }
    // Note: level-complete and game-over sounds are triggered by their modal components
  }, [screen, currentLevel]);

  // Reset root scroll when switching screens (home scroll can bleed into game)
  useEffect(() => {
    document.getElementById('root')!.scrollTop = 0;
  }, [isGame]);

  return (
    <AnimatePresence mode="sync">
      {phase === 'splash' && (
        <motion.div
          key="phase-splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, zIndex: 100 }}
        >
          <SplashScreen onComplete={handleSplashComplete} />
        </motion.div>
      )}

      {phase === 'menu' && (
        <motion.div
          key="phase-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, zIndex: 90 }}
        >
          <MainMenu onStartGame={handleStartGame} />
        </motion.div>
      )}

      {phase === 'loading' && (
        <motion.div
          key="phase-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, zIndex: 95 }}
        >
          <LoadingScreen onComplete={handleLoadingComplete} />
        </motion.div>
      )}

      {phase === 'game' && (
        <motion.div
          key="phase-game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, zIndex: 80 }}
        >
          <AnimatePresence mode="sync">
            {screen === 'home' && (
              <motion.div
                key="screen-home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <HomeScreen onBack={handleBackToMenu} />
              </motion.div>
            )}
            {isGame && (
              <motion.div
                key="screen-game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <GameScreen />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {screen === 'levelComplete' && <LevelCompleteModal key="victory" />}
            {screen === 'gameOver' && <GameOverModal key="gameover" />}
          </AnimatePresence>
          <AnimatePresence>
            {showGoalModal && <GoalModal key="goal" level={currentLevel} onStart={dismissGoalModal} onClose={closeGoalModal} />}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
