// Nivå 4: kvart og halv. Bygger forsiktig opp, siden særlig kvart og «halv tre = 2:30» er vanskelig.
// Kakestykket på klokka viser hvor mye av timen som har gått.
import { atHour, capitalize, hourOf, hourWord, minuteOf, nextHour, timePhrase } from '../time.js';
import { HOUR, MINUTE } from '../ui.js';
import { randomHour, readout, short, timeChoice, whichIsWrong, wrongTimes } from './common.js';
import { pick, shuffle } from './random.js';

const phrase = (time) => capitalize(timePhrase(time));
const goTo = (time) => (clock) => clock.animateTo(time, { duration: 1100, sound: true });

const QUARTER_NAMES = { 0: 'Hel time: 0 minutter', 15: '15 minutter = ett kvarter', 30: '30 minutter = to kvarter', 45: '45 minutter = tre kvarter' };

export const intro = [
  {
    title: 'Klokka i fire deler',
    text: 'Del urskiven i fire like store stykker, som en pizza. Hvert stykke er 15 minutter. Et slikt stykke kalles <b>et kvarter</b>. Trykk på knappene og se.',
    clock: { time: atHour(2, 15), wedge: true, highlight: ['quarters', 'minute'] },
    label: (time) => QUARTER_NAMES[minuteOf(Math.round(time))] ?? `${minuteOf(Math.round(time))} minutter`,
    actions: [
      { label: 'Ett kvarter', run: goTo(atHour(2, 15)) },
      { label: 'To kvarter', run: goTo(atHour(2, 30)) },
      { label: 'Tre kvarter', run: goTo(atHour(2, 45)) },
      { label: 'Hel time', run: goTo(atHour(3)) },
    ],
  },
  {
    title: 'Kvart over',
    text: `Når ${MINUTE} har gått ett kvarter og står på 3, sier vi <b>kvart over</b>. Klokka har gått et kvarter over to, så den er <b>kvart over to</b>.`,
    clock: { time: atHour(2, 15), wedge: true, highlight: ['minute', 'num:3', 'hour'] },
    label: () => 'Kvart over to · 2:15',
  },
  {
    title: 'Halv: les dette nøye',
    text: `På norsk sier vi <b>halv tre</b> når klokka er 2:30. Det betyr <i>halvveis til tre</i>. Vi ser altså fremover mot neste time, ikke bakover. ${capitalize(HOUR)} står midt mellom 2 og 3.`,
    clock: { time: atHour(2, 30), wedge: true, highlight: ['hour', 'num:2', 'num:3'] },
    label: () => 'Halv tre · 2:30',
  },
  {
    title: 'Trikset for halv',
    text: `Se hvilket tall ${HOUR} er <b>på vei mot</b>. Det tallet er det du sier etter «halv». Prøv knappene.`,
    clock: { time: atHour(1, 30), wedge: true, highlight: ['hour'] },
    label: readout,
    actions: [
      { label: '1:30', run: goTo(atHour(1, 30)) },
      { label: '2:30', run: goTo(atHour(2, 30)) },
      { label: '6:30', run: goTo(atHour(6, 30)) },
      { label: '11:30', run: goTo(atHour(11, 30)) },
    ],
  },
  {
    title: 'Kvart på',
    text: `Når ${MINUTE} står på 9, er det bare ett kvarter igjen til neste hele time. Da sier vi <b>kvart på</b>. 2:45 er kvart på tre, fordi det er et kvarter igjen til tre.`,
    clock: { time: atHour(2, 45), wedge: true, highlight: ['minute', 'num:9', 'num:3'] },
    label: () => 'Kvart på tre · 2:45',
  },
  {
    title: 'Prøv alle fire',
    text: `Dra ${MINUTE} rundt. På 3: kvart over. På 6: halv. På 9: kvart på. Husk at halv og kvart på bruker <b>neste</b> time.`,
    clock: { time: atHour(2), drag: ['minute'], snapMinutes: 15, wedge: true },
    label: readout,
  },
];

