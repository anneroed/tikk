// En oppgaverunde: 5 spørsmål, tilbakemelding etter hvert svar, oppsummering til slutt.
// Feil svar gir ingen straff: appen viser riktig svar, gjerne med viserne i bevegelse.
import { createClock } from '../clock.js';
import { LEVELS, levelByNumber, isBuilt } from '../levels/index.js';
import { goBack, navigate, setLeaveGuard } from '../router.js';
import { play } from '../sound.js';
import { PASS_SCORE, isLevelOpen, recordAnswer, recordRound, getState } from '../store.js';
import { sameClockTime } from '../time.js';
import { backButton, confirmDialog, h, icon } from '../ui.js';

const PRAISE = ['Riktig!', 'Helt riktig!', 'Stemmer!', 'Bra!', 'Sånn ja!'];
const NOT_QUITE = ['Ikke helt', 'Nesten', 'Ikke denne gangen'];
const randomOf = (list) => list[Math.floor(Math.random() * list.length)];

export function roundView({ params, onCleanup }) {
  const level = levelByNumber(params.n);
  if (!level || !isBuilt(level) || !isLevelOpen(level.n)) {
    queueMicrotask(() => navigate('/', { replace: true }));
    return h('div');
  }

  const questions = level.content.makeRound();
  let index = 0;
  let score = 0;
  let answered = false;

  const clock = createClock();
  const progress = h('div', { class: 'round-progress' }, questions.map(() => h('span')));
  const prompt = h('h1', { class: 'round-prompt', 'aria-live': 'polite' });
  const hint = h('p', { class: 'clock-hint' });
  const answers = h('div', { class: 'round-answers' });
  const feedback = h('section', { class: 'feedback', hidden: true });
  const streak = h('span', { class: 'streak-chip' });
  const body = h(
    'main',
    { class: 'content round-content' },
    prompt,
    h('div', { class: 'clock-stage' }, clock.el),
    hint,
    answers,
    feedback,
  );

  const page = h(
    'div',
    { class: 'screen screen-round' },
    h('header', { class: 'topbar' }, backButton('Avslutt'), progress, streak),
    body,
  );

  function updateStreak() {
    const { streak: count } = getState().stats;
    streak.replaceChildren(icon('flame'), String(count));
    streak.classList.toggle('is-hot', count >= 3);
  }

  function markProgress(correct) {
    progress.children[index].classList.add(correct ? 'is-right' : 'is-wrong');
  }

  function showFeedback(correct, question, { sound = true } = {}) {
    answered = true;
    if (correct) score += 1;
    recordAnswer(correct);
    updateStreak();
    markProgress(correct);
    if (sound) play(correct ? 'correct' : 'wrong');

    const last = index === questions.length - 1;
    feedback.hidden = false;
    feedback.className = `feedback ${correct ? 'is-right' : 'is-wrong'}`;
    feedback.replaceChildren(
      h('div', { class: 'feedback-head' }, h('span', { class: 'feedback-icon' }, correct ? icon('check') : '→'), h('strong', {}, correct ? randomOf(PRAISE) : randomOf(NOT_QUITE))),
      h('p', { html: question.explain }),
      h('button', { class: 'button button-wide', type: 'button', onclick: nextQuestion }, last ? 'Se resultat' : 'Neste'),
    );
    requestAnimationFrame(() => feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  function renderChoice(question) {
    clock.configure({ time: question.clock.time, hands: question.clock.hands ?? true, drag: [], tappable: false });
    const buttons = question.options.map((option) =>
      h(
        'button',
        {
          class: 'option',
          type: 'button',
          onclick: () => {
            if (answered) return;
            buttons.forEach((button, i) => {
              button.disabled = true;
              if (question.options[i].correct) button.classList.add('is-right');
            });
            if (!option.correct) buttons[question.options.indexOf(option)].classList.add('is-wrong');
            showFeedback(option.correct, question);
          },
        },
        option.label,
      ),
    );
    answers.className = `round-answers ${question.options.some((o) => o.label.length > 16) ? 'is-list' : 'is-grid'}`;
    answers.replaceChildren(...buttons);
  }

  function renderTap(question) {
    const { accept } = question;
    clock.configure({
      time: question.clock.time,
      hands: question.clock.hands ?? true,
      drag: [],
      tappable: true,
      onTap: (target) => {
        if (answered) return;
        const correct = target.kind === accept.kind && (target.kind === 'num' ? target.n === accept.n : target.hand === accept.hand);
        if (target.kind === 'num') clock.markNumber(target.n, correct ? 'correct' : 'wrong');
        if (target.kind === 'hand') clock.markHand(target.hand, correct ? 'correct' : 'wrong');
        if (!correct) {
          if (accept.kind === 'num') clock.markNumber(accept.n, 'correct');
          else clock.markHand(accept.hand, 'correct');
        }
        clock.configure({ tappable: false });
        showFeedback(correct, question);
      },
    });
    answers.className = 'round-answers';
    answers.replaceChildren(h('p', { class: 'muted tap-hint' }, 'Trykk på klokka'));
  }

  function renderSet(question) {
    clock.configure({ time: question.start, hands: true, tappable: false, snapHour: false, snapMinutes: 1, ...question.clock });
    const check = h(
      'button',
      {
        class: 'button button-wide',
        type: 'button',
        onclick: async () => {
          if (answered) return;
          answered = true;
          check.disabled = true;
          clock.configure({ drag: [] });
          const correct = sameClockTime(clock.getTime(), question.target);
          if (!correct) {
            // Vis riktig svar ved å flytte viserne dit de skal.
            play('wrong');
            await new Promise((resolve) => setTimeout(resolve, 350));
            await clock.animateTo(question.target, { duration: 1200 });
            clock.highlight(['hour', 'minute']);
          }
          check.remove();
          // Feil-lyden kom før animasjonen, så den spilles ikke en gang til.
          showFeedback(correct, question, { sound: correct });
        },
      },
      'Sjekk',
    );
    answers.className = 'round-answers';
    answers.replaceChildren(check);
  }

  function showQuestion() {
    const question = questions[index];
    answered = false;
    clock.clearMarks();
    clock.highlight([]);
    feedback.hidden = true;
    progress.children[index].classList.add('is-current');
    prompt.textContent = question.prompt;
    hint.textContent = question.hint ?? '';
    hint.hidden = !question.hint;
    if (question.type === 'choice') renderChoice(question);
    if (question.type === 'tap') renderTap(question);
    if (question.type === 'set') renderSet(question);
    window.scrollTo({ top: 0 });
  }

  function nextQuestion() {
    play('tap');
    progress.children[index].classList.remove('is-current');
    if (index < questions.length - 1) {
      index += 1;
      showQuestion();
    } else {
      finish();
    }
  }

  function finish() {
    setLeaveGuard(null);
    const result = recordRound(level.n, score);
    const nextLevel = LEVELS.find((l) => l.n === level.n + 1);
    play(result.passed ? 'complete' : 'tap');

    let message;
    if (result.newlyPassed && nextLevel) {
      message = isBuilt(nextLevel)
        ? `Nivå ${nextLevel.n}, ${nextLevel.title.toLowerCase()}, er låst opp.`
        : `Nivå ${nextLevel.n} blir låst opp når det er ferdig bygget.`;
    } else if (result.passed) {
      message = 'Du kan ta en ny runde eller gå videre.';
    } else {
      message = `Få ${PASS_SCORE} av ${questions.length} riktige for å låse opp neste nivå. Ny runde gir nye oppgaver.`;
    }

    body.replaceChildren(
      h(
        'section',
        { class: 'summary' },
        h('div', { class: `summary-score ${result.passed ? 'is-passed' : ''}` }, h('span', {}, String(score)), h('small', {}, `av ${questions.length}`)),
        h('h1', {}, result.passed ? (score === questions.length ? 'Alle riktige!' : 'Godt jobbet!') : 'Runden er ferdig'),
        h('p', { class: 'muted' }, message),
        h(
          'div',
          { class: 'summary-actions' },
          result.newlyPassed && nextLevel && isBuilt(nextLevel)
            ? h('button', { class: 'button button-wide', type: 'button', onclick: () => navigate(`/niva/${nextLevel.n}`, { replace: true }) }, `Til nivå ${nextLevel.n}`)
            : null,
          h('button', { class: `button button-wide ${result.newlyPassed ? 'button-soft' : ''}`, type: 'button', onclick: () => navigate(`/niva/${level.n}/oppgaver`, { replace: true }) }, 'Ny runde'),
          h('button', { class: 'button button-wide button-ghost', type: 'button', onclick: () => goBack() }, 'Hjem'),
        ),
      ),
    );
    progress.replaceChildren();
  }

  updateStreak();
  showQuestion();
  setLeaveGuard(() =>
    confirmDialog({
      title: 'Avslutte runden?',
      text: 'Svarene du har gitt teller, men runden blir ikke fullført.',
      confirm: 'Avslutt',
      cancel: 'Fortsett',
    }),
  );
  onCleanup(() => clock.destroy());
  return page;
}
