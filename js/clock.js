// Interaktiv analog klokke i SVG.
// Tiden er ett tall: minutter. Begge viserne regnes ut fra det, så når minuttviseren
// dras en hel runde, flytter timeviseren seg nøyaktig én time – akkurat som en ekte klokke.
import { play } from './sound.js';
import { hourAngle, minuteAngle, mod, shortestDelta } from './time.js';

const NS = 'http://www.w3.org/2000/svg';
const C = 100; // sentrum i viewBox 0 0 200 200

/** Standardklokka. Fase 3 legger til flere urskiver, visere og tallstiler. */
export const DEFAULT_DESIGN = {
  face: '#15181e',
  ring: '#2b313b',
  tick: '#4a525f',
  tickMajor: '#c4cad3',
  number: '#f2f4f7',
  hour: '#ffb547',
  minute: '#62d6ff',
  cap: '#f2f4f7',
};

function svg(tag, attributes = {}, ...children) {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.append(...children);
  return element;
}

const polar = (angle, radius) => {
  const radians = (angle * Math.PI) / 180;
  return [C + radius * Math.sin(radians), C - radius * Math.cos(radians)];
};

const angleDistance = (a, b) => {
  const delta = Math.abs(mod(a - b, 360));
  return Math.min(delta, 360 - delta);
};

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * @param {object} options
 * @param {number} options.time            minutter
 * @param {string[]} options.drag          hvilke visere som kan dras: 'hour', 'minute'
 * @param {boolean} options.snapHour        timeviseren slippes alltid på hel time
 * @param {number} options.snapMinutes      minuttene rundes til nærmeste (1, 5 …) når viseren slippes
 * @param {boolean} options.tappable        tall og visere kan trykkes på (onTap)
 * @param {boolean} options.hands           vis viserne (false = tom urskive)
 */
