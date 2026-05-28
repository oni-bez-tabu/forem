// E6 profile creation/edit form jako pełny Preact widget. Wewnątrz:
// PhotoUploader (file input + preview), IdentityChips (4 chips), CityAuto-
// complete (z Fazy 2), BioField (textarea + counter). On submit POST/PATCH
// do /api/matching/profile, na sukces JS nawiguje na success screen
// (pełen reload — user kończy onboarding i zaczyna patrzeć na coś innego).
import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import PropTypes from 'prop-types';
import { profilesApi } from './profilesApi';
import { CityAutocomplete } from './CityAutocomplete';
import { showToast } from './toast';

const BIO_MAX = 200;

const IDENTITY_OPTIONS = [
  { value: 'woman', label: 'Kobieta' },
  { value: 'man', label: 'Mężczyzna' },
  { value: 'couple', label: 'Para' },
  { value: 'non_binary', label: 'Osoba niebinarna' },
];

function chipStyle(selected) {
  const base =
    'display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 100px; font-size: 14px; font-weight: 600; cursor: pointer; line-height: 1.2; transition: all 120ms ease;';
  return selected
    ? `${base} background: var(--accent-brand, #6366f1); color: #fff; border: 1px solid var(--accent-brand, #6366f1);`
    : `${base} background: transparent; border: 1px solid var(--card-border, #e5e5e5); color: var(--base-90, #171717);`;
}

const PhotoUploader = ({ photoUrl, file, onSelect }) => {
  const previewSrc = file ? URL.createObjectURL(file) : photoUrl;
  return (
    <div class="flex items-start" style={{ gap: '16px', flexWrap: 'wrap' }}>
      <label
        style={{
          cursor: 'pointer',
          flex: '0 0 140px',
          width: '140px',
          aspectRatio: '4 / 5',
          borderRadius: '12px',
          border: '2px dashed rgba(99,102,241,0.4)',
          background: 'rgba(99,102,241,0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--accent-brand, #6366f1)',
          textAlign: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Fragment>
            <span style={{ fontSize: '28px', lineHeight: 1 }}>+</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Dodaj zdjęcie</span>
          </Fragment>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onSelect(e.target.files && e.target.files[0])}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: '1px',
            height: '1px',
          }}
        />
      </label>
      <div class="flex flex-col flex-1" style={{ gap: '8px', minWidth: '220px' }}>
        <p
          style={{
            margin: 0,
            color: 'rgb(var(--grey-600, 107 114 128))',
            fontSize: '13px',
            lineHeight: 1.55,
          }}
        >
          Pojawi się tylko przed osobami, z którymi masz wzajemne dopasowanie. Nie musi pokazywać
          twarzy — może być sylwetka, plecy, cokolwiek czujesz, że cię reprezentuje.
        </p>
        {(file || photoUrl) && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            style={{
              background: 'none',
              border: 0,
              padding: 0,
              color: 'var(--accent-brand, #6366f1)',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            Zmień zdjęcie
          </button>
        )}
      </div>
    </div>
  );
};

const IdentityChips = ({ value, onChange }) => (
  <div class="js-identity-chip-group flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
    {IDENTITY_OPTIONS.map((opt) => {
      const selected = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={chipStyle(selected)}
        >
          {selected && <span style={{ fontSize: '12px', lineHeight: 1 }}>✓</span>}
          {opt.label}
        </button>
      );
    })}
  </div>
);

