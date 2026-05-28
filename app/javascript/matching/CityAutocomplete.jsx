// Debounced autocomplete dla City search. Używane w profile form
// (onboarding E6 i settings). Renderuje text input + dropdown z propozycjami
// (City list z /api/cities/search). Callback `onSelect({id, name, slug})`
// wywoływany przy wyborze; parent form decyduje co z tym zrobić (zwykle
// zapisuje do hidden field city_id).
import { h, Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import PropTypes from 'prop-types';
import { citiesApi } from './citiesApi';

const DEBOUNCE_MS = 180;
const MIN_QUERY = 2;

export const CityAutocomplete = ({
  initialValue,
  initialCityId,
  placeholder,
  onSelect,
  inputId,
}) => {
  const [query, setQuery] = useState(initialValue || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [, setCityId] = useState(initialCityId || null);
  const debounceRef = useRef(null);
  const cacheRef = useRef(new Map());
  const wrapperRef = useRef(null);

  // Click outside closes the dropdown.
  useEffect(() => {
    const handle = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const runQuery = (q) => {
    if (cacheRef.current.has(q)) {
      setResults(cacheRef.current.get(q));
      setOpen(true);
      return;
    }
    citiesApi.search(q).then(({ ok, payload }) => {
      if (!ok) return;
      const items = (payload && payload.cities) || [];
      cacheRef.current.set(q, items);
      setResults(items);
      setOpen(items.length > 0);
    });
  };

  const handleInput = (e) => {
    const value = e.target.value;
    setQuery(value);
    setCityId(null); // invalidate selection until user picks again
    onSelect && onSelect(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < MIN_QUERY) {
      setOpen(false);
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => runQuery(value.trim()), DEBOUNCE_MS);
  };

  const handleSelect = (city) => {
    setQuery(city.name);
    setCityId(city.id);
    setOpen(false);
    if (onSelect) onSelect(city);
  };

  const handleFocus = () => {
    if (query.trim().length >= MIN_QUERY && results.length > 0) setOpen(true);
  };

  return (
    <div
      ref={wrapperRef}
      class="js-city-autocomplete"
      style={{ position: 'relative' }}
    >
      <input
        type="text"
        id={inputId}
        class="crayons-textfield"
        placeholder={placeholder}
        autocomplete="off"
        aria-autocomplete="list"
        value={query}
        onInput={handleInput}
        onFocus={handleFocus}
      />
      {open && results.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 30,
            background: 'var(--card-bg, white)',
            border: '1px solid var(--card-border, #e0e0e0)',
            borderRadius: '6px',
            marginTop: '4px',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '4px',
            listStyle: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          {results.map((city) => (
            <li
              key={city.id}
              role="option"
              style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(city);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--card-secondary-bg, #f5f5f5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '';
              }}
            >
              {city.name}
              {city.voivodeship ? ` · ${city.voivodeship}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

CityAutocomplete.propTypes = {
  initialValue: PropTypes.string,
  initialCityId: PropTypes.number,
  placeholder: PropTypes.string,
  onSelect: PropTypes.func,
  inputId: PropTypes.string,
};
