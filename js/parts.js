// Klokkedeler hun kan samle: urskiver, visere, tallstiler og fargetemaer.
// Ren data og regler, ingen DOM, så alt kan testes med node.

export const CATEGORIES = [
  { id: 'face', name: 'Urskiver', single: 'urskive' },
  { id: 'hands', name: 'Visere', single: 'viserstil' },
  { id: 'numerals', name: 'Tall', single: 'tallstil' },
  { id: 'theme', name: 'Farger', single: 'fargetema' },
];

export const RARITY = {
  vanlig: { name: 'Vanlig', order: 0 },
  sjelden: { name: 'Sjelden', order: 1 },
  episk: { name: 'Episk', order: 2 },
};

// source: default | pack (fra pakker på et nivå) | level (fullfør nivået) | streak | days | total
export const PARTS = [
  // Urskiver
  { id: 'minimal', category: 'face', name: 'Minimal', rarity: 'vanlig', source: { type: 'default' } },
  { id: 'papir', category: 'face', name: 'Papir', rarity: 'vanlig', source: { type: 'pack', level: 1 } },
  { id: 'retro', category: 'face', name: 'Retro', rarity: 'vanlig', source: { type: 'pack', level: 2 } },
  { id: 'sport', category: 'face', name: 'Sport', rarity: 'vanlig', source: { type: 'pack', level: 3 } },
  { id: 'karbon', category: 'face', name: 'Karbon', rarity: 'vanlig', source: { type: 'pack', level: 5 } },
  { id: 'marmor', category: 'face', name: 'Marmor', rarity: 'sjelden', source: { type: 'level', level: 3 } },
  { id: 'neon', category: 'face', name: 'Neon', rarity: 'episk', source: { type: 'level', level: 4 } },
  { id: 'galakse', category: 'face', name: 'Galakse', rarity: 'episk', source: { type: 'level', level: 5 } },
  { id: 'midnatt', category: 'face', name: 'Midnatt', rarity: 'sjelden', source: { type: 'streak', count: 10 } },
  { id: 'gull', category: 'face', name: 'Gull', rarity: 'episk', source: { type: 'days', count: 7 } },

  // Visere
  { id: 'klassisk', category: 'hands', name: 'Klassisk', rarity: 'vanlig', source: { type: 'default' } },
  { id: 'slank', category: 'hands', name: 'Slanke', rarity: 'vanlig', source: { type: 'pack', level: 1 } },
  { id: 'blokk', category: 'hands', name: 'Blokk', rarity: 'vanlig', source: { type: 'pack', level: 2 } },
  { id: 'prikk', category: 'hands', name: 'Prikk', rarity: 'vanlig', source: { type: 'pack', level: 3 } },
  { id: 'pil', category: 'hands', name: 'Pil', rarity: 'sjelden', source: { type: 'level', level: 2 } },
  { id: 'glod', category: 'hands', name: 'Glød', rarity: 'episk', source: { type: 'streak', count: 20 } },

  // Tall
  { id: 'arabiske', category: 'numerals', name: 'Vanlige tall', rarity: 'vanlig', source: { type: 'default' } },
  { id: 'streker', category: 'numerals', name: 'Bare streker', rarity: 'vanlig', source: { type: 'pack', level: 1 } },
  { id: 'fire', category: 'numerals', name: '12, 3, 6, 9', rarity: 'vanlig', source: { type: 'pack', level: 2 } },
  { id: 'store', category: 'numerals', name: 'Store tall', rarity: 'vanlig', source: { type: 'pack', level: 4 } },
  { id: 'romerske', category: 'numerals', name: 'Romertall', rarity: 'sjelden', source: { type: 'level', level: 1 } },

  // Fargetemaer (viserfargene, også i forklaringstekstene)
  { id: 'standard', category: 'theme', name: 'Standard', rarity: 'vanlig', source: { type: 'default' } },
  { id: 'is', category: 'theme', name: 'Is', rarity: 'vanlig', source: { type: 'pack', level: 1 } },
  { id: 'skog', category: 'theme', name: 'Skog', rarity: 'vanlig', source: { type: 'pack', level: 2 } },
  { id: 'solnedgang', category: 'theme', name: 'Solnedgang', rarity: 'vanlig', source: { type: 'pack', level: 3 } },
  { id: 'godteri', category: 'theme', name: 'Godteri', rarity: 'vanlig', source: { type: 'pack', level: 4 } },
  { id: 'monokrom', category: 'theme', name: 'Monokrom', rarity: 'vanlig', source: { type: 'pack', level: 5 } },
  { id: 'lava', category: 'theme', name: 'Lava', rarity: 'sjelden', source: { type: 'days', count: 3 } },
  { id: 'aurora', category: 'theme', name: 'Aurora', rarity: 'sjelden', source: { type: 'total', count: 100 } },
];

