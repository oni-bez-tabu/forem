// Inline recommendation card — pokazywany pomiędzy timeline events
// co kilka pozycji (mockup E8).
import { h, Fragment } from 'preact';
import PropTypes from 'prop-types';
import { pillStyle, identityLabel } from './theme';
import { shortDate } from './formatDate';

const IDENTITY_PLURAL = {
  woman: 'kobiet',
  man: 'mężczyzn',
  couple: 'par',
  non_binary: 'os. niebinarnych',
};

function breakdownLine(breakdown) {
  if (!breakdown) return null;
  const parts = Object.entries(breakdown)
    .filter(([, count]) => count > 0)
    .map(([identity, count]) => `${count} ${IDENTITY_PLURAL[identity] || identity}`);
  return parts.join(' · ');
}

export const RecommendationCard = ({ recommendation }) => {
  const { meetup, active_count, identity_breakdown, open_to_meet_count, reasons } = recommendation;
  if (!meetup) return null;
  const breakdown = breakdownLine(identity_breakdown);
  const repeatOrganizer = (reasons || []).includes('repeat_organizer');
  return (
    <div
      class="crayons-card"
      style={{
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(169,31,105,0.04))',
        borderStyle: 'dashed',
        borderColor: 'rgba(99,102,241,0.35)',
      }}
    >
      <div
        class="flex items-baseline gap-2 flex-wrap"
        style={{ justifyContent: 'space-between' }}
      >
        <span style={pillStyle('brand_soft')}>✨ Polecane dla ciebie</span>
        <span class="fs-xs color-base-60">{shortDate(meetup.start_at)}</span>
      </div>
      <h3 class="fs-l" style={{ margin: '6px 0 0', fontWeight: 700 }}>
        <a
          href={`/meetups/${meetup.slug}`}
          class="c-link"
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          {meetup.name}
        </a>
      </h3>
      {meetup.venue_name && (
        <p class="fs-s color-base-70" style={{ margin: '2px 0 0' }}>
          📍 {meetup.venue_name}
        </p>
      )}
      <p class="fs-s color-base-70" style={{ margin: '10px 0 0' }}>
        <strong>Bo:</strong> {active_count} osób zadeklarowało intencję
        {breakdown && (
          <span style={{ fontStyle: 'italic', color: 'rgb(var(--grey-700, 75 85 99))' }}>
            {' '}
            ({breakdown})
          </span>
        )}
      </p>
      {open_to_meet_count > 0 && (
        <p class="fs-s color-base-70" style={{ margin: '4px 0 0' }}>
          ✨ {open_to_meet_count} chce się poznać
        </p>
      )}
      {repeatOrganizer && (
        <p class="fs-xs color-base-60" style={{ margin: '4px 0 0' }}>
          🔁 U organizatora, u którego już byłeś
        </p>
      )}
      <div class="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
        <a href={`/meetups/${meetup.slug}`} class="c-btn c-btn--primary c-btn--s">
          Zobacz wydarzenie
        </a>
      </div>
    </div>
  );
};

RecommendationCard.propTypes = {
  recommendation: PropTypes.object.isRequired,
};
