// Felles byggeklosser for oppgaver i nivå 3 og oppover.
import { capitalize, hourOf, minuteOf, mod, timePhrase } from '../time.js';
import { pick, shuffle } from './random.js';

/** «4:05» – timer 1–12 uten null foran, slik det skrives før vi lærer 24-timersklokka. */
export const short = (time) => `${hourOf(time)}:${String(minuteOf(time)).padStart(2, '0')}`;

/** «Fem på halv tre · 2:25» – brukt under klokka i forklaringene. */
export const readout = (time) => `${capitalize(timePhrase(Math.round(time)))} · ${short(Math.round(time))}`;

export const randomHour = (rng) => pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

/**
 * Typiske feil for et klokkeslett, i prioritert rekkefølge:
 * feil time («halv to» for 2:30), speiling rundt hel time («ti over» for «ti på»),
 * speiling rundt halv («fem over halv» for «fem på halv») og fem minutter feil.
 */
export function likelyMistakes(time) {
  const base = time - mod(time, 60);
  const minute = mod(time, 60);
  const nearestHour = Math.round(time / 60) * 60;
  return [
    minute >= 20 ? time - 60 : time + 60,
    2 * nearestHour - time,
    2 * (base + 30) - time,
    minute >= 20 ? time + 60 : time - 60,
    time + 5,
    time - 5,
    time + 15,
  ];
}

/** Unike gale tider som ikke ser like ut som svaret. */
export function wrongTimes(time, candidates, count = 3) {
  const seen = new Set([mod(time, 720)]);
  const result = [];
  for (const candidate of candidates) {
    const key = mod(candidate, 720);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
    if (result.length === count) break;
  }
  return result;
}

/** Flervalg der svaret er et klokkeslett, vist som tekst (format) eller som små klokker. */
export function timeChoice(rng, { prompt, time, wrong, format, explain, clock = { time }, asClocks = false }) {
  const option = (t, correct) => (asClocks ? { time: t, correct } : { label: format(t), correct });
  return {
    type: 'choice',
    prompt,
    clock: asClocks ? null : clock,
    options: shuffle(rng, [option(time, true), ...wrong.map((t) => option(t, false))]),
    explain,
  };
}

/**
 * «Hvilken er feil?»: fire klokker med tekst, der én tekst ikke stemmer.
 * pool er kandidater til de tre riktige; de som ville fått samme tekst som løgnen, hoppes over.
 */
export function whichIsWrong(rng, { liar, lie, pool, format, explain }) {
  const used = new Set([mod(liar, 720), mod(lie, 720)]);
  const honest = [];
  for (const time of pool) {
    if (used.has(mod(time, 720))) continue;
    used.add(mod(time, 720));
    honest.push(time);
    if (honest.length === 3) break;
  }
  return {
    type: 'choice',
    prompt: 'Én av klokkene har feil tekst. Hvilken?',
    clock: null,
    options: shuffle(rng, [
      { time: liar, label: format(lie), correct: true },
      ...honest.map((t) => ({ time: t, label: format(t), correct: false })),
    ]),
    explain,
  };
}
