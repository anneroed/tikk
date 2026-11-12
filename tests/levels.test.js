import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVELS } from '../js/levels/index.js';
import { seeded } from '../js/levels/random.js';
import { sameClockTime } from '../js/time.js';

const built = LEVELS.filter((level) => level.content);

test('hver runde har 5 gyldige spørsmål med nøyaktig ett riktig svar', () => {
  for (const level of built) {
    for (let seed = 1; seed <= 200; seed += 1) {
      const round = level.content.makeRound(seeded(seed));
      assert.equal(round.length, 5, `nivå ${level.n}`);
      for (const question of round) {
        assert.ok(question.prompt && question.explain, `nivå ${level.n}: mangler tekst`);
        if (question.type === 'choice') {
          assert.equal(question.options.filter((o) => o.correct).length, 1, question.prompt);
          const labels = question.options.map((o) => o.label);
          assert.equal(new Set(labels).size, labels.length, `like svaralternativer: ${labels}`);
          assert.ok(question.options.length >= 3);
        } else if (question.type === 'set') {
          assert.ok(!sameClockTime(question.start, question.target), 'klokka står allerede riktig');
        } else if (question.type === 'tap') {
          const { accept } = question;
          if (accept.kind === 'num') assert.ok(accept.n >= 1 && accept.n <= 12, `${question.prompt} → ${accept.n}`);
          else assert.ok(['hour', 'minute'].includes(accept.hand));
        } else {
          assert.fail(`ukjent type ${question.type}`);
        }
      }
    }
  }
});

test('forklaringene har minst tre kort', () => {
  for (const level of built) assert.ok(level.content.intro.length >= 3);
});

test('nivå 1 bruker ikke kvart eller halv, og forklarer «med klokka» tidlig', async () => {
  const level1 = await import('../js/levels/level1.js');
  for (let seed = 1; seed <= 200; seed += 1) {
    for (const question of level1.makeRound(seeded(seed))) {
      const text = `${question.prompt} ${question.explain} ${(question.options ?? []).map((o) => o.label).join(' ')}`;
      assert.doesNotMatch(text, /kvart|halv/i, question.prompt);
    }
  }
  assert.ok(level1.intro.findIndex((step) => step.title === 'Med klokka') <= 1);
});
