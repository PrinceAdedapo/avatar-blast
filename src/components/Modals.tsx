import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { getLevel } from '../data/levels';
import { playLevelComplete, playGameOver } from '../audio/sounds';
import { CHARACTER_IMG } from '../data/characters';
import { motion } from 'framer-motion';
import type { GemColor } from '../types/game';

const VICTORY_CHARACTERS: { color: GemColor; name: string }[] = [
  { color: 'green', name: 'Toph' },
  { color: 'blue', name: 'Katara' },
  { color: 'orange', name: 'Aang' },
  { color: 'red', name: 'Zuko' },
  { color: 'yellow', name: 'Sokka' },
];

const GAMEOVER_QUOTES = [
  { char: 'Iroh', text: '"Sometimes the best tea is brewed after the longest wait."' },
  { char: 'Aang', text: '"When we hit our lowest point, we are open to the greatest change."' },
  { char: 'Zuko', text: '"You must never give in to despair."' },
  { char: 'Katara', text: '"I will never turn my back on people who need me."' },
  { char: 'Toph', text: '"I am the greatest earthbender in the world! And don\'t you forget it."' },
  { char: 'Sokka', text: '"That\'s rough, buddy. But you can try again!"' },
  { char: 'Iroh', text: '"Failure is only the opportunity to begin again."' },
  { char: 'Aang', text: '"The monks used to say that hope is something you give yourself."' },
  { char: 'Zuko', text: '"I\'ve learned that it\'s the struggle that makes you stronger."' },
  { char: 'Korra', text: '"I finally understand. My enemies were my greatest teachers."' },
];

function getGameOverQuote(level: number): string {
  const q = GAMEOVER_QUOTES[level % GAMEOVER_QUOTES.length];
  return `${q.text} — ${q.char}`;
}

