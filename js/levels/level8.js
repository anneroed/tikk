// Nivå 8: tid i hverdagen. Regne ut tid mellom to klokkeslett, og hva klokka blir.
// Knepet som læres: hopp til neste hele time først. Og pass på «100-fella» (1730 − 1645 = 85).
import { dayPart, digital, durationText, mod } from '../time.js';
import { digitalDisplay } from '../views/digital.js';
import { pick, shuffle } from './random.js';

const at = (hour, minute = 0) => hour * 60 + minute;
const d24 = (time) => digital(time, { hours24: true });
const forward = (time) => (clock) => clock.animateTo(time, { duration: 1300, direction: 'forward', sound: true });
const elapsedFrom = (start) => (time) => {
  const passed = Math.round(time - start);
  return passed <= 0 ? 'Start' : `Har gått: ${durationText(passed)}`;
};

/** Feilen mange gjør: trekke fra som vanlige tall, som om en time hadde 100 minutter. */
const hundredTrap = (start, end) => {
  const asNumber = (t) => Math.floor(t / 60) * 100 + (t % 60);
  return asNumber(end) - asNumber(start);
};

export const intro = [
  {
    title: 'Hvor lenge er det til?',
    text: 'Treningen starter 17:30, og nå er klokka 16:45. Hopp først til neste hele time: fra 16:45 til 17:00 er 15 minutter. Så fra 17:00 til 17:30 er 30 minutter. Til sammen: 45 minutter.',
    clock: { time: at(16, 45), wedge: false },
    label: elapsedFrom(at(16, 45)),
    panel: (time) => digitalDisplay(time),
    actions: [
      { label: 'Hopp til 17:00', run: forward(at(17)) },
      { label: 'Hopp til 17:30', run: forward(at(17, 30)) },
      { label: 'Start på nytt', run: (clock) => clock.animateTo(at(16, 45), { duration: 700 }) },
    ],
  },
  {
    title: 'Pass på 100-fella',
    text: 'Regner du 1730 − 1645 som vanlige tall, får du 85. Men svaret er 45 minutter! En time har bare 60 minutter, ikke 100. Derfor er det tryggest å hoppe via hel time.',
    clock: { time: at(16, 45), highlight: ['minute'] },
    label: () => '16:45 → 17:30 = 45 minutter',
  },
  {
    title: 'Timer og minutter',
    text: '60 minutter er 1 time. 75 minutter er 1 time og 15 minutter. 90 minutter er 1 time og 30 minutter, også kalt halvannen time. Trykk og se.',
    clock: { time: at(15) },
    label: elapsedFrom(at(15)),
    actions: [
      { label: '+15 min', run: (clock) => clock.animateTo(Math.round(clock.getTime()) + 15, { duration: 600, direction: 'forward', sound: true }) },
      { label: '+30 min', run: (clock) => clock.animateTo(Math.round(clock.getTime()) + 30, { duration: 800, direction: 'forward', sound: true }) },
      { label: '+1 time', run: (clock) => clock.animateTo(Math.round(clock.getTime()) + 60, { duration: 1100, direction: 'forward', sound: true }) },
      { label: 'Nullstill', run: (clock) => clock.animateTo(at(15), { duration: 700 }) },
    ],
  },
  {
    title: 'Hva blir klokka?',
    text: 'Filmen starter 18:15 og varer 1 time og 40 minutter. Legg til timen først: 19:15. Så 40 minutter: 19:55.',
    clock: { time: at(18, 15) },
    label: elapsedFrom(at(18, 15)),
    panel: (time) => digitalDisplay(time),
    actions: [
      { label: '+1 time', run: forward(at(19, 15)) },
      { label: '+40 minutter', run: forward(at(19, 55)) },
      { label: 'Start på nytt', run: (clock) => clock.animateTo(at(18, 15), { duration: 700 }) },
    ],
  },
  {
    title: 'Prøv selv',
    text: 'Leksene starter 17:15. Dra minuttviseren fremover og se hvor lang tid som har gått. Hvor langt må du dra for 1 time og 10 minutter?',
    clock: { time: at(17, 15), drag: ['minute'], snapMinutes: 5 },
    label: elapsedFrom(at(17, 15)),
    panel: (time) => digitalDisplay(time),
  },
];

