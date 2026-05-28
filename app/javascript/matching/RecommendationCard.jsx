// Recommendation tile renderowany inline w timeline. 1:1 z mockup E8
// (`screens.jsx:868`): banner strip 140px po lewej + dashed brand border
// + content po prawej z ✨ "Polecane dla ciebie" tag + meetup name + meta
// + "Bo: X osób…" reason + identity_breakdown italic + 2 CTAs.
import { h, Fragment } from 'preact';
import PropTypes from 'prop-types';
import { bannerGradient } from './theme';
import { shortDate } from './formatDate';

const IDENTITY_PLURAL = {
  woman: 'kobiet',
  man: 'mężczyzn',
  couple: 'par',
  non_binary: 'os. niebinarnych',
};

function breakdownParts(breakdown) {
  if (!breakdown) return [];
  return Object.entries(breakdown)
    .filter(([, count]) => count > 0)
    .slice(0, 3)
    .map(([identity, count]) => `${count} ${IDENTITY_PLURAL[identity] || identity}`);
}

export const RecommendationCard = ({ recommendation }) => {
  const { meetup, active_count, identity_breakdown, open_to_meet_count, reasons } = recommendation;
  if (!meetup) return null;
  const parts = breakdownParts(identity_breakdown);
  const repeatOrganizer = (reasons || []).includes('repeat_organizer');

  return (
    <div
      class="crayons-card"
      style={{
        display: 'flex',
        gap: 0,
        overflow: 'hidden',
        borderStyle: 'dashed',
        borderColor: 'var(--accent-brand, #6366f1)',
        background: 'rgba(99,102,241,0.03)',
      }}
    >
      {meetup.banner_url ? (
        <img
          src={meetup.banner_url}
          alt=""
          style={{
            width: '140px',
            flex: '0 0 140px',
            alignSelf: 'stretch',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: '140px',
            flex: '0 0 140px',
            alignSelf: 'stretch',
            minHeight: '100%',
            display: 'block',
            backgroundImage: bannerGradient(meetup.banner_gradient),
          }}
        />
      )}

      <div style={{ flex: '1 1 auto', padding: '14px 16px', minWidth: 0 }}>
        <div
          class="flex items-baseline gap-2 flex-wrap"
          style={{ justifyContent: 'space-between' }}
        >
          <span
            class="fs-xs color-accent-brand"
            style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            ✨ Polecane dla ciebie
          </span>
          {repeatOrganizer && (
            <span class="fs-xs color-base-60" style={{ fontStyle: 'italic' }}>
              🔁 znany organizator
            </span>
          )}
        </div>

        <h3 class="fs-l mt-1" style={{ margin: '4px 0 0', fontWeight: 700 }}>
          <a
            href={`/meetups/${meetup.slug}`}
            class="c-link"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {meetup.name}
          </a>
        </h3>
        <p class="fs-s color-base-70" style={{ margin: '2px 0 0' }}>
          📅 {shortDate(meetup.start_at)}
          {meetup.venue_name && ` · 📍 ${meetup.venue_name}`}
        </p>

        {active_count > 0 && (
          <Fragment>
            <p class="fs-s color-base-80 mt-2" style={{ marginTop: '10px' }}>
              <strong>Bo:</strong> {active_count} osób z twoich preferencji zadeklarowało intencję
            </p>
            {(parts.length > 0 || open_to_meet_count > 0) && (
              <p class="fs-xs color-base-60" style={{ marginTop: '2px', fontStyle: 'italic' }}>
                {parts.length > 0 && parts.join(' · ')}
                {parts.length > 0 && open_to_meet_count > 0 && ' · '}
                {open_to_meet_count > 0 && `✨ ${open_to_meet_count} chce się poznać`}
              </p>
            )}
          </Fragment>
        )}

        <div class="flex gap-2" style={{ marginTop: '12px', flexWrap: 'wrap' }}>
          <a href={`/meetups/${meetup.slug}`} class="c-btn c-btn--primary c-btn--s">
            Zobacz wydarzenie
          </a>
          <a href={`/meetups/${meetup.slug}`} class="c-btn c-btn--secondary c-btn--s">
            Zadeklaruj intencję
          </a>
        </div>
      </div>
    </div>
  );
};

RecommendationCard.propTypes = {
  recommendation: PropTypes.object.isRequired,
};
