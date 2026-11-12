// Nivå 6: sekundviseren. Leses som minuttviseren, men én runde er ett minutt.
import { atHour, capitalize, hourOf, minuteOf, secondOf } from '../time.js';
import { MINUTE, SECOND } from '../ui.js';
import { randomHour, short } from './common.js';
import { pick, shuffle } from './random.js';

/** Tid i minutter med sekunder: 4:20 og 35 sekunder. */
const at = (hour, minute, second) => atHour(hour, minute) + second / 60;
const withSeconds = (time) => `${short(Math.floor(time + 1e-9))}:${String(secondOf(time)).padStart(2, '0')}`;
const goTo = (time) => (clock) => clock.animateTo(time, { duration: 900, sound: true });

const secondsText = (time) => {
  const second = secondOf(time);
  if (second === 0) return 'Sekundviseren står på 12: 0 sekunder';
  return second % 5 === 0 ? `Peker på ${second / 5}: ${second} sekunder` : `${second} sekunder`;
};

export const intro = [
  {
    title: 'Den raskeste viseren',
    text: `Et minutt har 60 sekunder. ${capitalize(SECOND)} bruker akkurat ett minutt på en hel runde. Følg med på den!`,
    clock: { time: at(4, 20, 0), seconds: true, running: true, tickSound: true, highlight: ['second'] },
    label: (time) => `${secondOf(time)} sekunder`,
  },
  {
    title: 'Leses som minuttviseren',
    text: `Sekundene telles akkurat som minuttene: hvert tall er 5 sekunder. Peker ${SECOND} på 3, har det gått 15 sekunder.`,
    clock: { time: at(4, 20, 15), seconds: true, minuteLabels: true, highlight: ['second', 'minute-labels'] },
    label: secondsText,
    actions: [
      { label: '5 s', run: goTo(at(4, 20, 5)) },
      { label: '15 s', run: goTo(at(4, 20, 15)) },
      { label: '30 s', run: goTo(at(4, 20, 30)) },
      { label: '45 s', run: goTo(at(4, 20, 45)) },
    ],
  },
  {
    title: 'Ett minutt går',
    text: `Når ${SECOND} har gått en hel runde, flytter ${MINUTE} seg én liten strek, altså ett minutt.`,
    clock: { time: at(4, 20, 0), seconds: true, highlight: ['second', 'minute'] },
    label: (time) => `${short(Math.floor(time + 1e-9))} og ${secondOf(time)} sekunder`,
    action: {
      label: 'Spill av ett minutt',
      run: (clock) => clock.animateTo(Math.round(clock.getTime() * 60) / 60 + 1, { duration: 4000, direction: 'forward' }),
    },
  },
  {
    title: 'Prøv selv',
    text: `Dra den tynne ${SECOND} rundt. Se hvordan ${MINUTE} flytter seg når du går forbi 12.`,
    clock: { time: at(4, 20, 0), seconds: true, drag: ['second'] },
    label: secondsText,
    hint: 'Dra den tynne viseren',
  },
  {
    title: 'Med sekunder',
    text: 'Noen digitale klokker viser sekundene også, med et kolon til: først timer, så minutter, så sekunder.',
    clock: { time: at(4, 20, 35), seconds: true, highlight: ['hour', 'minute', 'second'] },
    label: () => '4:20:35 = 4 timer, 20 minutter, 35 sekunder',
  },
];

// 1. Hvor mange sekunder, når viseren peker på et tall.
function secondsOnNumber(rng) {
  const number = pick(rng, [1, 2, 3, 4, 6, 8, 9, 10, 11]);
  const second = number * 5;
  const wrong = shuffle(rng, [...new Set([number, 60 - second, second + 10, second - 5].filter((s) => s > 0 && s < 60 && s !== second))]).slice(0, 3);
  return {
    type: 'choice',
    prompt: 'Hvor mange sekunder viser sekundviseren?',
    clock: { time: at(randomHour(rng), pick(rng, [10, 25, 40]), second), seconds: true },
    options: shuffle(rng, [{ label: `${second}`, correct: true }, ...wrong.map((s) => ({ label: `${s}`, correct: false }))]),
    explain: `${capitalize(SECOND)} peker på ${number}. Hvert tall er 5 sekunder: ${number} × 5 = ${second}.`,
  };
}

