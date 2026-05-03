import { motion } from 'framer-motion';
import { playButtonTap } from '../audio/sounds';

interface HelpScreenProps {
  onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  return (
    <motion.div
      className="menu-screen"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="screen-header">
        <button className="back-btn" onClick={() => { playButtonTap(); onBack(); }}>
          <span className="back-arrow">‹</span>
          <span>Back</span>
        </button>
        <h2 className="screen-title">How to Play</h2>
      </div>

      <div className="help-content">
        {/* Basic Gameplay */}
        <motion.div
          className="help-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
        >
          <div className="help-card-header">
            <img src="/assets/characters/korra-power.avif" className="help-char-icon" alt="" />
            <h3 className="help-card-title">Basic Gameplay</h3>
          </div>
          <ul className="help-list">
            <li className="help-item"><strong>Swipe</strong> or <strong>tap</strong> two adjacent gems to swap them</li>
            <li className="help-item">Match <strong>3 or more</strong> same-colored gems in a row or column</li>
            <li className="help-item">Matched gems are destroyed and new ones fall from above</li>
            <li className="help-item">Complete the <strong>level goal</strong> before moves or time runs out</li>
          </ul>
        </motion.div>

        {/* Special Gems */}
        <motion.div
          className="help-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
        >
          <div className="help-card-header">
            <img src="/assets/characters/aang-power.avif" className="help-char-icon" alt="" />
            <h3 className="help-card-title">Special Gems</h3>
          </div>
          <ul className="help-list">
            <li className="help-item">
              <span className="help-badge help-badge-row">↔️</span>
              <strong>Line Blast</strong> — Match 4 in a row → clears entire row
            </li>
            <li className="help-item">
              <span className="help-badge help-badge-col">↕️</span>
              <strong>Column Blast</strong> — Match 4 in a column → clears entire column
            </li>
            <li className="help-item">
              <span className="help-badge help-badge-bomb">💥</span>
              <strong>Bomb</strong> — Match in L or T shape → blasts a 3×3 area
            </li>
            <li className="help-item">
              <span className="help-badge help-badge-rainbow">🌈</span>
              <strong>Avatar State</strong> — Match 5+ in a line → destroys all gems of one color
            </li>
          </ul>
        </motion.div>

        {/* Scoring & Stars */}
        <motion.div
          className="help-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: 'easeOut' }}
        >
          <div className="help-card-header">
            <img src="/assets/characters/katara-power.avif" className="help-char-icon" alt="" />
            <h3 className="help-card-title">Scoring & Stars</h3>
          </div>
          <ul className="help-list">
            <li className="help-item">Each gem matched = <strong>20 points</strong></li>
            <li className="help-item">Chain combos multiply your score (×1.5, ×2, ×2.5...)</li>
            <li className="help-item">Bigger matches (4+ gems) give bonus points</li>
            <li className="help-item">⭐ 1 Star = complete the goal</li>
            <li className="help-item">⭐⭐ 2 Stars = score 1.5× the target</li>
            <li className="help-item">⭐⭐⭐ 3 Stars = score 2.2× the target (master!)</li>
          </ul>
        </motion.div>

        {/* Level Goals */}
        <motion.div
          className="help-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4, ease: 'easeOut' }}
        >
          <div className="help-card-header">
            <img src="/assets/characters/zuko-power.avif" className="help-char-icon" alt="" />
            <h3 className="help-card-title">Level Goals</h3>
          </div>
          <ul className="help-list">
            <li className="help-item"><strong>Score Goal</strong> — Reach the target score before running out of moves</li>
            <li className="help-item"><strong>Collect Goal</strong> — Match a specific number of one gem color</li>
            <li className="help-item"><strong>Dual Goal</strong> — Complete both a score AND collection target</li>
            <li className="help-item">Watch the timer ⏱️ and moves counter — plan wisely!</li>
          </ul>
        </motion.div>

        {/* Pro Tips */}
        <motion.div
          className="help-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4, ease: 'easeOut' }}
        >
          <div className="help-card-header">
            <img src="/assets/characters/toph-power.avif" className="help-char-icon" alt="" />
            <h3 className="help-card-title">Pro Tips</h3>
          </div>
          <ul className="help-list">
            <li className="help-item">Match at the <strong>bottom</strong> of the board — causes more cascades above</li>
            <li className="help-item">Save special gems and trigger them <strong>together</strong> for massive combos</li>
            <li className="help-item">Focus on the <strong>goal first</strong>, high score comes naturally</li>
            <li className="help-item">Use the <strong>Hint button</strong> (💡) if you're stuck — no penalty!</li>
            <li className="help-item">Each world has a new theme — unlock all 5 worlds per era!</li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}
