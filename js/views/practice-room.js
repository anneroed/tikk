// Øvingsrommet: velg hvilke nivåer du vil øve på, eller bland alt.
import { LEVELS } from '../levels/index.js';
import { PRACTICE_LENGTH } from '../levels/practice.js';
import { navigate } from '../router.js';
import { play } from '../sound.js';
import { getState, practiceLevels } from '../store.js';
import { h, icon, subpage } from '../ui.js';

const accuracyText = (skill) => {
  if (!skill || skill.answered < 3) return 'Lite øvd';
  return `${Math.round((skill.correct / skill.answered) * 100)} % riktig`;
};

export function practiceRoomView() {
  const available = practiceLevels();
  if (!available.length) {
    return subpage(
      'Øvingsrom',
      h('p', { class: 'muted' }, 'Her kan du øve på blandede oppgaver fra nivåene du har klart. Fullfør nivå 1 først, så åpner øvingsrommet.'),
      h('button', { class: 'button button-wide', type: 'button', onclick: () => navigate('/niva/1') }, 'Til nivå 1'),
    );
  }

  const selected = new Set(available);
  const { skills } = getState();
  const start = h('button', { class: 'button button-wide', type: 'button' });
  const list = h('div', { class: 'practice-list' });
  const count = h('small', {});

  function render() {
    list.replaceChildren(
      ...LEVELS.filter((level) => available.includes(level.n)).map((level) => {
        const on = selected.has(level.n);
        return h(
          'button',
          {
            class: `practice-level ${on ? 'is-on' : ''}`,
            type: 'button',
            role: 'checkbox',
            'aria-checked': String(on),
            onclick: () => {
              if (on && selected.size > 1) selected.delete(level.n);
              else selected.add(level.n);
              play('tap');
              render();
            },
          },
          h('span', { class: 'level-number' }, String(level.n)),
          h('span', { class: 'level-text' }, h('strong', {}, level.title), h('small', {}, accuracyText(skills[level.n]))),
          h('span', { class: 'practice-check' }, on ? icon('check') : null),
        );
      }),
    );
    count.textContent = `${selected.size} valgt`;
    const all = selected.size === available.length;
    start.textContent = all ? `Bland alt (${PRACTICE_LENGTH} oppgaver)` : `Øv på ${selected.size === 1 ? 'ett nivå' : `${selected.size} nivåer`} (${PRACTICE_LENGTH} oppgaver)`;
  }

  start.addEventListener('click', () => {
    play('tap');
    const levels = [...selected].sort((a, b) => a - b);
    navigate(`/ov/${levels.join('-')}`);
  });

  render();
  return subpage(
    'Øvingsrom',
    h('p', { class: 'muted' }, 'Blandede oppgaver fra nivåene du har klart. Nivåene du bommer mest på, kommer oftere.'),
    start,
    h('div', { class: 'section-head' }, h('h2', {}, 'Velg nivåer'), count),
    list,
  );
}
