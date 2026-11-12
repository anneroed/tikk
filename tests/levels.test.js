import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVELS } from '../js/levels/index.js';
import { seeded } from '../js/levels/random.js';
import { minuteOf, mod, sameClockTime, secondOf, timePhrase } from '../js/time.js';

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
          // Både teksten og klokka må skille alternativene fra hverandre.
          const labels = question.options.map((o) => o.label).filter(Boolean);
          const times = question.options.filter((o) => o.time !== undefined).map((o) => mod(o.time, 720));
          assert.equal(new Set(labels).size, labels.length, `like tekster: ${labels} (${question.prompt})`);
          assert.equal(new Set(times).size, times.length, `like klokker (${question.prompt})`);
          assert.ok(question.options.length >= 3, question.prompt);
        } else if (question.type === 'set') {
          const same =
            question.check === 'second'
              ? secondOf(question.start) === secondOf(question.target)
              : question.check === 'minute'
                ? minuteOf(question.start) === minuteOf(question.target)
                : sameClockTime(question.start, question.target);
          assert.ok(!same, `klokka står allerede riktig (nivå ${level.n})`);
        } else if (question.type === 'tap') {
          const { accept } = question;
          if (accept.kind === 'num') assert.ok(accept.n >= 1 && accept.n <= 12, `${question.prompt} → ${accept.n}`);
          else assert.ok(['hour', 'minute', 'second'].includes(accept.hand));
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

test('nivå 1 bruker ikke kvart eller halv, og forklarer viserne før de brukes', async () => {
  const level1 = await import('../js/levels/level1.js');
  for (let seed = 1; seed <= 200; seed += 1) {
    for (const question of level1.makeRound(seeded(seed))) {
      const text = `${question.prompt} ${question.explain} ${(question.options ?? []).map((o) => o.label).join(' ')}`;
      assert.doesNotMatch(text, /kvart|halv/i, question.prompt);
    }
  }
  // Viserne skal ha fått navn før noe kort ber henne gjøre noe med dem.
  const titles = level1.intro.map((step) => step.title);
  const named = titles.indexOf('Tre visere');
  for (const [index, step] of level1.intro.entries()) {
    if (/(time|minutt|sekund)viseren/i.test(step.text)) assert.ok(index >= named, `«${step.title}» nevner en viser før de er forklart`);
  }
  assert.ok(titles.indexOf('Med klokka') < titles.indexOf('Fire faste punkter'));
});

test('«hvilken er feil?» har nøyaktig én klokke der teksten ikke stemmer', async () => {
  const { short } = await import('../js/levels/common.js');
  for (const n of [4, 5]) {
    const level = LEVELS.find((l) => l.n === n);
    for (let seed = 1; seed <= 300; seed += 1) {
      for (const question of level.content.makeRound(seeded(seed))) {
        if (question.prompt !== 'Én av klokkene har feil tekst. Hvilken?') continue;
        assert.equal(question.options.length, 4);
        for (const option of question.options) {
          const truthful = option.label.toLowerCase() === timePhrase(option.time) || option.label === short(option.time);
          assert.equal(truthful, !option.correct, `${option.label} på ${short(option.time)}`);
        }
      }
    }
  }
});

test('svarene i nivå 3–5 stemmer med klokka', () => {
  for (const n of [3, 4, 5]) {
    const level = LEVELS.find((l) => l.n === n);
    for (let seed = 1; seed <= 200; seed += 1) {
      for (const question of level.content.makeRound(seeded(seed))) {
        if (question.type !== 'choice' || !question.clock || question.options[0].time !== undefined) continue;
        if (!/^Hva er klokka/.test(question.prompt) && !/Hva sier vi/.test(question.prompt)) continue;
        const right = question.options.find((o) => o.correct).label.toLowerCase();
        assert.ok(right.includes(':') || right === timePhrase(question.clock.time), `${right} ≠ ${timePhrase(question.clock.time)}`);
      }
    }
  }
});

test('ingen like spørsmål i samme runde', () => {
  for (const level of built) {
    for (let seed = 1; seed <= 300; seed += 1) {
      const keys = level.content.makeRound(seeded(seed)).map((q) => `${q.prompt}|${q.clock?.time ?? ''}|${q.target ?? ''}`);
      assert.equal(new Set(keys).size, keys.length, `nivå ${level.n}: ${keys.join(' ; ')}`);
    }
  }
});
