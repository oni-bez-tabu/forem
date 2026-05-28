// Pack entry for the E10 declaration modal. Renders a Preact root that
// listens for the custom event `matching:open-declaration-modal` (with
// `detail.slug`), and delegates clicks on `[data-declaration-modal-trigger]`
// to dispatch that event.
import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { DeclarationModal } from '../matching/DeclarationModal';

const OPEN_EVENT = 'matching:open-declaration-modal';

function ModalRoot() {
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    const handleOpen = (e) => {
      const nextSlug = e.detail && e.detail.slug;
      if (nextSlug) setSlug(nextSlug);
    };
    document.addEventListener(OPEN_EVENT, handleOpen);
    return () => document.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  if (!slug) return null;
  return <DeclarationModal meetupSlug={slug} onClose={() => setSlug(null)} />;
}

function init() {
  if (document.getElementById('matching-modal-root')) return;
  const mount = document.createElement('div');
  mount.id = 'matching-modal-root';
  document.body.appendChild(mount);
  render(<ModalRoot />, mount);

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-declaration-modal-trigger]');
    if (!trigger) return;
    e.preventDefault();
    const slug = trigger.dataset.meetupSlug;
    if (slug) {
      document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { slug } }));
    }
  });

  // RSVP server-side flow still redirects with `?declare=1` + a hint slug.
  // Auto-open the modal if we land on /meetups/:slug with that flag. (Until
  // RSVP becomes Preact in Faza 2.)
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('declare') === '1') {
      const match = url.pathname.match(/\/meetups\/([^/]+)/);
      if (match) {
        const slug = decodeURIComponent(match[1]);
        url.searchParams.delete('declare');
        window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '') + url.hash);
        document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { slug } }));
      }
    }
  } catch (_e) {
    /* no-op */
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
