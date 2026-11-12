const SHOWN_KEY = 'tikk-install-shown';

export function isStandalone() {
  return navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

export const isIPhone = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

/** Sant første gang appen åpnes i en nettleserfane på iPhone, så veiledningen ikke maser. */
export function shouldOfferInstall() {
  if (isStandalone() || !isIPhone()) return false;
  try {
    if (sessionStorage.getItem(SHOWN_KEY)) return false;
    sessionStorage.setItem(SHOWN_KEY, '1');
  } catch {
    // Uten sessionStorage vises veiledningen bare på nytt ved omlasting.
  }
  return true;
}
