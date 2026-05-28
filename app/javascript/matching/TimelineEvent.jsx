// Single timeline event card — handles all 7 event types from
// Matching::TimelineFeed. Server pre-serializes each event so this
// component just renders.
import { h, Fragment } from 'preact';
import PropTypes from 'prop-types';
import { pillStyle, identityLabel, intentLabel } from './theme';
import { shortDate, timeAgo } from './formatDate';

const KIND_LABELS = {
  rsvp_created: 'Zapisano się',
  declaration_created: 'Zadeklarowano intencję',
  declaration_updated: 'Zmieniono intencję',
  welcome_sent: 'Wysłano powitanie',
  welcome_received: 'Odebrano powitanie',
  match_found: 'Nowe dopasowanie',
  needs_intent: 'Czeka na intencję',
};

const KIND_COLOR_CLASS = {
  match_found: 'color-base-90',
  declaration_created: 'color-accent-brand',
  declaration_updated: 'color-accent-brand',
  welcome_sent: 'color-accent-brand',
  welcome_received: 'color-accent-brand',
  needs_intent: 'color-accent-warning',
};

function HeaderRow({ event }) {
  const kindColor = KIND_COLOR_CLASS[event.type] || 'color-base-60';
  return (
    <div class="flex items-baseline gap-2 flex-wrap" style={{ justifyContent: 'space-between' }}>
      <span
        class={`fs-xs ${kindColor}`}
        style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
      >
        {KIND_LABELS[event.type] || event.type}
      </span>
      <span class="fs-xs color-base-60">{timeAgo(event.at)}</span>
    </div>
  );
}

function MeetupRow({ event }) {
  if (!event.meetup) return null;
  const payload = event.payload || {};
  let pill = null;
  if (event.type === 'rsvp_created' || event.type === 'needs_intent') {
    const variant = payload.status === 'going' ? 'success' : 'outline';
    pill = (
      <span style={pillStyle(variant)}>
        ✓ {payload.status === 'going' ? 'Idę' : 'Interesuje mnie'}
      </span>
    );
  } else if (event.type === 'declaration_created' || event.type === 'declaration_updated') {
    pill = <span style={pillStyle('magenta')}>{intentLabel(payload.intent)}</span>;
  }
  return (
    <Fragment>
      <div class="flex items-baseline gap-2 flex-wrap mt-1" style={{ justifyContent: 'space-between' }}>
        <h3 class="fs-l" style={{ margin: 0, fontWeight: 700 }}>
          <a
            href={`/meetups/${event.meetup.slug}`}
            class="c-link"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {event.meetup.name}
          </a>
        </h3>
        {pill}
      </div>
      <p class="fs-s color-base-70" style={{ margin: '2px 0 0' }}>
        📅 {shortDate(event.meetup.start_at)}
        {event.meetup.venue_name && ` · 📍 ${event.meetup.venue_name}`}
      </p>
    </Fragment>
  );
}

