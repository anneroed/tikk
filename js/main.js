import { shouldOfferInstall } from './install.js';
import { startRouter } from './router.js';
import { primeAudio } from './sound.js';
import { resolveDesign } from './parts.js';
import { currentDesign, subscribe } from './store.js';
import { homeView } from './views/home.js';
import { installView } from './views/install.js';
import { levelView } from './views/level.js';
import { roundView } from './views/round.js';
import { settingsView } from './views/settings.js';
import { collectionView } from './views/collection.js';
import { workshopView } from './views/workshop.js';

const routes = [
  { path: '/', view: homeView },
  { path: '/niva/:n', view: levelView, parent: '/' },
  { path: '/niva/:n/oppgaver', view: roundView, parent: '/' },
  { path: '/innstillinger', view: settingsView, parent: '/' },
  { path: '/samling', view: collectionView, parent: '/' },
  { path: '/verksted', view: workshopView, parent: '/' },
  { path: '/verksted/:category', view: workshopView, parent: '/' },
  { path: '/installer', view: installView, parent: '/' },
];

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.register('sw.js');
  const banner = document.getElementById('update-banner');
  let updating = false;

  const offerUpdate = () => {
    if (registration.waiting && navigator.serviceWorker.controller) banner.hidden = false;
  };

  offerUpdate();
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed') offerUpdate();
    });
  });

  document.getElementById('update-button').addEventListener('click', () => {
    updating = true;
    registration.waiting?.postMessage('SKIP_WAITING');
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updating) location.reload();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registration.update().catch(() => {});
  });
}

if (shouldOfferInstall()) history.replaceState(null, '', '#/installer');
// Ordene «timeviseren» og «minuttviseren» i tekstene får samme farge som viserne på hennes klokke.
function applyTextColors() {
  const { textColors } = resolveDesign(currentDesign());
  for (const [name, value] of Object.entries(textColors)) document.documentElement.style.setProperty(`--${name}`, value);
}

applyTextColors();
subscribe(applyTextColors);
primeAudio();
startRouter(routes, document.getElementById('app'));
registerServiceWorker().catch((error) => console.warn('Service worker ble ikke registrert', error));
navigator.storage?.persist?.().catch(() => {});
