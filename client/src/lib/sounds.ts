export type SoundTheme = 'mechanical' | 'typewriter' | 'bubble' | 'piano' | 'arcade' | 'none';

export const SOUND_THEMES: readonly { id: SoundTheme; name: string; icon: string }[] = [
  { id: 'mechanical', name: '机械键盘', icon: '⌨️' },
  { id: 'typewriter', name: '打字机', icon: '🖨️' },
  { id: 'bubble', name: '气泡', icon: '🫧' },
  { id: 'piano', name: '钢琴', icon: '🎹' },
  { id: 'arcade', name: '街机', icon: '🕹️' },
  { id: 'none', name: '静音', icon: '🔇' },
];

let currentTheme: SoundTheme = (localStorage.getItem('soundTheme') as SoundTheme) || 'mechanical';
let volume = parseFloat(localStorage.getItem('soundVolume') || '0.5');

const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

export function setTheme(theme: SoundTheme): void {
  currentTheme = theme;
  localStorage.setItem('soundTheme', theme);
}

export function getTheme(): SoundTheme {
  return currentTheme;
}

export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  localStorage.setItem('soundVolume', String(volume));
}

export function getVolume(): number {
  return volume;
}

function playTone(frequency: number, duration: number, vol: number, type: OscillatorType = 'sine'): void {
  if (currentTheme === 'none') return;
  const adjustedVol = vol * volume;
  if (adjustedVol <= 0) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(adjustedVol, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playNoise(duration: number, vol: number): void {
  if (currentTheme === 'none') return;
  const adjustedVol = vol * volume;
  if (adjustedVol <= 0) return;

  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(adjustedVol, audioContext.currentTime);

  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start();
}

// Theme-specific key sounds
const keySounds: Record<SoundTheme, () => void> = {
  mechanical: () => {
    playTone(800, 0.04, 0.12, 'square');
    playNoise(0.03, 0.06);
  },
  typewriter: () => {
    playNoise(0.06, 0.15);
    playTone(300, 0.03, 0.05, 'triangle');
  },
  bubble: () => {
    const freq = 600 + Math.random() * 400;
    playTone(freq, 0.08, 0.1, 'sine');
  },
  piano: () => {
    const notes = [262, 294, 330, 349, 392, 440, 494, 523];
    const note = notes[Math.floor(Math.random() * notes.length)];
    playTone(note, 0.15, 0.1, 'sine');
    playTone(note * 2, 0.1, 0.03, 'sine');
  },
  arcade: () => {
    playTone(1200 + Math.random() * 300, 0.03, 0.08, 'square');
  },
  none: () => {},
};

const errorSounds: Record<SoundTheme, () => void> = {
  mechanical: () => playTone(150, 0.15, 0.15, 'sawtooth'),
  typewriter: () => {
    playTone(100, 0.12, 0.1, 'square');
    playNoise(0.08, 0.1);
  },
  bubble: () => playTone(150, 0.2, 0.12, 'sine'),
  piano: () => {
    playTone(130, 0.2, 0.12, 'sine');
    playTone(138, 0.2, 0.08, 'sine');
  },
  arcade: () => playTone(100, 0.2, 0.15, 'square'),
  none: () => {},
};

export function playKeySound(): void {
  keySounds[currentTheme]();
}

export function playErrorSound(): void {
  errorSounds[currentTheme]();
}

export function playCompleteSound(): void {
  if (currentTheme === 'none') return;
  playTone(523, 0.3, 0.12, 'sine');
  setTimeout(() => playTone(659, 0.3, 0.12, 'sine'), 100);
  setTimeout(() => playTone(784, 0.4, 0.12, 'sine'), 200);
}

export function playCountdownSound(): void {
  if (currentTheme === 'none') return;
  playTone(440, 0.15, 0.2, 'sine');
}

export function playGoSound(): void {
  if (currentTheme === 'none') return;
  playTone(880, 0.3, 0.25, 'sine');
}

export function resumeAudioContext(): void {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}
