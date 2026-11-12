// All fremdrift ligger i localStorage under én nøkkel. Ingenting sendes noe sted.
import { DEFAULT_DESIGN, PARTS, partById } from './parts.js';
import { todayKey } from './time.js';

const KEY = 'tikk-v1';
const PASS_SCORE = 4; // riktige av 5 for å låse opp neste nivå

const fresh = () => ({
  version: 1,
  sound: true,
  unlockAll: false,
  levels: {},
  stats: { answered: 0, correct: 0, streak: 0, bestStreak: 0, days: [] },
  owned: [], // deler hun har fått (standarddelene er alltid hennes)
  pending: [], // uåpnede pakker: del-id-er som venter på å bli åpnet
  design: { ...DEFAULT_DESIGN },
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.version === 1) {
      const base = fresh();
      return { ...base, ...saved, stats: { ...base.stats, ...saved.stats }, design: { ...base.design, ...saved.design } };
    }
  } catch {
    // Ødelagt eller blokkert lagring: start på nytt i minnet.
  }
  return fresh();
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Privat modus o.l.: appen virker, men husker ikke til neste gang.
  }
  listeners.forEach((listener) => listener(state));
}

export const getState = () => state;
export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function setSound(on) {
  state.sound = on;
  save();
}

export function setUnlockAll(on) {
  state.unlockAll = on;
  save();
}

export const levelProgress = (n) => state.levels[n] ?? { rounds: 0, best: 0, passed: false };

export function isLevelOpen(n) {
  return n === 1 || state.unlockAll || levelProgress(n - 1).passed;
}

export function recordAnswer(correct) {
  const { stats } = state;
  stats.answered += 1;
  if (correct) {
    stats.correct += 1;
    stats.streak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  } else {
    stats.streak = 0;
  }
  const today = todayKey();
  if (!stats.days.includes(today)) stats.days.push(today);
  save();
}

/** Lagrer en ferdig runde. Svarer om runden låste opp neste nivå for første gang. */
export function recordRound(n, score) {
  const before = levelProgress(n);
  const passed = before.passed || score >= PASS_SCORE;
  state.levels[n] = { rounds: before.rounds + 1, best: Math.max(before.best, score), passed };
  save();
  return { passed: score >= PASS_SCORE, newlyPassed: passed && !before.passed };
}

// --- Klokkedeler ---

const DEFAULT_IDS = PARTS.filter((part) => part.source.type === 'default').map((part) => part.id);

export const ownedIds = () => [...DEFAULT_IDS, ...state.owned];
export const isOwned = (id) => DEFAULT_IDS.includes(id) || state.owned.includes(id);
export const currentDesign = () => state.design;

/** Gir nye deler. De legges i samlingen med en gang (hun mister aldri noe) og venter som pakker. */
export function grantParts(ids) {
  const added = ids.filter((id) => partById(id) && !isOwned(id));
  if (!added.length) return [];
  state.owned.push(...added);
  state.pending.push(...added);
  save();
  return added;
}

export function markOpened(id) {
  state.pending = state.pending.filter((pendingId) => pendingId !== id);
  save();
}

export function useDesignPart(id) {
  const part = partById(id);
  if (!part || !isOwned(id)) return;
  state.design = { ...state.design, [part.category]: id };
  save();
}

export function resetAll() {
  const sound = state.sound;
  state = { ...fresh(), sound };
  save();
}

export { PASS_SCORE };
