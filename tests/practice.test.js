import assert from 'node:assert/strict';
import test from 'node:test';
import { PRACTICE_LENGTH, makePractice, practiceWeight } from '../js/levels/practice.js';
import { seeded } from '../js/levels/random.js';

test('øvingsrunden har 10 ulike oppgaver, bare fra valgte nivåer', () => {
  for (let seed = 1; seed <= 100; seed += 1) {
    const round = makePractice([2, 5, 7], { rng: seeded(seed) });
    assert.equal(round.length, PRACTICE_LENGTH);
    assert.ok(round.every((q) => [2, 5, 7].includes(q.level)));
    const keys = round.map((q) => `${q.prompt}|${q.clock?.time ?? ''}|${q.target ?? ''}|${q.digital ?? ''}`);
    assert.equal(new Set(keys).size, keys.length);
  }
});

test('ett nivå alene gir også en full runde', () => {
  assert.equal(makePractice([1], { rng: seeded(3) }).length, PRACTICE_LENGTH);
});

test('nivåer med mange feil kommer oftere', () => {
  assert.ok(practiceWeight({ answered: 20, correct: 8 }) > practiceWeight({ answered: 20, correct: 19 }));
  const skills = { 3: { answered: 30, correct: 29 }, 4: { answered: 30, correct: 9 } };
  let fromWeak = 0;
  let fromStrong = 0;
  for (let seed = 1; seed <= 60; seed += 1) {
    for (const q of makePractice([3, 4], { skills, rng: seeded(seed) })) {
      if (q.level === 4) fromWeak += 1;
      else fromStrong += 1;
    }
  }
  assert.ok(fromWeak > fromStrong * 1.5, `${fromWeak} mot ${fromStrong}`);
});
