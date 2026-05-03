import { useGameStore } from '../stores/useGameStore';
import { getLevel } from '../data/levels';
import { CHARACTER_IMG, CHARACTER_NAME } from '../data/characters';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { playTimerTick } from '../audio/sounds';
import { MuteButton } from './MuteButton';

export function GameHeader() {
  const score = useGameStore(s => s.score);
  const movesLeft = useGameStore(s => s.movesLeft);
  const timeLeft = useGameStore(s => s.timeLeft);
  const totalTime = useGameStore(s => s.totalTime);
  const currentLevel = useGameStore(s => s.currentLevel);
  const collected = useGameStore(s => s.collected);
  const combo = useGameStore(s => s.combo);
  const setScreen = useGameStore(s => s.setScreen);
  const showHint = useGameStore(s => s.showHint);

  const config = getLevel(currentLevel);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const timeLow = timeLeft <= 10;

  // Play tick sound in last 10 seconds
  const prevTimeRef = useRef(timeLeft);
  useEffect(() => {
    if (timeLeft < prevTimeRef.current && timeLeft <= 10 && timeLeft > 0) {
      playTimerTick();
    }
    prevTimeRef.current = timeLeft;
  }, [timeLeft]);

  const movesPercent = config.moves > 0 ? (movesLeft / config.moves) * 100 : 0;
  const timePercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  // Calculate next star target
  const nextStarIdx = config.targetScore.findIndex(t => score < t);
  const nextStarTarget = nextStarIdx >= 0 ? config.targetScore[nextStarIdx] : null;
  const currentStars = nextStarIdx < 0 ? 3 : nextStarIdx;

  return (
    <div className="game-top">
      {/* Time bar at the very top */}
      <motion.div
        className="gh-time-top"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <img className={`gh-time-top-avatar ${timeLow ? 'gh-avatar-danger' : ''}`} src="/assets/characters/katara.webp" alt="Time" />
        <div className="gh-time-top-body">
          <div className="gh-time-top-row">
            <span className="gh-time-top-label">TIME</span>
            <span className={`gh-time-top-value ${timeLow ? 'text-danger timer-pulse' : ''}`}>{timeStr}</span>
          </div>
          <div className="gh-time-top-bar">
            <motion.div
              className={`gh-time-top-bar-fill ${timeLow ? 'gh-bar-danger' : 'gh-bar-time'}`}
              animate={{ width: `${timePercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        <MuteButton />
      </motion.div>

      <motion.div
        className="gh-row"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      >
        {/* Close button */}
        <button className="gh-btn gh-btn-close" onClick={() => setScreen('home')}>
          <img className="gh-btn-avatar" src="/assets/characters/zuko.webp" alt="Close" />
        </button>

        {/* Score */}
        <div className="gh-card">
          <img className="gh-card-avatar" src="/assets/characters/aang.webp" alt="Score" />
          <div className="gh-card-body">
            <span className="gh-card-label">Score</span>
            <motion.span
              className="gh-card-value"
              key={score}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {score.toLocaleString()}
            </motion.span>
          </div>
        </div>

        {/* Moves */}
        <div className="gh-card">
          <img className={`gh-card-avatar ${movesLeft <= 5 ? 'gh-avatar-danger' : ''}`} src="/assets/characters/sokka.webp" alt="Moves" />
          <div className="gh-card-body">
            <span className="gh-card-label">Moves</span>
            <motion.span
              className={`gh-card-value ${movesLeft <= 5 ? 'text-danger' : ''}`}
              key={movesLeft}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              {movesLeft}
            </motion.span>
            <div className="gh-bar">
              <motion.div
                className={`gh-bar-fill ${movesLeft <= 5 ? 'gh-bar-danger' : 'gh-bar-moves'}`}
                animate={{ width: `${movesPercent}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Level badge */}
        <div className="gh-level-badge">
          <span className="gh-level-num">{currentLevel}</span>
          <span className="gh-level-tag">LVL</span>
        </div>

        {/* Hint button */}
        <button className="gh-btn gh-btn-hint" onClick={showHint}>
          <img className="gh-btn-avatar" src="/assets/characters/toph.webp" alt="Hint" />
        </button>
      </motion.div>

      {/* Goals */}
      <motion.div
        className="gh-goals"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {config.goals.map((goal, i) => {
          let progress = 0;
          let current = 0;
          let target = 0;

          if (goal.type === 'score') {
            current = Math.min(score, goal.target);
            target = goal.target;
            progress = Math.min(score / goal.target, 1);
          } else if (goal.type === 'collect' && goal.color) {
            const have = collected[goal.color] || 0;
            current = Math.min(have, goal.target);
            target = goal.target;
            progress = Math.min(have / goal.target, 1);
          }

          return (
            <div key={i} className={`gh-goal ${progress >= 1 ? 'gh-goal-done' : ''}`}>
              <div className="gh-goal-left">
                {goal.type === 'score' ? (
                  <img className="gh-goal-avatar" src="/assets/characters/aang.webp" alt="Score" />
                ) : goal.color ? (
                  <img className="gh-goal-avatar" src={CHARACTER_IMG[goal.color]} alt={CHARACTER_NAME[goal.color]} />
                ) : null}
              </div>
              <div className="gh-goal-mid">
                <div className="gh-goal-info">
                  <span className="gh-goal-name">
                    {goal.type === 'score' ? 'Score' : goal.color ? CHARACTER_NAME[goal.color] : ''}
                  </span>
                  <span className="gh-goal-count">{current}/{target}</span>
                </div>
                <div className="gh-goal-bar">
                  <motion.div
                    className={`gh-goal-bar-fill ${progress >= 1 ? 'gh-goal-bar-done' : ''}`}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
              {progress >= 1 && <div className="gh-goal-check">✓</div>}
            </div>
          );
        })}

        <AnimatePresence>
          {combo > 1 && (
            <motion.div
              className="combo-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              🔥 x{combo}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next star progress */}
        <div className="gh-star-progress">
          <div className="gh-star-icons">
            {[0, 1, 2].map(i => (
              <span key={i} className={`gh-star-pip ${i < currentStars ? 'gh-star-earned' : ''}`}>★</span>
            ))}
          </div>
          {nextStarTarget ? (
            <>
              <div className="gh-star-bar">
                <motion.div
                  className="gh-star-bar-fill"
                  animate={{ width: `${Math.min((score / nextStarTarget) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="gh-star-target">{nextStarTarget.toLocaleString()}</span>
            </>
          ) : (
            <span className="gh-star-max">MAX ★</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
