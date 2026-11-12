// Interaktiv forklaring for et nivå: noen få kort, samme klokke hele veien.
import { createClock } from '../clock.js';
import { levelByNumber, isBuilt } from '../levels/index.js';
import { navigate } from '../router.js';
import { isLevelOpen, levelProgress } from '../store.js';
import { play } from '../sound.js';
import { backButton, h, icon } from '../ui.js';

export function levelView({ params, onCleanup }) {
  const level = levelByNumber(params.n);
  if (!level || !isBuilt(level) || !isLevelOpen(level.n)) {
    queueMicrotask(() => navigate('/', { replace: true }));
    return h('div');
  }

  const steps = level.content.intro;
  let index = 0;

  const clock = createClock();
  const counter = h('span', { class: 'step-counter' });
  const title = h('h1', { class: 'step-title' });
  const text = h('p', { class: 'step-text' });
  const label = h('p', { class: 'clock-label', 'aria-live': 'polite' });
  const hint = h('p', { class: 'clock-hint' });
  const extra = h('div', { class: 'step-extra' });
  const dots = h('div', { class: 'step-dots' }, steps.map(() => h('span')));
  const prev = h('button', { class: 'button button-ghost', type: 'button', onclick: () => show(index - 1) }, 'Forrige');
  const next = h('button', { class: 'button', type: 'button', onclick: () => (index < steps.length - 1 ? show(index + 1) : startTasks()) });

  function startTasks() {
    play('tap');
    navigate(`/niva/${level.n}/oppgaver`, { replace: true });
  }

  function show(i) {
    index = Math.max(0, Math.min(steps.length - 1, i));
    const step = steps[index];
    counter.textContent = `${index + 1} / ${steps.length}`;
    title.textContent = step.title;
    text.innerHTML = step.text;
    [...dots.children].forEach((dot, n) => dot.classList.toggle('is-on', n <= index));

    clock.configure({
      drag: [],
      snapHour: false,
      hands: true,
      ...step.clock,
      onChange: (time) => {
        if (step.label) label.textContent = step.label(time);
      },
    });
    clock.highlight(step.clock.highlight ?? []);
    label.textContent = step.label ? step.label(clock.getTime()) : '';
    label.hidden = !step.label;
    hint.textContent = step.hint ?? '';
    hint.hidden = !step.hint;

    extra.replaceChildren();
    if (step.action) {
      extra.append(
        h(
          'button',
          {
            class: 'button button-soft',
            type: 'button',
            onclick: async (event) => {
              event.currentTarget.disabled = true;
              await step.action.run(clock);
              event.currentTarget.disabled = false;
            },
          },
          icon('play'),
          step.action.label,
        ),
      );
    }

    prev.hidden = index === 0;
    next.textContent = index === steps.length - 1 ? 'Start oppgaver' : 'Neste';
  }

  const done = levelProgress(level.n).rounds > 0;
  const page = h(
    'div',
    { class: 'screen screen-level' },
    h(
      'header',
      { class: 'topbar' },
      backButton('Hjem'),
      done ? h('button', { class: 'link-button', type: 'button', onclick: startTasks }, 'Rett til oppgaver') : null,
    ),
    h(
      'main',
      { class: 'content level-content' },
      h('div', { class: 'level-kicker' }, h('span', {}, `Nivå ${level.n} · ${level.title}`), counter),
      dots,
      h('div', { class: 'clock-stage' }, clock.el),
      label,
      hint,
      h('section', { class: 'step-card' }, title, text, extra),
      h('div', { class: 'step-nav' }, prev, next),
    ),
  );

  show(0);
  onCleanup(() => clock.destroy());
  return page;
}
