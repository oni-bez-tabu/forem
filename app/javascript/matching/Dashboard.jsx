// Activity feed dla `/matching`. Profile header jest SSR
// (matching/_profile_header.html.erb). Tu renderujemy tylko listę
// timeline + interleavowanych recommendations. Loading state = skeleton
// cards (shimmer), nie spinner.
import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import PropTypes from 'prop-types';
import { dashboardApi } from './dashboardApi';
import { TimelineEvent } from './TimelineEvent';
import { TimelineItem } from './TimelineItem';
import { RecommendationCard } from './RecommendationCard';

const RECOMMENDATION_EVERY = 3;

function interleave(events, recommendations) {
  const result = [];
  let recIdx = 0;
  events.forEach((event, idx) => {
    result.push({ kind: 'event', item: event, key: `e-${event.type}-${event.at}-${idx}` });
    if ((idx + 1) % RECOMMENDATION_EVERY === 0 && recIdx < recommendations.length) {
      const rec = recommendations[recIdx];
      result.push({ kind: 'rec', item: rec, key: `r-${rec.meetup.slug}` });
      recIdx += 1;
    }
  });
  while (recIdx < recommendations.length) {
    const rec = recommendations[recIdx];
    result.push({ kind: 'rec', item: rec, key: `r-${rec.meetup.slug}-tail` });
    recIdx += 1;
  }
  return result;
}

const STATE = { LOADING: 'loading', READY: 'ready', ERROR: 'error' };

function SkeletonRow({ tall, dotColor }) {
  return (
    <li
      style={{
        position: 'relative',
        padding: '0 0 16px 28px',
        listStyle: 'none',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '8px',
          top: '18px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: dotColor,
          boxShadow: '0 0 0 3px var(--card-bg, #fff)',
          opacity: 0.6,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '12px',
          top: '28px',
          bottom: '-4px',
          width: '2px',
          background: 'var(--card-border, #e5e5e5)',
        }}
      />
      <div class="crayons-card" style={{ padding: '16px' }}>
        <div
          class="js-skeleton-shimmer"
          style={{
            height: '10px',
            width: '38%',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        />
        <div
          class="js-skeleton-shimmer"
          style={{
            height: '14px',
            width: '70%',
            borderRadius: '5px',
            marginBottom: tall ? '12px' : '8px',
          }}
        />
        <div
          class="js-skeleton-shimmer"
          style={{
            height: '10px',
            width: '50%',
            borderRadius: '4px',
            marginBottom: tall ? '14px' : 0,
          }}
        />
        {tall && (
          <div
            class="js-skeleton-shimmer"
            style={{
              height: '100px',
              width: '100%',
              borderRadius: '8px',
            }}
          />
        )}
      </div>
    </li>
  );
}

function ActivityHeading() {
  return (
    <div
      class="flex items-baseline flex-wrap"
      style={{ justifyContent: 'space-between', marginBottom: '12px' }}
    >
      <h2 class="crayons-subtitle-1" style={{ margin: 0 }}>
        Ostatnia aktywność
      </h2>
      <span class="fs-xs color-base-60">
        Dopasowania, deklaracje i zapisy — w kolejności jak się działy
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <Fragment>
      <style>{`
        @keyframes matchingSkeletonShimmer {
          0%   { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        .js-skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(0,0,0,0.05) 0%,
            rgba(0,0,0,0.10) 50%,
            rgba(0,0,0,0.05) 100%
          );
          background-size: 200px 100%;
          background-repeat: no-repeat;
          animation: matchingSkeletonShimmer 1.4s ease-in-out infinite;
        }
      `}</style>
      <ActivityHeading />
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <SkeletonRow tall dotColor="#171717" />
        <SkeletonRow dotColor="#a91f69" />
        <SkeletonRow dotColor="#9ca3af" />
        <SkeletonRow dotColor="#6366f1" />
      </ol>
    </Fragment>
  );
}

export const Dashboard = ({ onboardingUrl }) => {
  const [stage, setStage] = useState(STATE.LOADING);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    dashboardApi.show().then(({ ok, payload }) => {
      if (cancelled) return;
      if (!ok || !payload) {
        setStage(STATE.ERROR);
        return;
      }
      setData(payload);
      setStage(STATE.READY);
    });
    return () => { cancelled = true; };
  }, []);

  if (stage === STATE.LOADING) return <Skeleton />;

  if (stage === STATE.ERROR) {
    return (
      <div class="crayons-card" style={{ padding: '32px', textAlign: 'center' }}>
        <p class="color-accent-danger">
          Nie udało się załadować aktywności. Spróbuj odświeżyć stronę.
        </p>
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div class="crayons-card" style={{ padding: '32px', textAlign: 'center' }}>
        <p class="fs-base" style={{ marginBottom: '16px' }}>
          Nie masz jeszcze profilu Matching.
        </p>
        <a href={onboardingUrl} class="c-btn c-btn--primary">
          Stwórz profil
        </a>
      </div>
    );
  }

  // Server zwraca timeline=null gdy profile nie jest visible_to_others.
  // Moderation status pokazujemy w SSR notice, więc tu po prostu nic.
  if (data.timeline === null) return null;

  const items = interleave(data.timeline || [], data.recommendations || []);

  if (items.length === 0) {
    return (
      <div class="crayons-card" style={{ padding: '24px', textAlign: 'center' }}>
        <h2 class="crayons-subtitle mb-2">Tu się jeszcze nic nie dzieje</h2>
        <p class="fs-s color-base-70">
          RSVP na wydarzeniu i zadeklaruj intencję, żeby zobaczyć wpisy tutaj.
        </p>
        <div class="mt-3">
          <a href="/meetups" class="c-btn c-btn--primary">
            Przeglądaj wydarzenia
          </a>
        </div>
      </div>
    );
  }

  return (
    <Fragment>
      <ActivityHeading />
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, position: 'relative' }}>
        {items.map((entry, idx) => {
          const isLast = idx === items.length - 1;
          const dotType = entry.kind === 'event' ? entry.item.type : 'recommendation';
          return (
            <TimelineItem key={entry.key} dotType={dotType} isLast={isLast}>
              {entry.kind === 'event' ? (
                <TimelineEvent event={entry.item} />
              ) : (
                <RecommendationCard recommendation={entry.item} />
              )}
            </TimelineItem>
          );
        })}
      </ol>
    </Fragment>
  );
};

Dashboard.propTypes = {
  onboardingUrl: PropTypes.string.isRequired,
};
