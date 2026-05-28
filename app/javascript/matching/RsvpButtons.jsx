// RSVP buttons for the meetup hub. Replaces server-rendered button_to forms
// with a Preact widget that hits the v1 API, updates state in place, and
// chains the declaration modal when the server flags
// `needs_declaration_prompt: true`.
import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import PropTypes from 'prop-types';
import { rsvpsApi } from './rsvpsApi';
import { showToast } from './toast';
import { softRefreshCurrentPage } from './softRefresh';

const LABELS = {
  going: 'Idę',
  interested: 'Interesuje mnie',
  goingShort: 'idzie',
  interestedShort: 'zainteresowanych',
  goingFromNietabuTail: 'z nietabu idzie',
  otherChannelsHint: 'Na evencie mogą być też osoby z innych kanałów.',
  countsCaveat: 'Liczby dotyczą tylko deklaracji z platformy',
  rsvpHeading: 'Wybierz swój udział',
  goingConfirmation: 'Zapisaliśmy że idziesz.',
  goingConfirmationTail: 'Powodzenia 🌙',
  signInRequired: 'Zaloguj się, żeby zapisać się na to wydarzenie.',
};

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
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    let result;
    if (status === next) {
      result = await rsvpsApi.destroy(slug);
    } else {
      result = await rsvpsApi.upsert(slug, next);
    }
    setBusy(false);
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
    // Refresh the matching section, P1/P2/P3 transitions etc.
    softRefreshCurrentPage();
  };

  const buttonClass = (target) =>
    `c-btn c-btn--l ${status === target ? 'c-btn--primary' : 'c-btn--secondary'}`;

  const buttonContent = (target, baseLabel) =>
    status === target ? `✓ ${baseLabel}` : baseLabel;

  return (
    <Fragment>
      <div class="flex items-baseline flex-wrap mb-3" style={{ justifyContent: 'space-between' }}>
        <h2 class="crayons-subtitle-1" style={{ margin: 0 }}>
          {LABELS.rsvpHeading}
        </h2>
        <span class="fs-xs color-base-60">{LABELS.countsCaveat}</span>
      </div>
      <div class="flex gap-3 items-center flex-wrap">
        <button
          type="button"
          class={buttonClass('going')}
          onClick={() => handleClick('going')}
          disabled={busy}
        >
          {buttonContent('going', LABELS.going)}
        </button>
        <button
          type="button"
          class={buttonClass('interested')}
          onClick={() => handleClick('interested')}
          disabled={busy}
        >
          {buttonContent('interested', LABELS.interested)}
        </button>
        <div class="flex flex-col" style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
          <div class="fs-base">
            <strong>{going}</strong> {LABELS.goingFromNietabuTail}
            <span class="color-base-40" style={{ margin: '0 6px' }}>
              ·
            </span>
            <strong>{interested}</strong> {LABELS.interestedShort}
          </div>
          <div class="fs-xs color-base-60" style={{ marginTop: '2px' }}>
            {LABELS.otherChannelsHint}
          </div>
        </div>
      </div>
      {status === 'going' && (
        <div
          class="crayons-card flex items-center gap-3 mt-3"
          style={{
            padding: '12px 16px',
            background: 'rgba(5,150,105,0.08)',
            borderColor: 'rgba(5,150,105,0.25)',
          }}
        >
          <span style={{ fontSize: '18px', color: 'rgb(5,150,105)' }}>✓</span>
          <div class="fs-s">
            <strong>{LABELS.goingConfirmation}</strong>{' '}
            <span class="color-base-60">{LABELS.goingConfirmationTail}</span>
          </div>
        </div>
      )}
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
