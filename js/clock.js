// Interaktiv analog klokke i SVG.
// Tiden er ett tall: minutter. Begge viserne regnes ut fra det, så når minuttviseren
// dras en hel runde, flytter timeviseren seg nøyaktig én time – akkurat som en ekte klokke.
import { resolveDesign } from './parts.js';
import { play } from './sound.js';
import { currentDesign } from './store.js';
import { hourAngle, minuteAngle, mod, shortestDelta } from './time.js';

const NS = 'http://www.w3.org/2000/svg';
const C = 100; // sentrum i viewBox 0 0 200 200
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
let uid = 0;
// Filtre måles i klokkas koordinater. Ellers forsvinner en loddrett viser (bredde 0) helt.
const WHOLE_CLOCK = { filterUnits: 'userSpaceOnUse', x: -20, y: -20, width: 240, height: 240 };

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
 * @param {boolean|'hands'} options.tappable tall og visere kan trykkes på (onTap); 'hands' = bare viserne
 * @param {boolean} options.hands           vis viserne (false = tom urskive)
 * @param {boolean} options.wedge           kakestykke fra 12 til minuttviseren: hvor mye av timen som har gått
 * @param {boolean} options.minuteLabels    små minuttall (5, 10, 15 …) utenfor urskiven
 * @param {boolean} options.seconds         vis sekundviseren (tiden kan da ha desimaler: 1/60 per sekund)
 * @param {boolean} options.running         klokka går av seg selv, ett sekund om gangen
 * @param {object} options.design            del-id-er som overstyrer hennes valgte klokke, f.eks. { face: 'neon' }
 * @param {string} options.numerals          tvinger en tallstil, f.eks. 'arabiske' når hun skal trykke på tall
 */
