// Samlingen: alle deler, med tomme plasser for det hun ikke har ennå, og hvordan hun får dem.
import { CATEGORIES, PARTS, howToGet } from '../parts.js';
import { navigate } from '../router.js';
import { isOwned } from '../store.js';
import { h, icon, subpage } from '../ui.js';
import { partPreview } from './package.js';

export function partTile(part, { onclick, selected = false } = {}) {
  if (!isOwned(part.id)) {
    return h(
      'div',
      { class: `part-tile is-locked rarity-${part.rarity}` },
      h('span', { class: 'part-slot' }, icon('lock')),
      h('span', {}, howToGet(part)),
    );
  }
  const preview = partPreview(part);
  return h(
    'button',
    { class: `part-tile rarity-${part.rarity} ${selected ? 'is-selected' : ''}`, type: 'button', onclick },
    h('span', { class: 'part-clock' }, preview.el),
    h('span', {}, part.name),
  );
}

export function collectionView() {
  const owned = PARTS.filter((part) => isOwned(part.id)).length;
  return subpage(
    'Samling',
    h(
      'div',
      { class: 'collection-summary' },
      h('strong', {}, `${owned} av ${PARTS.length}`),
      h('div', { class: 'collection-bar' }, h('span', { style: `width: ${(owned / PARTS.length) * 100}%` })),
    ),
    h('p', { class: 'muted small' }, 'Fullfør nivåer for de beste delene. Pakker får du etter runder med minst 3 riktige, og noen sjeldne deler får du for innsats.'),
    CATEGORIES.map((category) => {
      const parts = PARTS.filter((part) => part.category === category.id);
      const have = parts.filter((part) => isOwned(part.id)).length;
      return [
        h('div', { class: 'section-head' }, h('h2', {}, category.name), h('small', {}, `${have} av ${parts.length}`)),
        h(
          'div',
          { class: 'part-grid' },
          parts.map((part) => partTile(part, { onclick: () => navigate(`/verksted/${category.id}`) })),
        ),
      ];
    }),
  );
}
