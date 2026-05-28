// Pack entry for the welcome modal on event-scoped profiles. Click
// delegation on `[data-matching-welcome-trigger]` — picks up
// data-receiver-id / data-meetup-id / data-preview-body and renders the
// Preact modal. Server stays as the source of truth for the welcome's
// localized body text (rendered via MatchingWelcome.render_body and
// passed verbatim through a data attribute).
import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { WelcomeModal } from '../matching/WelcomeModal';

const OPEN_EVENT = 'matching:open-welcome-modal';

function ModalRoot() {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const handle = (e) => {
      const detail = e.detail || {};
      if (detail.receiverProfileId && detail.meetupId) setOpen(detail);
    };
    document.addEventListener(OPEN_EVENT, handle);
    return () => document.removeEventListener(OPEN_EVENT, handle);
  }, []);

  if (!open) return null;
  return (
    <WelcomeModal
      receiverProfileId={open.receiverProfileId}
      meetupId={open.meetupId}
      previewBody={open.previewBody}
      onClose={() => setOpen(null)}
    />
  );
}

function init() {
  if (document.getElementById('matching-welcome-modal-root')) return;
  const mount = document.createElement('div');
  mount.id = 'matching-welcome-modal-root';
  document.body.appendChild(mount);
  render(<ModalRoot />, mount);

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-matching-welcome-trigger]');
    if (!trigger) return;
    e.preventDefault();
    const receiverProfileId = parseInt(trigger.dataset.receiverId || '0', 10);
    const meetupId = parseInt(trigger.dataset.meetupId || '0', 10);
    const previewBody = trigger.dataset.previewBody || '';
    if (!receiverProfileId || !meetupId) return;
    document.dispatchEvent(
      new CustomEvent(OPEN_EVENT, {
        detail: { receiverProfileId, meetupId, previewBody },
      }),
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
