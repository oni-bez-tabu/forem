// Pełny SPA dashboard `/matching`. Fetch /api/matching/dashboard, renderuje
// profile header + interleavowaną listę timeline events i rekomendacji
// (rekomendacja co 5 wpisów, tail spillover na końcu — żeby max 3 rec
// kart wcisnąć w timeline gdy ona jest krótsza niż 15).
import { h, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import PropTypes from 'prop-types';
import { dashboardApi } from './dashboardApi';
import { ProfileHeader } from './ProfileHeader';
import { TimelineEvent } from './TimelineEvent';
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
  // Spill remaining recommendations at the end.
  while (recIdx < recommendations.length) {
    const rec = recommendations[recIdx];
    result.push({ kind: 'rec', item: rec, key: `r-${rec.meetup.slug}-tail` });
    recIdx += 1;
  }
  return result;
}

const STATE = { LOADING: 'loading', READY: 'ready', ERROR: 'error' };

export const Dashboard = ({ onboardingUrl, settingsUrl }) => {
  const [stage, setStage] = useState(STATE.LOADING);
  const [data, setData] = useState(null);

  const fetchData = () => {
    setStage(STATE.LOADING);
    dashboardApi.show().then(({ ok, payload }) => {
      if (!ok || !payload) {
        setStage(STATE.ERROR);
        return;
      }
      setData(payload);
      setStage(STATE.READY);
    });
  };

  useEffect(() => {
    fetchData();
    // Refetch when the page becomes visible again (e.g. user comes back
    // from /meetups/:slug after RSVPing) — keeps the timeline fresh.
    const handleVisible = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, []);

  if (stage === STATE.LOADING) {
    return (
      <div class="crayons-card" style={{ padding: '32px', textAlign: 'center' }}>
        <p class="fs-s color-base-60">Ładuję twój matching…</p>
      </div>
    );
  }

  if (stage === STATE.ERROR) {
    return (
      <div class="crayons-card" style={{ padding: '32px', textAlign: 'center' }}>
        <p class="color-accent-danger">Nie udało się załadować. Spróbuj odświeżyć stronę.</p>
      </div>
    );
  }

  if (!data) return null;

  // Brak profilu → server-redirect powinien był nas zabrać na onboarding;
  // jeśli mimo wszystko tu jesteśmy, daj jasny CTA.
  if (!data.profile) {
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

  const items = data.timeline && data.recommendations
    ? interleave(data.timeline, data.recommendations)
    : [];

  return (
    <Fragment>
      <ProfileHeader profile={data.profile} settingsUrl={settingsUrl} />

      {data.profile.moderation_state === 'pending' && (
        <div class="crayons-notice crayons-notice--info" style={{ marginBottom: '16px' }} role="alert">
          <p>Twój profil czeka na akceptację administratora. Damy znać mailem, gdy zostanie zatwierdzony.</p>
        </div>
      )}

      {data.profile.moderation_state === 'rejected' && (
        <div class="crayons-notice crayons-notice--danger" style={{ marginBottom: '16px' }} role="alert">
          <p>Twój profil został odrzucony. Edytuj w ustawieniach, żeby ponownie zgłosić.</p>
        </div>
      )}

      {!data.profile.is_active && data.profile.moderation_state === 'approved' && (
        <div class="crayons-notice crayons-notice--warning" style={{ marginBottom: '16px' }} role="alert">
          <p>Profil jest dezaktywowany. Reaktywuj w ustawieniach, żeby znów się pokazywać.</p>
        </div>
      )}

      {data.timeline === null ? (
        <div class="crayons-card" style={{ padding: '24px', textAlign: 'center' }}>
          <p class="fs-s color-base-60">
            Twój profil zostanie odblokowany po zatwierdzeniu. Po tym pojawi się tu timeline twoich
            aktywności matching: RSVP, deklaracje, dopasowania, powitania.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div class="crayons-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h2 class="crayons-subtitle mb-2">Tu się jeszcze nic nie dzieje</h2>
          <p class="fs-s color-base-70">
            RSVP na wydarzeniu i zadeklaruj intencję, żeby zobaczyć wpisy tutaj.
          </p>
          <div class="mt-3">
            <a href="/wydarzenia" class="c-btn c-btn--primary">
              Przeglądaj wydarzenia
            </a>
          </div>
        </div>
      ) : (
        <div class="flex flex-col" style={{ gap: '12px' }}>
          {items.map((entry) =>
            entry.kind === 'event' ? (
              <TimelineEvent key={entry.key} event={entry.item} />
            ) : (
              <RecommendationCard key={entry.key} recommendation={entry.item} />
            ),
          )}
        </div>
      )}
    </Fragment>
  );
};

Dashboard.propTypes = {
  onboardingUrl: PropTypes.string.isRequired,
  settingsUrl: PropTypes.string.isRequired,
};