export function createClock(options = {}) {
  let config = {
    time: 0,
    drag: [],
    snapHour: false,
    snapMinutes: 1,
    tappable: false,
    hands: true,
    wedge: false,
    minuteLabels: false,
    seconds: false,
    running: false,
    tickSound: false,
    design: null,
    numerals: null,
    onChange: null,
    onRelease: null,
    onTap: null,
    ...options,
  };
  let time = config.time;
  let dragging = null;
  let animation = null;
  let runner = null;
  let decorKey = '';
  const id = `clock${(uid += 1)}`;

  const root = svg('svg', { viewBox: '0 0 200 200', class: 'clock', role: 'img' });

  // Felles effekter: skygge under viserne og glød for neon.
  const defs = svg(
    'defs',
    {},
    svg('filter', { id: `${id}-shadow`, ...WHOLE_CLOCK }, svg('feDropShadow', { dx: 0, dy: 1, stdDeviation: 1.2, 'flood-opacity': 0.45 })),
    svg(
      'filter',
      { id: `${id}-glow`, ...WHOLE_CLOCK },
      svg('feGaussianBlur', { stdDeviation: 2.2, result: 'blur' }),
      svg('feMerge', {}, svg('feMergeNode', { in: 'blur' }), svg('feMergeNode', { in: 'SourceGraphic' })),
    ),
  );

  // Urskive (innholdet tegnes av decorate, siden det avhenger av valgt urskive)
  const face = svg('g', { 'data-part': 'face' });

  const wedge = svg('path', { class: 'clock-wedge', 'data-part': 'wedge' });

  const minuteLabels = svg('g', { 'data-part': 'minute-labels', class: 'minute-labels' });
  for (let n = 1; n <= 12; n += 1) {
    const [x, y] = polar(n * 30, 108);
    minuteLabels.append(
      svg('text', { x, y, class: 'minute-label', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(n === 12 ? 0 : n * 5)),
    );
  }

  const ticks = svg('g', { 'data-part': 'ticks' });
  for (let i = 0; i < 60; i += 1) {
    const major = i % 5 === 0;
    const [x1, y1] = polar(i * 6, 91);
    const [x2, y2] = polar(i * 6, major ? 83 : 87);
    ticks.append(svg('line', { x1, y1, x2, y2, class: major ? 'tick tick-major' : 'tick' }));
  }

  // Tallene: én gruppe per time, med et usynlig merke bak som brukes til trykk og fremheving.
  const numbers = svg('g', { 'data-part': 'numbers' });
  const numberNodes = new Map();
  for (let n = 1; n <= 12; n += 1) {
    const [x, y] = polar(n * 30, 70);
    const group = svg('g', { class: 'num', 'data-n': n, 'data-tap': `num:${n}` }, svg('circle', { cx: x, cy: y, r: 13, class: 'num-mark' }));
    numberNodes.set(n, group);
    numbers.append(group);
  }

  // Visere. Den usynlige, tykke streken gjør det lett å treffe viseren med fingeren.
  const HAND_SIZES = { hour: [48, 8, 10], minute: [76, 5, 14], second: [86, 1.6, 22] };
  const hand = (name) => {
    const [length, , tail] = HAND_SIZES[name];
    return svg(
      'g',
      { class: `hand hand-${name}`, 'data-part': name, 'data-tap': `hand:${name}` },
      svg('line', { x1: C, y1: C + tail, x2: C, y2: C - length, class: 'hand-hit' }),
    );
  };
  const hourHand = hand('hour');
  const minuteHand = hand('minute');
  const secondHand = hand('second');
  const cap = svg('g', { 'data-part': 'cap' }, svg('circle', { cx: C, cy: C, r: 6, class: 'clock-cap' }));
  const handsLayer = svg('g', { class: 'hands', filter: `url(#${id}-shadow)` }, hourHand, minuteHand, secondHand, cap);

  root.append(defs, face, wedge, ticks, numbers, minuteLabels, handsLayer);

  // --- Utseende: urskive, tall, visere og farger fra delene hun har valgt ---

  function drawFace(look) {
    const extras = [];
    let fill = null;
    if (look.fill2) {
      extras.push(
        svg(
          'radialGradient',
          { id: `${id}-bg`, cx: '50%', cy: '38%', r: '70%' },
          svg('stop', { offset: '0%', 'stop-color': look.fill }),
          svg('stop', { offset: '100%', 'stop-color': look.fill2 }),
        ),
      );
      fill = `url(#${id}-bg)`;
    }
    const base = svg('circle', { cx: C, cy: C, r: 97, class: 'clock-face' });
    if (fill) base.style.fill = fill;
    if (look.glow) base.setAttribute('filter', `url(#${id}-glow)`);
    const layers = [base];

    if (look.pattern === 'marble') {
      extras.push(
        svg('clipPath', { id: `${id}-clip` }, svg('circle', { cx: C, cy: C, r: 95.5 })),
        svg(
          'filter',
          { id: `${id}-marble`, x: 0, y: 0, width: '100%', height: '100%' },
          svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.009 0.03', numOctaves: 4, seed: 7 }),
          svg('feColorMatrix', { values: '0 0 0 0 0.42  0 0 0 0 0.4  0 0 0 0 0.37  4 0 0 0 -1.9' }),
        ),
      );
      layers.push(svg('rect', { x: 0, y: 0, width: 200, height: 200, filter: `url(#${id}-marble)`, 'clip-path': `url(#${id}-clip)` }));
    }
    if (look.pattern === 'carbon') {
      extras.push(
        svg(
          'pattern',
          { id: `${id}-carbon`, width: 6, height: 6, patternUnits: 'userSpaceOnUse' },
          svg('rect', { width: 6, height: 6, fill: '#141619' }),
          svg('rect', { width: 3, height: 3, fill: '#1e2125' }),
          svg('rect', { x: 3, y: 3, width: 3, height: 3, fill: '#1e2125' }),
        ),
      );
      layers.push(svg('circle', { cx: C, cy: C, r: 95.5, fill: `url(#${id}-carbon)` }));
    }
    if (look.pattern === 'stars') {
      // Faste «tilfeldige» stjerner, så klokka ser lik ut hver gang.
      for (let i = 0; i < 46; i += 1) {
        const angle = (i * 137.5) % 360;
        const radius = 12 + ((i * 53) % 80);
        const [x, y] = polar(angle, radius);
        layers.push(svg('circle', { cx: x, cy: y, r: 0.35 + ((i * 7) % 10) / 12, fill: '#ffffff', opacity: 0.25 + ((i * 3) % 7) / 10 }));
      }
    }
    if (look.doubleRing) layers.push(svg('circle', { cx: C, cy: C, r: 92.5, fill: 'none', stroke: look.ring, 'stroke-width': 0.8 }));
    if (look.bezel) layers.push(svg('path', { d: `M${C} 4.5 L${C - 5} 12 L${C + 5} 12 Z`, fill: look.bezel }));

    face.replaceChildren(svg('defs', {}, ...extras), ...layers);
  }

  function drawNumbers(kind, look) {
    numberNodes.forEach((group, n) => {
      group.querySelectorAll(':not(.num-mark)').forEach((node) => node.remove());
      const [x, y] = polar(n * 30, 70);
      const text = (label, size, weight = 600) => {
        const node = svg('text', { x, y, class: 'num-text', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, label);
        node.style.font = `${weight} ${size}px ${look.font ?? 'var(--font)'}`;
        return node;
      };
      const quarter = n % 3 === 0;
      if (kind === 'romerske') group.append(text(ROMAN[n], n === 8 || n === 12 ? 11.5 : 13));
      else if (kind === 'digitale') {
        const node = text(String(n).padStart(2, '0'), 14, 700);
        node.style.fontFamily = 'ui-monospace, "SF Mono", Menlo, monospace';
        group.append(node);
      }
      else if (kind === 'store') group.append(text(String(n), 22, 800));
      else if (kind === 'fire') group.append(quarter ? text(String(n), 21, 750) : svg('circle', { cx: x, cy: y, r: 2.6, class: 'num-dot' }));
      else if (kind === 'streker') {
        const [x1, y1] = polar(n * 30, quarter ? 62 : 65);
        const [x2, y2] = polar(n * 30, 77);
        group.append(svg('line', { x1, y1, x2, y2, class: 'num-stick', 'stroke-width': quarter ? 5 : 3 }));
      } else group.append(text(String(n), 17));
    });
    if (look.glow) numbers.setAttribute('filter', `url(#${id}-glow)`);
    else numbers.removeAttribute('filter');
  }

  function drawHands(style) {
    for (const [name, node] of [['hour', hourHand], ['minute', minuteHand], ['second', secondHand]]) {
      node.querySelectorAll('.hand-body').forEach((body) => body.remove());
      const [length, width, tail] = HAND_SIZES[name];
      const line = (w, extra = {}) => svg('line', { x1: C, y1: C + tail, x2: C, y2: C - length, class: 'hand-body', 'stroke-width': w, ...extra });
      const dot = (cy, r) => svg('circle', { cx: C, cy, r, class: 'hand-body is-solid' });
      if (name === 'second') {
        node.append(line(width), dot(C + tail - 2, 2.6));
      } else if (style === 'slank') {
        node.append(line(width * 0.55));
      } else if (style === 'blokk') {
        node.append(line(width * 1.35, { 'stroke-linecap': 'butt' }));
      } else if (style === 'prikk') {
        node.append(line(width * 0.5), dot(C - length + width, width * 0.95));
      } else if (style === 'pil') {
        const half = width / 2;
        const head = C - length + width * 2.4;
        const points = [
          [C - half, C + tail], [C + half, C + tail], [C + half, head], [C + width * 1.25, head],
          [C, C - length], [C - width * 1.25, head], [C - half, head],
        ];
        node.append(svg('polygon', { points: points.map((p) => p.join(',')).join(' '), class: 'hand-body is-solid' }));
      } else if (style === 'diamant') {
        const wide = width * 0.95;
        const shoulder = C - length * 0.3;
        node.append(svg('polygon', { points: `${C},${C + tail} ${C + wide},${shoulder} ${C},${C - length} ${C - wide},${shoulder}`, class: 'hand-body is-solid' }));
      } else if (style === 'glod') {
        node.append(line(width * 0.9, { filter: `url(#${id}-glow)` }));
      } else {
        node.append(line(width));
      }
    }
  }

  /** Tegner utseendet på nytt bare når valgt design faktisk har endret seg. */
  function decorate() {
    const ids = { ...currentDesign(), ...config.design };
    if (config.numerals) ids.numerals = config.numerals;
    const key = JSON.stringify(ids);
    if (key === decorKey) return;
    decorKey = key;
    const look = resolveDesign(ids);
    const colors = { ...look.face, ...look.colors };
    for (const name of ['ring', 'tick', 'tickMajor', 'number', 'cap', 'hour', 'minute', 'second']) {
      root.style.setProperty(`--clock-${name}`, colors[name]);
    }
    root.style.setProperty('--clock-face', look.face.fill);
    root.classList.toggle('is-light', Boolean(look.face.light));
    drawFace(look.face);
    drawNumbers(look.numerals, look.face);
    drawHands(look.hands);
  }

  function drawWedge() {
    const minutes = mod(time, 60);
    if (!config.wedge || minutes < 0.01 || minutes > 59.99) {
      wedge.setAttribute('d', '');
      return;
    }
    const [x, y] = polar(minutes * 6, 92);
    wedge.setAttribute('d', `M${C} ${C}L${C} ${C - 92}A92 92 0 ${minutes > 30 ? 1 : 0} 1 ${x} ${y}Z`);
  }

  function draw() {
    drawWedge();
    // Med sekundviser hopper minuttviseren ett helt minutt når sekundviseren passerer 12, som på
    // en stasjonsklokke. Da peker den alltid rett på minuttet, og 35:40 kan ikke leses som 36.
    const shown = config.seconds && dragging !== 'hour' && dragging !== 'minute' ? Math.floor(time + 1e-9) : time;
    hourHand.setAttribute('transform', `rotate(${hourAngle(shown)} ${C} ${C})`);
    minuteHand.setAttribute('transform', `rotate(${minuteAngle(shown)} ${C} ${C})`);
    // Avrundes til hele sekunder, så sekundviseren hopper slik den gjør på en ekte klokke.
    secondHand.setAttribute('transform', `rotate(${mod(Math.round(time * 60), 60) * 6} ${C} ${C})`);
  }

  function applyConfig() {
    decorate();
    handsLayer.style.display = config.hands ? '' : 'none';
    minuteLabels.style.display = config.minuteLabels ? '' : 'none';
    secondHand.style.display = config.seconds ? '' : 'none';
    clearInterval(runner);
    runner = config.running
      ? setInterval(() => {
          setTime(time + 1 / 60);
          if (config.tickSound) play('tick');
        }, 1000)
      : null;
    // Minuttallene står utenfor urskiven, så da trengs litt mer plass rundt.
    root.setAttribute('viewBox', config.minuteLabels ? '-16 -16 232 232' : '0 0 200 200');
    drawWedge();
    root.classList.toggle('is-draggable', config.drag.length > 0);
    root.classList.toggle('is-tappable', Boolean(config.tappable));
    root.classList.toggle('tap-hands-only', config.tappable === 'hands');
    hourHand.classList.toggle('can-drag', config.drag.includes('hour'));
    minuteHand.classList.toggle('can-drag', config.drag.includes('minute'));
    secondHand.classList.toggle('can-drag', config.drag.includes('second'));
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

  /**
   * Flytter viserne mykt. direction: 'shortest' (korteste vei på urskiven), 'forward' (med klokka)
   * eller 'exact' (nøyaktig til den tiden, viktig når 02:30 og 14:30 er forskjellige).
   */
  function animateTo(target, { duration = 900, direction = 'shortest', sound = false } = {}) {
    stopAnimation();
    const from = time;
    const delta = direction === 'shortest' ? shortestDelta(from, target) : target - from;
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
    const box = root.viewBox.baseVal;
    const scale = box.width / rect.width;
    const dx = (event.clientX - rect.left) * scale + box.x - C;
    const dy = (event.clientY - rect.top) * scale + box.y - C;
    return { angle: mod((Math.atan2(dx, -dy) * 180) / Math.PI, 360), radius: Math.hypot(dx, dy) };
  }

  const secondAngle = (t) => mod(t * 60, 60) * 6;

  function pickHand({ angle, radius }) {
    const candidates = config.drag;
    if (candidates.length === 1) return candidates[0];
    if (candidates.includes('second') && angleDistance(angle, secondAngle(time)) < 15 && radius > 60) return 'second';
    const toHour = angleDistance(angle, hourAngle(time));
    const toMinute = angleDistance(angle, minuteAngle(time));
    // Står viserne nesten oppå hverandre, avgjør avstanden fra sentrum.
    if (Math.abs(toHour - toMinute) < 20) return radius < 56 ? 'hour' : 'minute';
    return toHour < toMinute ? 'hour' : 'minute';
  }

  function onPointerDown(event) {
    if (config.tappable) {
      const target = event.target.closest('[data-tap]');
      if (target && !(config.tappable === 'hands' && target.dataset.tap.startsWith('num:'))) {
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
    if (dragging === 'second') {
      // En hel runde med sekundviseren er ett minutt.
      let delta = angle / 6 - mod(time * 60, 60);
      if (delta > 30) delta -= 60;
      if (delta < -30) delta += 60;
      next = time + delta / 60;
    } else if (dragging === 'minute') {
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
    setTime(next, { silent: false, step: { second: 1 / 60, minute: 1, hour: 5 }[dragging] });
  }

  function onPointerUp() {
    if (!dragging) return;
    const released = dragging;
    dragging = null;
    root.classList.remove('is-dragging', 'dragging-hour', 'dragging-minute', 'dragging-second');
    const step = released === 'second' ? 1 / 60 : released === 'hour' && config.snapHour ? 60 : config.snapMinutes;
    // Avrundes via hele sekunder, så 1/60-steg ikke gir flyttallsstøy.
    const snapped = Math.round(Math.round(time * 60) / (step * 60)) * step;
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
    /** Tegner klokka på nytt med hennes valgte design (etter endring i verkstedet). */
    refresh: () => decorate(),
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
        else if (part === 'minute-labels') mark(minuteLabels);
        else if (part === 'hour') mark(hourHand);
        else if (part === 'minute') mark(minuteHand);
        else if (part === 'second') mark(secondHand);
      }
    },
    /** Setter et merke rundt et tall: 'correct', 'wrong', 'pick' eller null. */
    markNumber(n, kind) {
      const node = numberNodes.get(n);
      node?.classList.remove('mark-correct', 'mark-wrong', 'mark-pick');
      if (kind) node?.classList.add(`mark-${kind}`);
    },
    markHand(name, kind) {
      const node = { hour: hourHand, minute: minuteHand, second: secondHand }[name];
      node.classList.remove('mark-correct', 'mark-wrong');
      if (kind) node.classList.add(`mark-${kind}`);
    },
    clearMarks() {
      root.querySelectorAll('.mark-correct, .mark-wrong, .mark-pick').forEach((node) =>
        node.classList.remove('mark-correct', 'mark-wrong', 'mark-pick'),
      );
    },
    destroy() {
      stopAnimation();
      clearInterval(runner);
    },
  };
}
