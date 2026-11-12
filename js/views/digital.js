// Digital klokke og døgnlinje, brukt i nivå 7 og 8.
import { dayPart, digital, mod, secondOf } from '../time.js';
import { h, icon } from '../ui.js';

/** Stor digital visning, som på en smartklokke: «14:30» eller «14:30:15». */
export function digitalDisplay(time, { seconds = false } = {}) {
  const text = digital(Math.floor(time + 1e-9), { hours24: true });
  return h(
    'div',
    { class: 'digital' },
    h('span', { class: 'digital-time' }, text, seconds ? h('small', {}, `:${String(secondOf(time)).padStart(2, '0')}`) : null),
  );
}

/** Merke som sier hvilken del av døgnet det er: sol, måne osv. */
export function dayBadge(time) {
  const part = dayPart(time);
  return h('span', { class: `day-badge is-${part.icon}` }, icon(part.icon), part.name);
}

/** Døgnet som en linje fra 00 til 24, med en prikk der klokka er nå. */
export function dayBar(time) {
  const position = (mod(time, 1440) / 1440) * 100;
  return h(
    'div',
    { class: 'day-bar' },
    h('div', { class: 'day-track' }, h('span', { class: 'day-dot', style: `left: ${position}%` })),
    h('div', { class: 'day-scale' }, ['00', '06', '12', '18', '24'].map((label) => h('span', {}, label))),
  );
}

/** Alt samlet: digital tid, døgnlinje og del av døgnet. */
export function dayPanel(time) {
  return h('div', { class: 'day-panel' }, h('div', { class: 'day-row' }, digitalDisplay(time), dayBadge(time)), dayBar(time));
}
