// Nivå 1: urskiven, tallene, strekene og viserne.
import { capitalize } from '../time.js';
import { HOUR, MINUTE, SECOND } from '../ui.js';
import { pick, shuffle } from './random.js';

const wrap = (n) => ((n - 1 + 120) % 12) + 1;

// 10:10 og 40 sekunder: alle tre viserne står godt fra hverandre.
const WITH_SECONDS = 10 * 60 + 10 + 40 / 60;

// «Med klokka» kommer tidlig, siden nesten alt annet bygger på hvilken vei viserne går.
let lastDragTime = null;
let lastDirection = 'Dra den lange viseren';
function describeDirection(time) {
  const delta = lastDragTime === null ? 0 : time - lastDragTime;
  // Store hopp betyr at kortet ble åpnet på nytt; små hopp er at viseren rettes inn når hun slipper.
  if (lastDragTime === null || Math.abs(delta) > 20) {
    lastDragTime = time;
    lastDirection = 'Dra den lange viseren';
  } else if (Math.abs(delta) >= 0.6) {
    lastDragTime = time;
    lastDirection = delta > 0 ? 'Med klokka →' : '← Mot klokka, andre veien';
  }
  return lastDirection;
}

export const intro = [
  {
    title: 'Dette er en urskive',
    text: 'En analog klokke har en rund urskive med tallene 1 til 12. Tallene står alltid i samme rekkefølge, og 12 står øverst.',
    clock: { time: 10 * 60 + 10, highlight: ['numbers'] },
  },
  {
    title: 'Med klokka',
    text: 'Viserne går alltid samme vei rundt: fra 12 til 1, så 2, 3, 4 og videre. Den veien kaller vi «med klokka». Etter 12 begynner det på 1 igjen.',
    clock: { time: 3 * 60, highlight: ['minute'] },
    action: {
      label: 'Se viserne gå',
      run: (clock) => clock.animateTo(clock.getTime() + 60, { duration: 4000, direction: 'forward', sound: true }),
    },
  },
  {
    title: 'Hvilken vei?',
    text: `Dra ${MINUTE} med klokka: fra 12 mot 1 og 2. Prøv også andre veien, så ser du forskjellen.`,
    clock: { time: 3 * 60, drag: ['minute'] },
    label: describeDirection,
  },
  {
    title: 'Fire faste punkter',
    text: '12 står øverst og 6 står nederst. 3 og 9 står på hver sin side, midt mellom dem. Finner du disse fire, finner du alle de andre tallene.',
    clock: { time: 10 * 60 + 10, highlight: ['quarters'] },
  },
  {
    title: '60 små streker',
    text: 'Rundt kanten er det 60 små streker. Mellom to tall er det alltid 5 steg. Strekene brukes til å telle minutter, som du lærer om snart.',
    clock: { time: 10 * 60 + 10, highlight: ['ticks'] },
  },
  {
    title: 'Tre visere',
    text: `En klokke kan ha tre visere: ${HOUR}, ${MINUTE} og ${SECOND}. Navnene brukes i hele appen, så nå skal vi bli godt kjent med hver av dem.`,
    clock: { time: WITH_SECONDS, seconds: true, running: true, highlight: ['hour', 'minute', 'second'] },
  },
  {
    title: 'Timeviseren',
    text: `${capitalize(HOUR)} er <b>den korte, tykke</b>. Den viser hvilken time det er. Den går så sakte at du nesten ikke ser at den beveger seg.`,
    clock: { time: WITH_SECONDS, seconds: true, highlight: ['hour'] },
    label: () => 'Kort og tykk = timer',
  },
  {
    title: 'Minuttviseren',
    text: `${capitalize(MINUTE)} er <b>den lange</b>. Den viser minuttene. Den bruker én time på å gå en hel runde.`,
    clock: { time: WITH_SECONDS, seconds: true, highlight: ['minute'] },
    label: () => 'Lang = minutter',
  },
  {
    title: 'Sekundviseren',
    text: `${capitalize(SECOND)} er <b>den tynne som går fort</b>. Den går en hel runde hvert minutt. Mange klokker har ikke sekundviser, så den bruker vi ikke før senere.`,
    clock: { time: WITH_SECONDS, seconds: true, running: true, highlight: ['second'] },
    label: () => 'Tynn og rask = sekunder',
  },
  {
    title: 'Hvem er hvem?',
    text: 'Trykk på viserne en etter en. Husk: jo kortere viser, jo saktere går den.',
    clock: { time: WITH_SECONDS, seconds: true, running: true, tappable: 'hands' },
    tapPrompt: 'Trykk på en viser',
    onTap: (target) => {
      if (target.kind !== 'hand') return 'Det er et tall. Prøv å treffe en viser.';
      return {
        hour: 'Timeviseren: kort og tykk, viser timene',
        minute: 'Minuttviseren: lang, viser minuttene',
        second: 'Sekundviseren: tynn og rask, viser sekundene',
      }[target.hand];
    },
  },
  {
    title: 'Prøv selv',
    text: `Dra ${MINUTE} med klokka. Se at ${HOUR} også flytter seg, bare mye saktere.`,
    clock: { time: 3 * 60, drag: ['minute'] },
    hint: 'Dra den lange viseren rundt',
  },
];

const tapNumber = ({ prompt, answer, explain }) => ({
  type: 'tap',
  prompt,
  clock: { time: 0, hands: false },
  accept: { kind: 'num', n: answer },
  explain,
});

