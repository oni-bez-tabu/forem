// Pack entry for the boost modal. Listens for clicks on
// `[data-meetup-boost-trigger]` and opens a Preact-managed boost modal
// over the page. Preview HTML for the embedded meetup widget is pulled
// from a sibling `[data-meetup-boost-preview]` hidden node so we don't
// have to re-render the widget client-side.
import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { BoostModal } from '../matching/BoostModal';

const OPEN_EVENT = 'matching:open-boost-modal';

function ModalRoot() {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const handle = (e) => {
      const detail = e.detail || {};
      if (detail.slug) setOpen(detail);
    };
    document.addEventListener(OPEN_EVENT, handle);
    return () => document.removeEventListener(OPEN_EVENT, handle);
  }, []);

  if (!open) return null;
  return (
    <BoostModal
      slug={open.slug}
      previewHtml={open.previewHtml}
      onClose={() => setOpen(null)}
    />
  );
}

function findPreviewHtml(slug) {
  const node = document.querySelector(`[data-meetup-boost-preview="${slug}"]`);
  return node ? node.innerHTML : '';
}

function init() {
  if (document.getElementById('matching-boost-modal-root')) return;
  const mount = document.createElement('div');
  mount.id = 'matching-boost-modal-root';
  document.body.appendChild(mount);
  render(<ModalRoot />, mount);

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-meetup-boost-trigger]');
    if (!trigger) return;
    e.preventDefault();
    const slug = trigger.dataset.meetupSlug;
    if (!slug) return;
    document.dispatchEvent(
      new CustomEvent(OPEN_EVENT, { detail: { slug, previewHtml: findPreviewHtml(slug) } }),
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
