// Flappy Remake - Character Customization & Theme Picker
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const customModalBtn = document.getElementById('custom-modal-btn');
const gameoverCustomBtn = document.getElementById('gameover-custom-btn');
const customModal = document.getElementById('custom-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalDoneBtn = document.getElementById('modal-done-btn');
const tabCharsBtn = document.getElementById('tab-chars-btn');
const tabThemesBtn = document.getElementById('tab-themes-btn');
const charsView = document.getElementById('chars-view');
const themesView = document.getElementById('themes-view');

const heroAvatar = document.getElementById('hero-avatar');
const heroName = document.getElementById('hero-name');
const heroBadge = document.getElementById('hero-badge');
const titleTag = document.getElementById('title-tag');

const finalScoreEl = document.getElementById('final-score');
const highScoreEl = document.getElementById('high-score');
const startHighScoreEl = document.getElementById('start-high-score');
const medalEl = document.getElementById('medal');
const scoreHistoryList = document.getElementById('score-history-list');

const pokemonGrid = document.getElementById('pokemon-chars-grid');
const animeGrid = document.getElementById('anime-chars-grid');
const cartoonGrid = document.getElementById('cartoon-chars-grid');
const themesGrid = document.getElementById('themes-grid');

//#region Game
// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Sound Synthesizer
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  if (type === 'flap') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    const baseFreq = currentChar.soundPitch || 550;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.11);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  } else if (type === 'score') {
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.2, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.04 + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.22);
    });
  } else if (type === 'hit') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  } else if (type === 'die') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

