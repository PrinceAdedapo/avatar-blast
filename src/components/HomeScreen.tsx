import { useGameStore } from '../stores/useGameStore';
import { getLevel, getWorld, getEra, WORLDS as WORLD_DEFS } from '../data/levels';
import { CHARACTER_IMG, CHARACTER_NAME } from '../data/characters';
import { HOME_BACKGROUND, getBackgroundForLevel } from '../data/backgrounds';
import { motion } from 'framer-motion';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { preloadImages } from '../utils/preloadAssets';

import type { GemColor } from '../types/game';

const COLORS: GemColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

/* ── Elemental Particle System ── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  dx: number;
  element: 'fire' | 'water' | 'air' | 'earth';
}

function generateParticles(count: number): Particle[] {
  const elements: Particle['element'][] = ['fire', 'water', 'air', 'earth'];
  const colorMap = {
    fire: ['#ff6b6b', '#ffa502', '#ff4757', '#ffd32a'],
    water: ['#1e90ff', '#70a1ff', '#3742fa', '#74b9ff'],
    air: ['#dfe6e9', '#b2bec3', '#ffffff', '#ffeaa7'],
    earth: ['#2ed573', '#05c46b', '#7bed9f', '#a3cb38'],
  };
  return Array.from({ length: count }, (_, i) => {
    const el = elements[i % 4];
    const cols = colorMap[el];
    return {
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      color: cols[Math.floor(Math.random() * cols.length)],
      duration: 8 + Math.random() * 12,
      delay: Math.random() * -20,
      dx: (Math.random() - 0.5) * 60,
      element: el,
    };
  });
}

function ElementalParticles() {
  const particles = useMemo(() => generateParticles(12), []);
  return (
    <div className="elemental-particles" aria-hidden>
      {particles.map(p => (
        <div
          key={p.id}
          className={`ep ep-${p.element}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            '--ep-color': p.color,
            '--ep-dur': `${p.duration}s`,
            '--ep-delay': `${p.delay}s`,
            '--ep-dx': `${p.dx}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ── Energy Ring around Play Button ── */
function EnergyRing() {
  return (
    <div className="energy-ring-wrap" aria-hidden>
      <div className="energy-ring energy-ring-1" />
    </div>
  );
}

