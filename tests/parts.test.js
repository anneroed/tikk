import assert from 'node:assert/strict';
import test from 'node:test';
import { CATEGORIES, DEFAULT_DESIGN, FACES, PARTS, RARITY, THEMES, earnedParts, pickPack } from '../js/parts.js';
import { seeded } from '../js/levels/random.js';

const state = (overrides = {}) => ({
  levels: {},
  stats: { answered: 0, correct: 0, streak: 0, bestStreak: 0, days: [] },
  ...overrides,
});

test('alle deler er gyldige og kan tegnes', () => {
  const ids = PARTS.map((part) => part.id);
  assert.equal(new Set(ids).size, ids.length, 'like id-er');
  for (const part of PARTS) {
    assert.ok(CATEGORIES.some((c) => c.id === part.category), part.id);
    assert.ok(RARITY[part.rarity], part.id);
    if (part.category === 'face') assert.ok(FACES[part.id], `mangler urskive ${part.id}`);
    if (part.category === 'theme') assert.ok(THEMES[part.id], `mangler tema ${part.id}`);
  }
  assert.deepEqual(Object.keys(DEFAULT_DESIGN).sort(), CATEGORIES.map((c) => c.id).sort());
});

test('hvert ferdig nivå gir en sjelden eller episk del', () => {
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const reward = PARTS.find((part) => part.source.type === 'level' && part.source.level === n);
    assert.ok(reward, `nivå ${n} mangler belønning`);
    assert.ok(RARITY[reward.rarity].order >= 1, `nivå ${n} bør gi noe sjeldent`);
  }
});

test('pakker: bare med nok riktige, aldri noe hun har, og aldri fra høyere nivå enn hun spiller', () => {
  assert.equal(pickPack([], 1, 2), null);
  const owned = [];
  const rng = seeded(4);
  for (let i = 0; i < 20; i += 1) {
    const id = pickPack(owned, 1, 5, rng);
    if (!id) break;
    const part = PARTS.find((p) => p.id === id);
    assert.equal(part.source.level, 1, 'å repetere nivå 1 skal bare gi nivå 1-deler');
    assert.ok(!owned.includes(id));
    owned.push(id);
  }
  assert.equal(owned.length, PARTS.filter((p) => p.source.type === 'pack' && p.source.level === 1).length);
  assert.equal(pickPack(owned, 1, 5, rng), null, 'tomt for nivå 1-deler');
  const fromLevel2 = pickPack(owned, 2, 5, rng);
  assert.equal(PARTS.find((p) => p.id === fromLevel2).source.level, 2);
});

test('innsats og nivåer gir riktige deler', () => {
  assert.deepEqual(earnedParts(state()), []);
  assert.ok(earnedParts(state({ stats: { correct: 0, bestStreak: 10, days: [] } })).includes('midnatt'));
  assert.ok(earnedParts(state({ stats: { correct: 0, bestStreak: 0, days: ['a', 'b', 'c'] } })).includes('lava'));
  assert.ok(earnedParts(state({ levels: { 4: { passed: true } } })).includes('neon'));
  assert.ok(!earnedParts(state({ levels: { 4: { passed: false } } })).includes('neon'));
});
