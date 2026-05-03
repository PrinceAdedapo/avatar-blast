import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { isMuted, setMuted, getMasterVolume, setMasterVolume, playButtonTap } from '../audio/sounds';

interface SettingsScreenProps {
  onBack: () => void;
  onCredits: () => void;
}

export function SettingsScreen({ onBack, onCredits }: SettingsScreenProps) {
  const [muted, setMutedState] = useState(isMuted());
  const [volume, setVolume] = useState(getMasterVolume());

  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  const handleToggleMute = () => {
    playButtonTap();
    const newVal = !muted;
    setMutedState(newVal);
    setMuted(newVal);
  };

  return (
    <motion.div
      className="menu-screen"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>
          <span className="back-arrow">‹</span>
          <span>Back</span>
        </button>
        <h2 className="screen-title">Settings</h2>
      </div>

      <div className="settings-list">
        {/* Music Toggle */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="settings-icon">🎵</span>
            <span className="settings-label">Music & Sound</span>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <span className="setting-name">Sound Effects</span>
              <button
                className={`toggle-btn ${!muted ? 'toggle-on' : 'toggle-off'}`}
                onClick={handleToggleMute}
              >
                <span className="toggle-knob" />
              </button>
            </div>
            <div className="setting-row">
              <span className="setting-name">Volume</span>
              <div className="volume-control">
                <span className="vol-icon">🔈</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))}
                  className="volume-slider"
                />
                <span className="vol-icon">🔊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Credits */}
        <motion.button
          className="settings-nav-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { playButtonTap(); onCredits(); }}
        >
          <span className="settings-icon">🏆</span>
          <span className="settings-label">Game Credits</span>
          <span className="settings-arrow">›</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
