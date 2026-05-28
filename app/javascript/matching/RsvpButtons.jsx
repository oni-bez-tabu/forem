// RSVP buttons widget for the meetup hub. Replaces server-rendered
// button_to forms with a Preact component that hits the v1 API and
// updates state in place. Polish: smooth selected-state transition,
// click ripple, numeric tween on counts, slide-down confirmation card.
import { h, Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import PropTypes from 'prop-types';
import { rsvpsApi } from './rsvpsApi';
import { showToast } from './toast';
import { softRefreshCurrentPage } from './softRefresh';

const LABELS = {
  going: 'Idę',
  interested: 'Interesuje mnie',
  interestedShort: 'zainteresowanych',
  goingFromNietabuTail: 'z nietabu idzie',
  otherChannelsHint: 'Na evencie mogą być też osoby z innych kanałów.',
  countsCaveat: 'Liczby dotyczą tylko deklaracji z platformy',
  rsvpHeading: 'Wybierz swój udział',
  goingConfirmation: 'Zapisaliśmy że idziesz.',
  goingConfirmationTail: 'Powodzenia 🌙',
  signInRequired: 'Zaloguj się, żeby zapisać się na to wydarzenie.',
};

const TWEEN_MS = 480;

// Numeric tween. Animates from prev value to current using rAF.
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return undefined;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / TWEEN_MS);
      // easeOutCubic
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <strong>{display}</strong>;
}

// Confirmation card with slide-down + green pulse on mount.
function GoingConfirmation() {
  return (
    <div
      class="crayons-card flex items-center gap-3 mt-3"
      style={{
        padding: '12px 16px',
        background: 'rgba(5,150,105,0.08)',
        borderColor: 'rgba(5,150,105,0.25)',
        animation: 'matchingRsvpSlide 360ms cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <span
        style={{
          fontSize: '18px',
          color: 'rgb(5,150,105)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(5,150,105,0.15)',
          animation: 'matchingRsvpCheckPop 480ms cubic-bezier(0.22, 1, 0.36, 1) both',
          animationDelay: '120ms',
        }}
      >
        ✓
      </span>
      <div class="fs-s">
        <strong>{LABELS.goingConfirmation}</strong>{' '}
        <span class="color-base-60">{LABELS.goingConfirmationTail}</span>
      </div>
    </div>
  );
}

function buttonStyle(selected, busyForMe, pressed) {
  const baseShadow = selected
    ? '0 6px 20px -8px rgba(99,102,241,0.55)'
    : '0 1px 3px rgba(0,0,0,0.06)';
  return {
    flex: '0 0 auto',
    minWidth: '180px',
    minHeight: '48px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 700,
    borderRadius: '999px',
    border: '1px solid',
    borderColor: selected ? 'var(--accent-brand, #6366f1)' : 'var(--card-border, #e5e5e5)',
    background: selected ? 'var(--accent-brand, #6366f1)' : 'var(--card-bg, #fff)',
    color: selected ? '#fff' : 'var(--base-90, #171717)',
    transform: pressed ? 'scale(0.96)' : 'scale(1)',
    transition: 'background 220ms ease, color 220ms ease, border-color 220ms ease, transform 120ms ease, box-shadow 220ms ease, opacity 220ms ease',
    boxShadow: baseShadow,
    cursor: busyForMe ? 'wait' : 'pointer',
    opacity: busyForMe ? 0.85 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    position: 'relative',
    overflow: 'hidden',
  };
}

function Checkmark({ visible }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: visible ? '20px' : '0',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.4)',
        transition: 'width 220ms ease, opacity 220ms ease, transform 220ms ease',
        fontSize: '15px',
        lineHeight: 1,
      }}
    >
      ✓
    </span>
  );
}

function Pill({ children }) {
  return (
    <span
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.20)',
        opacity: 0,
        pointerEvents: 'none',
        animation: 'matchingRsvpRipple 420ms ease-out forwards',
      }}
    >
      {children}
    </span>
  );
}

