// Nivå 7: digital klokke og 24-timersklokka.
// Analog klokke viser bare 12 timer. Merket «om ettermiddagen» forteller hvilken halvdel av døgnet det er.
import { capitalize, dayPart, digital, mod, timePhrase } from '../time.js';
import { HOUR } from '../ui.js';
import { dayPanel } from '../views/digital.js';
import { likelyMistakes, wrongTimes } from './common.js';
import { pick, shuffle } from './random.js';

const at = (hour, minute = 0) => hour * 60 + minute;
const d24 = (time) => digital(time, { hours24: true });
const goTo = (time) => (clock) => clock.animateTo(time, { duration: 1400, direction: 'forward', sound: true });

/** Fra 24-timers til slik vi sier det: «halv tre om ettermiddagen». */
const spoken = (time) => `${timePhrase(time)} ${dayPart(time).name}`;

export const intro = [
  {
    title: 'Digital klokke',
    text: 'En digital klokke viser tiden med tall: først timene, så et kolon, så minuttene. 07:45 betyr 7 timer og 45 minutter, altså kvart på åtte.',
    clock: { time: at(7, 45) },
    panel: dayPanel,
  },
  {
    title: 'Døgnet har 24 timer',
    text: 'Den analoge klokka går rundt to ganger hvert døgn: først fra midnatt til midt på dagen, så fra midt på dagen til midnatt. Den digitale klokka teller videre etter 12: 13, 14, 15 … helt til 23.',
    clock: { time: at(9) },
    panel: dayPanel,
    actions: [
      { label: 'Spol en halv dag', run: goTo(at(21)) },
      { label: 'Tilbake til morgen', run: (clock) => clock.animateTo(at(9), { duration: 1100, direction: 'exact' }) },
    ],
  },
  {
    title: 'Legg til 12',
    text: `Etter klokka 12 på dagen legger du til 12 på timen. Klokka 2 om ettermiddagen blir 14:00, og halv tre om ettermiddagen blir 14:30. ${capitalize(HOUR)} står likt, det er bare tallet som er annerledes.`,
    clock: { time: at(2) },
    panel: dayPanel,
    actions: [
      { label: '2 om natta', run: (clock) => clock.animateTo(at(2), { duration: 1100, direction: 'exact' }) },
      { label: '2 om ettermiddagen', run: (clock) => clock.animateTo(at(14), { duration: 1400, direction: 'forward' }) },
      { label: 'Halv tre', run: (clock) => clock.animateTo(at(14, 30), { duration: 1100, direction: 'exact' }) },
    ],
  },
  {
    title: 'Trekk fra 12',
    text: 'Andre veien: ser du 18:45 på en digital klokke, trekker du fra 12. 18 − 12 = 6, så det er kvart på sju om kvelden.',
    clock: { time: at(18, 45), highlight: ['hour', 'minute'] },
    panel: dayPanel,
    label: (time) => capitalize(spoken(Math.round(time))),
  },
  {
    title: 'Midnatt',
    text: 'Ved midnatt starter døgnet på nytt, og klokka viser 00:00. 00:30 er halv ett om natta.',
    clock: { time: at(0, 30) },
    panel: dayPanel,
    label: () => 'Halv ett om natta',
  },
  {
    title: 'Prøv selv',
    text: 'Dra viserne rundt og se den digitale klokka følge med, gjennom hele døgnet.',
    clock: { time: at(6), drag: ['hour', 'minute'], snapMinutes: 5 },
    panel: dayPanel,
    label: (time) => capitalize(spoken(mod(Math.round(time), 1440))),
  },
];

const PM_HOURS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const MINUTES = [0, 15, 30, 45, 10, 20, 40, 50];

/** Typiske feil med 24 timer: glemme å legge til 12, eller lese 15 som 5. */
function mistakes24(time) {
  const hour = Math.floor(time / 60);
  const minute = time % 60;
  return [time - 720, at((hour % 10) + 10, minute), time + 60, time - 60, at(hour, (minute + 30) % 60)];
}

const distinct24 = (time, candidates) => {
  const seen = new Set([mod(time, 1440)]);
  return candidates.filter((t) => t >= 0 && t < 1440 && !seen.has(t) && seen.add(t)).slice(0, 3);
};

