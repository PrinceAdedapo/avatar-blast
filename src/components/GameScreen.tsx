import { useEffect, useRef, useState } from 'react';
import { GameHeader } from './GameHeader';
import { Board } from './Board';
import { useGameStore } from '../stores/useGameStore';
import { getBackgroundForLevel } from '../data/backgrounds';

/* ── Interactive Tutorial — highlights real UI elements step by step ── */

interface TutorialStep {
  highlight: string;       // CSS selector or area to highlight
  position: 'top' | 'middle' | 'bottom';  // Where to show the tooltip
  pointer: 'up' | 'down' | 'none';        // Arrow direction
  avatar: string;
  title: string;
  desc: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    highlight: 'timer',
    position: 'top',
    pointer: 'up',
    avatar: '/assets/characters/katara.avif',
    title: 'Timer',
    desc: 'This is your time limit! Complete the goal before it reaches zero.',
  },
  {
    highlight: 'moves',
    position: 'top',
    pointer: 'up',
    avatar: '/assets/characters/sokka.avif',
    title: 'Moves Counter',
    desc: 'Each swap costs one move. Use them wisely — when they run out, the game ends!',
  },
  {
    highlight: 'score',
    position: 'top',
    pointer: 'up',
    avatar: '/assets/characters/aang.avif',
    title: 'Your Score',
    desc: 'Points earned from matching gems. Hit the target score to complete the level!',
  },
  {
    highlight: 'hint',
    position: 'top',
    pointer: 'up',
    avatar: '/assets/characters/toph.avif',
    title: 'Hint Button',
    desc: 'Stuck? Tap here and Toph will show you a possible match. No penalty!',
  },
  {
    highlight: 'goal',
    position: 'top',
    pointer: 'up',
    avatar: '/assets/characters/korra.avif',
    title: 'Level Goal',
    desc: 'Your mission! Reach the target score or collect the required gems to win.',
  },
  {
    highlight: 'board',
    position: 'middle',
    pointer: 'down',
    avatar: '/assets/characters/aang-power.avif',
    title: 'The Game Board',
    desc: 'Swipe any gem to swap it with a neighbor. Match 3+ same-color gems to clear them!',
  },
  {
    highlight: 'specials',
    position: 'middle',
    pointer: 'none',
    avatar: '/assets/characters/zuko-power.avif',
    title: 'Special Gems',
    desc: 'Match 4 → Line Blast (clears row/col)\nL or T shape → Bomb (3×3 blast)\nMatch 5+ → Avatar State (clears a color!)',
  },
  {
    highlight: 'ready',
    position: 'middle',
    pointer: 'none',
    avatar: '/assets/characters/korra-power.avif',
    title: "You're Ready!",
    desc: 'Match at the bottom for cascades. Save specials for combos. Now go save the Four Nations!',
  },
];

function TutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onDismiss();
    }
  };

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  // Determine tooltip position class
  const posClass = current.position === 'top' ? 'tut-pos-bottom'
    : current.position === 'bottom' ? 'tut-pos-top'
    : 'tut-pos-center';

  return (
    <div className="tut-overlay">
      {/* Highlight pulse for specific areas */}
      <div className={`tut-highlight tut-hl-${current.highlight}`} />

      {/* Tooltip card */}
      <div className={`tut-tooltip ${posClass}`} onClick={(e) => e.stopPropagation()}>
        {current.pointer === 'up' && <div className="tut-arrow tut-arrow-up" />}

        <div className="tut-tooltip-inner">
          <img src={current.avatar} className="tut-avatar" alt="" />
          <div className="tut-content">
            <div className="tut-step-label">Step {step + 1}/{TUTORIAL_STEPS.length}</div>
            <h3 className="tut-title">{current.title}</h3>
            <p className="tut-desc">{current.desc}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="tut-progress">
          {TUTORIAL_STEPS.map((_, i) => (
            <span key={i} className={`tut-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        {/* Buttons */}
        <div className="tut-actions">
          <button className="tut-skip-btn" onClick={onDismiss}>Skip All</button>
          <button className="tut-next-btn" onClick={handleNext}>
            {isLast ? "LET'S PLAY!" : 'NEXT'}
          </button>
        </div>

        {current.pointer === 'down' && <div className="tut-arrow tut-arrow-down" />}
      </div>
    </div>
  );
}

export function GameScreen() {
  const tick = useGameStore(s => s.tick);
  const phase = useGameStore(s => s.phase);
  const currentLevel = useGameStore(s => s.currentLevel);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (currentLevel === 1) {
      try {
        if (!localStorage.getItem('gemblast-tutorial-done')) {
          setShowTutorial(true);
        }
      } catch { setShowTutorial(true); }
    }
  }, [currentLevel]);

  const dismissTutorial = () => {
    setShowTutorial(false);
    try { localStorage.setItem('gemblast-tutorial-done', '1'); } catch {}
  };

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Pause timer during tutorial
    if (showTutorial) return;
    intervalRef.current = setInterval(() => {
      if (phaseRef.current !== 'complete') tick();
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tick, showTutorial]);

  const bgUrl = getBackgroundForLevel(currentLevel);

  return (
    <div className="game-screen">
      <div className="game-bg" style={{ backgroundImage: `url(${bgUrl})` }} />
      <GameHeader />
      <Board />
      {showTutorial && <TutorialOverlay onDismiss={dismissTutorial} />}
    </div>
  );
}
