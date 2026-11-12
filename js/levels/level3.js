// Nivå 3: minuttviseren. Hvert tall er 5 minutter, og strekene teller enkeltminutter.
// Her brukes bare «4:20»-skrivemåten og «minutter over». Kvart og halv kommer i nivå 4.
import { atHour, capitalize, hourOf, minuteOf } from '../time.js';
import { HOUR, MINUTE } from '../ui.js';
import { randomHour, short, timeChoice, wrongTimes } from './common.js';
import { pick, shuffle } from './random.js';

/** «5 + 5 + 5 = 15» for de første tallene, så det er lett å se at det er femmere som legges sammen. */
const countFives = (number) =>
  number <= 4 ? `${Array(number).fill(5).join(' + ')}${number > 1 ? ` = ${number * 5}` : ''}` : `${number} × 5 = ${number * 5}`;

const goTo = (time) => (clock) => clock.animateTo(time, { duration: 900, sound: true });

const minutesText = (time) => {
  const minute = minuteOf(Math.round(time));
  if (minute === 0) return 'Minuttviseren står på 12: 0 minutter';
  const number = Math.floor(minute / 5);
  const rest = minute % 5;
  if (rest === 0) return `Peker på ${number}: ${countFives(number)} minutter`;
  return `${minute} minutter`;
};

export const intro = [
  {
    title: 'Minuttviseren teller minutter',
    text: `En time har 60 minutter. ${capitalize(MINUTE)} bruker én time på en runde, og flytter seg én liten strek hvert minutt.`,
    clock: { time: atHour(3), highlight: ['minute', 'ticks'] },
  },
  {
    title: 'Fra ett tall til det neste',
    text: 'Se på strekene mellom 12 og 1. Det er 5 små streker, og hver strek er ett minutt. Når minuttviseren går fra 12 til 1, har det altså gått <b>5 minutter</b>.',
    clock: { time: atHour(3, 5), wedge: true, highlight: ['minute', 'ticks', 'num:12', 'num:1'] },
    label: () => 'Fra 12 til 1: 5 minutter',
  },
  {
    title: 'Tell i femmere',
    text: 'For hvert nytt tall kommer det 5 minutter til. Trykk på knappene og tell sammen med klokka: 5, 10, 15, 20 …',
    clock: { time: atHour(3, 5), wedge: true, minuteLabels: true },
    label: minutesText,
    actions: [1, 2, 3, 4, 6].map((n) => ({ label: `Til ${n}`, run: goTo(atHour(3, n * 5)) })),
  },
  {
    title: 'Prøv selv',
    text: `Dra ${MINUTE} rundt og se hvor mange minutter den viser. Tallene utenfor urskiven hjelper deg i starten.`,
    clock: { time: atHour(3), drag: ['minute'], snapMinutes: 5, minuteLabels: true },
    label: minutesText,
  },
  {
    title: 'Uten hjelpetall',
    text: 'På en vanlig klokke står ikke minuttene skrevet. Da ganger du tallet med 5 i hodet. Prøv igjen, nå uten hjelp.',
    clock: { time: atHour(3, 20), drag: ['minute'], snapMinutes: 5 },
    label: minutesText,
  },
  {
    title: 'Mellom tallene',
    text: 'Står viseren mellom to tall, teller du strekene. Her står den 2 streker etter 3: 15 + 2 = 17 minutter.',
    clock: { time: atHour(3, 17), highlight: ['minute', 'ticks', 'num:3'] },
    label: () => '15 + 2 = 17 minutter',
  },
  {
    title: 'Slik skriver vi det',
    text: `Timer og minutter skrives med kolon mellom: først timen, så minuttene. Her har ${HOUR} passert 3, og ${MINUTE} viser 17 minutter.`,
    clock: { time: atHour(3, 17), highlight: ['hour', 'minute'] },
    label: () => '3:17',
  },
];

