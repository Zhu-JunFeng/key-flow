// Background ambient music using Web Audio API
// Generates procedural ambient sounds without requiring audio files

let audioCtx: AudioContext | null = null;
let currentNodes: AudioNode[] = [];
let isPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function stopAll() {
  currentNodes.forEach(node => {
    try { (node as OscillatorNode).stop?.(); } catch { /* ignore */ }
    try { node.disconnect(); } catch { /* ignore */ }
  });
  currentNodes = [];
  isPlaying = false;
}

function createGain(ctx: AudioContext, vol: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  return gain;
}

// Lo-Fi: gentle ambient pads with slow modulation
function playLoFi(vol: number) {
  const ctx = getAudioContext();
  const masterGain = createGain(ctx, vol * 0.3);
  masterGain.connect(ctx.destination);
  currentNodes.push(masterGain);

  const notes = [220, 277.18, 329.63, 440]; // Am chord
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Slow frequency wobble
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.1 + i * 0.05, ctx.currentTime);
    const lfoGain = createGain(ctx, 2);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    currentNodes.push(lfo, lfoGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1, ctx.currentTime);

    osc.connect(filter);
    filter.connect(masterGain);
    osc.start();
    currentNodes.push(osc, filter);
  });
}

// Nature: birds-like chirps with wind
function playNature(vol: number) {
  const ctx = getAudioContext();
  const masterGain = createGain(ctx, vol * 0.2);
  masterGain.connect(ctx.destination);
  currentNodes.push(masterGain);

  // Wind noise
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const windSource = ctx.createBufferSource();
  windSource.buffer = buffer;
  windSource.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.setValueAtTime(400, ctx.currentTime);
  windSource.connect(windFilter);
  windFilter.connect(masterGain);
  windSource.start();
  currentNodes.push(windSource, windFilter);

  // Bird chirps
  const chirpInterval = setInterval(() => {
    if (!isPlaying) { clearInterval(chirpInterval); return; }
    const chirp = ctx.createOscillator();
    chirp.type = 'sine';
    const baseFreq = 1200 + Math.random() * 800;
    chirp.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    chirp.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.05);
    chirp.frequency.exponentialRampToValueAtTime(baseFreq, ctx.currentTime + 0.1);
    const chirpGain = createGain(ctx, vol * 0.08);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    chirp.connect(chirpGain);
    chirpGain.connect(ctx.destination);
    chirp.start();
    chirp.stop(ctx.currentTime + 0.15);
  }, 2000 + Math.random() * 3000);
}

// Rain: filtered noise
function playRain(vol: number) {
  const ctx = getAudioContext();
  const masterGain = createGain(ctx, vol * 0.4);
  masterGain.connect(ctx.destination);
  currentNodes.push(masterGain);

  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = (Math.random() * 2 - 1);
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Multiple filters for realistic rain
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(1000, ctx.currentTime);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(6000, ctx.currentTime);

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(masterGain);
  source.start();
  currentNodes.push(source, highpass, lowpass);
}

// White noise
function playWhiteNoise(vol: number) {
  const ctx = getAudioContext();
  const masterGain = createGain(ctx, vol * 0.15);
  masterGain.connect(ctx.destination);
  currentNodes.push(masterGain);

  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, ctx.currentTime);

  source.connect(filter);
  filter.connect(masterGain);
  source.start();
  currentNodes.push(source, filter);
}

// Cafe: chatter + clinking + soft music
function playCafe(vol: number) {
  const ctx = getAudioContext();
  const masterGain = createGain(ctx, vol * 0.25);
  masterGain.connect(ctx.destination);
  currentNodes.push(masterGain);

  // Background chatter (bandpass filtered noise)
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = (Math.random() * 2 - 1) * 0.5;
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(800, ctx.currentTime);
  bandpass.Q.setValueAtTime(0.5, ctx.currentTime);
  source.connect(bandpass);
  bandpass.connect(masterGain);
  source.start();
  currentNodes.push(source, bandpass);

  // Soft ambient pad
  const pad = ctx.createOscillator();
  pad.type = 'sine';
  pad.frequency.setValueAtTime(261.63, ctx.currentTime);
  const padGain = createGain(ctx, 0.03);
  pad.connect(padGain);
  padGain.connect(masterGain);
  pad.start();
  currentNodes.push(pad, padGain);
}

export type BgMusicType = 'none' | 'lofi' | 'nature' | 'rain' | 'whitenoise' | 'cafe';

export function startBgMusic(type: BgMusicType, volume: number = 0.3): void {
  stopAll();
  if (type === 'none') return;

  isPlaying = true;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  switch (type) {
    case 'lofi': playLoFi(volume); break;
    case 'nature': playNature(volume); break;
    case 'rain': playRain(volume); break;
    case 'whitenoise': playWhiteNoise(volume); break;
    case 'cafe': playCafe(volume); break;
  }
}

export function stopBgMusic(): void {
  stopAll();
}

export function setBgMusicVolume(volume: number): void {
  if (currentNodes.length > 0 && currentNodes[0] instanceof GainNode) {
    (currentNodes[0] as GainNode).gain.setValueAtTime(volume * 0.3, getAudioContext().currentTime);
  }
}
