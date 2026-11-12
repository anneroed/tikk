// Nivå 5: over og på, i femmere. Fem over, ti på, fem på halv, ti over halv …
import { atHour, capitalize, hourOf, hourWord, minuteOf, nextHour, timePhrase } from '../time.js';
import { MINUTE } from '../ui.js';
import { likelyMistakes, randomHour, readout, short, timeChoice, whichIsWrong, wrongTimes } from './common.js';
import { pick, shuffle } from './random.js';

const phrase = (time) => capitalize(timePhrase(time));
const goTo = (time) => (clock) => clock.animateTo(time, { duration: 900, sound: true });

export const intro = [
  {
    title: 'Fem og ti over',
    text: 'I starten av timen teller vi minuttene <b>over</b> timen vi er i. 2:05 er fem over to, og 2:10 er ti over to.',
    clock: { time: atHour(2, 5), wedge: true, highlight: ['minute', 'num:1', 'num:2'] },
    label: readout,
    actions: [
      { label: 'Fem over', run: goTo(atHour(2, 5)) },
      { label: 'Ti over', run: goTo(atHour(2, 10)) },
      { label: 'Kvart over', run: goTo(atHour(2, 15)) },
    ],
  },
  {
    title: 'Fem og ti på',
    text: 'Mot slutten av timen teller vi hvor mye som er igjen <b>på</b> neste time. 2:50 er ti på tre, og 2:55 er fem på tre.',
    clock: { time: atHour(2, 50), wedge: true, highlight: ['minute', 'num:10', 'num:11'] },
    label: readout,
    actions: [
      { label: 'Kvart på', run: goTo(atHour(2, 45)) },
      { label: 'Ti på', run: goTo(atHour(2, 50)) },
      { label: 'Fem på', run: goTo(atHour(2, 55)) },
    ],
  },
  {
    title: 'Rundt halv',
    text: 'Rundt 6-tallet teller vi fra halv. 2:25 er <b>fem på halv tre</b>, og 2:35 er <b>fem over halv tre</b>. Begge bruker neste time, akkurat som halv.',
    clock: { time: atHour(2, 25), wedge: true, highlight: ['minute', 'num:5', 'num:6', 'num:7'] },
    label: readout,
    actions: [
      { label: 'Fem på halv', run: goTo(atHour(2, 25)) },
      { label: 'Halv', run: goTo(atHour(2, 30)) },
      { label: 'Fem over halv', run: goTo(atHour(2, 35)) },
    ],
  },
  {
    title: 'Ti på og ti over halv',
    text: '2:20 er <b>ti på halv tre</b>, og 2:40 er <b>ti over halv tre</b>. Mange sier også «tjue over to» og «tjue på tre». Det er også riktig.',
    clock: { time: atHour(2, 20), wedge: true, highlight: ['minute', 'num:4', 'num:6', 'num:8'] },
    label: readout,
    actions: [
      { label: 'Ti på halv', run: goTo(atHour(2, 20)) },
      { label: 'Ti over halv', run: goTo(atHour(2, 40)) },
    ],
  },
  {
    title: 'Hele kartet',
    text: `Dra ${MINUTE} rundt. Første kvarter: <b>over</b> timen du er i. Rundt halv og siste kvarter: <b>neste</b> time.`,
    clock: { time: atHour(2), drag: ['minute'], snapMinutes: 5, wedge: true },
    label: readout,
  },
];

function explainFor(time) {
  const minute = minuteOf(time);
  const hour = hourOf(time);
  const next = nextHour(hour);
  const name = `<b>${timePhrase(time)}</b> (${short(time)})`;
  if (minute < 15) return `${capitalize(MINUTE)} har gått ${minute} minutter over hel time. Vi er fortsatt i ${hourWord(hour)}-timen: ${name}.`;
  if (minute < 30) return `${capitalize(MINUTE)} er ${30 - minute} minutter før 6-tallet, og halv betyr halvveis til ${hourWord(next)}: ${name}.`;
  if (minute < 45) return `${capitalize(MINUTE)} er ${minute - 30} minutter forbi 6-tallet, og vi er på vei mot ${hourWord(next)}: ${name}.`;
  return `Det er ${60 - minute} minutter igjen til ${hourWord(next)}: ${name}.`;
}

function read(rng, minutes) {
  const time = atHour(randomHour(rng), pick(rng, minutes));
  return timeChoice(rng, {
    prompt: 'Hva er klokka?',
    time,
    wrong: wrongTimes(time, likelyMistakes(time)),
    format: phrase,
    clock: { time },
    explain: explainFor(time),
  });
}

const FIVES = [5, 10, 20, 25, 35, 40, 50, 55];

/** Koble analog og digital: ord til klokke, eller ord til digitalt klokkeslett. */
function match(rng) {
  const time = atHour(randomHour(rng), pick(rng, FIVES));
  const wrong = wrongTimes(time, likelyMistakes(time));
  if (rng() < 0.5) {
    return timeChoice(rng, { prompt: `Hvilken klokke viser ${timePhrase(time)}?`, time, wrong, asClocks: true, explain: explainFor(time) });
  }
  return timeChoice(rng, {
    prompt: `${capitalize(timePhrase(time))}. Hvordan skrives det?`,
    time,
    wrong,
    format: short,
    clock: null,
    explain: explainFor(time),
  });
}

function setFive(rng) {
  const hour = randomHour(rng);
  const target = atHour(hour, pick(rng, FIVES));
  return {
    type: 'set',
    prompt: `Still klokka til ${timePhrase(target)}.`,
    hint: 'Begge viserne kan dras',
    start: atHour(pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => Math.abs(h - hour) > 2))),
    target,
    clock: { drag: ['hour', 'minute'], snapMinutes: 5 },
    explain: explainFor(target),
  };
}

function spotTheWrong(rng) {
  const liar = atHour(randomHour(rng), pick(rng, FIVES));
  const lie = wrongTimes(liar, likelyMistakes(liar), 1)[0];
  const minutes = shuffle(rng, FIVES);
  const pool = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((hour, i) => atHour(hour, minutes[i % minutes.length]));
  return whichIsWrong(rng, {
    liar,
    lie,
    pool,
    format: phrase,
    explain: `Klokka som viser ${short(liar)} er ${timePhrase(liar)}, ikke ${timePhrase(lie)}. ${explainFor(liar)}`,
  });
}

/** Fra lett til vanskeligere: over, på, rundt halv, koble, og til slutt still eller finn feilen. */
export function makeRound(rng = Math.random) {
  const last = rng() < 0.5 ? setFive(rng) : spotTheWrong(rng);
  return [read(rng, [5, 10]), read(rng, [50, 55]), read(rng, [20, 25, 35, 40]), match(rng), last];
}