// 1. Lettest: hvor mange minutter, når viseren peker rett på et tall.
function minutesOnNumber(rng) {
  const number = pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const minute = number * 5;
  const wrong = shuffle(rng, [...new Set([number, number * 10, 60 - minute, minute + 5, minute - 5])].filter((m) => m !== minute && m > 0 && m < 60)).slice(0, 3);
  return {
    type: 'choice',
    prompt: 'Hvor mange minutter viser minuttviseren?',
    clock: { time: atHour(randomHour(rng), minute) },
    options: shuffle(rng, [{ label: `${minute}`, correct: true }, ...wrong.map((m) => ({ label: `${m}`, correct: false }))]),
    explain: `${capitalize(MINUTE)} peker på ${number}. ${number} × 5 = ${minute} minutter.`,
  };
}

// 2. Dra minuttviseren til et antall minutter.
function setMinutes(rng) {
  const minute = pick(rng, [10, 20, 25, 35, 40, 50, 55]);
  const hour = randomHour(rng);
  return {
    type: 'set',
    prompt: `Dra minuttviseren til ${minute} minutter.`,
    hint: 'Hvilket tall ganger 5 blir det?',
    start: atHour(hour),
    target: atHour(hour, minute),
    check: 'minute',
    clock: { drag: ['minute'], snapMinutes: 5 },
    explain: `${minute} minutter er ${minute / 5} × 5, så ${MINUTE} skal peke på ${minute / 5}.`,
  };
}

// 3. Les hele klokkeslettet, minuttene i femmere.
function readTime(rng) {
  const hour = randomHour(rng);
  const minute = pick(rng, [5, 10, 20, 25, 35, 40, 50]);
  const time = atHour(hour, minute);
  const asNumber = atHour(hour, minute / 5); // leser tallet viseren peker på som minutter
  return timeChoice(rng, {
    prompt: 'Hva er klokka?',
    time,
    wrong: wrongTimes(time, [asNumber, minute >= 30 ? time + 60 : time - 60, atHour(hour, 60 - minute), time + 5]),
    format: short,
    explain: `${capitalize(HOUR)} har passert ${hour}, og ${MINUTE} peker på ${minute / 5}: ${minute / 5} × 5 = ${minute}. Klokka er ${short(time)}.`,
  });
}

// 4. Minutter mellom tallene.
function readOddMinutes(rng) {
  const hour = randomHour(rng);
  const number = pick(rng, [1, 2, 3, 4, 6, 7, 8, 9]);
  const extra = pick(rng, [1, 2, 3, 4]);
  const minute = number * 5 + extra;
  const time = atHour(hour, minute);
  return timeChoice(rng, {
    prompt: 'Hva er klokka? Tell strekene.',
    time,
    wrong: wrongTimes(time, [time + (extra > 2 ? -2 : 2), time + 5, time - 5, time + 60]),
    format: short,
    explain: `${capitalize(MINUTE)} står ${extra} ${extra === 1 ? 'strek' : 'streker'} etter ${number}: ${number * 5} + ${extra} = ${minute}. Klokka er ${short(time)}.`,
  });
}

// 5. Vanskeligst: still hele klokka.
function setTime(rng) {
  const hour = randomHour(rng);
  const minute = pick(rng, [10, 20, 25, 35, 40, 50]);
  const target = atHour(hour, minute);
  const start = atHour(pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => Math.abs(h - hour) > 2)));
  return {
    type: 'set',
    prompt: `Still klokka til ${short(target)}.`,
    hint: 'Begge viserne kan dras',
    start,
    target,
    clock: { drag: ['hour', 'minute'], snapMinutes: 5 },
    explain: `${capitalize(MINUTE)} på ${minute / 5} (${minute} minutter), og ${HOUR} har passert ${hourOf(target)}.`,
  };
}

export function makeRound(rng = Math.random) {
  return [minutesOnNumber(rng), setMinutes(rng), readTime(rng), readOddMinutes(rng), setTime(rng)];
}
