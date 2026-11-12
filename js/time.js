// Ren tidsmatematikk og norsk tidsspråk. Ingen DOM her, så alt kan testes med node.
// Klokketid lagres som minutter (kan være negativ eller over 720 mens viserne dras).

export const mod = (value, base) => ((value % base) + base) % base;

/** Vinkel i grader med 0 rett opp og økende med klokka. */
export const minuteAngle = (total) => mod(total, 60) * 6;
export const hourAngle = (total) => mod(total, 720) / 2;

/** Timen 1–12 som timeviseren har passert. */
export const hourOf = (total) => {
  const hour = Math.floor(mod(total, 720) / 60);
  return hour === 0 ? 12 : hour;
};
export const minuteOf = (total) => Math.floor(mod(total, 60));
export const nextHour = (hour) => (hour % 12) + 1;

/** Minst mulig endring (i minutter, ±360) for å gå fra en klokketid til en annen på urskiven. */
export const shortestDelta = (from, to) => {
  const delta = mod(to - from, 720);
  return delta > 360 ? delta - 720 : delta;
};

/** Er to klokketider like på urskiven (12-timers)? */
export const sameClockTime = (a, b) => mod(Math.round(a), 720) === mod(Math.round(b), 720);

export const atHour = (hour, minute = 0) => mod(hour, 12) * 60 + minute;

const HOUR_WORDS = ['tolv', 'ett', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti', 'elleve', 'tolv'];
const MINUTE_WORDS = [
  'null', 'ett', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti',
  'elleve', 'tolv', 'tretten', 'fjorten',
];

export const hourWord = (hour) => HOUR_WORDS[mod(hour, 12) === 0 ? 12 : mod(hour, 12)];

function minutes(count) {
  if (count === 5 || count === 10) return MINUTE_WORDS[count];
  return count === 1 ? 'ett minutt' : `${MINUTE_WORDS[count]} minutter`;
}

/** Klokkeslett slik vi sier det på norsk, f.eks. «fem på halv tre». */
export function timePhrase(total) {
  const hour = hourOf(total);
  const minute = minuteOf(total);
  const next = hourWord(nextHour(hour));
  const now = hourWord(hour);

  if (minute === 0) return now;
  if (minute === 15) return `kvart over ${now}`;
  if (minute === 30) return `halv ${next}`;
  if (minute === 45) return `kvart på ${next}`;
  if (minute < 15) return `${minutes(minute)} over ${now}`;
  if (minute < 30) return `${minutes(30 - minute)} på halv ${next}`;
  if (minute < 45) return `${minutes(minute - 30)} over halv ${next}`;
  return `${minutes(60 - minute)} på ${next}`;
}

/** Stor forbokstav, også når teksten starter med en HTML-tagg som <b>. */
export const capitalize = (text) => text.replace(/^((?:<[^>]+>)*)(.)/, (_, tags, first) => tags + first.toUpperCase());

/** «14:05»-format. hours24 gir 0–23, ellers vises 1–12. */
export function digital(total, { hours24 = false } = {}) {
  const minute = minuteOf(total);
  const hour = hours24 ? Math.floor(mod(total, 1440) / 60) : hourOf(total);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function nowInMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

export const todayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Del av døgnet for en tid i minutter (0–1439), slik vi sier det: «om ettermiddagen». */
export function dayPart(total) {
  const hour = Math.floor(mod(total, 1440) / 60);
  if (hour < 6) return { name: 'om natta', icon: 'moon' };
  if (hour < 9) return { name: 'om morgenen', icon: 'sunrise' };
  if (hour < 12) return { name: 'på formiddagen', icon: 'sun' };
  if (hour < 18) return { name: 'om ettermiddagen', icon: 'sun' };
  return { name: 'om kvelden', icon: 'sunset' };
}

/** «1 time og 15 minutter», «45 minutter», «2 timer». */
export function durationText(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const h = hours === 1 ? '1 time' : `${hours} timer`;
  const m = rest === 1 ? '1 minutt' : `${rest} minutter`;
  if (!hours) return m;
  if (!rest) return h;
  return `${h} og ${m}`;
}

/** Sekunder i tiden (minutter med desimaler), 0–59. */
export const secondOf = (total) => mod(Math.round(total * 60), 60);
