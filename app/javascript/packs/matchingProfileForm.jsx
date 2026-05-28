// Pack entry — mountuje <ProfileForm /> w `#matching-profile-form-mount`.
// Server (onboarding/form view) renderuje shell, podaje URL'e i opcjonalnie
// initial profile JSON gdy edit mode. Reszta po stronie Preact.
import { h, render } from 'preact';
import { ProfileForm } from '../matching/ProfileForm';

function init() {
  const root = document.getElementById('matching-profile-form-mount');
  if (!root) return;
  const mode = root.dataset.mode === 'edit' ? 'edit' : 'create';
  const successUrl = root.dataset.successUrl || '/matching/onboarding/success';
  let initialProfile = null;
  if (root.dataset.profile) {
    try {
      initialProfile = JSON.parse(root.dataset.profile);
    } catch (_e) {
      initialProfile = null;
    }
  }
  render(
    <ProfileForm mode={mode} successUrl={successUrl} initialProfile={initialProfile} />,
    root,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