const explainFor = (time) => {
  const minute = minuteOf(time);
  const hour = hourOf(time);
  const next = nextHour(hour);
  if (minute === 15) return `${capitalize(MINUTE)} står på 3, ett kvarter over hel time. ${capitalize(HOUR)} har passert ${hour}: <b>kvart over ${hourWord(hour)}</b> (${short(time)}).`;
  if (minute === 30) return `${capitalize(MINUTE)} står på 6, og ${HOUR} er halvveis fra ${hour} til ${next}. Klokka er halvveis til ${hourWord(next)}: <b>halv ${hourWord(next)}</b> (${short(time)}).`;
  if (minute === 45) return `${capitalize(MINUTE)} står på 9, så det er ett kvarter igjen til ${next}: <b>kvart på ${hourWord(next)}</b> (${short(time)}).`;
  return `${capitalize(MINUTE)} står på 12: klokka ${hourWord(hour)}.`;
};

/** Gale svar som ligner, med de vanligste feilene først. */
function mistakesFor(time) {
  const minute = minuteOf(time);
  if (minute === 15) return [time + 30, time + 60, time + 15, time - 45];
  if (minute === 30) return [time - 60, time - 15, time + 15, time + 60];
  return [time - 60, time - 30, time + 30, time - 15];
}

function readQuarter(rng, minute) {
  const time = atHour(randomHour(rng), minute);
  return timeChoice(rng, {
    prompt: 'Hva er klokka?',
    time,
    wrong: wrongTimes(time, mistakesFor(time)),
    format: phrase,
    clock: { time, wedge: true },
    explain: explainFor(time),
  });
}

/** Koble: tekst eller digitalt klokkeslett til riktig klokke, eller digitalt til ord. */
function match(rng) {
  const minute = pick(rng, [30, 30, 15, 45]);
  const time = atHour(randomHour(rng), minute);
  if (rng() < 0.5) {
    return timeChoice(rng, {
      prompt: `Hvilken klokke viser ${timePhrase(time)}?`,
      time,
      wrong: wrongTimes(time, mistakesFor(time)),
      asClocks: true,
      explain: explainFor(time),
    });
  }
  return timeChoice(rng, {
    prompt: `Hva sier vi når klokka er ${short(time)}?`,
    time,
    wrong: wrongTimes(time, mistakesFor(time)),
    format: phrase,
    clock: { time, wedge: true },
    explain: explainFor(time),
  });
}

function setQuarter(rng) {
  const minute = pick(rng, [15, 30, 45]);
  const hour = randomHour(rng);
  const target = atHour(hour, minute);
  return {
    type: 'set',
    prompt: `Still klokka til ${timePhrase(target)}.`,
    hint: 'Begge viserne kan dras',
    start: atHour(pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => Math.abs(h - hour) > 2))),
    target,
    clock: { drag: ['hour', 'minute'], snapMinutes: 15, wedge: true },
    explain: explainFor(target),
  };
}

function spotTheWrong(rng) {
  // Den som lyver, er en halv med den vanligste feilen: «halv to» for 2:30.
  const liar = atHour(randomHour(rng), 30);
  const lie = mistakesFor(liar)[0];
  const pool = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((hour, i) => atHour(hour, [15, 45, 30][i % 3]));
  return whichIsWrong(rng, {
    liar,
    lie,
    pool,
    format: phrase,
    explain: `Klokka som viser ${short(liar)} er ${timePhrase(liar)}, ikke ${timePhrase(lie)}. ${explainFor(liar)}`,
  });
}

/** Fra lett til vanskeligere: kvart over, halv, kvart på, koble, og til slutt still eller finn feilen. */
export function makeRound(rng = Math.random) {
  const last = rng() < 0.5 ? setQuarter(rng) : spotTheWrong(rng);
  return [readQuarter(rng, 15), readQuarter(rng, 30), readQuarter(rng, 45), match(rng), last];
}
