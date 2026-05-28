// E10 declaration popup — 1:1 with hifi mockup `IntentPopup` (screens.jsx:405).
// Replaces the old inline-JS `_declaration_modal.html.erb`. Mounted by
// `packs/matchingDeclarationModal.jsx` and opened via custom DOM event
// `matching:open-declaration-modal` (`detail: { slug }`).
import { h, Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import PropTypes from 'prop-types';
import { declarationsApi } from './api';
import { showToast } from './toast';
import { softRefreshCurrentPage } from './softRefresh';

const NOTE_MAX = 200;

const INTENTS = [
  {
    id: 'not_looking',
    emoji: '🌑',
    title: 'Nie szukam nikogo',
    desc: 'Idę, ale nie chcę żadnego kontaktu — nikt mnie nie widać w dopasowaniach i nikt do mnie nie napisze.',
  },
  {
    id: 'just_vibe',
    emoji: '🌙',
    title: 'Tylko klimat',
    desc: 'Idę poczuć atmosferę — nie przeglądam dopasowań, ale inni mogą do mnie napisać.',
  },
  {
    id: 'open_to_meet',
    emoji: '💬',
    title: 'Otwarty na poznanie',
    desc: 'Chętnie kogoś poznam, zobaczymy o czym.',
  },
];

export const DeclarationModal = ({ meetupSlug, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [meetup, setMeetup] = useState(null);
  const [intent, setIntent] = useState('open_to_meet');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const cardRef = useRef(null);

  // Fetch existing declaration + meetup context on open.
  useEffect(() => {
    let cancelled = false;
    declarationsApi.show(meetupSlug).then(({ ok, payload }) => {
      if (cancelled) return;
      if (!ok) {
        setFetchError(true);
        setLoading(false);
        return;
      }
      setMeetup(payload.meetup);
      if (payload.declaration) {
        setIntent(payload.declaration.intent_level);
        setNote(payload.declaration.meetup_note || '');
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [meetupSlug]);

  // Escape closes the modal.
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors(null);
    const { ok, payload } = await declarationsApi.upsert(meetupSlug, {
      intent_level: intent,
      meetup_note: note,
    });
    setSubmitting(false);
    if (ok) {
      onClose();
      showToast('Zapisano deklarację', 'success');
      softRefreshCurrentPage();
    } else {
      const message = (payload && payload.error) || 'Wystąpił błąd zapisu';
      setErrors([message]);
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
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={cardRef}
        style={{
          background: 'var(--card-bg, #fff)',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
        }}
      >
        <div
          class="flex items-start"
          style={{ padding: '24px 28px 12px', gap: '16px', justifyContent: 'space-between' }}
        >
          <div style={{ flex: '1 1 auto' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              Twoja intencja
            </h2>
            {meetup && (
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '13px',
                  color: 'rgb(var(--grey-600, 107 114 128))',
                }}
              >
                na:{' '}
                <strong style={{ color: 'rgb(var(--grey-900, 17 24 39))' }}>{meetup.name}</strong>
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Anuluj"
            onClick={onClose}
            style={{
              fontSize: '18px',
              lineHeight: 1,
              padding: '8px 10px',
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

        {fetchError && (
          <div style={{ padding: '12px 28px' }}>
            <div
              role="alert"
              class="crayons-notice crayons-notice--danger"
              style={{ padding: '12px 16px' }}
            >
              Nie udało się otworzyć modala (brak profilu, brak RSVP, lub wydarzenie wygasło).
            </div>
          </div>
        )}

        {!fetchError && (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '12px 28px 0' }}>
              {errors && (
                <div
                  role="alert"
                  class="crayons-notice crayons-notice--danger"
                  style={{ padding: '12px 16px', marginBottom: '16px' }}
                >
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {errors.map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p
                style={{
                  margin: '0 0 20px',
                  fontSize: '14px',
                  lineHeight: 1.55,
                  color: 'rgb(var(--grey-600, 107 114 128))',
                }}
              >
                Każde wydarzenie to osobna deklaracja. Nikt jej nie zobaczy poza osobami, które
                pasują do twojego filtra.
              </p>

              <fieldset style={{ border: 0, padding: 0, margin: '0 0 20px' }}>
                <legend style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
                  Intencja
                </legend>
                <div class="flex flex-col" style={{ gap: '10px' }}>
                  {INTENTS.map((it) => {
                    const selected = intent === it.id;
                    return (
                      <label
                        key={it.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          border: `1px solid ${
                            selected ? 'var(--accent-brand, #6366f1)' : 'var(--card-border, #e5e5e5)'
                          }`,
                          background: selected ? 'rgba(99,102,241,0.06)' : 'transparent',
                          transition: 'all 120ms ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="intent_level"
                          value={it.id}
                          checked={selected}
                          onChange={() => setIntent(it.id)}
                          style={{
                            margin: '6px 0 0',
                            accentColor: 'var(--accent-brand, #6366f1)',
                          }}
                        />
                        <div
                          style={{ fontSize: '24px', lineHeight: 1, flex: '0 0 28px', paddingTop: '2px' }}
                        >
                          {it.emoji}
                        </div>
                        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.3 }}>
                            {it.title}
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              lineHeight: 1.45,
                              color: 'rgb(var(--grey-700, 75 85 99))',
                              marginTop: '4px',
                            }}
                          >
                            {it.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div
                class="flex flex-col"
                style={{ gap: '8px', marginBottom: '20px' }}
              >
                <label
                  for="declaration-modal-note"
                  style={{ fontSize: '13px', fontWeight: 700 }}
                >
                  Notatka na tym wydarzeniu
                </label>
                <textarea
                  id="declaration-modal-note"
                  value={note}
                  maxLength={NOTE_MAX}
                  rows={3}
                  onInput={(e) => setNote(e.target.value)}
                  placeholder='np. "Pierwszy raz w tym klubie, chętnie pogadam"'
                  class="crayons-textfield"
                />
                <div
                  class="flex"
                  style={{ justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}
                >
                  <span style={{ fontSize: '12px', color: 'rgb(var(--grey-600, 107 114 128))' }}>
                    Pojawi się tylko przed twoimi dopasowaniami z tego wydarzenia.
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'rgb(var(--grey-600, 107 114 128))',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {note.length}/{NOTE_MAX}
                  </span>
                </div>
              </div>
            </div>

            <div
              class="flex"
              style={{
                padding: '16px 28px 24px',
                gap: '12px',
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--card-border, #e5e5e5)',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                class="c-btn"
                style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600 }}
                disabled={submitting}
              >
                Anuluj
              </button>
              <button
                type="submit"
                class="c-btn c-btn--primary"
                style={{ padding: '10px 22px', fontSize: '14px', fontWeight: 700 }}
                disabled={loading || submitting}
              >
                {submitting ? '…' : 'Zapisz deklarację'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

DeclarationModal.propTypes = {
  meetupSlug: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