// CHARACTERS DATABASE
const CHARACTERS = [
  // Pokémon
  {
    id: 'sylveon',
    name: 'Sylveon',
    category: 'pokemon',
    icon: '🎀',
    badge: 'FAIRY POKÉMON',
    tagline: 'FAIRY',
    primaryColor: '#f7f0e6',
    secondaryColor: '#ff9ebb',
    ribbonColor: '#38bdf8',
    particle: 'heart',
    soundPitch: 620,
    draw(ctx, flapFrame) {
      // Sylveon head & long ears with ribbons
      ctx.save();
      // Body / Head
      ctx.fillStyle = '#fdf8f4';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#d81b60';
      ctx.stroke();

      // Ears
      const earFlap = Math.sin(flapFrame) * 3;
      // Left ear
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.quadraticCurveTo(-18, -26 + earFlap, -8, -28 + earFlap);
      ctx.quadraticCurveTo(-4, -14, -4, -8);
      ctx.fillStyle = '#ff80bf';
      ctx.fill();
      ctx.stroke();
      // Inner blue ear tip
      ctx.beginPath();
      ctx.arc(-11, -23 + earFlap, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Right ear
      ctx.beginPath();
      ctx.moveTo(3, -8);
      ctx.quadraticCurveTo(8, -28 + earFlap, 18, -25 + earFlap);
      ctx.quadraticCurveTo(12, -12, 8, -7);
      ctx.fillStyle = '#ff80bf';
      ctx.fill();
      ctx.stroke();
      // Inner blue tip
      ctx.beginPath();
      ctx.arc(12, -22 + earFlap, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Cheeks
      ctx.beginPath();
      ctx.arc(6, 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 105, 180, 0.5)';
      ctx.fill();

      // Sylveon Bow 🎀 on left ear
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-8, -9, 4, 3, -0.4, 0, Math.PI * 2);
      ctx.ellipse(-2, -9, 4, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-5, -9, 2, 0, Math.PI * 2);
      ctx.fill();

      // Flowing Fairy Ribbons trailing behind
      const ribbonWave = Math.sin(flapFrame * 1.5) * 6;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#fce7f3';
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.bezierCurveTo(-18, -4 + ribbonWave, -25, 4 - ribbonWave, -32, 2 + ribbonWave);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-5, -6);
      ctx.bezierCurveTo(-14, 2 - ribbonWave, -20, 10 + ribbonWave, -28, 9 - ribbonWave);
      ctx.stroke();

      // Big Sparkly Blue Eyes
      ctx.beginPath();
      ctx.ellipse(7, -2, 5, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(8, -4.5, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Tiny nose & smile
      ctx.beginPath();
      ctx.arc(13, 1, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#be185d';
      ctx.fill();
      ctx.restore();
    }
  },
  {
    id: 'pikachu',
    name: 'Pikachu',
    category: 'pokemon',
    icon: '⚡',
    badge: 'ELECTRIC POKÉMON',
    tagline: 'VOLT',
    primaryColor: '#fde047',
    particle: 'star',
    soundPitch: 680,
    draw(ctx, flapFrame) {
      ctx.save();
      // Body
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ca8a04';
      ctx.stroke();

      // Ears with black tips
      const earFlap = Math.sin(flapFrame) * 4;
      // Left ear
      ctx.beginPath();
      ctx.moveTo(-10, -7);
      ctx.lineTo(-20, -25 + earFlap);
      ctx.lineTo(-12, -26 + earFlap);
      ctx.lineTo(-4, -8);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.stroke();
      // Black tip
      ctx.beginPath();
      ctx.moveTo(-17, -20 + earFlap);
      ctx.lineTo(-20, -25 + earFlap);
      ctx.lineTo(-12, -26 + earFlap);
      ctx.lineTo(-11, -19 + earFlap);
      ctx.fillStyle = '#111';
      ctx.fill();

      // Right ear
      ctx.beginPath();
      ctx.moveTo(3, -7);
      ctx.lineTo(16, -26 + earFlap);
      ctx.lineTo(22, -20 + earFlap);
      ctx.lineTo(7, -6);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.stroke();
      // Black tip
      ctx.beginPath();
      ctx.moveTo(12, -18 + earFlap);
      ctx.lineTo(16, -26 + earFlap);
      ctx.lineTo(22, -20 + earFlap);
      ctx.lineTo(16, -14 + earFlap);
      ctx.fillStyle = '#111';
      ctx.fill();

      // Rosy Red Cheeks
      ctx.beginPath();
      ctx.arc(6, 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // Eye
      ctx.beginPath();
      ctx.arc(7, -3, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(8.5, -4.5, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Lightning tail behind
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ca8a04';
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(-12, 2);
      ctx.lineTo(-19, -4);
      ctx.lineTo(-20, 2);
      ctx.lineTo(-28, -6);
      ctx.stroke();
      ctx.restore();
    }
  },
  {
    id: 'jigglypuff',
    name: 'Jigglypuff',
    category: 'pokemon',
    icon: '🎤',
    badge: 'BALLOON POKÉMON',
    tagline: 'LULLABY',
    primaryColor: '#fbcfe8',
    particle: 'music',
    soundPitch: 720,
    draw(ctx, flapFrame) {
      ctx.save();
      // Round balloon body
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f472b6';
      ctx.stroke();

      // Pointy ears with brown insides
      // Left ear
      ctx.beginPath();
      ctx.moveTo(-11, -10);
      ctx.lineTo(-16, -22);
      ctx.lineTo(-4, -15);
      ctx.fillStyle = '#fbcfe8';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, -11);
      ctx.lineTo(-14, -19);
      ctx.lineTo(-6, -15);
      ctx.fillStyle = '#831843';
      ctx.fill();

      // Right ear
      ctx.beginPath();
      ctx.moveTo(3, -15);
      ctx.lineTo(14, -22);
      ctx.lineTo(11, -10);
      ctx.fillStyle = '#fbcfe8';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, -14);
      ctx.lineTo(11, -19);
      ctx.lineTo(9, -10);
      ctx.fillStyle = '#831843';
      ctx.fill();

      // Big swirl tuft of hair
      ctx.beginPath();
      ctx.arc(-2, -13, 6, 0, Math.PI * 1.6);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Huge teal anime eyes
      ctx.beginPath();
      ctx.arc(6, -2, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(7.5, -4, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }
  },
  {
    id: 'eevee',
    name: 'Eevee',
    category: 'pokemon',
    icon: '🦊',
    badge: 'EVOLUTION POKÉMON',
    tagline: 'EEVEE',
    primaryColor: '#c29062',
    particle: 'star',
    soundPitch: 580,
    draw(ctx, flapFrame) {
      ctx.save();
      // Body
      ctx.fillStyle = '#b47b48';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#78431e';
      ctx.stroke();

      // Fluffy Cream Collar
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(-5, 6, 12, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Long Fox Ears
      const earWave = Math.sin(flapFrame) * 3;
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(-20, -26 + earWave);
      ctx.lineTo(-7, -14);
      ctx.fillStyle = '#b47b48';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(3, -9);
      ctx.lineTo(15, -26 + earWave);
      ctx.lineTo(8, -8);
      ctx.fillStyle = '#b47b48';
      ctx.fill();
      ctx.stroke();

      // Big Brown Eyes
      ctx.beginPath();
      ctx.ellipse(6, -2, 4.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(7.5, -4, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }
  },

  // Anime
  {
    id: 'sailormoon',
    name: 'Usagi / Sailor',
    category: 'anime',
    icon: '🌙',
    badge: 'MOON PRINCESS',
    tagline: 'MOON',
    primaryColor: '#fef08a',
    particle: 'star',
    soundPitch: 640,
    draw(ctx, flapFrame) {
      ctx.save();
      // Head
      ctx.fillStyle = '#ffe4e6';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#f43f5e';
      ctx.stroke();

      // Golden Tiara with red jewel
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-7, -8, 14, 3);
      ctx.beginPath();
      ctx.arc(0, -6.5, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // Odango Hair Buns (Meatballs)
      const pigtailFlap = Math.sin(flapFrame) * 4;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-8, -13, 5, 0, Math.PI * 2);
      ctx.arc(8, -13, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.stroke();

      // Flowing twin pigtails behind
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.quadraticCurveTo(-22, -8 + pigtailFlap, -30, -2 + pigtailFlap);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(6, -10);
      ctx.quadraticCurveTo(-14, 2 + pigtailFlap, -24, 8 + pigtailFlap);
      ctx.stroke();

      // Anime blue eyes
      ctx.beginPath();
      ctx.ellipse(4, -1, 4, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2563eb';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -3, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }
  },
  {
    id: 'totoro',
    name: 'Totoro',
    category: 'anime',
    icon: '🍃',
    badge: 'FOREST SPIRIT',
    tagline: 'TOTORO',
    primaryColor: '#94a3b8',
    particle: 'leaf',
    soundPitch: 480,
    draw(ctx, flapFrame) {
      ctx.save();
      // Grey chubby body
      ctx.fillStyle = '#7e8b9b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      // White Belly
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(3, 3, 9, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Little belly chevrons
      ctx.fillStyle = '#7e8b9b';
      ctx.beginPath();
      ctx.arc(3, 1, 2, Math.PI, 0);
      ctx.arc(6, 4, 2, Math.PI, 0);
      ctx.fill();

      // Pointy ears
      ctx.beginPath();
      ctx.ellipse(-7, -15, 3, 6, -0.2, 0, Math.PI * 2);
      ctx.ellipse(5, -15, 3, 6, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#7e8b9b';
      ctx.fill();
      ctx.stroke();

      // Whiskers
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(8, -1);
      ctx.lineTo(17, -3);
      ctx.moveTo(8, 2);
      ctx.lineTo(17, 3);
      ctx.stroke();

      // Round wide eyes
      ctx.beginPath();
      ctx.arc(5, -4, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(6, -4, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      ctx.restore();
    }
  },
  {
    id: 'nezuko',
    name: 'Nezuko',
    category: 'anime',
    icon: '🎋',
    badge: 'DEMON SLAYER',
    tagline: 'NEZUKO',
    primaryColor: '#f43f5e',
    particle: 'heart',
    soundPitch: 600,
    draw(ctx, flapFrame) {
      ctx.save();
      // Hair back
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();

      // Orange ribbon tips on hair
      const wave = Math.sin(flapFrame) * 4;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(-20, 6 + wave, -28, 4 + wave);
      ctx.stroke();

      // Pale cute face
      ctx.fillStyle = '#fff1f2';
      ctx.beginPath();
      ctx.arc(2, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Pink anime demon eyes
      ctx.beginPath();
      ctx.ellipse(6, -3, 4, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(7, -4.5, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Bamboo Muzzle 🎋
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(4, 2, 11, 5, 2) : ctx.rect(4, 2, 11, 5);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#4d7c0f';
      ctx.stroke();
      ctx.strokeStyle = '#dc2626';
      ctx.strokeRect(2, 3, 15, 2);

      // Pink hair ribbon
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(-2, -9, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  // Cartoons & Classics
  {
    id: 'hellokitty',
    name: 'Hello Kitty',
    category: 'cartoon',
    icon: '🐱',
    badge: 'SANRIO ICON',
    tagline: 'KITTY',
    primaryColor: '#ffffff',
    particle: 'heart',
    soundPitch: 670,
    draw(ctx, flapFrame) {
      ctx.save();
      // White Oval Kitty Head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#1e1b4b';
      ctx.stroke();

      // Kitty Ears
      ctx.beginPath();
      ctx.moveTo(-12, -7);
      ctx.lineTo(-17, -19);
      ctx.lineTo(-6, -11);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(4, -11);
      ctx.lineTo(15, -19);
      ctx.lineTo(11, -7);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      // Red Bow 🎀 on left ear
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(-10, -11, 5, 4, -0.3, 0, Math.PI * 2);
      ctx.ellipse(-4, -13, 5, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(-7, -12, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Oval eyes
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(3, -2, 2, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Yellow nose
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(9, 1, 2.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Whiskers
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(11, -3);
      ctx.lineTo(18, -4);
      ctx.moveTo(11, 3);
      ctx.lineTo(18, 5);
      ctx.stroke();
      ctx.restore();
    }
  },
  {
    id: 'kirby',
    name: 'Kirby',
    category: 'cartoon',
    icon: '⭐',
    badge: 'STAR WARRIOR',
    tagline: 'KIRBY',
    primaryColor: '#f472b6',
    particle: 'star',
    soundPitch: 650,
    draw(ctx, flapFrame) {
      ctx.save();
      // Round pink puffball
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#db2777';
      ctx.stroke();

      // Flapping Little Arms
      const armWave = Math.sin(flapFrame) * 4;
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.ellipse(-13, armWave, 5, 4, -0.3, 0, Math.PI * 2);
      ctx.ellipse(13, -armWave, 5, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red feet
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.ellipse(-5, 12, 7, 4, 0.2, 0, Math.PI * 2);
      ctx.ellipse(5, 12, 7, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Rosy Cheeks
      ctx.beginPath();
      ctx.ellipse(-4, 3, 3, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(6, 3, 3, 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fb7185';
      ctx.fill();

      // Big Blue Eyes
      ctx.beginPath();
      ctx.ellipse(2, -3, 3, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1e3a8a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(2, -5, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Open smile
      ctx.beginPath();
      ctx.arc(2, 1, 2.5, 0, Math.PI);
      ctx.fillStyle = '#9f1239';
      ctx.fill();
      ctx.restore();
    }
  },
  {
    id: 'classicpink',
    name: 'Bubbly Bird',
    category: 'cartoon',
    icon: '🐥',
    badge: 'ORIGINAL CHIRP',
    tagline: 'BUBBLY',
    primaryColor: '#ff99cc',
    particle: 'heart',
    soundPitch: 550,
    draw(ctx, flapFrame) {
      ctx.save();
      // Body
      const bodyGrad = ctx.createRadialGradient(-2, -3, 3, 0, 0, 18);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.35, '#ff99cc');
      bodyGrad.addColorStop(1, '#ff66aa');
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#d81b60';
      ctx.stroke();

      // Cheek
      ctx.beginPath();
      ctx.arc(6, 4, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 20, 147, 0.6)';
      ctx.fill();

      // Wing
      const wingY = Math.sin(flapFrame) * 4;
      ctx.beginPath();
      ctx.ellipse(-7, wingY, 7, 5, -0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#fff0f5';
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#ff66aa';
      ctx.stroke();

      // Anime Eye
      ctx.beginPath();
      ctx.ellipse(7, -3, 5.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#4a0e4e';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(8.5, -5.5, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Beak
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(19, 3);
      ctx.lineTo(11, 6);
      ctx.closePath();
      ctx.fillStyle = '#ff70a6';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#c2185b';
      ctx.stroke();

      // Bow
      ctx.translate(-4, -13);
      ctx.fillStyle = '#ff1493';
      ctx.beginPath();
      ctx.ellipse(-4, 0, 4, 3, -0.4, 0, Math.PI * 2);
      ctx.ellipse(4, 0, 4, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
];

// THEMES DATABASE
const THEMES = [
  {
    id: 'fairy-pastel',
    name: 'Fairy Blossom (Pastel)',
    icon: '🌸',
    desc: 'Sweet candy skies, strawberry frosting ground & bubbles',
    skyTop: '#e8dff5',
    skyMid: '#ffd1dc',
    skyBottom: '#ffccd5',
    pipeGradient: ['#ffb3d9', '#ffe6f2', '#ff80bf'],
    pipeBorder: '#ff4d94',
    pipeCapIcon: '💖',
    groundColor: '#ffccd5',
    groundBorder: '#ff85a1',
    scallopColor: '#ff85a1',
    hasBubbles: true
  },
  {
    id: 'sakura-anime',
    name: 'Sakura Twilight',
    icon: '⛩️',
    desc: 'Japanese sunset lavender gradient with falling cherry blossoms',
    skyTop: '#4a154b',
    skyMid: '#a855f7',
    skyBottom: '#f472b6',
    pipeGradient: ['#fbcfe8', '#ffffff', '#f472b6'],
    pipeBorder: '#c026d3',
    pipeCapIcon: '🌸',
    groundColor: '#701a75',
    groundBorder: '#d946ef',
    scallopColor: '#f472b6',
    hasPetals: true
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Pop / Neon',
    icon: '✨',
    desc: 'Deep retro synthwave galaxy with glowing neon pipes',
    skyTop: '#0f172a',
    skyMid: '#312e81',
    skyBottom: '#0284c7',
    pipeGradient: ['#06b6d4', '#67e8f9', '#0891b2'],
    pipeBorder: '#22d3ee',
    pipeCapIcon: '⚡',
    groundColor: '#0f172a',
    groundBorder: '#38bdf8',
    scallopColor: '#a855f7',
    hasStars: true
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy Sky',
    icon: '☁️',
    desc: 'Soft baby blue & marshmallow cloud dreamscape',
    skyTop: '#bae6fd',
    skyMid: '#e0f2fe',
    skyBottom: '#fce7f3',
    pipeGradient: ['#7dd3fc', '#ffffff', '#38bdf8'],
    pipeBorder: '#0284c7',
    pipeCapIcon: '⭐',
    groundColor: '#fed7aa',
    groundBorder: '#f472b6',
    scallopColor: '#38bdf8',
    hasBubbles: true
  }
];

// USER PREFERENCES (Stored in localStorage)
const STORAGE_KEY_CHAR = 'flappy_selected_char_v2';
const STORAGE_KEY_THEME = 'flappy_selected_theme_v2';
const STORAGE_KEY_HIGH = 'flappy_high_score_v2';
const STORAGE_KEY_HISTORY = 'flappy_score_history_v2';

let currentCharId = localStorage.getItem(STORAGE_KEY_CHAR) || 'sylveon'; // Sylveon by default!
let currentThemeId = localStorage.getItem(STORAGE_KEY_THEME) || 'fairy-pastel';

let currentChar = CHARACTERS.find(c => c.id === currentCharId) || CHARACTERS[0];
let currentTheme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];

function selectCharacter(charId) {
  const found = CHARACTERS.find(c => c.id === charId);
  if (!found) return;
  currentChar = found;
  localStorage.setItem(STORAGE_KEY_CHAR, charId);
  updateHeroPreview();
  renderCustomizerLists();
}

function selectTheme(themeId) {
  const found = THEMES.find(t => t.id === themeId);
  if (!found) return;
  currentTheme = found;
  localStorage.setItem(STORAGE_KEY_THEME, themeId);
  renderCustomizerLists();
}

function updateHeroPreview() {
  if (heroAvatar) heroAvatar.textContent = currentChar.icon;
  if (heroName) heroName.textContent = currentChar.name;
  if (heroBadge) heroBadge.textContent = currentChar.badge;
  if (titleTag) titleTag.textContent = currentChar.tagline;
}

// Populate Customization Drawers
function renderCustomizerLists() {
  // Clear grids
  if (pokemonGrid) pokemonGrid.innerHTML = '';
  if (animeGrid) animeGrid.innerHTML = '';
  if (cartoonGrid) cartoonGrid.innerHTML = '';
  if (themesGrid) themesGrid.innerHTML = '';

  // Render Characters into grids
  CHARACTERS.forEach(char => {
    const card = document.createElement('div');
    card.className = `char-item-card ${char.id === currentChar.id ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="char-icon">${char.icon}</div>
      <div class="char-name">${char.name}</div>
    `;
    card.onclick = () => selectCharacter(char.id);

    if (char.category === 'pokemon' && pokemonGrid) {
      pokemonGrid.appendChild(card);
    } else if (char.category === 'anime' && animeGrid) {
      animeGrid.appendChild(card);
    } else if (cartoonGrid) {
      cartoonGrid.appendChild(card);
    }
  });

  // Render Themes
  THEMES.forEach(th => {
    const card = document.createElement('div');
    card.className = `theme-card ${th.id === currentTheme.id ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="theme-preview-box" style="background: linear-gradient(135deg, ${th.skyTop}, ${th.skyBottom})">
        ${th.icon}
      </div>
      <div class="theme-details">
        <div class="theme-name">${th.name}</div>
        <div class="theme-desc">${th.desc}</div>
      </div>
    `;
    card.onclick = () => selectTheme(th.id);
    if (themesGrid) themesGrid.appendChild(card);
  });
}

// Modal Toggle Handlers
function openCustomModal(tab = 'chars') {
  renderCustomizerLists();
  customModal.classList.remove('hidden');
  switchTab(tab);
}

function closeCustomModal() {
  customModal.classList.add('hidden');
}

function switchTab(tab) {
  if (tab === 'chars') {
    tabCharsBtn.classList.add('active');
    tabThemesBtn.classList.remove('active');
    charsView.classList.remove('hidden');
    themesView.classList.add('hidden');
  } else {
    tabThemesBtn.classList.add('active');
    tabCharsBtn.classList.remove('active');
    themesView.classList.remove('hidden');
    charsView.classList.add('hidden');
  }
}

customModalBtn.onclick = () => openCustomModal('chars');
gameoverCustomBtn.onclick = () => openCustomModal('chars');
modalCloseBtn.onclick = closeCustomModal;
modalDoneBtn.onclick = closeCustomModal;
tabCharsBtn.onclick = () => switchTab('chars');
tabThemesBtn.onclick = () => switchTab('themes');

// History & High Scores
function loadStoredData() {
  const high = parseInt(localStorage.getItem(STORAGE_KEY_HIGH) || '0', 10);
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
  } catch (e) {
    history = [];
  }
  return { high, history };
}

function saveScoreRun(newScore) {
  let { high, history } = loadStoredData();
  if (newScore > high) {
    high = newScore;
    localStorage.setItem(STORAGE_KEY_HIGH, high.toString());
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  history.unshift({ score: newScore, time: timeStr, charName: currentChar.name });
  if (history.length > 5) {
    history = history.slice(0, 5);
  }
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  return { high, history };
}

function renderHistoryUI() {
  const { high, history } = loadStoredData();
  if (startHighScoreEl) startHighScoreEl.textContent = high;
  if (highScoreEl) highScoreEl.textContent = high;

  if (scoreHistoryList) {
    scoreHistoryList.innerHTML = '';
    if (history.length === 0) {
      scoreHistoryList.innerHTML = '<li><span>No flights yet 💕</span><span>-</span></li>';
    } else {
      history.forEach((item, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${idx + 1} ${item.charName || 'Sylveon'} (${item.time})</span><span class="score-num">${item.score} 💖</span>`;
        scoreHistoryList.appendChild(li);
      });
    }
  }
}

// Initial UI Setup
updateHeroPreview();
renderHistoryUI();

// GAME LOOP & PHYSICS
const STATE = { START: 0, PLAYING: 1, GAMEOVER: 2 };
let gameState = STATE.START;
let frames = 0;
let score = 0;

const GROUND_Y = 540;
const GRAVITY = 0.25;
const FLAP_STRENGTH = -5.6;

// Ambient Floating Bubbles
const ambientBubbles = [];
for (let i = 0; i < 22; i++) {
  ambientBubbles.push({
    x: Math.random() * 360,
    y: Math.random() * 640,
    r: Math.random() * 8 + 3,
    speedY: Math.random() * 0.6 + 0.3,
    wobble: Math.random() * Math.PI * 2,
    alpha: Math.random() * 0.4 + 0.3
  });
}

// Particles (Hearts, Stars, Petals)
let particles = [];
function addSparkles(x, y, count, type = 'heart') {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4.5,
      vy: (Math.random() - 0.6) * 4,
      size: Math.random() * 6 + 3,
      alpha: 1,
      decay: Math.random() * 0.025 + 0.015,
      type: type,
      color: ['#ff69b4', '#ffb6c1', '#ffd1dc', '#fff', '#e0bbff', '#b5e2fa'][Math.floor(Math.random() * 6)]
    });
  }
}

// Dynamic Bird / Hero Object
const bird = {
  x: 75,
  y: 280,
  radius: 14,
  velocity: 0,
  rotation: 0,
  flapFrame: 0,

  reset() {
    this.x = 75;
    this.y = 280;
    this.velocity = 0;
    this.rotation = 0;
    this.flapFrame = 0;
  },

  flap() {
    this.velocity = FLAP_STRENGTH;
    playSound('flap');
    addSparkles(this.x - 10, this.y + 6, 7, currentChar.particle || 'heart');
  },

  update() {
    this.flapFrame += 0.16;
    if (gameState === STATE.START) {
      this.y = 280 + Math.sin(frames * 0.07) * 9;
      this.rotation = 0;
      return;
    }

    this.velocity += GRAVITY;
    this.y += this.velocity;

    if (this.velocity < 0) {
      this.rotation = Math.max(-0.4, this.velocity * 0.07);
    } else {
      this.rotation = Math.min(Math.PI / 2.2, (this.velocity - 2) * 0.1);
    }

    if (this.y + this.radius >= GROUND_Y) {
      this.y = GROUND_Y - this.radius;
      if (gameState === STATE.PLAYING) {
        triggerGameOver();
      }
    }

    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.velocity = 0;
    }
  },

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Call dynamic character drawing function
    if (currentChar && currentChar.draw) {
      currentChar.draw(ctx, this.flapFrame);
    }

    ctx.restore();
  }
};

// Dynamic Themed Pipes
const pipes = {
  items: [],
  width: 54,
  gap: 132,
  dx: 2.1,

  reset() {
    this.items = [];
  },

  spawn() {
    const minTop = 60;
    const maxTop = GROUND_Y - this.gap - 70;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

    this.items.push({
      x: canvas.width + 10,
      top: topHeight,
      bottom: GROUND_Y - (topHeight + this.gap),
      passed: false
    });
  },

  update() {
    if (gameState !== STATE.PLAYING) return;

    if (frames % 105 === 0) {
      this.spawn();
    }

    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      p.x -= this.dx;

      if (!p.passed && p.x + this.width < bird.x) {
        p.passed = true;
        score++;
        playSound('score');
        addSparkles(bird.x, bird.y - 18, 12, 'star');
      }

      const birdBox = {
        left: bird.x - bird.radius + 3,
        right: bird.x + bird.radius - 3,
        top: bird.y - bird.radius + 3,
        bottom: bird.y + bird.radius - 3
      };

      if (
        birdBox.right > p.x &&
        birdBox.left < p.x + this.width &&
        birdBox.top < p.top
      ) {
        triggerGameOver();
        return;
      }

      const bottomPipeY = GROUND_Y - p.bottom;
      if (
        birdBox.right > p.x &&
        birdBox.left < p.x + this.width &&
        birdBox.bottom > bottomPipeY
      ) {
        triggerGameOver();
        return;
      }
    }

    if (this.items.length && this.items[0].x < -this.width) {
      this.items.shift();
    }
  },

  draw() {
    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      const bottomPipeY = GROUND_Y - p.bottom;

      this.renderPipe(p.x, 0, this.width, p.top, true);
      this.renderPipe(p.x, bottomPipeY, this.width, p.bottom, false);
    }
  },

  renderPipe(x, y, w, h, isTop) {
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, currentTheme.pipeGradient[0]);
    grad.addColorStop(0.35, currentTheme.pipeGradient[1]);
    grad.addColorStop(1, currentTheme.pipeGradient[2]);

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = currentTheme.pipeBorder;
    ctx.strokeRect(x, y, w, h);

    // Decorative polka dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (let dotY = y + 16; dotY < y + h - 16; dotY += 28) {
      ctx.beginPath();
      ctx.arc(x + 18, dotY, 4, 0, Math.PI * 2);
      ctx.arc(x + 36, dotY + 14, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pipe Cap
    const capHeight = 24;
    const capExtra = 5;
    const capX = x - capExtra;
    const capW = w + capExtra * 2;
    const capY = isTop ? (y + h - capHeight) : y;

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(capX, capY, capW, capHeight, 6) : ctx.rect(capX, capY, capW, capHeight);
    ctx.fill();
    ctx.strokeStyle = currentTheme.pipeBorder;
    ctx.stroke();

    // Theme Pipe Cap Icon
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentTheme.pipeCapIcon || '💖', capX + capW / 2, capY + capHeight / 2);
  }
};

// Dynamic Background Environment
let bgOffset = 0;
let groundOffset = 0;

function drawBackground() {
  // Theme Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, currentTheme.skyTop);
  skyGrad.addColorStop(0.5, currentTheme.skyMid);
  skyGrad.addColorStop(1, currentTheme.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, GROUND_Y);

  // Distant Buildings / Turrets
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  const bldgWidth = 36;
  const numBldgs = Math.ceil(canvas.width / bldgWidth) + 2;
  const shift = (bgOffset * 0.2) % bldgWidth;
  for (let i = -1; i < numBldgs; i++) {
    const bx = i * bldgWidth - shift;
    const bh = 55 + ((i * 43) % 55);
    ctx.fillRect(bx, GROUND_Y - bh, bldgWidth - 2, bh);
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y - bh);
    ctx.lineTo(bx + (bldgWidth - 2) / 2, GROUND_Y - bh - 16);
    ctx.lineTo(bx + bldgWidth - 2, GROUND_Y - bh);
    ctx.fill();
  }

  // Soft Rolling Hills
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  const hillWidth = 54;
  const hShift = (bgOffset * 0.45) % hillWidth;
  for (let i = -1; i < Math.ceil(canvas.width / hillWidth) + 2; i++) {
    const hx = i * hillWidth - hShift;
    ctx.beginPath();
    ctx.arc(hx + 27, GROUND_Y, 27, Math.PI, 0);
    ctx.fill();
  }

  // Floating Ambient Bubbles / Sparkles
  for (let b of ambientBubbles) {
    b.y -= b.speedY;
    b.wobble += 0.03;
    if (b.y < -20) {
      b.y = canvas.height + 10;
      b.x = Math.random() * canvas.width;
    }
    const wobX = b.x + Math.sin(b.wobble) * 8;
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.beginPath();
    ctx.arc(wobX, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  }

  // Clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  drawFluffyCloud(70 - (bgOffset * 0.15) % (canvas.width + 130), 85, 0.85);
  drawFluffyCloud(250 - (bgOffset * 0.15) % (canvas.width + 130), 140, 1.15);

  // Ground
  ctx.fillStyle = currentTheme.groundColor;
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

  // Scalloped border
  ctx.fillStyle = currentTheme.scallopColor;
  const scallopW = 20;
  const sShift = groundOffset % scallopW;
  for (let x = -scallopW; x < canvas.width + scallopW * 2; x += scallopW) {
    ctx.beginPath();
    ctx.arc(x - sShift + 10, GROUND_Y + 7, 10, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillRect(0, GROUND_Y, canvas.width, 8);

  // Ground Sprinkles
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, GROUND_Y + 16, canvas.width, canvas.height - GROUND_Y - 16);
  ctx.clip();
  const sprinkleSpacing = 24;
  const gShift = groundOffset % sprinkleSpacing;
  const sprinkleColors = ['#ff4081', '#7b2cbf', '#00b4d8', '#ffd166', '#ffffff'];
  for (let x = -sprinkleSpacing; x < canvas.width + sprinkleSpacing * 2; x += sprinkleSpacing) {
    for (let sy = GROUND_Y + 22; sy < canvas.height - 10; sy += 20) {
      ctx.fillStyle = sprinkleColors[(Math.floor(x + sy)) % sprinkleColors.length];
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x - gShift, sy, 8, 4, 2) : ctx.rect(x - gShift, sy, 8, 4);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = currentTheme.groundBorder;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(canvas.width, GROUND_Y);
  ctx.stroke();
}

function drawFluffyCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.arc(15, -8, 16, 0, Math.PI * 2);
  ctx.arc(32, -4, 14, 0, Math.PI * 2);
  ctx.arc(42, 0, 12, 0, Math.PI * 2);
  ctx.arc(20, 8, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLiveScore() {
  if (gameState !== STATE.PLAYING) return;
  ctx.save();
  ctx.font = '26px "Press Start 2P", cursive';
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff1493';
  ctx.fillText(score, canvas.width / 2 + 2, 72);
  ctx.fillText(score, canvas.width / 2 - 2, 72);
  ctx.fillText(score, canvas.width / 2, 74);
  ctx.fillText(score, canvas.width / 2, 70);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(score, canvas.width / 2, 72);
  ctx.restore();
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    } else {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'heart') {
        ctx.font = `${Math.floor(p.size * 2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('💖', p.x, p.y);
      } else if (p.type === 'music') {
        ctx.font = `${Math.floor(p.size * 1.8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🎵', p.x, p.y);
      } else if (p.type === 'leaf') {
        ctx.font = `${Math.floor(p.size * 1.8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🍃', p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

function startGame() {
  initAudio();
  window.aiPlaybackActive = false;
  gameState = STATE.PLAYING;
  score = 0;
  frames = 0;
  particles = [];
  bird.reset();
  pipes.reset();
  bird.flap();

  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
}

function triggerGameOver() {
  if (gameState !== STATE.PLAYING) return;
  gameState = STATE.GAMEOVER;
  window.aiPlaybackActive = false;
  playSound('hit');
  setTimeout(() => playSound('die'), 120);

  saveScoreRun(score);
  renderHistoryUI();

  finalScoreEl.textContent = score;

  medalEl.className = 'medal-slot';
  medalEl.textContent = '';
  if (score >= 40) {
    medalEl.classList.add('platinum');
    medalEl.textContent = '👑';
  } else if (score >= 25) {
    medalEl.classList.add('gold');
    medalEl.textContent = '💖';
  } else if (score >= 10) {
    medalEl.classList.add('silver');
    medalEl.textContent = '🎀';
  } else if (score >= 5) {
    medalEl.classList.add('bronze');
    medalEl.textContent = '🌸';
  }

  gameOverScreen.classList.remove('hidden');
}

let lastActionTime = 0;
function handleUserAction() {
  if (!customModal.classList.contains('hidden')) return;
  if (window.aiPlaybackActive) return;
  initAudio();
  const now = Date.now();
  if (now - lastActionTime < 140) return;
  lastActionTime = now;

  if (gameState === STATE.START) {
    startGame();
  } else if (gameState === STATE.PLAYING) {
    bird.flap();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    if (!e.repeat) {
      handleUserAction();
    }
  }
});

let usedTouch = false;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  usedTouch = true;
  handleUserAction();
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
  if (usedTouch) {
    usedTouch = false;
    return;
  }
  e.preventDefault();
  handleUserAction();
});

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

restartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

function loop() {
  if (window.liveEvolutionActive) {
    requestAnimationFrame(loop);
    return;
  }

  frames++;

  if (gameState !== STATE.GAMEOVER) {
    bgOffset += 0.8;
    groundOffset += pipes.dx;
  }

  if (
    window.aiPlaybackActive &&
    gameState === STATE.PLAYING &&
    window.bestGenomeForPlayback &&
    typeof getObservation === 'function' &&
    typeof chooseAction === 'function'
  ) {
    const observation = getObservation();
    if (chooseAction(window.bestGenomeForPlayback, observation) === 1) {
      bird.flap();
    }
  }

  bird.update();
  pipes.update();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  pipes.draw();
  bird.draw();
  updateParticles();
  drawLiveScore();

  requestAnimationFrame(loop);
}

loop();
//#endregion Game

//#region RL Learning
function getGameState() {
  return {
    birdY: bird.y,
    birdVelocity: bird.velocity,
    score,
    pipes: pipes.items
  };
}

//#endregion RL Learning