const asChoice = (rng, { prompt, options: [right, ...wrong], explain, time = 10 * 60 + 10, seconds = false }) => ({
  type: 'choice',
  prompt,
  clock: { time, seconds },
  options: shuffle(rng, [{ label: right, correct: true }, ...wrong.map((label) => ({ label, correct: false }))]),
  explain,
});

// 1. Lettest: finn et tall.
function findNumber(rng) {
  const n = pick(rng, [1, 2, 4, 5, 7, 8, 10, 11]);
  return tapNumber({
    prompt: `Trykk på tallet ${n}.`,
    answer: n,
    explain: `${n} står ${n < 6 ? 'på høyre side' : 'på venstre side'} av urskiven.`,
  });
}

// 2. Med klokka: ett steg videre.
function direction(rng) {
  if (rng() < 0.5) {
    return asChoice(rng, {
      prompt: 'Minuttviseren står på 12 og går med klokka. Hvilket tall kommer den til først?',
      options: ['1', '11', '6', '3'],
      explain: 'Med klokka går viserne fra 12 til 1, så 2, 3 og videre.',
      time: 4 * 60,
    });
  }
  const n = pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const answer = wrap(n + 1);
  return tapNumber({
    prompt: `Hvilket tall kommer rett etter ${n} når du går med klokka? Trykk på det.`,
    answer,
    explain: n === 12 ? 'Etter 12 begynner urskiven på nytt med 1.' : `Med klokka blir tallene større: etter ${n} kommer ${answer}.`,
  });
}

// 4. Faste punkter og fakta om urskiven.
function aboutTheFace(rng) {
  if (rng() < 0.5) {
    const [place, answer] = pick(rng, [['nederst', 6], ['øverst', 12]]);
    return tapNumber({
      prompt: `Trykk på tallet som står ${place} på klokka.`,
      answer,
      explain: `${answer} er et av de fire faste punktene. 12 står alltid øverst og 6 alltid nederst.`,
    });
  }
  return asChoice(
    rng,
    pick(rng, [
      {
        prompt: 'Hvor mange små steg er det mellom to tall på urskiven?',
        options: ['5', '1', '10', '12'],
        explain: '60 streker fordelt på 12 tall blir 5 steg mellom hvert tall.',
      },
      {
        prompt: 'Hvor mange små streker er det rundt hele urskiven?',
        options: ['60', '12', '100', '24'],
        explain: 'Det er 60 streker, én for hvert minutt i en time.',
      },
      {
        prompt: 'Hvilken viser går fortest?',
        options: ['Sekundviseren', 'Minuttviseren', 'Timeviseren'],
        explain: 'Sekundviseren, den tynne, går en hel runde hvert minutt. Timeviseren er saktest.',
        time: WITH_SECONDS,
        seconds: true,
      },
      {
        prompt: 'Hvilken viser viser timene?',
        options: ['Den korte, tykke', 'Den lange', 'Den tynne som går fort'],
        explain: 'Timeviseren er den korte, tykke. Den lange er minuttviseren, og den tynne er sekundviseren.',
        time: WITH_SECONDS,
        seconds: true,
      },
      {
        prompt: 'Hva skiller timeviseren fra minuttviseren?',
        options: ['Timeviseren er kortest', 'Timeviseren er lengst', 'Timeviseren er alltid oransje', 'Det er ingen forskjell'],
        explain: 'Timeviseren er den korte. Fargen kan variere fra klokke til klokke, lengden gjør det ikke.',
      },
    ]),
  );
}

// 5. Vanskeligst: flere steg med klokka.
function countSteps(rng) {
  const n = pick(rng, [2, 4, 5, 7, 8, 10, 11]);
  const steps = pick(rng, [2, 3]);
  const answer = wrap(n + steps);
  return tapNumber({
    prompt: `Start på ${n} og gå ${steps} tall med klokka. Trykk der du lander.`,
    answer,
    explain: `Med klokka teller vi oppover: ${Array.from({ length: steps + 1 }, (_, i) => wrap(n + i)).join(' → ')}.`,
  });
}

function tapHand(rng) {
  const handName = pick(rng, ['hour', 'minute', 'minute', 'hour', 'second']);
  // Tidspunkter der alle tre viserne står godt fra hverandre, så det er lett å treffe.
  const time = pick(rng, [WITH_SECONDS, 2 * 60 + 40 + 20 / 60, 4 * 60 + 50 + 30 / 60, 8 * 60 + 15, 1 * 60 + 35 + 50 / 60]);
  const text = {
    hour: ['Trykk på timeviseren.', `${capitalize(HOUR)} er den korte, tykke. Den viser timene.`],
    minute: ['Trykk på minuttviseren.', `${capitalize(MINUTE)} er den lange. Den viser minuttene.`],
    second: ['Trykk på sekundviseren.', `${capitalize(SECOND)} er den tynne som går fort. Den viser sekundene.`],
  }[handName];
  return {
    type: 'tap',
    prompt: text[0],
    clock: { time, seconds: true },
    accept: { kind: 'hand', hand: handName },
    explain: text[1],
  };
}

/** Spørsmålene kommer i rekkefølge fra lett til vanskeligere. */
export function makeRound(rng = Math.random) {
  return [findNumber(rng), direction(rng), tapHand(rng), aboutTheFace(rng), countSteps(rng)];
}