const BioField = ({ value, onChange }) => (
  <Fragment>
    <textarea
      id="matching-bio"
      class="crayons-textfield"
      rows={4}
      maxLength={BIO_MAX}
      placeholder="Krótko: czego ludzie powinni się o tobie spodziewać"
      value={value}
      onInput={(e) => onChange(e.target.value)}
    />
    <div class="flex" style={{ justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
      <span style={{ margin: 0, color: 'rgb(var(--grey-600, 107 114 128))', fontSize: '13px' }}>
        Bio jest globalne. Na wydarzeniu możesz dodać dodatkowy kontekst.
      </span>
      <span
        style={{
          fontSize: '12px',
          color: 'rgb(var(--grey-600, 107 114 128))',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value.length}/{BIO_MAX}
      </span>
    </div>
  </Fragment>
);

export const ProfileForm = ({ mode, successUrl, initialProfile }) => {
  const [photoFile, setPhotoFile] = useState(null);
  const [identityType, setIdentityType] = useState(
    (initialProfile && initialProfile.identity_type) || 'woman',
  );
  const [cityId, setCityId] = useState(
    initialProfile && initialProfile.city ? initialProfile.city.id : null,
  );
  const [cityName, setCityName] = useState(
    initialProfile && initialProfile.city ? initialProfile.city.name : '',
  );
  const [bio, setBio] = useState((initialProfile && initialProfile.bio) || '');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErrors(null);
    if (mode === 'create' && !photoFile) {
      setErrors(['Wybierz zdjęcie']);
      return;
    }
    if (!cityId) {
      setErrors(['Wybierz miasto']);
      return;
    }
    setSubmitting(true);
    const payload = { photoFile, identityType, cityId, bio };
    const fn = mode === 'create' ? profilesApi.create : profilesApi.update;
    const { ok, payload: response } = await fn(payload);
    if (ok) {
      if (mode === 'create') {
        window.location.href = successUrl;
      } else {
        setSubmitting(false);
        showToast('Profil zapisany', 'success');
      }
    } else {
      setSubmitting(false);
      setErrors([(response && response.error) || 'Wystąpił błąd zapisu']);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="flex flex-col" style={{ gap: '24px' }}>
      {errors && (
        <div role="alert" class="crayons-notice crayons-notice--danger" style={{ padding: '12px 16px' }}>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div class="flex flex-col" style={{ gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 700 }}>
          Zdjęcie <span style={{ color: 'rgb(169,31,105)' }}>*</span>
        </label>
        <PhotoUploader
          photoUrl={initialProfile && initialProfile.photo_url}
          file={photoFile}
          onSelect={setPhotoFile}
        />
      </div>

      <div class="flex flex-col" style={{ gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 700 }}>
          Kim jesteś? <span style={{ color: 'rgb(169,31,105)' }}>*</span>
        </label>
        <IdentityChips value={identityType} onChange={setIdentityType} />
        <p style={{ margin: 0, color: 'rgb(var(--grey-600, 107 114 128))', fontSize: '13px', lineHeight: 1.55 }}>
          Możesz to zmienić w każdej chwili. Dla par: zakładacie wspólne konto Matching.
        </p>
      </div>

      <div class="flex flex-col" style={{ gap: '8px' }}>
        <label for="matching-city" style={{ fontSize: '14px', fontWeight: 700 }}>
          Miasto <span style={{ color: 'rgb(169,31,105)' }}>*</span>
        </label>
        <CityAutocomplete
          inputId="matching-city"
          initialValue={cityName}
          initialCityId={cityId}
          placeholder="Zacznij pisać nazwę miasta…"
          onSelect={(city) => {
            setCityId(city ? city.id : null);
            if (city) setCityName(city.name);
          }}
        />
        <p style={{ margin: 0, color: 'rgb(var(--grey-600, 107 114 128))', fontSize: '13px', lineHeight: 1.55 }}>
          Wybierz z polskich miast — albo "🌍 Wszędzie", jeśli nie chcesz ograniczać do jednego miasta.
        </p>
      </div>

      <div class="flex flex-col" style={{ gap: '8px' }}>
        <label for="matching-bio" style={{ fontSize: '14px', fontWeight: 700 }}>O tobie</label>
        <BioField value={bio} onChange={setBio} />
      </div>

      <div class="flex" style={{ gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
        <button
          type="submit"
          class="c-btn c-btn--primary"
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: 700,
            minHeight: '48px',
            minWidth: '200px',
          }}
          disabled={submitting}
        >
          {submitting ? '…' : mode === 'create' ? 'Zapisz profil' : 'Zapisz zmiany'}
        </button>
      </div>
    </form>
  );
};

ProfileForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  successUrl: PropTypes.string,
  initialProfile: PropTypes.object,
};