export const RsvpButtons = ({
  slug,
  initialStatus,
  goingCount,
  interestedCount,
  signedIn,
  signInUrl,
}) => {
  const [status, setStatus] = useState(initialStatus || null);
  const [going, setGoing] = useState(goingCount);
  const [interested, setInterested] = useState(interestedCount);
  const [busy, setBusy] = useState(null); // null | 'going' | 'interested' | 'destroy'
  const [pressed, setPressed] = useState(null);
  const [ripple, setRipple] = useState({ key: 0, target: null });

  if (!signedIn) {
    return (
      <p>
        <a href={signInUrl} class="c-link">
          {LABELS.signInRequired}
        </a>
      </p>
    );
  }

  const applyResponse = (payload) => {
    setStatus(payload.rsvp ? payload.rsvp.status : null);
    setGoing(payload.counts.going);
    setInterested(payload.counts.interested);
  };

  const handleClick = async (next) => {
    if (busy) return;
    setRipple({ key: ripple.key + 1, target: next });
    setPressed(next);
    setTimeout(() => setPressed((p) => (p === next ? null : p)), 140);
    const action = status === next ? 'destroy' : next;
    setBusy(action);
    const result = status === next ? await rsvpsApi.destroy(slug) : await rsvpsApi.upsert(slug, next);
    setBusy(null);
    if (!result.ok || !result.payload) {
      showToast('Nie udało się zapisać', 'error');
      return;
    }
    applyResponse(result.payload);
    if (result.payload.needs_declaration_prompt) {
      document.dispatchEvent(
        new CustomEvent('matching:open-declaration-modal', { detail: { slug } }),
      );
    }
    softRefreshCurrentPage();
  };

  return (
    <Fragment>
      <style>{`
        @keyframes matchingRsvpSlide {
          from { opacity: 0; transform: translateY(-6px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes matchingRsvpCheckPop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes matchingRsvpRipple {
          0%   { transform: scale(0.4); opacity: 0.55; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      <div
        class="flex items-baseline flex-wrap mb-3"
        style={{ justifyContent: 'space-between' }}
      >
        <h2 class="crayons-subtitle-1" style={{ margin: 0 }}>
          {LABELS.rsvpHeading}
        </h2>
        <span class="fs-xs color-base-60">{LABELS.countsCaveat}</span>
      </div>

      <div class="flex gap-3 items-center flex-wrap">
        {['going', 'interested'].map((target) => {
          const selected = status === target;
          const busyForMe = busy === target || (busy === 'destroy' && status === target);
          return (
            <button
              key={target}
              type="button"
              onClick={() => handleClick(target)}
              onMouseDown={() => setPressed(target)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed((p) => (p === target ? null : p))}
              disabled={busy != null && !busyForMe}
              style={buttonStyle(selected, busyForMe, pressed === target)}
              aria-pressed={selected}
            >
              <Checkmark visible={selected} />
              <span>{target === 'going' ? LABELS.going : LABELS.interested}</span>
              {ripple.target === target && ripple.key > 0 && (
                <Pill key={ripple.key} />
              )}
            </button>
          );
        })}

        <div class="flex flex-col" style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
          <div class="fs-base">
            <AnimatedNumber value={going} /> {LABELS.goingFromNietabuTail}
            <span class="color-base-40" style={{ margin: '0 6px' }}>·</span>
            <AnimatedNumber value={interested} /> {LABELS.interestedShort}
          </div>
          <div class="fs-xs color-base-60" style={{ marginTop: '2px' }}>
            {LABELS.otherChannelsHint}
          </div>
        </div>
      </div>

      {status === 'going' && <GoingConfirmation />}
    </Fragment>
  );
};

RsvpButtons.propTypes = {
  slug: PropTypes.string.isRequired,
  initialStatus: PropTypes.oneOf(['going', 'interested', null, undefined]),
  goingCount: PropTypes.number.isRequired,
  interestedCount: PropTypes.number.isRequired,
  signedIn: PropTypes.bool.isRequired,
  signInUrl: PropTypes.string,
};
