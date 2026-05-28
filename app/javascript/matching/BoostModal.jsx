// Boost modal for meetup hub — share section's "Udostępnij na nietabu" CTA.
// Opens via `matching:open-boost-modal` custom event (`detail: { slug,
// previewHtml }`). On submit POSTs to /api/meetups/:slug/boost, then
// navigates to the freshly-created article (full reload by design — user
// is leaving the meetup hub for their new post).
import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import PropTypes from 'prop-types';
import { boostsApi } from './boostsApi';
import { showToast } from './toast';

export const BoostModal = ({ slug, previewHtml, onClose }) => {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [onClose]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = body.trim();
    if (!trimmed) {
      showToast('Napisz coś, żeby udostępnić', 'error');
      return;
    }
    setSubmitting(true);
    const { ok, payload } = await boostsApi.create(slug, trimmed);
    if (ok && payload && payload.path) {
      window.location.href = payload.path;
    } else {
      setSubmitting(false);
      showToast((payload && payload.error) || 'Błąd publikacji', 'error');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
      onMouseDown={handleBackdrop}
    >
      <div
        class="crayons-card"
        style={{
          padding: '24px 28px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
        }}
      >
        <div
          class="flex items-start"
          style={{ gap: '16px', justifyContent: 'space-between', marginBottom: '12px' }}
        >
          <h2 class="crayons-subtitle-1" style={{ margin: 0 }}>
            Udostępnij wydarzenie
          </h2>
          <button
            type="button"
            aria-label="Anuluj"
            onClick={onClose}
            style={{
              fontSize: '18px',
              lineHeight: 1,
              padding: '4px 10px',
              background: 'transparent',
              border: 0,
              color: 'rgb(var(--grey-600, 107 114 128))',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            class="crayons-textfield"
            rows={4}
            placeholder="Napisz coś o tym wydarzeniu…"
            value={body}
            onInput={(e) => setBody(e.target.value)}
            disabled={submitting}
            required
          />

          {previewHtml && (
            <div style={{ marginTop: '16px' }}>
              <p class="fs-xs color-base-60" style={{ marginBottom: '4px' }}>
                Podgląd
              </p>
              <div
                style={{
                  border: '1px dashed var(--card-border, #ddd)',
                  borderRadius: '8px',
                  padding: '8px',
                }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}

          <div class="flex gap-2 justify-end" style={{ marginTop: '16px' }}>
            <button
              type="button"
              class="c-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Anuluj
            </button>
            <button
              type="submit"
              class="c-btn c-btn--primary"
              disabled={submitting}
            >
              {submitting ? '…' : 'Opublikuj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

BoostModal.propTypes = {
  slug: PropTypes.string.isRequired,
  previewHtml: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
