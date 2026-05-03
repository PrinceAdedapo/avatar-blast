import { Howl, Howler } from 'howler';
import type { GemColor } from '../types/game';

// --- Mute State ---
const MUTE_KEY = 'avatar-blast-muted';
let _muted = localStorage.getItem(MUTE_KEY) === 'true';

export function isMuted(): boolean { return _muted; }
export function setMuted(val: boolean) {
  _muted = val;
  localStorage.setItem(MUTE_KEY, String(val));
  Howler.mute(val);
  if (val) {
    if (currentMusic) currentMusic.pause();
    stopAllVoices();
  }
  if (!val && currentMusic) currentMusic.play();
}
export function toggleMute(): boolean { setMuted(!_muted); return _muted; }

// --- Volume Control ---
const VOLUME_KEY = 'avatar-blast-volume';
const _parsedVolume = parseFloat(localStorage.getItem(VOLUME_KEY) || '1');
let _masterVolume = Number.isFinite(_parsedVolume) ? Math.max(0, Math.min(1, _parsedVolume)) : 1;

export function getMasterVolume(): number { return _masterVolume; }
export function setMasterVolume(val: number) {
  _masterVolume = Math.max(0, Math.min(1, val));
  localStorage.setItem(VOLUME_KEY, String(_masterVolume));
  Howler.volume(_masterVolume);
}
// Apply initial volume
Howler.volume(_masterVolume);

// Apply initial mute state
if (_muted) Howler.mute(true);

// --- Volume Levels ---
const VOL_SFX = 0.4;
const VOL_VOICE = 0.55;
const VOL_MUSIC = 0.18;

// --- Throttle / Cooldown System ---
let lastVoiceTime = 0;
const VOICE_COOLDOWN = 4500; // ms between voice lines

let lastSfxTime: Record<string, number> = {};
const SFX_COOLDOWN = 80; // ms — prevent same SFX from stacking

let lastTickTime = 0;
const TICK_COOLDOWN = 900; // ms — prevent timer tick spam

// --- Voice Management (only one voice at a time) ---
let currentVoice: Howl | null = null;
let currentVoiceId: number | null = null;

function stopAllVoices() {
  if (currentVoice && currentVoiceId !== null) {
    currentVoice.stop(currentVoiceId);
  }
  currentVoice = null;
  currentVoiceId = null;
}

// --- Audio Context (for lightweight synth SFX) ---
let audioCtx: AudioContext | null = null;
function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// --- SFX Howls (preloaded) ---
const sfx = {
  swap: new Howl({ src: ['/assets/sounds/sfx/swap.mp3'], volume: VOL_SFX, preload: true }),
  match3: new Howl({ src: ['/assets/sounds/sfx/match-3.mp3'], volume: VOL_SFX, preload: true }),
  match4: new Howl({ src: ['/assets/sounds/sfx/match-4.mp3'], volume: VOL_SFX, preload: true }),
  match5: new Howl({ src: ['/assets/sounds/sfx/match-5.mp3'], volume: VOL_SFX, preload: true }),
  invalidSwap: new Howl({ src: ['/assets/sounds/sfx/invalid-swap.mp3'], volume: VOL_SFX, preload: true }),
  buttonTap: new Howl({ src: ['/assets/sounds/sfx/button-tap.mp3'], volume: VOL_SFX * 0.7, preload: true }),
  starEarned: new Howl({ src: ['/assets/sounds/sfx/star-earned.mp3'], volume: VOL_SFX, preload: true }),
  timerTick: new Howl({ src: ['/assets/sounds/sfx/timer-tick.mp3'], volume: VOL_SFX * 0.6, preload: true }),
};

/** Play an SFX with throttle to prevent stacking the same sound */
function playSfx(sound: Howl, key: string) {
  const now = Date.now();
  if (now - (lastSfxTime[key] || 0) < SFX_COOLDOWN) return;
  lastSfxTime[key] = now;
  sound.play();
}

// --- Voice Line Pools (lazy loaded) ---
const voiceCache: Record<string, Howl> = {};

function getVoice(path: string): Howl {
  if (!voiceCache[path]) {
    voiceCache[path] = new Howl({
      src: [path],
      volume: VOL_VOICE,
      onend: () => {
        // Clear current voice reference when done
        if (currentVoice === voiceCache[path]) {
          currentVoice = null;
          currentVoiceId = null;
        }
      },
    });
  }
  return voiceCache[path];
}

function playRandomVoice(paths: string[]) {
  const now = Date.now();
  if (now - lastVoiceTime < VOICE_COOLDOWN) return;
  if (_muted) return;

  // Stop any currently playing voice to prevent overlap
  stopAllVoices();

  lastVoiceTime = now;
  const path = paths[Math.floor(Math.random() * paths.length)];
  const voice = getVoice(path);
  currentVoice = voice;
  currentVoiceId = voice.play();
}

// Character voice line paths
const CHARACTER_VOICES: Record<GemColor, string[]> = {
  red: Array.from({ length: 6 }, (_, i) => `/assets/sounds/voices/zuko-match-${i + 1}.mp3`),
  orange: Array.from({ length: 6 }, (_, i) => `/assets/sounds/voices/aang-match-${i + 1}.mp3`),
  yellow: Array.from({ length: 6 }, (_, i) => `/assets/sounds/voices/sokka-match-${i + 1}.mp3`),
  green: Array.from({ length: 6 }, (_, i) => `/assets/sounds/voices/toph-match-${i + 1}.mp3`),
  blue: Array.from({ length: 6 }, (_, i) => `/assets/sounds/voices/katara-match-${i + 1}.mp3`),
  purple: Array.from({ length: 6 }, (_, i) => `/assets/sounds/voices/korra-match-${i + 1}.mp3`),
};

