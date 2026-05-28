// E18 welcome popup — sender wybiera "Napisz" na event-scoped profile,
// modal pokazuje preview treści (renderowany server-side, niemodyfikowalny),
// na potwierdzenie POSTuje /api/matching/welcomes. Treść trafia do chatu
// Firebase przez Cloud Function (poza Forem repo — Faza 4 dług).
import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import PropTypes from 'prop-types';
import { welcomesApi } from './welcomesApi';

const STATE = {
  COMPOSE: 'compose',
  SENDING: 'sending',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const WelcomeModal = ({ receiverProfileId, meetupId, previewBody, onClose }) => {
  const [stage, setStage] = useState(STATE.COMPOSE);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const onKeydown = (e) => {
      if (e.key === 'Escape' && stage !== STATE.SENDING) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [onClose, stage]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && stage !== STATE.SENDING) onClose();
  };

  const handleSend = async () => {
    setStage(STATE.SENDING);
    setErrorMessage(null);
    const { ok, payload } = await welcomesApi.create({ receiverProfileId, meetupId });
    if (ok) {
      setStage(STATE.SUCCESS);
    } else {
      setErrorMessage((payload && payload.error) || 'Nie udało się wysłać');
      setStage(STATE.ERROR);
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
          maxWidth: '520px',
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
            Wyślij powitalną wiadomość
          </h2>
          {stage !== STATE.SENDING && (
            <button
              type="button"
              aria-label="Zamknij"
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
          )}
        </div>

        {stage === STATE.COMPOSE && (
          <Fragment>
            <p class="fs-xs color-base-60" style={{ marginBottom: '8px' }}>
              Podgląd treści
            </p>
            <div
              style={{
                background: 'var(--card-secondary-bg, #f5f5f5)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '13px',
              }}
            >
              {previewBody}
            </div>

            <div
              style={{
                border: '1px solid var(--card-border, #ddd)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              <p class="fs-s" style={{ marginBottom: '8px' }}>
                <strong>Co się stanie?</strong>
              </p>
              <ul
                class="fs-xs color-base-70"
                style={{ listStyle: 'disc', paddingLeft: '20px', margin: 0 }}
              >
                <li>Trafi do twojego chatu nietabu jako pierwsza wiadomość.</li>
                <li>Druga strona widzi tylko twój profil Matching.</li>
                <li>Dalszą rozmowę prowadzicie normalnie w chacie.</li>
              </ul>
            </div>

            <p
              class="fs-xs color-accent-warning"
              style={{ marginBottom: '16px' }}
            >
              ⚠ Tę osobę możesz przywitać tylko raz, niezależnie od wydarzeń.
            </p>

            <div class="flex gap-2 justify-end">
              <button type="button" class="c-btn" onClick={onClose}>
                Anuluj
              </button>
              <button type="button" class="c-btn c-btn--primary" onClick={handleSend}>
                Wyślij
              </button>
            </div>
          </Fragment>
        )}

        {stage === STATE.SENDING && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✉️</div>
            <p>Wysyłam wiadomość…</p>
          </div>
        )}

        {stage === STATE.SUCCESS && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
            <h3 class="crayons-subtitle" style={{ marginBottom: '8px' }}>
              Wysłane
            </h3>
            <p class="fs-s color-base-70" style={{ marginBottom: '16px' }}>
              Wiadomość trafiła do waszego chatu nietabu. Powodzenia ✨
            </p>
            <button type="button" class="c-btn c-btn--primary" onClick={onClose}>
              Zamknij
            </button>
          </div>
        )}

        {stage === STATE.ERROR && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p class="color-accent-danger">{errorMessage}</p>
            <button type="button" class="c-btn" style={{ marginTop: '12px' }} onClick={onClose}>
              Zamknij
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

WelcomeModal.propTypes = {
  receiverProfileId: PropTypes.number.isRequired,
  meetupId: PropTypes.number.isRequired,
  previewBody: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
