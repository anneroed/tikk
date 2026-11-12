import { navigate } from '../router.js';
import { play } from '../sound.js';
import { getState, resetAll, setSound, setUnlockAll } from '../store.js';
import { confirmDialog, h, subpage } from '../ui.js';
import { isStandalone } from '../install.js';

function toggleRow({ title, text, checked, onChange }) {
  const input = h('input', { type: 'checkbox', class: 'switch', role: 'switch' });
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return h('label', { class: 'setting-row' }, h('span', {}, h('strong', {}, title), text ? h('small', {}, text) : null), input);
}

export function settingsView() {
  return subpage(
    'Innstillinger',
    h(
      'section',
      { class: 'card' },
      toggleRow({
        title: 'Lyd',
        text: 'Tikking, svar og opplåsing. På iPhone må stillebryteren være av.',
        checked: getState().sound,
        onChange: (on) => {
          setSound(on);
          play('tap');
        },
      }),
      toggleRow({
        title: 'Foreldremodus',
        text: 'Lås opp alle nivåer, for å teste eller hoppe over det hun kan fra før.',
        checked: getState().unlockAll,
        onChange: setUnlockAll,
      }),
    ),
    isStandalone()
      ? null
      : h('button', { class: 'button button-soft button-wide', type: 'button', onclick: () => navigate('/installer') }, 'Legg til på Hjem-skjerm'),
    h(
      'button',
      {
        class: 'button button-ghost button-wide danger',
        type: 'button',
        onclick: async () => {
          const ok = await confirmDialog({
            title: 'Nullstille alt?',
            text: 'All fremdrift på denne enheten slettes. Dette kan ikke angres.',
            confirm: 'Nullstill',
          });
          if (ok) {
            resetAll();
            navigate('/', { replace: true });
          }
        },
      },
      'Nullstill fremdrift',
    ),
    h('p', { class: 'muted small center' }, 'All fremdrift lagres bare på denne enheten.'),
  );
}
