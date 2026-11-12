// Øvingsrom: blandede oppgaver fra flere nivåer.
// Nivåer hun bommer mest på, kommer oftere, så øvingen treffer der det trengs.
import { levelByNumber } from './index.js';
import { shuffle } from './random.js';

export const PRACTICE_LENGTH = 10;

/** Vekt per nivå: 1 for et nivå hun kan godt, opptil 3 for et nivå med mange feil. */
export function practiceWeight(skill) {
  if (!skill || skill.answered < 5) return 1.5;
  const accuracy = skill.correct / skill.answered;
  return 1 + 2 * (1 - accuracy);
}

function weightedPick(rng, items, weight) {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

const keyOf = (q) => `${q.prompt}|${q.clock?.time ?? ''}|${q.target ?? ''}|${q.digital ?? ''}`;

/** Lager en øvingsrunde. Hvert spørsmål får med seg nivået det kommer fra (level). */
export function makePractice(levelNumbers, { count = PRACTICE_LENGTH, skills = {}, rng = Math.random } = {}) {
  const pools = new Map(levelNumbers.map((n) => [n, []]));
  const seen = new Set();
  const picked = [];
  for (let guard = 0; picked.length < count && guard < 500; guard += 1) {
    const n = weightedPick(rng, levelNumbers, (level) => practiceWeight(skills[level]));
    if (!pools.get(n).length) pools.set(n, shuffle(rng, levelByNumber(n).content.makeRound(rng)));
    const question = pools.get(n).pop();
    const key = keyOf(question);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push({ ...question, level: n });
  }
  return picked;
}
