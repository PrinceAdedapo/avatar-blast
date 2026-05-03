import { motion } from 'framer-motion';
import { playButtonTap } from '../audio/sounds';

interface CreditsScreenProps {
  onBack: () => void;
}

const TEAM = [
  {
    name: 'Akano Ismail',
    role: 'Lead Developer',
    icon: '💻',
    description: 'Game architecture & engineering',
  },
  {
    name: 'Oluwamo Tunde',
    role: 'Developer',
    icon: '🎨',
    description: 'UI/UX design & implementation',
  },
  {
    name: 'Akano Ayuba',
    role: 'Planner',
    icon: '📋',
    description: 'Game design & project planning',
  },
];

export function CreditsScreen({ onBack }: CreditsScreenProps) {
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
        <h2 className="screen-title">Credits</h2>
      </div>

      <div className="credits-content">
        <motion.div
          className="credits-studio"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img
            src="/assets/splash/studio-logo.webp"
            alt="3X Game Studio"
            className="credits-studio-logo"
            loading="lazy"
          />
          <h3 className="credits-studio-name">3X Game Studio</h3>
        </motion.div>

        <div className="credits-team">
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              className="credit-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.4, ease: 'easeOut' }}
            >
              <div className="credit-avatar">{member.icon}</div>
              <div className="credit-info">
                <h4 className="credit-name">{member.name}</h4>
                <p className="credit-role">{member.role}</p>
                <p className="credit-desc">{member.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="credits-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.9 }}
        >
          Avatar Blast © 2026 — All Rights Reserved
        </motion.p>
      </div>
    </motion.div>
  );
}
