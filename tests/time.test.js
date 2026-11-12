import assert from 'node:assert/strict';
import test from 'node:test';
import { atHour, digital, hourAngle, hourOf, minuteAngle, sameClockTime, shortestDelta, timePhrase } from '../js/time.js';

test('viserne henger sammen: en hel runde med minuttviseren flytter timeviseren 30 grader', () => {
  const start = atHour(3);
  assert.equal(minuteAngle(start), 0);
  assert.equal(minuteAngle(start + 60), 0);
  assert.equal(hourAngle(start), 90);
  assert.equal(hourAngle(start + 60), 120);
  assert.equal(hourAngle(atHour(4, 30)), 135);
});

test('tider utenfor 0–720 fra dragging tolkes riktig', () => {
  assert.equal(hourOf(-60), 11);
  assert.equal(hourOf(720 + 60), 1);
  assert.equal(hourOf(0), 12);
  assert.ok(sameClockTime(-60, atHour(11)));
  assert.equal(shortestDelta(atHour(11), atHour(1)), 120);
  assert.equal(shortestDelta(atHour(1), atHour(11)), -120);
});

test('norsk tidsspråk', () => {
  const cases = [
    [atHour(3), 'tre'],
    [atHour(1), 'ett'],
    [atHour(12), 'tolv'],
    [atHour(2, 5), 'fem over to'],
    [atHour(2, 15), 'kvart over to'],
    [atHour(2, 20), 'ti på halv tre'],
    [atHour(2, 25), 'fem på halv tre'],
    [atHour(2, 30), 'halv tre'],
    [atHour(2, 35), 'fem over halv tre'],
    [atHour(2, 40), 'ti over halv tre'],
    [atHour(2, 45), 'kvart på tre'],
    [atHour(2, 55), 'fem på tre'],
    [atHour(12, 50), 'ti på ett'],
    [atHour(11, 30), 'halv tolv'],
    [atHour(2, 1), 'ett minutt over to'],
    [atHour(2, 58), 'to minutter på tre'],
  ];
  for (const [time, phrase] of cases) assert.equal(timePhrase(time), phrase, `${digital(time)}`);
});

test('digital visning', () => {
  assert.equal(digital(14 * 60 + 30, { hours24: true }), '14:30');
  assert.equal(digital(14 * 60 + 30), '02:30');
  assert.equal(digital(5, { hours24: true }), '00:05');
});

test('stor forbokstav også inni HTML', async () => {
  const { capitalize } = await import('../js/time.js');
  assert.equal(capitalize('<b class="t-hour">timeviseren</b> er kort'), '<b class="t-hour">Timeviseren</b> er kort');
  assert.equal(capitalize('halv tre'), 'Halv tre');
});

test('varighet og del av døgnet', async () => {
  const { durationText, dayPart } = await import('../js/time.js');
  assert.equal(durationText(45), '45 minutter');
  assert.equal(durationText(60), '1 time');
  assert.equal(durationText(75), '1 time og 15 minutter');
  assert.equal(durationText(121), '2 timer og 1 minutt');
  assert.equal(dayPart(14 * 60 + 30).name, 'om ettermiddagen');
  assert.equal(dayPart(30).name, 'om natta');
  assert.equal(dayPart(20 * 60).name, 'om kvelden');
  assert.equal(dayPart(7 * 60).name, 'om morgenen');
});