/** «100-fella» skrevet slik den som regner feil ville skrevet den: «85 minutter» eller «1 time og 85 minutter». */
const trapLabel = (value) => {
  const hours = Math.floor(value / 100);
  const rest = value % 100;
  if (!hours) return `${rest} minutter`;
  return `${hours === 1 ? '1 time' : `${hours} timer`} og ${rest} minutter`;
};

const durationOptions = (rng, minutes, trap = null) => {
  const right = durationText(minutes);
  const labels = new Set([right]);
  const wrong = [];
  const add = (label) => {
    if (wrong.length < 3 && !labels.has(label)) {
      labels.add(label);
      wrong.push(label);
    }
  };
  // Fella regnes bare med når den faktisk gir et annet svar.
  if (trap !== null && trap > 0 && trap !== minutes) add(trapLabel(trap));
  for (const m of [minutes + 5, minutes - 5, minutes + 10, minutes - 10, minutes + 15, minutes + 60, minutes - 60]) {
    if (m > 0) add(durationText(m));
  }
  return shuffle(rng, [{ label: right, correct: true }, ...wrong.map((label) => ({ label, correct: false }))]);
};

const timeOptions = (rng, time, extra = []) => {
  const candidates = [...extra, time + 10, time - 10, time + 5, time - 5, time + 60, time - 60];
  const seen = new Set([mod(time, 1440)]);
  const wrong = candidates.map((t) => mod(t, 1440)).filter((t) => !seen.has(t) && seen.add(t)).slice(0, 3);
  return shuffle(rng, [{ label: d24(time), correct: true }, ...wrong.map((t) => ({ label: d24(t), correct: false }))]);
};

const UNTIL = [
  ['Treningen', 'starter'],
  ['Fotballkampen', 'begynner'],
  ['Middagen', 'er klar'],
  ['Filmen', 'begynner'],
  ['Bursdagsfesten', 'starter'],
  ['Svømmingen', 'begynner'],
];

// 1. Lettest: innenfor samme time, begge tidene digitalt.
function untilSameHour(rng) {
  const hour = pick(rng, [15, 16, 17, 18]);
  const start = at(hour, pick(rng, [5, 10, 15, 20]));
  const end = start + pick(rng, [15, 20, 25, 30, 35]);
  const [thing, verb] = pick(rng, UNTIL);
  return {
    type: 'choice',
    prompt: `${thing} ${verb} ${d24(end)}. Nå er klokka ${d24(start)}. Hvor lenge er det til?`,
    clock: { time: start },
    options: durationOptions(rng, end - start),
    explain: `Fra ${d24(start)} til ${d24(end)}: minuttviseren går fra ${start % 60} til ${end % 60}. Det er ${durationText(end - start)}.`,
  };
}

// 2. Over hel time, og hun må lese klokka selv.
function untilCrossHour(rng) {
  const hour = pick(rng, [15, 16, 17]);
  const start = at(hour, pick(rng, [35, 40, 45, 50]));
  const end = at(hour + 1, pick(rng, [10, 15, 20, 30]));
  const [thing, verb] = pick(rng, UNTIL);
  const toHour = at(hour + 1) - start;
  const trap = hundredTrap(start, end);
  return {
    type: 'choice',
    prompt: `${thing} ${verb} ${d24(end)}. Se på klokka. Hvor lenge er det til?`,
    clock: { time: start },
    dayTime: start,
    options: durationOptions(rng, end - start, trap),
    explain: `Klokka er ${d24(start)}. Hopp til ${d24(at(hour + 1))}: ${toHour} minutter. Så til ${d24(end)}: ${end % 60} minutter. ${toHour} + ${end % 60} = ${durationText(end - start)}.`,
  };
}