const COMBO_VOICES = Array.from({ length: 6 }, (_, i) => `/assets/sounds/voices/combo-${i + 1}.mp3`);
const MEGA_COMBO_VOICES = Array.from({ length: 3 }, (_, i) => `/assets/sounds/voices/mega-combo-${i + 1}.mp3`);
const LEVEL_COMPLETE_VOICES = Array.from({ length: 6 }, (_, i) => `/assets/sounds/voices/level-complete-${i + 1}.mp3`);
const PERFECT_CLEAR_VOICES = Array.from({ length: 2 }, (_, i) => `/assets/sounds/voices/perfect-clear-${i + 1}.mp3`);
const GAME_OVER_VOICES = Array.from({ length: 6 }, (_, i) => `/assets/sounds/voices/game-over-${i + 1}.mp3`);

// --- Background Music ---
let currentMusic: Howl | null = null;
let currentMusicKey = '';
let musicFadeTimer: ReturnType<typeof setTimeout> | null = null;

const MUSIC_TRACKS: Record<string, string> = {
  home: '/assets/sounds/music/home-theme.mp3',
  'air-temple': '/assets/sounds/music/air-temple.mp3',
  'ba-sing-se': '/assets/sounds/music/ba-sing-se.mp3',
  'fire-nation': '/assets/sounds/music/fire-nation.mp3',
  'water-tribe': '/assets/sounds/music/water-tribe.mp3',
  'spirit-world': '/assets/sounds/music/spirit-world.mp3',
};

export function playMusic(key: string) {
  if (key === currentMusicKey && currentMusic && currentMusic.playing()) return;

  const src = MUSIC_TRACKS[key];
  if (!src) return;

  // Cancel any pending fade-out timer
  if (musicFadeTimer) {
    clearTimeout(musicFadeTimer);
    musicFadeTimer = null;
  }

  // Fade out and stop old music
  if (currentMusic) {
    const old = currentMusic;
    const oldVolume = old.volume();
    old.fade(oldVolume, 0, 600);
    musicFadeTimer = setTimeout(() => {
      old.stop();
      old.unload();
      musicFadeTimer = null;
    }, 620);
  }

  currentMusicKey = key;
  currentMusic = new Howl({
    src: [src],
    volume: 0,
    loop: true,
    html5: true,
  });

  if (!_muted) {
    currentMusic.play();
    // Delay fade-in slightly so old track fades first
    currentMusic.fade(0, VOL_MUSIC, 1000);
  }
}

export function stopMusic() {
  if (musicFadeTimer) {
    clearTimeout(musicFadeTimer);
    musicFadeTimer = null;
  }
  if (currentMusic) {
    const old = currentMusic;
    const oldVolume = old.volume();
    old.fade(oldVolume, 0, 500);
    setTimeout(() => { old.stop(); old.unload(); }, 520);
    currentMusic = null;
    currentMusicKey = '';
  }
}

// --- Exported Game Sound Functions ---

export function playSwap() {
  playSfx(sfx.swap, 'swap');
}

export function playMatch(combo: number, matchedColor?: GemColor) {
  // Pick appropriate match SFX (throttled)
  if (combo >= 5) {
    playSfx(sfx.match5, 'match5');
  } else if (combo >= 3) {
    playSfx(sfx.match4, 'match4');
  } else {
    playSfx(sfx.match3, 'match3');
  }

  // Voice lines: mega combo > combo > random character (25% chance)
  if (combo >= 5) {
    playRandomVoice(MEGA_COMBO_VOICES);
  } else if (combo >= 2) {
    playRandomVoice(COMBO_VOICES);
  } else if (matchedColor && Math.random() < 0.25) {
    playRandomVoice(CHARACTER_VOICES[matchedColor]);
  }
}

export function playInvalidSwap() {
  playSfx(sfx.invalidSwap, 'invalidSwap');
}

export function playSpecial() {
  playSfx(sfx.match5, 'special');
}

export function playSelect() {
  if (_muted) return;
  const c = ctx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(500, c.currentTime);
  g.gain.setValueAtTime(0.08, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.06);
}

export function playShuffle() {
  if (_muted) return;
  const c = ctx();
  for (let i = 0; i < 6; i++) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(300 + i * 80, c.currentTime + i * 0.06);
    g.gain.setValueAtTime(0.06, c.currentTime + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.06 + 0.1);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + i * 0.06);
    o.stop(c.currentTime + i * 0.06 + 0.1);
  }
}

export function playButtonTap() {
  playSfx(sfx.buttonTap, 'buttonTap');
}

export function playStarEarned() {
  playSfx(sfx.starEarned, 'starEarned');
}

export function playTimerTick() {
  const now = Date.now();
  if (now - lastTickTime < TICK_COOLDOWN) return;
  lastTickTime = now;
  sfx.timerTick.play();
}

export function playLevelComplete(stars: number) {
  // Stop any game voices, then play completion voice
  stopAllVoices();
  lastVoiceTime = 0; // Reset cooldown so it always plays
  if (stars >= 3) {
    playRandomVoice(PERFECT_CLEAR_VOICES);
  } else {
    playRandomVoice(LEVEL_COMPLETE_VOICES);
  }
}

export function playGameOver() {
  // Stop any game voices, then play game over voice
  stopAllVoices();
  lastVoiceTime = 0; // Reset cooldown so it always plays
  playRandomVoice(GAME_OVER_VOICES);
}

// Get world music key from level number
export function getMusicKeyForLevel(level: number): string {
  const worldIndex = Math.floor((level - 1) / 20) % 5;
  const keys = ['air-temple', 'ba-sing-se', 'fire-nation', 'water-tribe', 'spirit-world'];
  return keys[worldIndex];
}
