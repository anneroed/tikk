// Pakkeåpning: en gave som rister, sprekker opp og viser en ny klokkedel.
// Delen er allerede hennes (lagret før åpningen), så ingenting går tapt om hun lukker appen.
import { createClock } from '../clock.js';
import { CATEGORIES, RARITY, howToGet, partById } from '../parts.js';
import { play } from '../sound.js';
import { currentDesign, getState, markOpened, useDesignPart } from '../store.js';
import { h, icon } from '../ui.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Klokke som viser hvordan delen ser ut sammen med resten av hennes klokke. */
export function partPreview(part, { running = false } = {}) {
  const clock = createClock({
    time: 10 * 60 + 10 + 30 / 60,
    seconds: true,
    running,
    design: { [part.category]: part.id },
  });
  return clock;
}

function revealCard(part, { index, total, onNext }) {
  const category = CATEGORIES.find((c) => c.id === part.category);
  const preview = partPreview(part, { running: true });
  const inUse = () => currentDesign()[part.category] === part.id;
  const useButton = h('button', { class: 'button button-soft button-wide', type: 'button' });
  const renderUse = () => {
    useButton.replaceChildren(inUse() ? icon('check') : '', inUse() ? 'I bruk' : 'Bruk på klokka mi');
    useButton.disabled = inUse();
  };
  useButton.addEventListener('click', () => {
    useDesignPart(part.id);
    play('tap');
    renderUse();
  });
  renderUse();

  const card = h(
    'div',
    { class: `pack-reveal rarity-${part.rarity}` },
    h('div', { class: 'pack-preview' }, preview.el),
    h('span', { class: 'rarity-chip' }, RARITY[part.rarity].name),
    h('h2', {}, part.name),
    h('p', { class: 'muted' }, `Ny ${category.single} · ${howToGet(part)}`),
    h(
      'div',
      { class: 'pack-actions' },
      useButton,
      h('button', { class: 'button button-wide', type: 'button', onclick: () => onNext(preview) }, index < total - 1 ? 'Neste pakke' : 'Ferdig'),
    ),
  );
  return card;
}

/** Åpner alle ventende pakker, én om gangen. Løses når den siste er lukket. */
export function openPackages() {
  const queue = [...getState().pending];
  if (!queue.length) return Promise.resolve();

  return new Promise((resolve) => {
    const overlay = h('div', { class: 'pack-overlay', role: 'dialog', 'aria-modal': 'true' });
    document.body.append(overlay);

    const showGift = (index) => {
      const part = partById(queue[index]);
      let opening = false;
      const gift = h(
        'button',
        { class: 'gift', type: 'button', 'aria-label': 'Åpne pakken' },
        h('span', { class: 'gift-lid' }),
        h('span', { class: 'gift-box' }),
        h('span', { class: 'gift-ribbon' }),
      );
      const stage = h(
        'div',
        { class: 'pack-stage' },
        h('p', { class: 'pack-count' }, queue.length > 1 ? `Pakke ${index + 1} av ${queue.length}` : 'Ny pakke'),
        h('div', { class: `pack-rays rarity-${part.rarity}` }),
        gift,
        h('p', { class: 'pack-hint' }, 'Trykk for å åpne'),
      );
      overlay.replaceChildren(stage);

      gift.addEventListener('click', async () => {
        if (opening) return;
        opening = true;
        // Sjeldnere deler rister litt lenger. Spenningen er en del av moroa.
        const shakes = 3 + RARITY[part.rarity].order * 2;
        gift.classList.add('is-shaking');
        for (let i = 0; i < shakes; i += 1) {
          play('tick');
          await wait(140);
        }
        gift.classList.remove('is-shaking');
        gift.classList.add('is-open');
        stage.classList.add('is-open');
        play('unlock');
        markOpened(part.id);
        await wait(450);
        stage.replaceChildren(
          h('div', { class: `pack-rays rarity-${part.rarity} is-on` }),
          revealCard(part, {
            index,
            total: queue.length,
            onNext: (preview) => {
              preview.destroy();
              if (index < queue.length - 1) {
                showGift(index + 1);
              } else {
                overlay.classList.add('is-closing');
                setTimeout(() => overlay.remove(), 200);
                resolve();
              }
            },
          }),
        );
      });
    };

    showGift(0);
  });
}
