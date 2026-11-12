import { goBack } from './router.js';

export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (name.startsWith('on')) element.addEventListener(name.slice(2), value);
    else if (name === 'class') element.className = value;
    else if (name === 'html') element.innerHTML = value;
    else element.setAttribute(name, value === true ? '' : value);
  }
  element.append(...children.flat(Infinity).filter((child) => child !== null && child !== undefined && child !== false));
  return element;
}

const ICONS = {
  back: 'M15 5l-7 7 7 7',
  forward: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  check: 'M5 12.5l4.5 4.5L19 7',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  soundOn: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  soundOff: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9.5l5 5M21 9.5l-5 5',
  share: 'M12 15V4M8 7.5l4-4 4 4M8 11H5.5v9.5h13V11H16',
  play: 'M8 5.5v13l10.5-6.5z',
  flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.6 1.2 2.5 2 2.5-.5-3 0-5.5 1-8z',
  calendar: 'M5 6h14v14H5zM5 10h14M9 4v4M15 4v4',
  wrench: 'M14.5 6.5a4 4 0 0 0 5 5L13 18a2.1 2.1 0 0 1-3-3l6.5-6.5M14.5 6.5l3-3a4 4 0 0 0-5 5',
  grid: 'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z',
};

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICONS[name]);
  svg.append(path);
  return svg;
}

export function backButton(label = 'Tilbake', onclick = () => goBack()) {
  return h('button', { class: 'back-button', type: 'button', onclick }, icon('back'), label);
}

/** Underside med fast tilbakeknapp øverst. */
export function subpage(title, ...children) {
  return h(
    'div',
    { class: 'screen' },
    h('header', { class: 'topbar' }, backButton()),
    h('main', { class: 'content' }, title ? h('h1', {}, title) : null, children),
  );
}

/** Enkel bekreftelsesdialog. Svarer true/false. */
export function confirmDialog({ title, text, confirm = 'OK', cancel = 'Avbryt' }) {
  return new Promise((resolve) => {
    const close = (answer) => {
      overlay.classList.add('is-closing');
      setTimeout(() => overlay.remove(), 160);
      resolve(answer);
    };
    const overlay = h(
      'div',
      { class: 'dialog-overlay', onclick: (event) => event.target === overlay && close(false) },
      h(
        'div',
        { class: 'dialog', role: 'dialog', 'aria-modal': 'true' },
        h('h2', {}, title),
        text ? h('p', { class: 'muted' }, text) : null,
        h(
          'div',
          { class: 'dialog-actions' },
          h('button', { class: 'button button-ghost', type: 'button', onclick: () => close(false) }, cancel),
          h('button', { class: 'button', type: 'button', onclick: () => close(true) }, confirm),
        ),
      ),
    );
    document.body.append(overlay);
  });
}

/** Ord for viserne med fast farge, så forklaringene peker på riktig viser. */
export const HOUR = '<b class="t-hour">timeviseren</b>';
export const MINUTE = '<b class="t-minute">minuttviseren</b>';
export const SECOND = '<b class="t-second">sekundviseren</b>';
