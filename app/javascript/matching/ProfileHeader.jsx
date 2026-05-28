// E8 profile header card — large portrait + identity/city/status pills +
// italic bio quote + manage profile link. 1:1 z mockup screens.jsx:785-812.
import { h, Fragment } from 'preact';
import PropTypes from 'prop-types';
import { pillStyle, identityLabel } from './theme';

const STATE_PILL = {
  approved_active: { variant: 'brand', label: 'Aktywny' },
  pending: { variant: 'warning', label: 'Oczekuje na akceptację' },
  rejected: { variant: 'danger', label: 'Odrzucony' },
  approved_inactive: { variant: 'outline', label: 'Wstrzymany' },
};

function statePill(profile) {
  if (profile.moderation_state === 'pending') return STATE_PILL.pending;
  if (profile.moderation_state === 'rejected') return STATE_PILL.rejected;
  if (!profile.is_active) return STATE_PILL.approved_inactive;
  return STATE_PILL.approved_active;
}

export const ProfileHeader = ({ profile, settingsUrl }) => {
  const pill = statePill(profile);
  return (
    <div class="crayons-card mb-6" style={{ padding: '28px' }}>
      <div class="flex gap-5 items-start flex-wrap">
        {profile.photo_url && (
          <img
            src={profile.photo_url}
            alt=""
            style={{
              width: '120px',
              height: '150px',
              objectFit: 'cover',
              borderRadius: '8px',
              flex: '0 0 120px',
            }}
          />
        )}
        <div class="flex-1" style={{ minWidth: '240px' }}>
          <div class="flex items-baseline gap-3 flex-wrap mb-2">
            <h1 class="crayons-title" style={{ margin: 0, fontSize: '24px' }}>
              Twój profil Matching
            </h1>
            <span style={pillStyle(pill.variant)}>{pill.label}</span>
          </div>

          <div class="flex gap-2 flex-wrap" style={{ marginBottom: '8px' }}>
            <span style={pillStyle('solid')}>{identityLabel(profile.identity_type)}</span>
            {profile.city && (
              <span style={pillStyle('outline')}>
                📍 {profile.city.name}
              </span>
            )}
          </div>

          {profile.bio && (
            <p
              class="fs-base"
              style={{
                marginTop: '8px',
                fontStyle: 'italic',
                color: 'rgb(var(--grey-800, 31 41 55))',
              }}
            >
              "{profile.bio}"
            </p>
          )}

          {profile.moderation_reason && (
            <p
              class="fs-s color-base-60"
              style={{ marginTop: '8px' }}
            >
              <strong>Powód odrzucenia:</strong> {profile.moderation_reason}
            </p>
          )}

          <p class="fs-xs color-base-60" style={{ marginTop: '8px' }}>
            👁 Twoje zdjęcie widzą tylko osoby pasujące do twojego filtra
          </p>
        </div>
        <a href={settingsUrl} class="c-btn c-btn--secondary c-btn--s">
          ✎ Edytuj
        </a>
      </div>
    </div>
  );
};

ProfileHeader.propTypes = {
  profile: PropTypes.object.isRequired,
  settingsUrl: PropTypes.string,
};