// 1. Analog klokke + «om ettermiddagen» → digital.
function analogToDigital(rng) {
  const time = at(pick(rng, PM_HOURS), pick(rng, [0, 30, 15, 45]));
  return {
    type: 'choice',
    prompt: 'Hva viser en digital klokke nå?',
    clock: { time },
    dayTime: time,
    options: shuffle(rng, [{ label: d24(time), correct: true }, ...distinct24(time, mistakes24(time)).map((t) => ({ label: d24(t), correct: false }))]),
    explain: `Klokka er ${spoken(time)}. Etter 12 på dagen legger vi til 12: ${Math.floor(time / 60) - 12} + 12 = ${Math.floor(time / 60)}. Digitalt: ${d24(time)}.`,
  };
}

// 2. Digital → analog klokke.
function digitalToAnalog(rng) {
  const time = at(pick(rng, PM_HOURS), pick(rng, MINUTES));
  const hour12 = Math.floor(time / 60) - 12;
  const lastDigit = Math.floor(time / 60) % 10;
  const wrong = wrongTimes(time, [at(lastDigit === 0 ? 10 : lastDigit, time % 60), time + 60, time - 60, time + 30], 3);
  return {
    type: 'choice',
    prompt: `Hvilken klokke viser ${d24(time)}?`,
    clock: null,
    options: shuffle(rng, [{ time, correct: true }, ...wrong.map((t) => ({ time: t, correct: false }))]),
    explain: `${d24(time)}: ${Math.floor(time / 60)} − 12 = ${hour12}. Klokka er ${timePhrase(time)} ${dayPart(time).name}.`,
  };
}

// 3. Digital → slik vi sier det.
function digitalToWords(rng) {
  const time = at(pick(rng, [...PM_HOURS, 7, 8, 9, 10, 11]), pick(rng, [15, 30, 45, 20, 40, 50]));
  const wrong = wrongTimes(time, likelyMistakes(time), 3);
  return {
    type: 'choice',
    prompt: 'Hva sier vi når den digitale klokka viser dette?',
    clock: null,
    digital: time,
    options: shuffle(rng, [{ label: capitalize(timePhrase(time)), correct: true }, ...wrong.map((t) => ({ label: capitalize(timePhrase(t)), correct: false }))]),
    explain: `${d24(time)} er ${spoken(time)}.`,
  };
}

// 4. Still den analoge klokka etter en digital tid.
function setFromDigital(rng) {
  const time = at(pick(rng, PM_HOURS), pick(rng, [15, 30, 45, 10, 50]));
  const startHour = pick(rng, [1, 3, 5, 7, 9, 11].filter((h) => Math.abs(h - (Math.floor(time / 60) - 12)) > 2));
  return {
    type: 'set',
    prompt: `Still klokka til ${d24(time)}.`,
    hint: 'Begge viserne kan dras',
    start: at(startHour),
    target: time,
    digital: time,
    clock: { drag: ['hour', 'minute'], snapMinutes: 5 },
    explain: `${d24(time)} er ${spoken(time)}. Trekk fra 12: timeviseren skal stå ved ${Math.floor(time / 60) - 12}.`,
  };
}

// 5. Vanskeligst: ord med del av døgnet → digital tid.
function wordsToDigital(rng) {
  const time = at(pick(rng, [...PM_HOURS, 6, 7, 8, 9]), pick(rng, [30, 15, 45, 25, 35]));
  return {
    type: 'choice',
    prompt: `Hva er ${spoken(time)} på en digital klokke?`,
    clock: null,
    options: shuffle(rng, [{ label: d24(time), correct: true }, ...distinct24(time, [time + 720, time - 720, time - 60, time + 60, ...likelyMistakes(time)]).map((t) => ({ label: d24(t), correct: false }))]),
    explain: `${capitalize(spoken(time))} er ${d24(time)}.${time >= 720 ? ` Etter 12 på dagen legger vi til 12.` : ''}`,
  };
}

export function makeRound(rng = Math.random) {
  return [analogToDigital(rng), digitalToAnalog(rng), digitalToWords(rng), setFromDigital(rng), wordsToDigital(rng)];
}

