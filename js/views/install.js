import { isIPhone } from '../install.js';
import { goBack } from '../router.js';
import { h, icon, subpage } from '../ui.js';

export function installView() {
  return subpage(
    'Legg til på Hjem-skjerm',
    h(
      'p',
      { class: 'muted intro' },
      isIPhone() ? 'Da åpnes Tikk i full skjerm og virker uten nett.' : 'Åpne denne adressen i Safari på iPhone og gjør dette:',
    ),
    h(
      'ol',
      { class: 'steps' },
      h('li', {}, 'Trykk på Del-knappen ', icon('share'), ' i Safari. Ser du den ikke, trykk først på ••• nederst.'),
      h('li', {}, 'Bla ned og velg ', h('strong', {}, 'Legg til på Hjem-skjerm'), '.'),
      h('li', {}, 'Trykk ', h('strong', {}, 'Legg til'), ', og åpne Tikk fra det nye ikonet.'),
    ),
    h('p', { class: 'card note' }, 'Fremdrift i nettleseren følger ikke med til appen på Hjem-skjermen. Bruk derfor alltid ikonet.'),
    h('button', { class: 'button button-ghost button-wide', type: 'button', onclick: () => goBack() }, 'Fortsett i nettleseren'),
  );
}
