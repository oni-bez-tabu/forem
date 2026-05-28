// Pack entry for the /matching SPA. Mountuje <Dashboard /> w
// `#matching-app`. URLe (onboarding, settings) ciągnie z data-* attrs
// żeby Rails source of truth dla routing pozostał spójny.
import { h, render } from 'preact';
import { Dashboard } from '../matching/Dashboard';

function init() {
  const root = document.getElementById('matching-app');
  if (!root) return;
  const onboardingUrl = root.dataset.onboardingUrl || '/matching/onboarding';
  const settingsUrl = root.dataset.settingsUrl || '/settings/matching';
  render(<Dashboard onboardingUrl={onboardingUrl} settingsUrl={settingsUrl} />, root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