function MatchFoundBody({ event }) {
  const payload = event.payload || {};
  const joiners = payload.joiners || [];
  const declarations = payload.declarations || [];
  const slug = event.meetup && event.meetup.slug;
  if ((payload.count || 0) === 1 && declarations[0] && joiners[0]) {
    const jp = joiners[0];
    const dec = declarations[0];
    return (
      <div class="flex gap-4 items-start flex-wrap mt-3">
        <a
          href={`/m/${slug}/${jp.id}`}
          class="c-link"
          style={{ flex: '0 0 80px', display: 'block' }}
        >
          {jp.photo_url ? (
            <img
              src={jp.photo_url}
              alt=""
              style={{
                display: 'block',
                width: '80px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '6px',
              }}
            />
          ) : (
            <div
              style={{
                width: '80px',
                height: '100px',
                background: 'var(--base-20, #e5e7eb)',
                borderRadius: '6px',
              }}
            />
          )}
        </a>
        <div class="flex-1" style={{ minWidth: '200px' }}>
          <div class="flex gap-2 flex-wrap mb-2">
            <span style={pillStyle('solid')}>{identityLabel(jp.identity_type)}</span>
            {jp.city_name && <span style={pillStyle('outline')}>📍 {jp.city_name}</span>}
            <span style={pillStyle('magenta')}>{intentLabel(dec.intent_level)}</span>
          </div>
          {dec.meetup_note ? (
            <p class="fs-s color-base-80" style={{ fontStyle: 'italic', margin: 0 }}>
              "{dec.meetup_note}"
            </p>
          ) : (
            jp.bio && (
              <p class="fs-s color-base-70" style={{ margin: 0 }}>
                {jp.bio}
              </p>
            )
          )}
        </div>
        <a href={`/m/${slug}/${jp.id}`} class="c-btn c-btn--primary c-btn--s">
          Zobacz profil →
        </a>
      </div>
    );
  }
  return (
    <Fragment>
      <p class="fs-s color-base-70 mt-2">
        {payload.count} nowych dopasowań
      </p>
      {joiners.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 160px)',
            gap: '10px',
            marginTop: '12px',
          }}
        >
          {joiners.map((jp) => (
            <a
              key={jp.id}
              href={`/m/${slug}/${jp.id}`}
              class="c-link"
              style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
            >
              <div
                class="crayons-card"
                style={{ overflow: 'hidden', border: '1px solid var(--card-border, #e5e5e5)' }}
              >
                {jp.photo_url ? (
                  <img
                    src={jp.photo_url}
                    alt=""
                    style={{ display: 'block', width: '100%', height: '140px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{ width: '100%', height: '140px', background: 'var(--base-20, #e5e7eb)' }}
                  />
                )}
                <div style={{ padding: '8px 10px' }}>
                  <p class="fs-xs" style={{ margin: 0, fontWeight: 600 }}>
                    {identityLabel(jp.identity_type)}
                  </p>
                  {jp.city_name && (
                    <p class="fs-xs color-base-60" style={{ margin: '2px 0 0' }}>
                      📍 {jp.city_name}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </Fragment>
  );
}

function NeedsIntentBody({ event }) {
  if (!event.meetup) return null;
  return (
    <div class="flex items-center gap-3 flex-wrap mt-2" style={{ justifyContent: 'space-between' }}>
      <p
        class="fs-s color-base-70"
        style={{ margin: 0, flex: '1 1 auto', minWidth: '200px' }}
      >
        Uzupełnij intencję, żeby pojawić się w dopasowaniach.
      </p>
      <a
        href={`/meetups/${event.meetup.slug}?declare=1`}
        class="c-btn c-btn--primary c-btn--s"
        data-declaration-modal-trigger="true"
        data-meetup-slug={event.meetup.slug}
        data-no-instant="true"
      >
        Dodaj intencję
      </a>
    </div>
  );
}

function WelcomeBody({ event }) {
  const label = event.type === 'welcome_sent' ? 'Wysłałeś powitanie' : 'Otrzymałeś powitanie';
  return (
    <p class="fs-s color-base-70 mt-1">💌 {label}</p>
  );
}

export const TimelineEvent = ({ event }) => {
  const needsIntentStyle =
    event.type === 'needs_intent'
      ? 'border-style: dashed; border-color: var(--accent-warning, #d97706); background: rgba(217,119,6,0.04);'
      : '';
  return (
    <div class="crayons-card" style={`padding: 16px; ${needsIntentStyle}`}>
      <HeaderRow event={event} />
      <MeetupRow event={event} />
      {event.type === 'match_found' && <MatchFoundBody event={event} />}
      {event.type === 'needs_intent' && <NeedsIntentBody event={event} />}
      {(event.type === 'welcome_sent' || event.type === 'welcome_received') && (
        <WelcomeBody event={event} />
      )}
    </div>
  );
};

TimelineEvent.propTypes = {
  event: PropTypes.object.isRequired,
};
