import { createClock } from '../clock.js';
import { LEVELS, isBuilt } from '../levels/index.js';
import { navigate } from '../router.js';
import { play } from '../sound.js';
import { PARTS } from '../parts.js';
import { getState, isLevelOpen, isOwned, levelProgress, practiceLevels, setSound, PASS_SCORE } from '../store.js';
import { openPackages } from './package.js';
import { capitalize, digital, nowInMinutes, timePhrase } from '../time.js';
import { h, icon } from '../ui.js';

function soundButton() {
  const button = h('button', { class: 'icon-button', type: 'button' });
  const render = () => {
    const on = getState().sound;
    button.replaceChildren(icon(on ? 'soundOn' : 'soundOff'));
    button.setAttribute('aria-label', on ? 'Skru av lyd' : 'Skru på lyd');
  };
  button.addEventListener('click', () => {
    setSound(!getState().sound);
    render();
    play('tap');
  });
  render();
  return button;
}

/** Hennes klokke viser tiden nå. Trykk for å se svaret. */
function nowCard(onCleanup) {
  const clock = createClock({ time: nowInMinutes() });
  const answer = h('p', { class: 'now-answer' });
  let revealed = false;

  const update = () => {
    const now = nowInMinutes();
    clock.setTime(now);
    answer.textContent = revealed ? `${capitalize(timePhrase(now))} · ${digital(now, { hours24: true })}` : 'Hva er klokka nå?';
  };
  const timer = setInterval(update, 10_000);
  onCleanup(() => clearInterval(timer));
  update();

  return h(
    'button',
    {
      class: 'now-card',
      type: 'button',
      onclick: () => {
        revealed = !revealed;
        play('tap');
        update();
      },
    },
    h('div', { class: 'now-clock' }, clock.el),
    answer,
  );
}

/** Uåpnede pakker venter øverst, så de ikke blir glemt om hun gikk ut før hun åpnet dem. */
function pendingCard() {
  const count = getState().pending.length;
  if (!count) return null;
  return h(
    'button',
    {
      class: 'pack-card home-pack',
      type: 'button',
      onclick: async () => {
        await openPackages();
        navigate('/', { replace: true });
      },
    },
    h('span', { class: 'pack-card-gift' }),
    h('span', {}, h('strong', {}, count === 1 ? 'En uåpnet pakke' : `${count} uåpnede pakker`), h('small', {}, 'Trykk for å åpne')),
  );
}

/** Øvingsrommet. Når hele løypa er ferdig, blir det hovedkortet øverst. */
function practiceCard(pathDone) {
  const levels = practiceLevels();
  if (!levels.length) return null;
  return h(
    'button',
    { class: pathDone ? 'continue-card' : 'practice-card', type: 'button', onclick: () => navigate('/ovingsrom') },
    h('small', {}, pathDone ? 'Løypa er fullført' : 'Øvingsrom'),
    h('strong', {}, pathDone ? 'Øvingsrom' : 'Bland og øv'),
    h('span', { class: 'muted' }, `Blandede oppgaver fra ${levels.length === 1 ? 'nivå 1' : `${levels.length} nivåer`}`),
    h('span', { class: 'continue-arrow' }, icon('forward')),
  );
}

function levelCard(level) {
  const open = isLevelOpen(level.n);
  const built = isBuilt(level);
  const progress = levelProgress(level.n);
  const state = !built ? 'soon' : !open ? 'locked' : progress.passed ? 'done' : 'open';

  let status;
  if (state === 'soon') status = h('span', { class: 'level-status' }, 'Kommer');
  else if (state === 'locked') status = h('span', { class: 'level-status' }, icon('lock'));
  else if (state === 'done') status = h('span', { class: 'level-status is-done' }, icon('check'), `${progress.best}/5`);
  else status = h('span', { class: 'level-status is-open' }, progress.rounds ? `${progress.best}/5` : 'Start');

  return h(
    'button',
    {
      class: `level-card is-${state}`,
      type: 'button',
      disabled: state === 'soon' || state === 'locked',
      onclick: () => {
        play('tap');
        navigate(`/niva/${level.n}`);
      },
    },
    h('span', { class: 'level-number' }, String(level.n)),
    h('span', { class: 'level-text' }, h('strong', {}, level.title), h('small', {}, level.subtitle)),
    status,
  );
}

export function homeView({ onCleanup }) {
  const { stats } = getState();
  const current = LEVELS.find((level) => isBuilt(level) && isLevelOpen(level.n) && !levelProgress(level.n).passed);

  return h(
    'div',
    { class: 'screen screen-home' },
    h(
      'header',
      { class: 'home-top' },
      h('span', { class: 'brand' }, 'Tikk'),
      h(
        'div',
        { class: 'home-actions' },
        soundButton(),
        h('button', { class: 'icon-button', type: 'button', 'aria-label': 'Innstillinger', onclick: () => navigate('/innstillinger') }, icon('settings')),
      ),
    ),
    h(
      'main',
      { class: 'content' },
      pendingCard(),
      nowCard(onCleanup),
      h(
        'div',
        { class: 'stat-row' },
        h('div', { class: 'stat' }, icon('flame'), h('strong', {}, String(stats.streak)), h('small', {}, 'på rad')),
        h('div', { class: 'stat' }, icon('check'), h('strong', {}, String(stats.correct)), h('small', {}, 'riktige')),
        h('div', { class: 'stat' }, icon('calendar'), h('strong', {}, String(stats.days.length)), h('small', {}, stats.days.length === 1 ? 'dag' : 'dager')),
      ),
      current
        ? h(
            'button',
            { class: 'continue-card', type: 'button', onclick: () => navigate(`/niva/${current.n}`) },
            h('small', {}, levelProgress(current.n).rounds ? 'Fortsett' : 'Neste nivå'),
            h('strong', {}, `${current.n}. ${current.title}`),
            h('span', { class: 'muted' }, levelProgress(current.n).rounds ? `Få ${PASS_SCORE} av 5 for å gå videre` : current.subtitle),
            h('span', { class: 'continue-arrow' }, icon('forward')),
          )
        : null,
      practiceCard(!current),
      h(
        'div',
        { class: 'tile-row' },
        h('button', { class: 'tile', type: 'button', onclick: () => navigate('/verksted') }, icon('wrench'), h('strong', {}, 'Klokkeverksted'), h('small', {}, 'Lag din egen klokke')),
        h(
          'button',
          { class: 'tile', type: 'button', onclick: () => navigate('/samling') },
          icon('grid'),
          h('strong', {}, 'Samling'),
          h('small', {}, `${PARTS.filter((part) => isOwned(part.id)).length} av ${PARTS.length} deler`),
        ),
      ),
      h('h2', { class: 'section-title' }, 'Læringsløype'),
      h('div', { class: 'level-list' }, LEVELS.map(levelCard)),
    ),
  );
}
