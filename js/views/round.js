// En oppgaverunde: 5 spørsmål, tilbakemelding etter hvert svar, oppsummering til slutt.
// Feil svar gir ingen straff: appen viser riktig svar, gjerne med viserne i bevegelse.
import { createClock } from '../clock.js';
import { LEVELS, levelByNumber, isBuilt } from '../levels/index.js';
import { goBack, navigate, setLeaveGuard } from '../router.js';
import { play } from '../sound.js';
import { PASS_SCORE, isLevelOpen, recordAnswer, recordRound, getState } from '../store.js';
import { minuteOf, mod, sameClockTime } from '../time.js';
import { backButton, confirmDialog, h, icon } from '../ui.js';

const PRAISE = ['Riktig!', 'Helt riktig!', 'Stemmer!', 'Bra!', 'Sånn ja!'];
const NOT_QUITE = ['Ikke helt', 'Nesten', 'Ikke denne gangen'];
const randomOf = (list) => list[Math.floor(Math.random() * list.length)];

/** Klokka nullstilles til dette før hvert spørsmål, så ingenting henger igjen fra forrige. */
const BASE_CLOCK = { drag: [], tappable: false, hands: true, wedge: false, minuteLabels: false, seconds: false, running: false, snapHour: false, snapMinutes: 1 };

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
  const stage = h('div', { class: 'clock-stage' }, clock.el);
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
    stage,
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

  /** Svaralternativ med egen lille klokke (koble analog og digital, «hvilken er feil?»). */
  function optionContent(option) {
    if (option.time === undefined) return option.label;
    const mini = createClock({ ...BASE_CLOCK, time: option.time });
    return [h('span', { class: 'option-clock' }, mini.el), option.label ? h('span', { class: 'option-label' }, option.label) : null];
  }

  function renderChoice(question) {
    if (question.clock) clock.configure({ ...BASE_CLOCK, ...question.clock });
    const buttons = question.options.map((option) =>
      h(
        'button',
        {
          class: option.time === undefined ? 'option' : 'option option-with-clock',
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
        optionContent(option),
      ),
    );
    const long = question.options.some((o) => o.time === undefined && o.label.length > 16);
    answers.className = `round-answers ${long ? 'is-list' : 'is-grid'}`;
    answers.replaceChildren(...buttons);
  }

  function renderTap(question) {
    const { accept } = question;
    clock.configure({
      ...BASE_CLOCK,
      ...question.clock,
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
    clock.configure({ ...BASE_CLOCK, ...question.clock, time: question.start });
    // check: 'minute' betyr at bare minuttviseren teller, uansett time.
    const isRight = (time) =>
      question.check === 'minute' ? minuteOf(Math.round(time)) === minuteOf(question.target) : sameClockTime(time, question.target);
    const answerTime = (time) => {
      if (question.check !== 'minute') return question.target;
      let delta = mod(minuteOf(question.target) - minuteOf(Math.round(time)), 60);
      if (delta > 30) delta -= 60;
      return Math.round(time) + delta;
    };
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
          const correct = isRight(clock.getTime());
          if (!correct) {
            // Vis riktig svar ved å flytte viserne dit de skal.
            play('wrong');
            await new Promise((resolve) => setTimeout(resolve, 350));
            await clock.animateTo(answerTime(clock.getTime()), { duration: 1200 });
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
    stage.hidden = !question.clock && question.type === 'choice';
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