export const partById = (id) => PARTS.find((part) => part.id === id);
export const DEFAULT_DESIGN = Object.fromEntries(PARTS.filter((p) => p.source.type === 'default').map((p) => [p.category, p.id]));

/** Kort tekst om hvordan en del låses opp, vist på tomme plasser i samlingen. */
export function howToGet(part) {
  const { source } = part;
  switch (source.type) {
    case 'default':
      return 'Har du fra start';
    case 'pack':
      return `Pakke fra nivå ${source.level}`;
    case 'level':
      return `Fullfør nivå ${source.level}`;
    case 'streak':
      return `${source.count} riktige på rad`;
    case 'days':
      return `Øv ${source.count} ulike dager`;
    case 'total':
      return `${source.count} riktige til sammen`;
    default:
      return '';
  }
}

/** Alle deler hun har gjort seg fortjent til uten pakke: nivåer og innsats. */
export function earnedParts(state) {
  const { stats, levels } = state;
  return PARTS.filter(({ source }) => {
    if (source.type === 'level') return Boolean(levels[source.level]?.passed);
    if (source.type === 'streak') return stats.bestStreak >= source.count;
    if (source.type === 'days') return stats.days.length >= source.count;
    if (source.type === 'total') return stats.correct >= source.count;
    return false;
  }).map((part) => part.id);
}

export const MIN_PACK_SCORE = 3;

/**
 * Pakken etter en runde: en tilfeldig vanlig del fra nivået hun spilte eller lavere.
 * Repeterer hun et lett nivå, går de delene tomme, og de nye finnes bare på neste nivå.
 */
export function packPool(owned, level) {
  return PARTS.filter((part) => part.source.type === 'pack' && part.source.level <= level && !owned.includes(part.id));
}

export function pickPack(owned, level, score, rng = Math.random) {
  if (score < MIN_PACK_SCORE) return null;
  const pool = packPool(owned, level);
  if (!pool.length) return null;
  // Deler fra akkurat dette nivået først, så nye nivåer føles nye.
  const fresh = pool.filter((part) => part.source.level === level);
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(rng() * from.length)].id;
}

// --- Utseende: hvordan hver del tegnes ---

const SERIF = 'Georgia, "Times New Roman", serif';
const CONDENSED = '"Avenir Next Condensed", "Arial Narrow", system-ui, sans-serif';

