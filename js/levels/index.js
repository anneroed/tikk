import * as level1 from './level1.js';
import * as level2 from './level2.js';
import * as level3 from './level3.js';
import * as level4 from './level4.js';
import * as level5 from './level5.js';

export const LEVELS = [
  { n: 1, title: 'Urskiven', subtitle: 'Tallene, strekene og viserne', content: level1 },
  { n: 2, title: 'Hele timer', subtitle: 'Timeviseren viser timen', content: level2 },
  { n: 3, title: 'Minutter', subtitle: 'Hvorfor 3 betyr 15 minutter', content: level3 },
  { n: 4, title: 'Halv og kvart', subtitle: '«Halv tre» er 2:30', content: level4 },
  { n: 5, title: 'Over og på', subtitle: 'Fem på halv, ti over halv', content: level5 },
  { n: 6, title: 'Sekundviseren', subtitle: 'Den raskeste av dem' },
  { n: 7, title: 'Digital klokke', subtitle: '24 timer og 14:30' },
  { n: 8, title: 'Tid i hverdagen', subtitle: 'Hvor lenge er det til?' },
];

export const levelByNumber = (n) => LEVELS.find((level) => level.n === Number(n));
export const isBuilt = (level) => Boolean(level?.content);