export function createClock(options = {}) {
  let config = {
    time: 0,
    drag: [],
    snapHour: false,
    snapMinutes: 1,
    tappable: false,
    hands: true,
    design: DEFAULT_DESIGN,
    onChange: null,
    onRelease: null,
    onTap: null,
    ...options,
  };
  let time = config.time;
  let dragging = null;
  let animation = null;

  const root = svg('svg', { viewBox: '0 0 200 200', class: 'clock', role: 'img' });

  // Urskive
  const face = svg('g', { 'data-part': 'face' }, svg('circle', { cx: C, cy: C, r: 97, class: 'clock-face' }));

  const ticks = svg('g', { 'data-part': 'ticks' });
  for (let i = 0; i < 60; i += 1) {
    const major = i % 5 === 0;
    const [x1, y1] = polar(i * 6, 91);
    const [x2, y2] = polar(i * 6, major ? 83 : 87);
    ticks.append(svg('line', { x1, y1, x2, y2, class: major ? 'tick tick-major' : 'tick' }));
  }

  const numbers = svg('g', { 'data-part': 'numbers' });
  const numberNodes = new Map();
  for (let n = 1; n <= 12; n += 1) {
    const [x, y] = polar(n * 30, 70);
    const group = svg(
      'g',
      { class: 'num', 'data-n': n, 'data-tap': `num:${n}` },
      svg('circle', { cx: x, cy: y, r: 13, class: 'num-mark' }),
      svg('text', { x, y, class: 'num-text', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(n)),
    );
    numberNodes.set(n, group);
    numbers.append(group);
  }

  // Visere. Den usynlige, tykke streken gjør det lett å treffe viseren med fingeren.
  const hand = (name, length, width, tail) =>
    svg(
      'g',
      { class: `hand hand-${name}`, 'data-part': name, 'data-tap': `hand:${name}` },
      svg('line', { x1: C, y1: C + tail, x2: C, y2: C - length, class: 'hand-hit' }),
      svg('line', { x1: C, y1: C + tail, x2: C, y2: C - length, class: 'hand-body', 'stroke-width': width }),
    );
  const hourHand = hand('hour', 48, 8, 10);
  const minuteHand = hand('minute', 76, 5, 14);
  const cap = svg('g', { 'data-part': 'cap' }, svg('circle', { cx: C, cy: C, r: 6, class: 'clock-cap' }));
  const handsLayer = svg('g', { class: 'hands' }, hourHand, minuteHand, cap);

  root.append(face, ticks, numbers, handsLayer);

  function applyDesign(design) {
    for (const [name, value] of Object.entries(design)) root.style.setProperty(`--clock-${name}`, value);
  }

  function draw() {
    hourHand.setAttribute('transform', `rotate(${hourAngle(time)} ${C} ${C})`);
    minuteHand.setAttribute('transform', `rotate(${minuteAngle(time)} ${C} ${C})`);
  }

  function applyConfig() {
    applyDesign(config.design);
    handsLayer.style.display = config.hands ? '' : 'none';
    root.classList.toggle('is-draggable', config.drag.length > 0);
    root.classList.toggle('is-tappable', config.tappable);
    hourHand.classList.toggle('can-drag', config.drag.includes('hour'));
    minuteHand.classList.toggle('can-drag', config.drag.includes('minute'));
  }

  // Tikk ved hvert minutt (minuttviser) eller hvert femte minutt (timeviser), egen lyd ved hel time.
  function soundFor(previous, next, step) {
    const before = Math.floor(previous / step);
    const after = Math.floor(next / step);
    if (before === after) return;
    const crossedHour = Math.floor(previous / 60) !== Math.floor(next / 60);
    play(crossedHour ? 'hour' : 'tick');
  }

  function setTime(next, { silent = true, step = 1 } = {}) {
    const previous = time;
    time = next;
    draw();
    if (!silent) soundFor(previous, next, step);
    config.onChange?.(time);
  }

  function stopAnimation() {
    if (animation) cancelAnimationFrame(animation.frame);
    animation?.resolve();
    animation = null;
  }

  /** Flytter viserne mykt. direction: 'shortest' eller 'forward'. */
  function animateTo(target, { duration = 900, direction = 'shortest', sound = false } = {}) {
    stopAnimation();
    const from = time;
    const delta = direction === 'forward' ? target - from : shortestDelta(from, target);
    if (delta === 0) return Promise.resolve();
    return new Promise((resolve) => {
      const started = performance.now();
      animation = { resolve, frame: 0 };
      const frame = (now) => {
        const t = Math.min(1, (now - started) / duration);
        setTime(from + delta * easeInOut(t), { silent: !sound, step: Math.abs(delta) > 120 ? 5 : 1 });
        if (t < 1) {
          animation.frame = requestAnimationFrame(frame);
        } else {
          setTime(from + delta);
          animation = null;
          resolve();
        }
      };
      animation.frame = requestAnimationFrame(frame);
    });
  }

  // --- Berøring ---

  function pointerInfo(event) {
    const rect = root.getBoundingClientRect();
    const scale = 200 / rect.width;
    const dx = (event.clientX - rect.left) * scale - C;
    const dy = (event.clientY - rect.top) * scale - C;
    return { angle: mod((Math.atan2(dx, -dy) * 180) / Math.PI, 360), radius: Math.hypot(dx, dy) };
  }

  function pickHand({ angle, radius }) {
    const candidates = config.drag;
    if (candidates.length === 1) return candidates[0];
    const toHour = angleDistance(angle, hourAngle(time));
    const toMinute = angleDistance(angle, minuteAngle(time));
    // Står viserne nesten oppå hverandre, avgjør avstanden fra sentrum.
    if (Math.abs(toHour - toMinute) < 20) return radius < 56 ? 'hour' : 'minute';
    return toHour < toMinute ? 'hour' : 'minute';
  }

  function onPointerDown(event) {
    if (config.tappable) {
      const target = event.target.closest('[data-tap]');
      if (target) {
        event.preventDefault();
        const [kind, value] = target.dataset.tap.split(':');
        config.onTap?.(kind === 'num' ? { kind, n: Number(value) } : { kind, hand: value });
      }
      return;
    }
    if (!config.drag.length) return;
    const info = pointerInfo(event);
    if (info.radius > 104) return;
    event.preventDefault();
    stopAnimation();
    dragging = pickHand(info);
    root.classList.add('is-dragging', `dragging-${dragging}`);
    try {
      root.setPointerCapture(event.pointerId);
    } catch {
      // Syntetiske hendelser (tester) har ingen ekte peker å fange.
    }
    onPointerMove(event);
  }

  function onPointerMove(event) {
    if (!dragging) return;
    event.preventDefault();
    const { angle } = pointerInfo(event);
    let next = time;
    if (dragging === 'minute') {
      let delta = angle / 6 - mod(time, 60);
      if (delta > 30) delta -= 60;
      if (delta < -30) delta += 60;
      next = time + delta;
    } else {
      let delta = angle * 2 - mod(time, 720);
      if (delta > 360) delta -= 720;
      if (delta < -360) delta += 720;
      next = time + delta;
    }
    setTime(next, { silent: false, step: dragging === 'minute' ? 1 : 5 });
  }

  function onPointerUp() {
    if (!dragging) return;
    const released = dragging;
    dragging = null;
    root.classList.remove('is-dragging', 'dragging-hour', 'dragging-minute');
    const step = released === 'hour' && config.snapHour ? 60 : config.snapMinutes;
    const snapped = Math.round(time / step) * step;
    animateTo(snapped, { duration: 160 }).then(() => {
      time = snapped;
      config.onRelease?.(time, released);
    });
  }

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerUp);
  root.addEventListener('lostpointercapture', onPointerUp);

  applyConfig();
  draw();

  return {
    el: root,
    getTime: () => time,
    setTime: (next) => {
      stopAnimation();
      setTime(next);
    },
    animateTo,
    /** Endrer innstillinger uten å lage ny klokke. */
    configure(next) {
      config = { ...config, ...next };
      applyConfig();
      if ('time' in next) {
        stopAnimation();
        setTime(next.time);
      }
    },
    /**
     * Fremhever deler og demper resten. Navn: 'numbers', 'quarters', 'ticks', 'hour', 'minute',
     * eller 'num:7'. Tom liste fjerner fremhevingen.
     */
    highlight(parts = []) {
      root.classList.toggle('has-highlight', parts.length > 0);
      root.querySelectorAll('.is-hl').forEach((node) => node.classList.remove('is-hl'));
      const mark = (node) => node?.classList.add('is-hl');
      for (const part of parts) {
        if (part === 'numbers') numberNodes.forEach(mark);
        else if (part === 'quarters') [12, 3, 6, 9].forEach((n) => mark(numberNodes.get(n)));
        else if (part.startsWith('num:')) mark(numberNodes.get(Number(part.slice(4))));
        else if (part === 'ticks') mark(ticks);
        else if (part === 'hour') mark(hourHand);
        else if (part === 'minute') mark(minuteHand);
      }
    },
    /** Setter et merke rundt et tall: 'correct', 'wrong', 'pick' eller null. */
    markNumber(n, kind) {
      const node = numberNodes.get(n);
      node?.classList.remove('mark-correct', 'mark-wrong', 'mark-pick');
      if (kind) node?.classList.add(`mark-${kind}`);
    },
    markHand(name, kind) {
      const node = name === 'hour' ? hourHand : minuteHand;
      node.classList.remove('mark-correct', 'mark-wrong');
      if (kind) node.classList.add(`mark-${kind}`);
    },
    clearMarks() {
      root.querySelectorAll('.mark-correct, .mark-wrong, .mark-pick').forEach((node) =>
        node.classList.remove('mark-correct', 'mark-wrong', 'mark-pick'),
      );
    },
    destroy: stopAnimation,
  };
}
