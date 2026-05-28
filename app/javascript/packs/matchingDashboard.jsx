// Pack entry dla /matching activity feed. Profile header jest SSR,
// my mountujemy tylko Preact dla listy aktywności w `#matching-app`.
// Idempotent + reaguje na matching:dom-refreshed (po softRefresh swap).
import { h, render } from 'preact';
import { Dashboard } from '../matching/Dashboard';

function mount(root) {
  if (!root || root.dataset.matchingMounted === 'true') return;
  root.dataset.matchingMounted = 'true';
  const onboardingUrl = root.dataset.onboardingUrl || '/matching/onboarding';
  render(<Dashboard onboardingUrl={onboardingUrl} />, root);
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
