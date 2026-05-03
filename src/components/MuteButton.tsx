import { useState } from 'react';
import { isMuted, toggleMute } from '../audio/sounds';

export function MuteButton() {
  const [muted, setMuted] = useState(isMuted());

  const handleToggle = () => {
    const newState = toggleMute();
    setMuted(newState);
  };

  return (
    <button
      className="mute-btn"
      onClick={handleToggle}
      aria-label={muted ? 'Unmute' : 'Mute'}
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
