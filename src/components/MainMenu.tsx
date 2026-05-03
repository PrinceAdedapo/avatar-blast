import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsScreen } from './SettingsScreen';
import { CreditsScreen } from './CreditsScreen';
import { HelpScreen } from './HelpScreen';
import { playButtonTap, isMuted } from '../audio/sounds';

type MenuView = 'main' | 'settings' | 'credits' | 'help';

interface MainMenuProps {
  onStartGame: () => void;
}

export function MainMenu({ onStartGame }: MainMenuProps) {
  const [view, setView] = useState<MenuView>('main');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUnmuted, setVideoUnmuted] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch(() => {});
  }, []);

  const unmuteVideo = () => {
    if (!videoUnmuted && videoRef.current && !isMuted()) {
      videoRef.current.muted = false;
      videoRef.current.volume = 0.4;
      setVideoUnmuted(true);
    }
  };

  const handleNav = (target: MenuView) => {
    unmuteVideo();
    playButtonTap();
    setView(target);
  };

  const handleStart = () => {
    playButtonTap();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onStartGame();
  };

  return (
    <div className="main-menu" onClick={unmuteVideo}>
      {/* Video Background */}
      <video
        ref={videoRef}
        className="menu-video-bg"
        src="/assets/splash/menu-bg.mp4"
        poster="/assets/splash/menu-bg-poster.webp"
        preload="auto"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="menu-overlay" />
      <div className="menu-particles" />

      <AnimatePresence mode="popLayout">
        {view === 'main' && (
          <motion.div
            key="main"
            className="menu-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Top HUD bar */}
            <motion.div
              className="menu-hud-top"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="menu-hud-brand">
                <span className="menu-hud-title">Avatar</span>
                <span className="menu-hud-title-bold">BLAST</span>
              </div>
              <div className="menu-hud-badge">
                <span className="menu-hud-badge-label">SEASON</span>
                <span className="menu-hud-badge-value">1</span>
              </div>
            </motion.div>

            {/* Center decorative line */}
            <div className="menu-center-spacer" />

            {/* Right-side navigation panel (CODM style) */}
            <motion.div
              className="menu-nav-panel"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavButton
                label="START GAME"
                subtitle="Match & Blast"
                icon="/assets/characters/aang-power-sm.webp"
                variant="primary"
                delay={0.15}
                onClick={handleStart}
              />
              <NavButton
                label="SETTINGS"
                subtitle="Audio & Display"
                icon="/assets/characters/toph-sm.webp"
                variant="secondary"
                delay={0.22}
                onClick={() => handleNav('settings')}
              />
              <NavButton
                label="HOW TO PLAY"
                subtitle="Tutorial"
                icon="/assets/characters/katara-sm.webp"
                variant="secondary"
                delay={0.29}
                onClick={() => handleNav('help')}
              />
              <NavButton
                label="CREDITS"
                subtitle="The Team"
                icon="/assets/characters/zuko-sm.webp"
                variant="secondary"
                delay={0.36}
                onClick={() => handleNav('credits')}
              />
            </motion.div>

            {/* Bottom bar */}
            <motion.div
              className="menu-bottom-bar"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.35 }}
            >
              <div className="menu-bottom-left">
                <div className="menu-bottom-dot" />
                <span className="menu-bottom-version">v1.0</span>
              </div>
              <span className="menu-bottom-studio">3X GAME STUDIO</span>
              <div className="menu-bottom-right">
                <span className="menu-bottom-tag">MATCH • BLAST • CONQUER</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {view === 'settings' && (
          <SettingsScreen key="settings" onBack={() => handleNav('main')} onCredits={() => handleNav('credits')} />
        )}

        {view === 'credits' && (
          <CreditsScreen key="credits" onBack={() => handleNav('main')} />
        )}

        {view === 'help' && (
          <HelpScreen key="help" onBack={() => handleNav('main')} />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- CODM-style Nav Button ---
interface NavButtonProps {
  label: string;
  subtitle: string;
  icon: string;
  variant: 'primary' | 'secondary';
  delay: number;
  onClick: () => void;
}

function NavButton({ label, subtitle, icon, variant, delay, onClick }: NavButtonProps) {
  return (
    <motion.button
      className={`menu-nav-btn menu-nav-btn-${variant}`}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
    >
      <div className="menu-nav-btn-edge" />
      <img className="menu-nav-btn-icon" src={icon} alt="" draggable={false} />
      <div className="menu-nav-btn-text">
        <span className="menu-nav-btn-label">{label}</span>
        <span className="menu-nav-btn-sub">{subtitle}</span>
      </div>
      <div className="menu-nav-btn-chevron">
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
          <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </motion.button>
  );
}