const ACTIVITIES = ['leksene', 'pianoøvingen', 'turen med hunden', 'ryddingen av rommet', 'gitarøvingen'];

// 3. Hva blir klokka når noe har vart en stund? Svar med knapper eller ved å stille klokka.
function addDuration(rng) {
  const start = at(pick(rng, [16, 17, 18]), pick(rng, [10, 15, 20, 30, 35, 40]));
  const minutes = pick(rng, [25, 30, 40, 45, 50]);
  const end = start + minutes;
  const activity = pick(rng, ACTIVITIES);
  const explain = `${d24(start)} + ${minutes} minutter = ${d24(end)}.${Math.floor(end / 60) > Math.floor(start / 60) ? ` Du går forbi hel time: ${60 - (start % 60)} minutter til ${d24(at(Math.floor(end / 60)))}, og ${end % 60} minutter til.` : ''}`;
  if (rng() < 0.5) {
    return {
      type: 'set',
      prompt: `Du begynner på ${activity} ${d24(start)} og bruker ${minutes} minutter. Still klokka til når du er ferdig.`,
      hint: 'Dra minuttviseren fremover',
      start,
      target: end,
      clock: { drag: ['hour', 'minute'], snapMinutes: 5 },
      explain,
    };
  }
  return {
    type: 'choice',
    prompt: `Du begynner på ${activity} ${d24(start)} og bruker ${minutes} minutter. Når er du ferdig?`,
    clock: { time: start },
    options: timeOptions(rng, end),
    explain,
  };
}

// 4. Hvor lenge varer noe, over flere timer.
function durationBetween(rng) {
  const start = at(pick(rng, [17, 18, 19]), pick(rng, [15, 30, 45]));
  const length = pick(rng, [75, 90, 100, 105, 110, 135]);
  const end = start + length;
  const trap = hundredTrap(start, end);
  const thing = pick(rng, [['Filmen', 'Hvor lang er filmen?'], ['Konserten', 'Hvor lenge varer konserten?'], ['Kampen', 'Hvor lenge varer kampen?']]);
  return {
    type: 'choice',
    prompt: `${thing[0]} starter ${d24(start)} og slutter ${d24(end)}. ${thing[1]}`,
    clock: null,
    options: durationOptions(rng, length, trap),
    explain: `Fra ${d24(start)} til ${d24(start + 60)} er 1 time. Resten er ${durationText(length - 60)}. Til sammen ${durationText(length)}.`,
  };
}

// 5. Vanskeligst: regne bakover.
function subtract(rng) {
  const [event, walk] = pick(rng, [
    ['Bussen går', 'gå til bussen'],
    ['Skolen begynner', 'sykle til skolen'],
    ['Treningen starter', 'sykle til treningen'],
  ]);
  const end = at(pick(rng, [7, 8, 16, 17]), pick(rng, [5, 10, 15, 20, 30]));
  const minutes = pick(rng, [15, 20, 25, 30]);
  const start = end - minutes;
  return {
    type: 'choice',
    prompt: `${event} ${d24(end)}. Det tar ${minutes} minutter å ${walk}. Når må du dra?`,
    clock: null,
    options: timeOptions(rng, start, [end + minutes]),
    explain: `Regn bakover: ${d24(end)} − ${minutes} minutter = ${d24(start)}.${end % 60 < minutes ? ` Først ${end % 60} minutter tilbake til ${d24(end - (end % 60))}, så ${minutes - (end % 60)} til.` : ''} Du må dra ${d24(start)} ${dayPart(start).name}.`,
  };
}

export function makeRound(rng = Math.random) {
  return [untilSameHour(rng), untilCrossHour(rng), addDuration(rng), durationBetween(rng), subtract(rng)];
}

