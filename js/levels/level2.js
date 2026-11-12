// Nivå 2: timeviseren og hele timer.
import { atHour, capitalize, hourOf, hourWord, minuteOf, mod, nextHour } from '../time.js';
import { HOUR, MINUTE } from '../ui.js';
import { pick, shuffle } from './random.js';

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Tekst under klokka mens hun drar timeviseren. */
function describeHour(time) {
  const rounded = Math.round(time);
  if (mod(rounded, 60) === 0) return `Klokka er ${hourWord(hourOf(rounded))}`;
  const hour = hourOf(time);
  return `Mellom ${hour} og ${nextHour(hour)}: litt over ${hourWord(hour)}`;
}

export const intro = [
  {
    title: 'Timeviseren viser timen',
    text: `Når ${MINUTE} står rett opp på 12, er klokka et helt antall timer. Da leser du bare tallet ${HOUR} peker på.`,
    clock: { time: atHour(3), highlight: ['hour', 'num:3'] },
    label: () => 'Klokka er tre',
  },
  {
    title: 'Prøv selv',
    text: `Dra ${HOUR} til et nytt tall. Legg merke til at ${MINUTE} også går rundt mens du drar: på en ekte klokke henger de sammen.`,
    clock: { time: atHour(3), drag: ['hour'], snapHour: true },
    label: describeHour,
  },
  {
    title: 'Én runde er én time',
    text: `${capitalize(MINUTE)} bruker nøyaktig én time på en hel runde. Dra den rundt én gang og se ${HOUR} gå fra 3 til 4.`,
    clock: { time: atHour(3), drag: ['minute'] },
    label: (time) => {
      const passed = Math.floor(Math.round(time - atHour(3)) / 60);
      if (passed >= 1) return passed === 1 ? 'En hel runde! Nå er klokka fire.' : `${passed} runder: klokka er ${hourWord(hourOf(time))}`;
      if (passed < 0) return 'Andre veien går klokka bakover';
      return `${minuteOf(time)} av 60 minutter`;
    },
  },
  {
    title: 'Mellom to tall',
    text: `Står ${HOUR} mellom to tall, har timen begynt, men neste time har ikke kommet ennå. Her er klokka litt over fire, ikke fem. Det er alltid tallet den har passert som gjelder.`,
    clock: { time: atHour(4, 25), highlight: ['hour', 'num:4', 'num:5'] },
    label: () => 'Litt over fire',
  },
];

function readWholeHour(rng, hour) {
  const distractors = new Set([nextHour(hour), hour === 1 ? 12 : hour - 1, 12, mod(12 - hour, 12) || 12, nextHour(nextHour(hour))]);
  distractors.delete(hour);
  const wrong = shuffle(rng, [...distractors]).slice(0, 3);
  return {
    type: 'choice',
    prompt: 'Hva er klokka?',
    clock: { time: atHour(hour) },
    options: shuffle(rng, [
      { label: `Klokka ${hourWord(hour)}`, correct: true },
      ...wrong.map((h) => ({ label: `Klokka ${hourWord(h)}`, correct: false })),
    ]),
    explain:
      hour === 12
        ? `Begge viserne peker rett opp på 12, så klokka er tolv.`
        : `${capitalize(MINUTE)} står på 12 og ${HOUR} peker på ${hour}: klokka er ${hourWord(hour)}.`,
  };
}

function setWholeHour(rng, hour) {
  const start = pick(rng, HOURS.filter((h) => h !== hour && h !== nextHour(hour)));
  return {
    type: 'set',
    prompt: `Still klokka til ${hourWord(hour)}.`,
    hint: 'Dra timeviseren',
    start: atHour(start),
    target: atHour(hour),
    clock: { drag: ['hour'], snapHour: true },
    explain: `${capitalize(HOUR)} skal peke på ${hour}, og ${MINUTE} står da på 12.`,
  };
}

function betweenHours(rng, hour) {
  const minute = pick(rng, [10, 15, 20, 25, 35, 40]);
  const after = nextHour(hour);
  return {
    type: 'choice',
    prompt: 'Se på timeviseren. Hva stemmer?',
    clock: { time: atHour(hour, minute) },
    options: shuffle(rng, [
      { label: `Litt over ${hourWord(hour)}`, correct: true },
      { label: `Litt over ${hourWord(after)}`, correct: false },
      { label: `Klokka ${hourWord(after)}`, correct: false },
      { label: `Klokka ${hourWord(hour)}`, correct: false },
    ]),
    explain: `${capitalize(HOUR)} har passert ${hour}, men ikke kommet til ${after}. Da er klokka litt over ${hourWord(hour)}.`,
  };
}

/** Fra lett til vanskeligere: les, still, og til slutt «mellom to tall». */
export function makeRound(rng = Math.random) {
  // Fem ulike timer, så ingen spørsmål i samme runde blir like.
  const [a, b, c, d, e] = shuffle(rng, HOURS);
  return [readWholeHour(rng, a), setWholeHour(rng, b), readWholeHour(rng, c), setWholeHour(rng, d), betweenHours(rng, e)];
}