export function LevelCompleteModal() {
  const score = useGameStore(s => s.score);
  const stars = useGameStore(s => s.stars);
  const currentLevel = useGameStore(s => s.currentLevel);
  const nextLevel = useGameStore(s => s.nextLevel);
  const restartLevel = useGameStore(s => s.restartLevel);
  const setScreen = useGameStore(s => s.setScreen);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showContent, setShowContent] = useState(false);
  const config = getLevel(currentLevel);

  useEffect(() => {
    playLevelComplete(stars);
    // Delay content reveal for dramatic effect
    const timer = setTimeout(() => setShowContent(true), 400);

    // Confetti burst
    const canvas = canvasRef.current;
    if (!canvas) return () => clearTimeout(timer);
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => clearTimeout(timer);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti: { x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; rv: number }[] = [];
    const colors = ['#ff6b6b', '#ffa502', '#feca57', '#26de81', '#45aaf2', '#a55eea', '#ff9ff3', '#54a0ff'];

    for (let i = 0; i < 150; i++) {
      confetti.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: canvas.height * 0.3,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 18 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.3,
      });
    }

    let frame = 0;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const c of confetti) {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.25;
        c.vx *= 0.99;
        c.rotation += c.rv;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 150);
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
        ctx.restore();
      }
      frame++;
      if (frame < 180) requestAnimationFrame(animate);
    }
    animate();
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="modal-overlay victory-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="modal-bg-img victory-bg" style={{ backgroundImage: 'url(/assets/victory/level-complete-bg.webp)' }} />
      <div className="victory-glow" />
      <div className="victory-rays" />
      <div className="victory-sparkles">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="sparkle" style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            fontSize: `${6 + Math.random() * 10}px`,
          }} />
        ))}
      </div>
      <canvas ref={canvasRef} className="confetti-canvas" />

      <div className={`victory-container ${showContent ? 'revealed' : ''}`}>
        {/* Banner ribbon */}
        <div className="victory-banner">
          <span className="victory-banner-text">VICTORY!</span>
        </div>

        {/* Character avatars in arc */}
        <div className="victory-characters">
          {VICTORY_CHARACTERS.map((char, i) => (
            <div key={char.color} className="victory-char" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
              <img src={CHARACTER_IMG[char.color]} alt={char.name} draggable={false} />
            </div>
          ))}
        </div>

        {/* Level info */}
        <div className="victory-level-tag">Level {currentLevel}</div>
        <h2 className="victory-title">Level Complete!</h2>

        {/* Stars */}
        <div className="victory-stars-row">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={`victory-star ${i < stars ? 'earned' : 'empty'}`} style={{ animationDelay: `${0.5 + i * 0.2}s` }}>
              <span className="victory-star-icon">{i < stars ? '⭐' : '☆'}</span>
              {i < stars && <div className="star-burst" />}
            </div>
          ))}
        </div>

        {/* Star threshold breakdown */}
        <div className="victory-star-breakdown">
          {config.targetScore.map((threshold, i) => {
            const reached = score >= threshold;
            return (
              <div key={i} className={`victory-tier ${reached ? 'victory-tier-reached' : 'victory-tier-missed'}`}>
                <span className="victory-tier-star">{'★'.repeat(i + 1)}</span>
                <div className="victory-tier-bar-track">
                  <div
                    className="victory-tier-bar-fill"
                    style={{ width: `${Math.min((score / threshold) * 100, 100)}%` }}
                  />
                </div>
                <span className="victory-tier-score">{threshold.toLocaleString()}</span>
                {reached && <span className="victory-tier-check">✓</span>}
              </div>
            );
          })}
        </div>

        {/* Score */}
        <div className="victory-score-wrap">
          <span className="victory-score-label">SCORE</span>
          <span className="victory-score-value">{score.toLocaleString()}</span>
        </div>

        {/* Buttons — CODM Style */}
        <div className="victory-buttons">
          <motion.button
            className="codm-btn codm-btn-secondary"
            onClick={() => setScreen('home')}
            whileTap={{ scale: 0.94 }}
          >
            <span className="codm-btn-text">HOME</span>
          </motion.button>
          <motion.button
            className="codm-btn codm-btn-primary"
            onClick={nextLevel}
            whileTap={{ scale: 0.94 }}
          >
            <span className="codm-btn-text">NEXT LEVEL</span>
            <span className="codm-btn-arrow">›</span>
          </motion.button>
          <motion.button
            className="codm-btn codm-btn-secondary"
            onClick={restartLevel}
            whileTap={{ scale: 0.94 }}
          >
            <span className="codm-btn-text">RETRY</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function GameOverModal() {
  const currentLevel = useGameStore(s => s.currentLevel);
  const restartLevel = useGameStore(s => s.restartLevel);
  const continueWithAd = useGameStore(s => s.continueWithAd);
  const setScreen = useGameStore(s => s.setScreen);
  const score = useGameStore(s => s.score);
  const timeLeft = useGameStore(s => s.timeLeft);
  const [showIroh, setShowIroh] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const outOfTime = timeLeft <= 0;
  const reason = outOfTime ? "Time's Up!" : 'Out of Moves!';

  useEffect(() => {
    playGameOver();
    const timer = setTimeout(() => setShowContent(true), 300);

    // Falling debris particles
    const canvas = canvasRef.current;
    if (!canvas) return () => clearTimeout(timer);
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => clearTimeout(timer);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const debris: { x: number; y: number; vx: number; vy: number; size: number; color: string; rotation: number; rv: number; opacity: number }[] = [];
    const colors = ['#4a3f6b', '#6b5b95', '#3d3556', '#2a2040', '#8b7fb5'];

    for (let i = 0; i < 40; i++) {
      debris.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 1,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    let frame = 0;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of debris) {
        d.x += d.vx;
        d.y += d.vy;
        d.rotation += d.rv;
        if (d.y > canvas.height) {
          d.y = -10;
          d.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = d.opacity * Math.max(0, 1 - frame / 300);
        ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size * 0.7);
        ctx.restore();
      }
      frame++;
      if (frame < 400) requestAnimationFrame(animate);
    }
    animate();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showingAd) return;
    const start = Date.now();
    const duration = 3000;
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / duration, 1);
      setAdProgress(pct);
      if (pct >= 1) {
        clearInterval(id);
        setShowingAd(false);
        setAdProgress(0);
        continueWithAd();
      }
    }, 50);
    return () => clearInterval(id);
  }, [showingAd, continueWithAd]);

  if (showingAd) {
    return (
      <div className="modal-overlay iroh-overlay">
        <div className="iroh-bg" style={{ backgroundImage: 'url(/assets/ui/iroh-tea.webp)' }} />
        <div className="iroh-dim" />
        <div className="ad-progress-overlay">
          <div className="ad-progress-wrap iroh-progress">
            <div className="ad-progress-bar" style={{ width: `${adProgress * 100}%` }} />
          </div>
          <p className="iroh-ad-timer">{Math.ceil((1 - adProgress) * 3)}s — Brewing your revival tea...</p>
        </div>
      </div>
    );
  }

  if (showIroh) {
    return (
      <div className="modal-overlay iroh-overlay">
        <div className="iroh-bg" style={{ backgroundImage: 'url(/assets/ui/iroh-tea.webp)' }} />
        <div className="iroh-dim" />

        {/* Bottom panel */}
        <div className="iroh-bottom-panel">
          <h2 className="iroh-title">Continue Journey?</h2>
          <p className="iroh-subtitle">Watch a short video to revive your character and find your focus.</p>

          <button className="btn iroh-btn-watch" onClick={() => setShowingAd(true)}>
            <span className="iroh-btn-text">WATCH AD &amp; REVIVE</span>
            <span className="iroh-btn-icon">▶</span>
          </button>

          <button className="btn iroh-btn-giveup" onClick={() => setShowIroh(false)}>
            GIVE UP
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="modal-overlay gameover-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >      <div className="modal-bg-img gameover-bg" style={{ backgroundImage: 'url(/assets/victory/game-over-bg.webp)' }} />
      <div className="gameover-vignette" />
      <canvas ref={canvasRef} className="confetti-canvas" />

      {/* Lightning flashes */}
      <div className="gameover-lightning" />

      <div className={`gameover-container ${showContent ? 'revealed' : ''}`}>
        {/* Cracked emblem */}
        <div className="gameover-emblem">
          <span className="gameover-emblem-icon">{outOfTime ? '⏰' : '💔'}</span>
          <div className="gameover-emblem-crack" />
        </div>

        {/* Title with shake */}
        <h2 className="gameover-title">{reason}</h2>

        <div className="gameover-level-tag">Level {currentLevel}</div>

        {/* Score */}
        <div className="gameover-score-wrap">
          <span className="gameover-score-label">SCORE</span>
          <span className="gameover-score-value">{score.toLocaleString()}</span>
        </div>

        <p className="gameover-encourage">{getGameOverQuote(currentLevel)}</p>

        {/* Continue with ad */}
        <motion.button
          className="btn btn-ad gameover-ad-btn"
          onClick={() => setShowIroh(true)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
        >
          🍵 Uncle Iroh's Tea Break
        </motion.button>
        <p className="gameover-ad-hint">Get +30s & +5 moves</p>

        {/* Buttons */}
        <div className="gameover-buttons">
          <motion.button className="btn btn-blue gameover-btn" onClick={() => setScreen('home')} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>🏠 Home</motion.button>
          <motion.button className="btn btn-primary gameover-btn gameover-btn-retry" onClick={restartLevel} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>🔄 Retry</motion.button>
        </div>
      </div>
    </motion.div>
  );
}
