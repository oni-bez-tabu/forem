// Klikalny prototyp — jeden ekran na pełen ekran, router po hash.
// Wszystkie screens.jsx / extras.jsx widzą `onNav(id)`, więc tu po prostu
// mapujemy id → komponent. Pomocniczy floating panel do skoków + back.

const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

/* ============================================================
   Mapa: id ekranu → render
   ============================================================ */
const SCREEN_LIST = [
  { group: '📅 Events',     id: 'E1',                  label: 'E1 · Kalendarium · P1 (bez Matching)',         render: (nav) => <E1_Calendar persona="P1" onNav={nav}/> },
  { group: '📅 Events',     id: 'E2',                  label: 'E2 · Event hub · P1',                          render: (nav) => <E2_EventHub persona="P1" onNav={nav}/> },
  { group: '📅 Events',     id: 'E4',                  label: 'E4 · Event hub · P2 Interesuje mnie',          render: (nav) => <E2_EventHub persona="P2" rsvp="interested" onNav={nav}/> },

  { group: '✨ Onboarding',  id: 'E5',                  label: 'E5 · Onboarding intro',                        render: (nav) => <E5_Intro onNav={nav}/> },
  { group: '✨ Onboarding',  id: 'E6',                  label: 'E6 · Formularz profilu',                       render: (nav) => <E6_Form onNav={nav}/> },
  { group: '✨ Onboarding',  id: 'E7',                  label: 'E7 · Success',                                 render: (nav) => <E7_Success onNav={nav}/> },

  { group: '💬 Matching',   id: 'E8',                  label: 'E8 · Mój profil Matching · timeline',          render: (nav) => <E8_Profile onNav={nav}/> },
  { group: '💬 Matching',   id: 'E10',                 label: 'E10 · Deklaracja intencji (modal)',            render: (nav) => <E10_Intent onNav={nav}/> },
  { group: '💬 Matching',   id: 'E15',                 label: 'E15 · Profil matcha',                          render: (nav) => <E15_MatchProfile onNav={nav}/> },

  { group: '✉ Wiadomość',  id: 'E18-para',            label: 'E18 · Powitalna · compose (para)',             render: (nav) => <E18_HelloMessage stage="compose" identity="para"    onNav={nav}/> },
  { group: '✉ Wiadomość',  id: 'E18-sending',         label: 'E18b · Wysyłam',                               render: (nav) => <E18_HelloMessage stage="sending" identity="kobieta" onNav={nav}/> },
  { group: '✉ Wiadomość',  id: 'E18-success',         label: 'E18c · Wysłane',                               render: (nav) => <E18_HelloMessage stage="success" identity="kobieta" onNav={nav}/> },

  { group: '⚙ Ustawienia', id: 'NT-settings-profil',  label: 'Ustawienia · Profil (P3)',                     render: (nav) => <NT_Settings activeTab="profil" persona="P3" onNav={nav}/> },
  { group: '⚙ Ustawienia', id: 'NT-settings-matching',label: 'Ustawienia · ✨ Matching',                     render: (nav) => <NT_Settings activeTab="matching" persona="P3" onNav={nav}/> },

  { group: '🪧 Stany',      id: 'E16',                 label: 'E16 · Empty events',                           render: (nav) => <E16_EmptyEvents onNav={nav}/> },
];

const SCREEN_MAP = Object.fromEntries(SCREEN_LIST.map(s => [s.id, s]));

// Aliasy / przekierowania — kilka miejsc nawiguje do zakładek ustawień których
// nie chcemy mockować osobno, kierujemy na profil.
const ALIASES = {
  // Zakładki ustawień których nie mockujemy osobno → na profil.
  'NT-settings-konto':            'NT-settings-profil',
  'NT-settings-personalizacja':   'NT-settings-profil',
  'NT-settings-powiadomienia':    'NT-settings-profil',
  'NT-settings-bezpieczenstwo':   'NT-settings-profil',
  'NT-settings-organizacje':      'NT-settings-profil',
  'NT-settings-rozszerzenia':     'NT-settings-profil',
  'NT-settings-profil-P1':        'NT-settings-profil',
  // Ekrany usunięte z canvasa — kierujemy na najbliższy odpowiednik.
  'E1-p3':                        'E1',
  'E3':                           'E4',      // P3 event hub → najbliższy hub (P2 Interested)
  'E9':                           'E6',      // edycja profilu → formularz
  'E11':                          'E4',      // lista matchów inline → hub
  'E12':                          'E4',
  'E13':                          'E4',
  'E14':                          'E8',      // empty matches → profil
  'E17':                          'E1',
  'E18':                          'E18-para',
  // Stary canvas używał osobnych „live"/badge demo — w prototypie wrzucamy
  // na sensowne ekrany docelowe.
  'NT-badge-P3':                  'E1',
  'NT-badge-P2':                  'E4',
  'NT-avatar-menu-P3':            'E1',
  'NT-avatar-menu-P1':            'E1',
};

