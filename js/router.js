// Hash-ruter med egen historikk. Hjem-skjerm-appen på iPhone har ingen nettleserknapper,
// så hver skjerm kjenner sin forelder og kan alltid finne veien tilbake.

let routes = [];
let outlet = null;
let renderedPath = '/';
let historyIndex = 0;
let leaveGuard = null;
let guardOpen = false;
let cleanup = null;

const currentPath = () => location.hash.slice(1) || '/';
const urlFor = (path) => `#${path}`;

/** Finner ruten for en sti som '/niva/2/oppgaver', med parametere som { n: '2' }. */
function match(path) {
  const parts = path.split('/').filter(Boolean);
  for (const route of routes) {
    const pattern = route.path.split('/').filter(Boolean);
    if (pattern.length !== parts.length) continue;
    const params = {};
    const ok = pattern.every((segment, index) => {
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = decodeURIComponent(parts[index]);
        return true;
      }
      return segment === parts[index];
    });
    if (ok) return { route, params };
  }
  return null;
}

function parentOf(path) {
  const found = match(path);
  if (!found) return '/';
  const { parent = '/' } = found.route;
  return typeof parent === 'function' ? parent(found.params) : parent;
}

function render(path) {
  const found = match(path) ?? match('/');
  cleanup?.();
  cleanup = null;
  leaveGuard = null;

  const node = found.route.view({
    params: found.params,
    onCleanup: (fn) => {
      cleanup = fn;
    },
  });
  renderedPath = match(path) ? path : '/';
  document.body.dataset.route = found.route.path;
  outlet.replaceChildren(node);
  window.scrollTo(0, 0);
}

async function mayLeave() {
  if (!leaveGuard) return true;
  if (guardOpen) return false;
  guardOpen = true;
  try {
    if (!(await leaveGuard())) return false;
    leaveGuard = null;
    return true;
  } finally {
    guardOpen = false;
  }
}

async function onPopState(event) {
  if (leaveGuard) {
    history.pushState({ index: historyIndex }, '', urlFor(renderedPath));
    if (await mayLeave()) history.back();
    return;
  }
  historyIndex = event.state?.index ?? 0;
  render(currentPath());
}

export function startRouter(routeTable, element) {
  routes = routeTable;
  outlet = element;
  historyIndex = history.state?.index ?? 0;
  history.replaceState({ index: historyIndex }, '', urlFor(currentPath()));
  window.addEventListener('popstate', onPopState);
  render(currentPath());
}

export async function navigate(path, { replace = false } = {}) {
  if (!(await mayLeave())) return;
  if (replace) {
    history.replaceState({ index: historyIndex }, '', urlFor(path));
  } else {
    historyIndex += 1;
    history.pushState({ index: historyIndex }, '', urlFor(path));
  }
  render(path);
}

export async function goBack() {
  if (!(await mayLeave())) return;
  if (historyIndex > 0) {
    history.back();
  } else {
    const parent = parentOf(renderedPath);
    history.replaceState({ index: 0 }, '', urlFor(parent));
    render(parent);
  }
}

/** Må settes etter at skjermen er tegnet; nullstilles automatisk ved neste skjermbytte. */
export function setLeaveGuard(guard) {
  leaveGuard = guard;
}