export function HomeScreen({ onBack }: { onBack?: () => void }) {
  const unlockedLevel = useGameStore(s => s.unlockedLevel);
  const levelStars = useGameStore(s => s.levelStars);
  const showLevelGoals = useGameStore(s => s.showLevelGoals);

  const totalStars = Object.values(levelStars).reduce((a, b) => a + b, 0);
  const levelsCleared = unlockedLevel - 1;
  const era = getEra(unlockedLevel);

  // Generate dynamic world sections up to one world past the current
  const worldCount = Math.ceil(unlockedLevel / 20) + 1;
  const dynamicWorlds = Array.from({ length: worldCount }, (_, i) => {
    const start = i * 20 + 1;
    const end = start + 19;
    const def = WORLD_DEFS[i % 5];
    const worldEra = getEra(start);
    return { name: def.name, icon: def.icon, accent: def.accent, start, end, era: worldEra };
  });

  return (
    <div className="home">
      <div className="game-bg" style={{ backgroundImage: `url(${HOME_BACKGROUND})` }} />
      <div className="home-bg-overlay" />

      {/* Back to Main Menu */}
      {onBack && (
        <button className="home-back-btn" onClick={onBack}>
          <span className="home-back-arrow">‹</span>
          <span>Menu</span>
        </button>
      )}

      {/* Floating elemental particles */}
      <ElementalParticles />

      <div className="home-hero">
        <motion.div
          className="home-logo-wrap"
          initial={{ y: -40, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <span className="home-logo-icon">🌊</span>
          <h1 className="home-title">
            Avatar Blast
            <span className="title-shimmer" aria-hidden />
          </h1>
        </motion.div>

        <div className="home-gem-row">
          {COLORS.map((color, i) => (
            <motion.div
              key={color}
              className="home-gem"
              style={{ background: `var(--gem-${color})`, '--gem-float-delay': `${i * -1.2}s` } as React.CSSProperties}
              initial={{ y: 30, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 + i * 0.07 }}
              whileHover={{ scale: 1.2, rotate: 8, y: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <img className="home-gem-img" src={CHARACTER_IMG[color]} alt={CHARACTER_NAME[color]} draggable={false} />
              <div className="home-gem-ring" />
              <div className="home-gem-glow" aria-hidden style={{ background: `var(--glow-${color})` }} />
            </motion.div>
          ))}
        </div>

        <div className="btn-play-wrap">
          <EnergyRing />
          <motion.button
            className="btn btn-primary btn-play"
            onClick={() => showLevelGoals(unlockedLevel)}
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.55 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="btn-play-icon">▶</span>
            <span>Play Level {unlockedLevel}</span>
          </motion.button>
        </div>

        <motion.div
          className="home-stats"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {[
            { img: '/assets/characters/aang.webp', alt: 'Stars', value: String(totalStars), label: 'Stars' },
            { img: '/assets/characters/zuko.webp', alt: 'Cleared', value: String(levelsCleared), label: 'Cleared' },
            { img: '/assets/characters/korra.webp', alt: 'Era', value: era.name, label: `Era ${era.num}` },
          ].map((stat, i) => (
            <motion.div
              key={stat.alt}
              className="stat-chip"
              initial={{ opacity: 0, y: 20, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.75 + i * 0.12, type: 'spring', stiffness: 200, damping: 16 }}
              whileHover={{ y: -3, scale: 1.04 }}
            >
              <img className="stat-avatar" src={stat.img} alt={stat.alt} />
              <div className="stat-content">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
              <div className="stat-chip-shine" aria-hidden />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Level Select */}
      <div className="home-levels">
        <div className="home-levels-header">
          <div className="home-levels-left">
            <div className="home-levels-icon-wrap">
              <span className="home-levels-icon-inner">⚔</span>
              <div className="home-levels-icon-glow" />
            </div>
            <div className="home-levels-title-wrap">
              <span className="home-levels-title">Select Level</span>
              <span className="home-levels-subtitle">{levelsCleared} of {dynamicWorlds.length * 20} completed</span>
            </div>
          </div>
          <div className="home-levels-badge">
            <div className="home-levels-badge-ring" />
            <span className="home-levels-badge-dot" />
            <span className="home-levels-badge-label">Era {era.num}</span>
            <span className="home-levels-badge-sep">·</span>
            <span className="home-levels-badge-name">{era.name}</span>
          </div>
        </div>

        <div className="level-scroll">
          {dynamicWorlds.map(world => {
            const worldStart = world.start;
            const worldEnd = world.end;
            const worldLevels = Array.from({ length: worldEnd - worldStart + 1 }, (_, i) => worldStart + i);
            const worldStars = worldLevels.reduce((sum, l) => sum + (levelStars[l] || 0), 0);
            const maxStars = worldLevels.length * 3;
            const worldProgress = Math.min(worldStars / maxStars, 1);
            const isWorldActive = unlockedLevel >= worldStart;
            const showEraTag = world.start % 100 === 1; // First world of each era

            return (
              <div key={`${world.name}-${world.start}`} className={`world-section ${isWorldActive ? '' : 'world-locked'}`}>
                {showEraTag && (
                  <div className="era-badge" style={{ '--era-color': world.era.color } as React.CSSProperties}>
                    <div className="era-badge-deco era-badge-deco-l" />
                    <div className="era-badge-content">
                      <span className="era-badge-icon">✦</span>
                      <span className="era-badge-text">Era {world.era.num}</span>
                      <span className="era-badge-divider" />
                      <span className="era-badge-name">{world.era.name}</span>
                      <span className="era-badge-icon">✦</span>
                    </div>
                    <div className="era-badge-deco era-badge-deco-r" />
                    <div className="era-badge-shine" />
                  </div>
                )}
                <div className="world-header">
                  <div className="world-header-left">
                    <span className="world-icon">{world.icon}</span>
                    <div className="world-info">
                      <span className="world-name">{world.name}</span>
                      <span className="world-range">Levels {worldStart}–{worldEnd}</span>
                    </div>
                  </div>
                  <div className="world-progress-wrap">
                    <div className="world-progress-bar">
                      <div className="world-progress-fill" style={{ width: `${worldProgress * 100}%`, background: world.accent }} />
                    </div>
                    <span className="world-star-count">⭐ {worldStars}/{maxStars}</span>
                  </div>
                </div>

                <div className="level-grid">
                  {worldLevels.map(lvl => {
                    const isUnlocked = lvl <= unlockedLevel;
                    const isCurrent = lvl === unlockedLevel;
                    const stars = levelStars[lvl] || 0;
                    return (
                      <button
                        key={lvl}
                        className={`level-btn ${isCurrent ? 'current' : isUnlocked ? 'unlocked' : 'locked'}`}
                        onClick={() => isUnlocked && showLevelGoals(lvl)}
                        disabled={!isUnlocked}
                        style={isCurrent ? { '--btn-accent': world.accent } as React.CSSProperties : undefined}
                      >
                        {isCurrent && <span className="level-current-ping" />}
                        <span className="level-num">{lvl}</span>
                        {isUnlocked && lvl < unlockedLevel && (
                          <span className="level-stars-row">
                            {[1, 2, 3].map(s => (
                              <span key={s} className={`level-star ${s <= stars ? 'earned' : 'empty'}`}>★</span>
                            ))}
                          </span>
                        )}
                        {!isUnlocked && <span className="level-lock">🔒</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export function GoalModal({ level, onStart, onClose }: { level: number; onStart: () => void; onClose: () => void }) {
  const config = getLevel(level);
  const world = getWorld(level);
  const era = getEra(level);
  const levelStars = useGameStore(s => s.levelStars);
  const prevStars = levelStars[level] || 0;
  const isReplay = prevStars > 0;

  // Loading state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBeginMission = useCallback(() => {
    setLoading(true);
    setProgress(0);

    // Preload level assets during loading
    const bgUrl = getBackgroundForLevel(level);
    preloadImages([bgUrl]);

    // Animate progress bar over 5 seconds
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      // Ease-out progress curve for natural feel
      const raw = step / steps;
      const eased = 1 - Math.pow(1 - raw, 2.5);
      setProgress(Math.min(eased * 100, 100));

      if (step >= steps) {
        clearInterval(timer);
        onStart();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [level, onStart]);

  // Loading tips that rotate
  const loadingMessages = [
    'Preparing the battlefield...',
    'Summoning benders...',
    'Channeling elements...',
    'Opening spirit portal...',
    'Aligning the stars...',
  ];
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIndex(i => (i + 1) % loadingMessages.length), 1200);
    return () => clearInterval(t);
  }, [loading, loadingMessages.length]);

  // Gameplay tips pool
  const tips = [
    { icon: '💎', text: 'Match 4 in a row to create a Line Blast!' },
    { icon: '💣', text: 'Match 5 in an L or T shape for a Bomb!' },
    { icon: '🌈', text: 'Match 5 in a row for a Rainbow gem!' },
    { icon: '🔥', text: 'Chain combos for score multipliers!' },
    { icon: '🎯', text: 'Start from the bottom for bigger cascades.' },
    { icon: '⏱️', text: 'Combos keep scoring even when time is low.' },
    { icon: '👁️', text: 'Use Toph\'s hint if you\'re stuck!' },
  ];
  // Deterministic tip based on level
  const tip = tips[level % tips.length];

  return (
    <motion.div
      className="modal-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <motion.div
        className="modal goal-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Decorative top glow */}
        <div className="goal-top-glow" style={{ background: `radial-gradient(ellipse at center, ${world.accent}22 0%, transparent 70%)` }} />

        {/* Level badge */}
        <div className="goal-level-badge">
          <span className="goal-level-num">{level}</span>
          <span className="goal-level-label">LEVEL</span>
        </div>

        {/* World tag */}
        <div className="goal-body">
        <div className="goal-world-tag">
          <span>{world.icon}</span>
          <span>{world.name}</span>
          {era.num > 1 && <span className="goal-era-tag" style={{ color: era.color }}>Era {era.num}</span>}
        </div>

        {/* Previous best for replays */}
        {isReplay && (
          <div className="goal-best-score">
            <span className="goal-best-stars">{'★'.repeat(prevStars)}{'☆'.repeat(3 - prevStars)}</span>
            <span className="goal-best-label">Previous Best</span>
          </div>
        )}

        {/* Section title */}
        <h2 className="goal-modal-title">Objectives</h2>

        {/* Goals */}
        <div className="goal-list">
          {config.goals.map((goal, i) => (
            <div
              key={i}
              className="goal-item"
            >
              {goal.type === 'score' && (
                <>
                  <span className="goal-item-icon goal-item-icon-score">⭐</span>
                  <div className="goal-item-text">
                    <span className="goal-item-primary">Score {goal.target.toLocaleString()}</span>
                    <span className="goal-item-secondary">points</span>
                  </div>
                </>
              )}
              {goal.type === 'collect' && goal.color && (
                <>
                  <img className="goal-item-avatar" src={CHARACTER_IMG[goal.color]} alt={CHARACTER_NAME[goal.color]} />
                  <div className="goal-item-text">
                    <span className="goal-item-primary">Collect {goal.target} tiles</span>
                    <span className="goal-item-secondary">{CHARACTER_NAME[goal.color]}</span>
                  </div>
                  <span className="goal-item-count">×{goal.target}</span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="goal-divider" />

        {/* Star Thresholds */}
        <h3 className="goal-section-title">Star Targets</h3>
        <div className="goal-star-thresholds">
          {config.targetScore.map((threshold, i) => (
            <div
              key={i}
              className={`goal-star-tier goal-star-tier-${i + 1}`}
            >
              <div className="goal-star-tier-stars">
                {Array.from({ length: 3 }, (_, s) => (
                  <span key={s} className={`goal-star-tier-icon ${s <= i ? 'lit' : 'dim'}`}>★</span>
                ))}
              </div>
              <div className="goal-star-tier-bar">
                <div
                  className="goal-star-tier-fill"
                  style={{ width: `${(threshold / config.targetScore[2]) * 100}%` }}
                />
              </div>
              <span className="goal-star-tier-value">{threshold.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="goal-divider" />

        {/* Resources row */}
        <div className="goal-info-row">
          <div className="goal-info-chip">
            <img className="goal-info-avatar" src="/assets/characters/aang.webp" alt="Moves" loading="lazy" />
            <div className="goal-info-detail">
              <span className="goal-info-value">{config.moves}</span>
              <span className="goal-info-label">Moves</span>
            </div>
          </div>
          <div className="goal-info-chip">
            <img className="goal-info-avatar" src="/assets/characters/katara.webp" alt="Time" loading="lazy" />
            <div className="goal-info-detail">
              <span className="goal-info-value">{Math.floor(config.timeLimit / 60)}:{(config.timeLimit % 60).toString().padStart(2, '0')}</span>
              <span className="goal-info-label">Time</span>
            </div>
          </div>
          <div className="goal-info-chip">
            <img className="goal-info-avatar" src="/assets/characters/korra.webp" alt="Colors" loading="lazy" />
            <div className="goal-info-detail">
              <span className="goal-info-value">{config.colors.length}</span>
              <span className="goal-info-label">Colors</span>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="goal-tip">
          <span className="goal-tip-icon">{tip.icon}</span>
          <span className="goal-tip-text">{tip.text}</span>
        </div>

        {/* Start button */}
        <button
          className="btn goal-start-btn"
          onClick={handleBeginMission}
          disabled={loading}
        >
          <span className="goal-start-text">{loading ? 'LOADING...' : 'BEGIN MISSION'}</span>
          {!loading && <span className="goal-start-arrow">→</span>}
        </button>
        </div>{/* end goal-body */}

        {/* Loading overlay */}
        {loading && (
          <motion.div
            className="goal-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="goal-loading-content">
              <div className="goal-loading-icon">⚡</div>
              <div className="goal-loading-title">Level {level}</div>
              <div className="goal-loading-msg">{loadingMessages[msgIndex]}</div>
              <div className="goal-loading-bar">
                <div
                  className="goal-loading-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="goal-loading-percent">{Math.round(progress)}%</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