const DEFAULT_SCREEN = 'E1';

/* ============================================================
   useHashRoute — czyta/zapisuje #ekran w URL i pamięta stos historii
   ============================================================ */
function useHashRoute() {
  const readHash = () => {
    const raw = (location.hash || '').replace(/^#\/?/, '').trim();
    const id = ALIASES[raw] || raw;
    return SCREEN_MAP[id] ? id : DEFAULT_SCREEN;
  };
  const [current, setCurrent] = useStateP(readHash);
  const stackRef = useRefP([readHash()]);

  useEffectP(() => {
    const h = () => {
      const id = readHash();
      setCurrent(id);
      // Jeśli przyszliśmy back/forward przeglądarki — wyrównaj stos
      const s = stackRef.current;
      if (s[s.length - 1] !== id) s.push(id);
    };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  const nav = (raw) => {
    const id = ALIASES[raw] || raw;
    if (!SCREEN_MAP[id]) {
      console.warn('[prototype] nieznany ekran:', raw);
      return;
    }
    if (id === current) return;
    stackRef.current.push(id);
    location.hash = '#' + id;
  };
  const back = () => {
    const s = stackRef.current;
    if (s.length > 1) {
      s.pop();
      const prev = s[s.length - 1];
      location.hash = '#' + prev;
    } else {
      history.back();
    }
  };

  return { current, nav, back, stack: stackRef.current };
}

/* ============================================================
   FlowBar — floating dolny pasek: ← wstecz · breadcrumb · selektor
   ============================================================ */
const FlowBar = ({ current, onNav, onBack, stack }) => {
  const [open, setOpen] = useStateP(false);
  const groups = {};
  SCREEN_LIST.forEach(s => { (groups[s.group] = groups[s.group] || []).push(s); });
  const curMeta = SCREEN_MAP[current];

  return (
    <>
      <div className="proto-bar">
        <button className="proto-bar-btn" onClick={onBack} title="Cofnij" disabled={stack.length < 2}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12L6 8l4-4"/></svg>
        </button>
        <button className="proto-bar-btn" onClick={() => { stack.length = 0; stack.push(DEFAULT_SCREEN); location.hash = '#' + DEFAULT_SCREEN; }} title="Start">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8l6-6 6 6M4 7v6h8V7"/></svg>
        </button>
        <div className="proto-bar-sep"/>
        <button className="proto-bar-pick" onClick={() => setOpen(o => !o)}>
          <span className="proto-bar-id">{current}</span>
          <span className="proto-bar-label">{curMeta ? curMeta.label.replace(/^.+? · /, '') : ''}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d={open ? 'M2 6l3-3 3 3' : 'M2 4l3 3 3-3'}/></svg>
        </button>
      </div>

      {open && (
        <div className="proto-picker-backdrop" onClick={() => setOpen(false)}>
          <div className="proto-picker" onClick={e => e.stopPropagation()}>
            <div className="proto-picker-head">
              <div>
                <div className="proto-picker-title">Wszystkie ekrany</div>
                <div className="proto-picker-sub">{SCREEN_LIST.length} ekranów · kliknij żeby przejść</div>
              </div>
              <button className="proto-picker-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="proto-picker-body">
              {Object.entries(groups).map(([g, items]) => (
                <div key={g} className="proto-picker-group">
                  <div className="proto-picker-grouptitle">{g}</div>
                  <div className="proto-picker-list">
                    {items.map(s => (
                      <button key={s.id}
                              className={'proto-picker-item' + (s.id === current ? ' active' : '')}
                              onClick={() => { onNav(s.id); setOpen(false); }}>
                        <span className="ppi-id">{s.id}</span>
                        <span className="ppi-label">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ============================================================
   App
   ============================================================ */
const PrototypeApp = () => {
  const { current, nav, back, stack } = useHashRoute();
  const meta = SCREEN_MAP[current] || SCREEN_MAP[DEFAULT_SCREEN];

  // Skróty klawiszowe: Alt+← cofnij, Alt+→ następny w liście
  useEffectP(() => {
    const onKey = (e) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); back(); }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const i = SCREEN_LIST.findIndex(s => s.id === current);
        const next = SCREEN_LIST[(i + 1) % SCREEN_LIST.length];
        nav(next.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current]);

  return (
    <div className="proto-shell">
      <div key={current} className="proto-screen">
        {meta.render(nav)}
      </div>
      <FlowBar current={current} onNav={nav} onBack={back} stack={stack}/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<PrototypeApp/>);
