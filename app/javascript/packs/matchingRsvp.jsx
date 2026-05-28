// Pack entry for the meetup hub RSVP widget. Finds every
// `[data-rsvp-mount]` container and renders <RsvpButtons /> in its place.
// The container's data-* attributes carry the initial server-side state.
import { h, render } from 'preact';
import { RsvpButtons } from '../matching/RsvpButtons';

function mount(node) {
  if (node.dataset.rsvpMounted === 'true') return;
  node.dataset.rsvpMounted = 'true';
  node.innerHTML = '';

  const props = {
    slug: node.dataset.slug,
    initialStatus: node.dataset.currentStatus || null,
    goingCount: parseInt(node.dataset.goingCount || '0', 10) || 0,
    interestedCount: parseInt(node.dataset.interestedCount || '0', 10) || 0,
    signedIn: node.dataset.signedIn === 'true',
    signInUrl: node.dataset.signInUrl || '/users/sign_in',
  };
  render(<RsvpButtons {...props} />, node);
}

function init() {
  document.querySelectorAll('[data-rsvp-mount]').forEach(mount);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