// 2. Fakta om sekunder og minutter.
function facts(rng) {
  const fact = pick(rng, [
    { prompt: 'Hvor mange sekunder er ett minutt?', options: ['60', '100', '30', '12'], explain: 'Ett minutt er 60 sekunder, akkurat som en time er 60 minutter.' },
    { prompt: 'Hvor lang tid bruker sekundviseren på en hel runde?', options: ['Ett minutt', 'Ett sekund', 'En time', '12 sekunder'], explain: 'En hel runde med sekundviseren er 60 sekunder, altså ett minutt.' },
    { prompt: 'Hvor mange sekunder er et halvt minutt?', options: ['30', '50', '15', '60'], explain: 'Et halvt minutt er halvparten av 60 sekunder: 30 sekunder.' },
    { prompt: 'Hva varer lengst?', options: ['90 sekunder', '1 minutt', '50 sekunder', '45 sekunder'], explain: '90 sekunder er 1 minutt og 30 sekunder, så det er lengst.' },
    { prompt: 'Hvor mange sekunder er 2 minutter?', options: ['120', '60', '200', '100'], explain: '2 minutter er 60 + 60 = 120 sekunder.' },
  ]);
  const [right, ...wrong] = fact.options;
  return {
    type: 'choice',
    prompt: fact.prompt,
    clock: { time: at(10, 10, 30), seconds: true, running: true },
    options: shuffle(rng, [{ label: right, correct: true }, ...wrong.map((label) => ({ label, correct: false }))]),
    explain: fact.explain,
  };
}

// 3. Dra sekundviseren.
function setSeconds(rng) {
  const second = pick(rng, [10, 20, 25, 35, 40, 50]);
  const hour = randomHour(rng);
  return {
    type: 'set',
    prompt: `Dra sekundviseren til ${second} sekunder.`,
    hint: 'Dra den tynne viseren',
    start: at(hour, 15, 0),
    target: at(hour, 15, second),
    check: 'second',
    clock: { seconds: true, drag: ['second'] },
    explain: `${second} sekunder er ${second / 5} × 5, så ${SECOND} skal peke på ${second / 5}.`,
  };
}

// 4. Sekunder mellom tallene.
function oddSeconds(rng) {
  const number = pick(rng, [2, 3, 4, 6, 7, 8]);
  const extra = pick(rng, [1, 2, 3, 4]);
  const second = number * 5 + extra;
  const wrong = [second + 5, second - 5, number * 5 + (extra > 2 ? extra - 2 : extra + 2)];
  return {
    type: 'choice',
    prompt: 'Hvor mange sekunder? Tell strekene.',
    clock: { time: at(randomHour(rng), 40, second), seconds: true },
    options: shuffle(rng, [{ label: `${second}`, correct: true }, ...wrong.map((s) => ({ label: `${s}`, correct: false }))]),
    explain: `${capitalize(SECOND)} står ${extra} ${extra === 1 ? 'strek' : 'streker'} etter ${number}: ${number * 5} + ${extra} = ${second} sekunder.`,
  };
}

// 5. Vanskeligst: les timer, minutter og sekunder.
function readAll(rng) {
  const hour = randomHour(rng);
  const minute = pick(rng, [10, 20, 25, 35, 50]);
  const second = pick(rng, [5, 15, 40, 45, 55].filter((s) => s !== minute));
  const time = at(hour, minute, second);
  const wrongTimes = [at(hour, second, minute), at(hour, minute, (second + 10) % 60), at(hour === 12 ? 1 : hour + 1, minute, second)];
  return {
    type: 'choice',
    prompt: 'Hva viser klokka, med sekunder?',
    clock: { time, seconds: true },
    options: shuffle(rng, [{ label: withSeconds(time), correct: true }, ...wrongTimes.map((t) => ({ label: withSeconds(t), correct: false }))]),
    explain: `Timeviseren har passert ${hourOf(time)}, ${MINUTE} viser ${minuteOf(time)} minutter og ${SECOND} ${second} sekunder: ${withSeconds(time)}.`,
  };
}

export function makeRound(rng = Math.random) {
  return [secondsOnNumber(rng), facts(rng), setSeconds(rng), oddSeconds(rng), readAll(rng)];
}