/** light: lys urskive, så viserne trenger mørkere farger. */
export const FACES = {
  minimal: { fill: '#15181e', ring: '#2b313b', tick: '#4a525f', tickMajor: '#c4cad3', number: '#f2f4f7', cap: '#f2f4f7' },
  papir: { light: true, fill: '#f4f0e7', ring: '#d8d0bf', tick: '#b5ad9c', tickMajor: '#3b3730', number: '#26231e', cap: '#26231e' },
  retro: { light: true, fill: '#ecdfc2', fill2: '#d4bf95', ring: '#7a5c3a', doubleRing: true, tick: '#a08863', tickMajor: '#4a3520', number: '#3a2a18', cap: '#4a3520', font: SERIF },
  sport: { fill: '#0f1317', ring: '#e8eef4', bezel: '#d7263d', tick: '#56606c', tickMajor: '#ffffff', number: '#ffffff', cap: '#d7263d', font: CONDENSED },
  karbon: { fill: '#17191c', pattern: 'carbon', ring: '#474d55', tick: '#5d646d', tickMajor: '#d5d9de', number: '#e9ecef', cap: '#d5d9de', font: CONDENSED },
  marmor: { light: true, fill: '#eeebe6', pattern: 'marble', ring: '#b9b2a6', tick: '#948c80', tickMajor: '#3d3a35', number: '#2d2a26', cap: '#2d2a26', font: SERIF },
  neon: { fill: '#08060f', ring: '#ff3df2', glow: true, tick: '#3e2d57', tickMajor: '#5ef3ff', number: '#5ef3ff', cap: '#ff3df2' },
  galakse: { fill: '#2a1a63', fill2: '#06030f', pattern: 'stars', ring: '#7b6cf0', tick: '#5b4f99', tickMajor: '#d9d2ff', number: '#efeaff', cap: '#efeaff' },
  midnatt: { fill: '#10203d', fill2: '#050912', ring: '#22396a', tick: '#2f4878', tickMajor: '#8fb4ff', number: '#dbe6ff', cap: '#8fb4ff' },
  gull: { fill: '#1d1912', fill2: '#0d0b07', ring: '#d4af37', doubleRing: true, tick: '#6b5a32', tickMajor: '#e6c766', number: '#f1d98a', cap: '#d4af37', font: SERIF },
};

/** Viserfarger på mørk og lys urskive. */
export const THEMES = {
  standard: { dark: { hour: '#ffb547', minute: '#62d6ff', second: '#ff5d73' }, light: { hour: '#d77a00', minute: '#0878b8', second: '#d62d4a' } },
  is: { dark: { hour: '#d6f6ff', minute: '#5b8cff', second: '#7ef0d8' }, light: { hour: '#1f3f73', minute: '#3d6ee8', second: '#0f9e84' } },
  skog: { dark: { hour: '#c9e265', minute: '#3fbf7f', second: '#f2c14e' }, light: { hour: '#5e7a12', minute: '#18804c', second: '#c47f00' } },
  solnedgang: { dark: { hour: '#ffcf5c', minute: '#ff7a59', second: '#c86bfa' }, light: { hour: '#c98500', minute: '#d9472a', second: '#8c2fc4' } },
  godteri: { dark: { hour: '#ff8fc7', minute: '#7ee6ff', second: '#fff275' }, light: { hour: '#d6338a', minute: '#1594b8', second: '#b39b00' } },
  monokrom: { dark: { hour: '#f2f4f7', minute: '#9aa3ae', second: '#ff5d73' }, light: { hour: '#1d2025', minute: '#6b7480', second: '#d62d4a' } },
  lava: { dark: { hour: '#ff6a3d', minute: '#ffd23f', second: '#ff2e63' }, light: { hour: '#c73e12', minute: '#b88a00', second: '#c4103f' } },
  aurora: { dark: { hour: '#7cffb2', minute: '#b58cff', second: '#5ce1ff' }, light: { hour: '#0f9150', minute: '#6b3fd1', second: '#0b8fb3' } },
};

/** Gjør del-id-er om til farger og former klokka kan tegne. */
export function resolveDesign(ids = {}) {
  const design = { ...DEFAULT_DESIGN, ...ids };
  const face = FACES[design.face] ?? FACES.minimal;
  const theme = THEMES[design.theme] ?? THEMES.standard;
  return {
    ids: design,
    face,
    hands: design.hands,
    numerals: design.numerals,
    colors: face.light ? theme.light : theme.dark,
    textColors: theme.dark,
  };
}
