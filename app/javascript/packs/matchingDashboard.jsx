// Pack entry for the /matching SPA. Mountuje <Dashboard /> w
// `#matching-app`. URLe (onboarding, settings) ciągnie z data-* attrs
// żeby Rails source of truth dla routing pozostał spójny.
//
// Idempotent: jeśli ten sam #matching-app został już zmountowany,
// drugi init nie robi nic. Po softRefresh (event matching:dom-refreshed)
// znajdujemy świeży #matching-app i mountujemy go ponownie. Dashboard
// component sam sprawdza dashboardCache — gdy świeży, render bez spinnera.
import { h, render } from 'preact';
import { Dashboard } from '../matching/Dashboard';

function mount(root) {
  if (!root || root.dataset.matchingMounted === 'true') return;
  root.dataset.matchingMounted = 'true';
  const onboardingUrl = root.dataset.onboardingUrl || '/matching/onboarding';
  const settingsUrl = root.dataset.settingsUrl || '/settings/matching';
  render(<Dashboard onboardingUrl={onboardingUrl} settingsUrl={settingsUrl} />, root);
}

function init() {
  mount(document.getElementById('matching-app'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

document.addEventListener('matching:dom-refreshed', init);
