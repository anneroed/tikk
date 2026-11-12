// Klokkeverkstedet: sett sammen din egen klokke av delene du har låst opp.
import { createClock } from '../clock.js';
import { CATEGORIES, PARTS } from '../parts.js';
import { navigate } from '../router.js';
import { play } from '../sound.js';
import { currentDesign, isOwned, useDesignPart } from '../store.js';
import { nowInMinutes } from '../time.js';
import { h, subpage } from '../ui.js';
import { partTile } from './collection.js';

export function workshopView({ params, onCleanup }) {
  let active = CATEGORIES.some((c) => c.id === params.category) ? params.category : 'face';
  const now = new Date();
  const preview = createClock({ time: nowInMinutes(now) + now.getSeconds() / 60, seconds: true, running: true });
  const segments = h('div', { class: 'segments', role: 'tablist' });
  const grid = h('div', { class: 'part-grid' });
  const missing = h('p', { class: 'muted small center' });

  function render() {
    segments.replaceChildren(
      ...CATEGORIES.map((category) =>
        h(
          'button',
          {
            class: category.id === active ? 'is-on' : '',
            type: 'button',
            role: 'tab',
            'aria-selected': String(category.id === active),
            onclick: () => {
              active = category.id;
              play('tap');
              render();
            },
          },
          category.name,
        ),
      ),
    );
    const parts = PARTS.filter((part) => part.category === active);
    const owned = parts.filter((part) => isOwned(part.id));
    grid.replaceChildren(
      ...owned.map((part) =>
        partTile(part, {
          selected: currentDesign()[active] === part.id,
          onclick: () => {
            useDesignPart(part.id);
            play('tap');
            preview.refresh();
            render();
          },
        }),
      ),
    );
    const left = parts.length - owned.length;
    missing.replaceChildren(
      left
        ? h('button', { class: 'link-button', type: 'button', onclick: () => navigate('/samling') }, `${left} til å låse opp – se samlingen`)
        : 'Du har alle i denne kategorien!',
    );
  }

  render();
  onCleanup(() => preview.destroy());
  return subpage(
    'Klokkeverksted',
    h('div', { class: 'workshop-stage' }, preview.el),
    segments,
    grid,
    missing,
  );
}
