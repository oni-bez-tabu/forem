// nie!tabu Matching + Events — Low-fi wireframe screens
// All 17 screens + variant explorations
// Persona/state context injected via window.__wfCtx (set by app.jsx)

const ctx = () => window.__wfCtx || {};
const get = (k, d) => { const c = ctx(); return c[k] !== undefined ? c[k] : d; };

/* ========= Sketchy primitives ========= */
const Btn = ({ children, variant = 'default', size, onClick, ...rest }) => (
  <button className={`sk-btn ${variant} ${size || ''}`} onClick={onClick} {...rest}>{children}</button>
);
const Pill = ({ children, variant = '' }) => <span className={`sk-pill ${variant}`}>{children}</span>;
const Card = ({ children, style, className = '' }) => (
  <div className={`sk-card ${className}`} style={style}>{children}</div>
);
const Img = ({ w, h, label = 'photo', style }) => (
  <div className="sk-img" style={{ width: w, height: h, ...style }}>{label}</div>
);
const Avatar = ({ size = '' }) => <div className={`sk-avatar ${size}`}></div>;
const StickyNote = ({ children, rotate = -1, style }) => (
  <div className="sticky" style={{ transform: `rotate(${rotate}deg)`, ...style }}>{children}</div>
);

/* ========= nie!tabu Chrome ========= */

/* Header icon button with optional badge */
const HeaderIcon = ({ glyph, badge, active = false, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      position: 'relative',
      width: 34, height: 34,
      border: `2px solid ${active ? 'var(--purple)' : 'var(--rule)'}`,
      borderRadius: '50%',
      background: active ? 'var(--purple-soft)' : 'var(--paper)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      fontSize: 15,
      lineHeight: 1,
      padding: 0,
      color: active ? 'var(--purple)' : 'var(--ink)',
    }}>
    {glyph}
    {badge != null && badge > 0 && (
      <span style={{
        position: 'absolute', top: -4, right: -4,
        minWidth: 18, height: 18,
        padding: '0 4px',
        background: 'var(--magenta)',
        color: 'white',
        borderRadius: 9,
        fontFamily: 'var(--hand)',
        fontSize: 11,
        fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: '1.5px solid var(--paper)',
      }}>{badge > 9 ? '9+' : badge}</span>
    )}
  </button>
);

/* Avatar dropdown menu — shown under main nietabu avatar */
const AvatarMenu = ({ persona = 'P1', goto }) => {
  const hasMatching = persona === 'P2' || persona === 'P3';
  return (
    <div
      className="sk-card"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 320,
        padding: 0,
        zIndex: 50,
        boxShadow: '4px 6px 0 rgba(0,0,0,0.08)',
      }}>
      {/* nietabu identity row */}
      <div style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', borderBottom: '2px solid var(--rule)' }}>
        <Avatar />
        <div className="col flex1">
          <div className="wf-h4">Twoje konto nietabu</div>
          <div className="wf-tiny wf-mute">@kasiabp · nietabu.pl</div>
        </div>
      </div>

      {/* Main profile button */}
      <div className="col" style={{ padding: 8 }}>
        <div className="row gap-2" style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 6 }}>
          <span style={{ width: 20 }}>👤</span>
          <span className="wf-body" style={{ color: 'var(--ink)' }}>Mój profil nietabu</span>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-mute)' }}>→</span>
        </div>

        {/* Matching profile card — only if user has one */}
        {hasMatching && (
          <div
            onClick={() => goto && goto('E8')}
            style={{
              margin: '6px 4px',
              padding: 10,
              border: '2px solid var(--purple)',
              background: 'var(--purple-soft)',
              borderRadius: 6,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              cursor: 'pointer',
            }}>
            <Img w={42} h={42} label="" style={{ flexShrink: 0 }} />
            <div className="col flex1" style={{ minWidth: 0 }}>
              <div className="wf-tiny" style={{ color: 'var(--purple)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Twój profil Matching
              </div>
              <div className="wf-small" style={{ color: 'var(--ink)' }}>
                <strong>Kobieta</strong> · 📍 Warszawa
              </div>
            </div>
            <span style={{ color: 'var(--purple)' }}>→</span>
          </div>
        )}

        {/* If no matching profile — soft suggestion */}
        {!hasMatching && (
          <div
            onClick={() => goto && goto('E5')}
            style={{
              margin: '6px 4px',
              padding: 10,
              border: '2px dashed var(--ink-soft)',
              borderRadius: 6,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              cursor: 'pointer',
            }}>
            <div style={{ width: 42, height: 42, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✨</div>
            <div className="col flex1">
              <div className="wf-small" style={{ color: 'var(--ink)' }}>Załóż profil Matching</div>
              <div className="wf-tiny wf-mute">osobny, prywatny</div>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: 'var(--rule)', margin: '6px 4px' }}></div>

        <div onClick={() => goto && goto('NT-settings-profil-P3')} className="row gap-2" style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 6 }}>
          <span style={{ width: 20 }}>⚙</span>
          <span className="wf-body" style={{ color: 'var(--ink)' }}>Ustawienia</span>
        </div>
        <div className="row gap-2" style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 6 }}>
          <span style={{ width: 20 }}>🌙</span>
          <span className="wf-body" style={{ color: 'var(--ink)' }}>Tryb ciemny</span>
        </div>
        <div className="row gap-2" style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 6 }}>
          <span style={{ width: 20 }}>↩</span>
          <span className="wf-body" style={{ color: 'var(--ink-mute)' }}>Wyloguj</span>
        </div>
      </div>
    </div>
  );
};

const NTHeader = ({ persona, avatarMenuOpen = false, matchingActive = false, goto }) => {
  const p = persona || get('persona', 'P1');
  const hasMatching = p === 'P2' || p === 'P3';
  // Show the icon if user has a matching profile OR is actively in matching onboarding flow
  const showMatchingIcon = hasMatching || matchingActive;
  // P3 has activity in matching, so unread > 0; P2 has fewer; P1 none.
  const matchingUnread = p === 'P3' ? 3 : p === 'P2' ? 1 : 0;
  return (
    <div className="nt-header">
      <div className="nt-wordmark">nie<span className="bang">!</span>tabu</div>
      <input className="nt-search" placeholder="szukaj na nietabu..." readOnly />
      <div className="nt-header-right">
        <Btn size="sm" variant="ghost">utwórz post</Btn>
        <div className="row gap-2">
          <HeaderIcon glyph="🔔" badge={2} title="Powiadomienia" />
          <HeaderIcon glyph="💬" title="Wiadomości" />
          {showMatchingIcon && (
            <HeaderIcon
              glyph="✨"
              badge={matchingUnread}
              active={matchingActive}
              title="Mój Matching — nowe dopasowania i aktywność"
              onClick={() => goto && goto('E8')}
            />
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ cursor: 'pointer', outline: avatarMenuOpen ? '2px solid var(--purple)' : 'none', outlineOffset: 2, borderRadius: '50%' }}>
            <Avatar />
          </div>
          {avatarMenuOpen && <AvatarMenu persona={p} goto={goto} />}
        </div>
      </div>
    </div>
  );
};

const NTLeftRail = ({ active = 'events' }) => {
  const items = [
    { id: 'home', label: 'Strona główna' },
    { id: 'videos', label: 'Filmy' },
    { id: 'podcasts', label: 'Podcasty' },
    { id: 'rooms', label: 'Pokoje' },
    { id: 'tags', label: 'Tagi' },
    { id: 'events', label: 'Wydarzenia', isNew: true },
  ];
  return (
    <aside className="nt-rail">
      {items.map(i => (
        <div key={i.id} className={`item ${active === i.id ? 'active' : ''}`}>
          <span className="glyph"></span>
          <span>{i.label}</span>
          {i.isNew && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--magenta)' }}>NEW</span>}
        </div>
      ))}
      <div className="section-label">Popularne</div>
      <div className="item"><span style={{color:'var(--ink-mute)'}}>#</span>swingerski</div>
      <div className="item"><span style={{color:'var(--ink-mute)'}}>#</span>bdsm</div>
      <div className="item"><span style={{color:'var(--ink-mute)'}}>#</span>edukacja</div>
    </aside>
  );
};

const NTFrame = ({ active = 'events', children, w = 1100, h, avatarMenuOpen = false, matchingActive = false, persona, goto, hideRail = false }) => (
  <div className="nt-chrome" style={{ width: w, minHeight: h, position: 'relative' }}>
    <NTHeader persona={persona} avatarMenuOpen={avatarMenuOpen} matchingActive={matchingActive} goto={goto} />
    <div className="nt-body" style={hideRail ? { gridTemplateColumns: '1fr' } : undefined}>
      {!hideRail && <NTLeftRail active={active} />}
      <main className="nt-main">{children}</main>
    </div>
  </div>
);

/* ========= Sample data ========= */
const SAMPLE_DAYS = [
  {
    label: 'PIĄTEK · 14 czerwca',
    events: [
      { id: 'e1', time: '22:00', end: '04:00', name: 'Heaven · Friday Play', venue: 'Heaven', city: 'Warszawa', going: 12, interested: 7, banner: 'mesh', rsvp: null, linkType: 'internal' },
      { id: 'e2', time: '21:00', end: '02:00', name: 'Otwarty Pokój — wieczór rozmów', venue: 'Klub Sukces', city: 'Kraków', going: 4, interested: 3, banner: 'uploaded', rsvp: null, linkType: 'external' },
    ]
  },
  {
    label: 'SOBOTA · 15 czerwca',
    events: [
      { id: 'e3', time: '20:00', end: '03:00', name: 'Czerwony Wieczór · BDSM Beginners', venue: 'Czerwona Kotwica', city: 'Wrocław', going: 22, interested: 14, banner: 'linear', rsvp: 'going', linkType: 'internal' },
      { id: 'e4', time: '19:00', end: '23:00', name: 'Slow Touch Workshop', venue: 'Studio Wellness', city: 'Warszawa', going: 8, interested: 11, banner: 'uploaded', rsvp: 'interested', linkType: 'external' },
      { id: 'e5', time: '23:00', end: '05:00', name: 'After Hours', venue: 'Klub Kruk', city: 'Poznań', going: 0, interested: 2, banner: 'radial', rsvp: null, linkType: 'internal' },
    ]
  },
  {
    label: 'CZWARTEK · 20 czerwca',
    events: [
      { id: 'e6', time: '19:30', end: '22:30', name: 'Krąg kobiet · rozmowa o intymności', venue: 'Przestrzeń Kotłownia', city: 'Łódź', going: 6, interested: 4, banner: 'shapes', rsvp: null, linkType: 'internal' },
    ]
  },
];

/* ========= EventCard variants ========= */
const EventCard = ({ ev, variant = 'a' }) => {
  const counts = (ev.going + ev.interested <= 2)
    ? <em>Bądź pierwszą osobą z nietabu</em>
    : <>{ev.going} z nietabu idzie · {ev.interested} zainteresowanych</>;
  const Banner = (
    <div className={`${ev.banner === 'uploaded' ? 'up-banner' : `gen-banner gv-${ev.banner}`}`}
         style={{ width: variant === 'c' ? '100%' : 130, height: variant === 'c' ? 80 : 78, flexShrink: 0 }}>
    </div>
  );
  const rsvpBadge = ev.rsvp && (
    <span className="sk-pill active" style={{ position: 'absolute', top: 6, right: 6, fontSize: 11 }}>
      ✓ {ev.rsvp === 'going' ? 'Idziesz' : 'Interesuje cię'}
    </span>
  );
  const TimeBlock = (
    <div style={{ minWidth: 78, textAlign: 'left' }}>
      <div className="wf-h2" style={{ fontSize: 28, color: 'var(--ink)' }}>{ev.time}</div>
      <div className="wf-tiny">do {ev.end}</div>
    </div>
  );

  if (variant === 'b') {
    // Banner-left, vertical content
    return (
      <Card style={{ display: 'flex', gap: 14, padding: 12, position: 'relative' }}>
        <div style={{ position: 'relative' }}>{Banner}{rsvpBadge}</div>
        <div className="col flex1">
          <div className="row gap-2"><span className="wf-h4" style={{fontSize:13, color:'var(--magenta)'}}>{ev.time}–{ev.end}</span></div>
          <div className="wf-h3">{ev.name}</div>
          <div className="wf-small">{ev.venue} · {ev.city}</div>
          <div className="wf-small wf-mute mt-1">{counts}</div>
        </div>
      </Card>
    );
  }
  if (variant === 'c') {
    // Stacked vertical (banner top)
    return (
      <Card style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'relative' }}>{Banner}{rsvpBadge}</div>
        <div style={{ padding: 12 }}>
          <div className="row between">
            <div className="wf-h3">{ev.name}</div>
            <div className="wf-h4" style={{ color: 'var(--magenta)' }}>{ev.time}</div>
          </div>
          <div className="wf-small">{ev.venue} · {ev.city}</div>
          <div className="wf-small wf-mute mt-1">{counts}</div>
        </div>
      </Card>
    );
  }
  // variant A — default: time | content | banner
  return (
    <Card style={{ display: 'flex', alignItems: 'stretch', gap: 14, padding: 12, position: 'relative' }}>
      {TimeBlock}
      <div className="col flex1" style={{ borderLeft: '1.5px dashed var(--ink-faint)', paddingLeft: 14 }}>
        <div className="wf-h3">{ev.name}</div>
        <div className="wf-small mt-1">{ev.venue} · {ev.city}</div>
        <div className="wf-small wf-mute mt-1">{counts}</div>
      </div>
      <div style={{ position: 'relative' }}>{Banner}{rsvpBadge}</div>
    </Card>
  );
};

/* ========= Common UI building blocks ========= */
const MatchingBanner = ({ onClick }) => (
  <Card style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--purple-soft)', borderColor: 'var(--purple)' }}>
    <div style={{ fontSize: 28 }}>✨</div>
    <div className="col flex1">
      <div className="wf-h4" style={{ color: 'var(--purple)' }}>Chcesz tu kogoś poznać?</div>
      <div className="wf-small">Załóż profil Matching — odseparowany od twojego konta nietabu.</div>
    </div>
    <Btn variant="accent" onClick={onClick}>Załóż profil Matching →</Btn>
  </Card>
);

const SubmitEventBanner = () => (
  <Card style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderStyle: 'dashed' }}>
    <div style={{ fontSize: 24 }}>＋</div>
    <div className="col flex1">
      <div className="wf-h4">Chcesz, żeby twoje wydarzenie znalazło się na tej liście?</div>
      <div className="wf-small wf-mute">Napisz do nas — dodamy je ręcznie.</div>
    </div>
    <Btn variant="ghost">Napisz do nas →</Btn>
  </Card>
);

/* Share row — udostępnij swój interes w wydarzeniu */
const ShareRow = ({ rsvpState, evName = 'Czerwony Wieczór · BDSM Beginners' }) => {
  const [copied, setCopied] = React.useState(false);
  const [postedOnNT, setPostedOnNT] = React.useState(false);

  const stance =
    rsvpState === 'going' ? 'idę na'
    : rsvpState === 'interested' ? 'interesuje mnie'
    : 'chcę pójść na';

  const postPreview = rsvpState === 'going'
    ? `Idę na: ${evName} →`
    : rsvpState === 'interested'
    ? `Interesuje mnie: ${evName} →`
    : `Sprawdź: ${evName} →`;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };
  const handleNT = () => {
    setPostedOnNT(true);
    setTimeout(() => setPostedOnNT(false), 2800);
  };

  return (
    <div className="mt-4 sk-box" style={{ padding: 14 }}>
      <div className="row between" style={{ alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div className="wf-h4">Daj znać że {stance} to wydarzenie</div>
        <div className="wf-tiny wf-mute">opcjonalne · pomaga zebrać ludzi</div>
      </div>

      <div className="row gap-3 mt-3" style={{ flexWrap: 'wrap' }}>
        {/* Option 1 — Repost na nietabu */}
        <div className="col gap-1" style={{ flex: '1 1 280px' }}>
          <Btn variant={postedOnNT ? 'accent' : 'default'} onClick={handleNT}>
            {postedOnNT ? '✓ Udostępniono na nietabu' : '↗ Udostępnij na nietabu'}
          </Btn>
          <div className="wf-tiny wf-mute">
            {postedOnNT
              ? 'Post pojawił się na twoim profilu nietabu — znajomi zobaczą'
              : <>Tworzy post na twoim profilu: <em>"{postPreview}"</em></>}
          </div>
        </div>

        {/* Option 2 — Kopiuj link */}
        <div className="col gap-1" style={{ flex: '1 1 240px' }}>
          <Btn variant={copied ? 'accent' : 'default'} onClick={handleCopy}>
            {copied ? '✓ Skopiowano link' : '🔗 Skopiuj link'}
          </Btn>
          <div className="wf-tiny wf-mute">
            {copied
              ? 'Wklej gdziekolwiek — WhatsApp, Signal, mail…'
              : 'nietabu.pl/e/czerwony-wieczor-14-06'}
          </div>
        </div>
      </div>
    </div>
  );
};

const RSVPCount = ({ going, interested, lowFraming }) => {
  if (lowFraming || (going + interested <= 2)) {
    return <div className="wf-small">✷ Bądź pierwszą osobą z nietabu, która zadeklaruje udział</div>;
  }
  return <div className="wf-small wf-mute"><strong style={{color:'var(--ink)'}}>{going} z nietabu</strong> idzie · <strong style={{color:'var(--ink)'}}>{interested}</strong> zainteresowanych <span style={{color:'var(--ink-faint)'}}>ⓘ</span></div>;
};

/* ========= Screens ========= */

/* E1 — Wydarzenia: kalendarium */
const E1_Calendar = ({ goto, miniCal = true, variant = 'default' }) => {
  const persona = get('persona', 'P1');
  const lowCount = get('lowCount', false);
  return (
    <NTFrame active="events" persona={persona} goto={goto}>
      <div>
        <h1 className="wf-h1">Wydarzenia</h1>
        <p className="wf-body">Sprawdź co się dzieje w polskiej scenie i zadeklaruj swoje zainteresowanie</p>
      </div>

      {persona === 'P1' && <div className="mt-4"><MatchingBanner onClick={() => goto && goto('E5')} /></div>}

      <div className="mt-6 col gap-6">
        {SAMPLE_DAYS.map((day, di) => (
          <React.Fragment key={day.label}>
            <div>
              <div className="day-header">{day.label}</div>
              <div className="col gap-3">
                {day.events.map(ev => (
                  <div key={ev.id} onClick={() => goto && goto(ev.rsvp === 'going' ? 'E3' : ev.rsvp === 'interested' ? 'E4' : 'E2', { evId: ev.id })} style={{cursor:'pointer'}}>
                    <EventCard ev={lowCount ? {...ev, going: 0, interested: 1} : ev} variant={variant === 'default' ? 'a' : variant} />
                  </div>
                ))}
              </div>
            </div>
            {di === Math.floor(SAMPLE_DAYS.length / 2) - 1 && <SubmitEventBanner />}
          </React.Fragment>
        ))}
      </div>

      <div className="text-center mt-6">
        <Btn variant="ghost">Pokaż kolejne wydarzenia ↓</Btn>
      </div>
    </NTFrame>
  );
};

/* E2/E3/E4 — Pośredni ekran eventu */
const E2_EventHub = ({ goto, rsvpState = null, personaOverride = null, matchesEmpty = false }) => {
  const persona = personaOverride || get('persona', 'P1');
  const lowCount = get('lowCount', false);
  const linkType = get('linkType', 'internal');
  const bannerKind = get('bannerKind', 'uploaded');
  const heroRatio = get('heroRatio', '21:9');
  const intent = get('intent', null);

  const ev = { name: 'Czerwony Wieczór · BDSM Beginners', venue: 'Czerwona Kotwica', city: 'Wrocław',
    date: 'sobota, 14 czerwca 2026', time: '22:00 – 04:00', going: 22, interested: 14, matchPool: 9 };

  const heroH = heroRatio === '21:9' ? 280 : heroRatio === '16:9' ? 340 : 220; // 3:1 = 220 (wide & short)

  return (
    <NTFrame active="events" persona={persona} goto={goto}>
      <div className="row gap-2"><a className="wf-small" style={{color:'var(--ink-mute)'}}>← Wydarzenia</a></div>

      {/* Hero */}
      <div className="mt-3" style={{ position: 'relative', height: heroH }}>
        <div className={bannerKind === 'uploaded' ? 'up-banner' : `gen-banner gv-mesh`} style={{ position: 'absolute', inset: 0 }}></div>
        <div className="hero-overlay">
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, opacity: 0.9 }}>{ev.date}</div>
          <div style={{ fontFamily: 'var(--hand)', fontSize: 16, opacity: 0.85, marginTop: 2 }}>{ev.time}</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 42, fontWeight: 700, lineHeight: 1, marginTop: 6 }}>{ev.name}</div>
          <div style={{ fontFamily: 'var(--hand)', fontSize: 16, marginTop: 4 }}>{ev.venue} · {ev.city}</div>
        </div>
      </div>

      {/* Meta + pełen opis */}
      <div className="row between mt-4">
        <div className="row gap-3">
          <Avatar />
          <div className="col">
            <div className="wf-tiny wf-mute">Organizator</div>
            <div className="wf-h4">Czerwona Kotwica</div>
          </div>
        </div>
        <div className="col gap-1" style={{ alignItems: 'flex-end' }}>
          {linkType === 'internal'
            ? <Btn variant="primary" size="lg">Zobacz pełen opis na nietabu →</Btn>
            : <Btn variant="primary" size="lg">Zobacz opis u organizatora ↗</Btn>}
          {linkType === 'external' && <div className="wf-tiny">Otworzy się w nowej karcie · czerwonakotwica.pl</div>}
        </div>
      </div>

      {/* RSVP section */}
      <div className="mt-6">
        <div className="wf-h3">Wybierz swój udział</div>
        <div className="row gap-3 mt-3">
          <Btn variant={rsvpState === 'going' ? 'accent' : 'primary'} size="lg">{rsvpState === 'going' ? '✓ Idziesz ▾' : 'Idę'}</Btn>
          <Btn variant={rsvpState === 'interested' ? 'accent' : 'default'} size="lg">{rsvpState === 'interested' ? '✓ Interesuje cię' : 'Interesuje mnie'}</Btn>
          {rsvpState === 'going' && <span className="wf-small" style={{color: 'var(--purple)'}}>Zapisaliśmy że idziesz. Powodzenia 🌙</span>}
        </div>
        <div className="mt-3">
          <RSVPCount going={ev.going} interested={ev.interested} lowFraming={lowCount} />
          <div className="wf-tiny mt-1" style={{ fontStyle: 'italic' }}>Liczby dotyczą tylko deklaracji z platformy. Na evencie mogą być też osoby z innych kanałów.</div>
        </div>
        <ShareRow rsvpState={rsvpState} evName={ev.name} />
      </div>

      {/* Matching section */}
      <div className="mt-6">
        <div className="wf-h3">Matching na tym wydarzeniu</div>
        <div className="mt-3">
          {persona === 'P1' && (
            <Card style={{ padding: 16, display:'flex', flexDirection:'column', gap: 8, background: 'var(--purple-soft)', borderColor:'var(--purple)' }}>
              <div className="wf-body">
                {lowCount
                  ? <em>Bądź pierwszą osobą która zadeklaruje intencję — załóż profil Matching</em>
                  : <>Na tym wydarzeniu <strong>{ev.matchPool} osób z nietabu</strong> szuka kogoś poznać</>}
              </div>
              <div className="wf-small">Załóż profil Matching żeby zobaczyć szczegóły i dołączyć</div>
              <div><Btn variant="accent" onClick={() => goto && goto('E5')}>Załóż profil Matching</Btn></div>
            </Card>
          )}
          {persona === 'P2' && !intent && (
            <Card style={{ padding: 16 }}>
              <div className="wf-body">Możesz zadeklarować swoją intencję i zobaczyć kogo możesz tu poznać</div>
              <div className="row gap-3 mt-3">
                <Btn variant={rsvpState === 'going' ? 'primary' : 'disabled'} onClick={() => rsvpState === 'going' && goto && goto('E10')}>Zadeklaruj intencję</Btn>
                {rsvpState !== 'going' && <span className="wf-small wf-mute">Najpierw zaznacz że idziesz ↑</span>}
              </div>
            </Card>
          )}
          {persona === 'P3' && (
            <div className="col gap-4">
              <Card style={{ padding: 16, borderColor: 'var(--purple)' }}>
                <div className="row between">
                  <div>
                    <div className="wf-small wf-mute">Masz aktywną deklarację:</div>
                    <div className="wf-h4 mt-1">💬 Otwarty na poznanie</div>
                  </div>
                  <Btn variant="ghost" size="sm" onClick={() => goto && goto('E10')}>Zmień deklarację</Btn>
                </div>
              </Card>
              <E11_Embedded goto={goto} empty={matchesEmpty} />
            </div>
          )}
        </div>
      </div>

      {/* Inline E12 for P2 + Interested */}
      {rsvpState === 'interested' && persona === 'P2' && (
        <div className="mt-6">
          <E12_Embedded />
        </div>
      )}
    </NTFrame>
  );
};

const E3_EventHub = ({ goto }) => <E2_EventHub goto={goto} rsvpState="going" />;
const E4_EventHub = ({ goto }) => <E2_EventHub goto={goto} rsvpState="interested" />;

/* E5 — Onboarding intro */
const E5_Intro = ({ goto }) => (
  <NTFrame active="" matchingActive goto={goto}>
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <div className="text-center">
        <div style={{ fontSize: 80, margin: '12px 0' }}>🔒✨</div>
        <h1 className="wf-h1">Poznaj kogoś na wydarzeniu</h1>
        <p className="wf-body mt-3">Matching to osobny profil, który pozwala ci określić kogo chcesz spotkać na konkretnym wydarzeniu — i kto chce spotkać ciebie.</p>
      </div>
      <div className="col gap-3 mt-6">
        {[
          ['🔒 Pełna prywatność', 'Twój profil Matching jest oddzielony od twojego głównego konta nietabu. Nikt nie zobaczy że to ty.'],
          ['📅 Per wydarzenie', 'Każdy event = osobna deklaracja. Możesz być inną osobą na różnych imprezach.'],
          ['💬 Bez nacisku', 'Zdjęcie zobaczy tylko osoba, która sama szuka kogoś takiego jak ty.'],
        ].map(([t,d])=>(
          <div key={t} className="sk-box" style={{ padding: 14 }}>
            <div className="wf-h4">{t}</div>
            <div className="wf-small mt-1">{d}</div>
          </div>
        ))}
      </div>
      <Card style={{ padding: 14, marginTop: 16, background:'var(--purple-soft)', borderColor:'var(--purple)' }}>
        <div className="wf-small" style={{color:'var(--ink)'}}>
          <strong>🔒</strong> Twoje zdjęcie z profilu Matching pojawia się TYLKO przed osobami, które same szukają kogoś takiego jak ty. Inni go nie zobaczą — nawet w listach. Nikt też nie ma jak skojarzyć profilu Matching z twoim głównym kontem na nietabu.
        </div>
      </Card>
      <div className="text-center mt-6 col gap-2">
        <Btn variant="primary" size="lg" onClick={() => goto && goto('E6')}>Załóż profil Matching</Btn>
        <a className="wf-small" style={{color:'var(--ink-mute)', cursor:'pointer'}} onClick={() => goto && goto('E1')}>Może później</a>
      </div>
    </div>
  </NTFrame>
);

/* E6 — Onboarding formularz */
const E6_Form = ({ goto, edit = false }) => (
  <NTFrame active="" matchingActive goto={goto}>
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 className="wf-h1">{edit ? 'Edytuj profil Matching' : 'Twój profil Matching'}</h1>
      <p className="wf-body mt-2">3 pola. Możesz to zmienić w każdej chwili.</p>

      <div className="mt-6 col gap-6">
        {/* Photo */}
        <div>
          <label className="sk-label">Zdjęcie *</label>
          <div className="row gap-3 mt-2">
            <div className="sk-dash" style={{ width: 120, height: 120, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
              <div style={{fontSize:24}}>+</div>
              <div className="wf-tiny">Dodaj zdjęcie</div>
            </div>
            <div className="wf-small flex1">Pojawi się tylko przed osobami z którymi masz wzajemne dopasowanie. Nie musi pokazywać twarzy — może być sylwetka, plecy, cokolwiek czujesz że cię reprezentuje.</div>
          </div>
        </div>

        {/* Identity */}
        <div>
          <label className="sk-label">Kim jesteś? *</label>
          <div className="row gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
            <Pill variant="active">Kobieta</Pill>
            <Pill>Mężczyzna</Pill>
            <Pill>Para</Pill>
            <Pill>Osoba niebinarna</Pill>
          </div>
          <div className="sk-helper mt-2">Możesz to zmienić w każdej chwili. Dla par: zakładacie wspólne konto Matching.</div>
        </div>

        {/* City — searchable, big list */}
        <div>
          <label className="sk-label">Miasto *</label>
          <div className="row gap-2 mt-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="sk-input" style={{ minWidth: 280, color: 'var(--ink)' }}>
              Warszawa <span className="wf-tiny wf-mute">▾</span>
            </div>
            <Pill variant="accent">🌍 lub: Wszędzie / dowolne miasto</Pill>
          </div>
          <div className="sk-helper mt-2">Wybierz z listy polskich miast (Warszawa, Kraków, Wrocław, Poznań, Łódź, Trójmiasto, Katowice, Lublin, Białystok, Bydgoszcz, Szczecin, Rzeszów, Olsztyn, Toruń, Zielona Góra…) lub wpisz własne. Widoczne publicznie na twoim profilu Matching i używane do dobierania wydarzeń + dopasowań. Nie chcesz podawać? Wybierz „🌍 Wszędzie".</div>
        </div>

        {/* Bio */}
        <div>
          <label className="sk-label">O tobie</label>
          <div className="sk-input lg mt-1" style={{ display:'block' }}>Krótko: czego ludzie powinni się o tobie spodziewać</div>
          <div className="row between mt-1">
            <span className="sk-helper">To bio jest globalne. Na konkretnym wydarzeniu możesz dodać dodatkowy kontekst.</span>
            <span className="wf-tiny">0/200</span>
          </div>
        </div>

        <div className="row gap-3 mt-3">
          <Btn variant="primary" size="lg" onClick={() => goto && goto(edit ? 'E8' : 'E7')}>{edit ? 'Zapisz zmiany' : 'Zapisz profil'}</Btn>
          {edit && <Btn variant="ghost" onClick={() => goto && goto('E8')}>Anuluj</Btn>}
        </div>
      </div>
    </div>
  </NTFrame>
);

/* E7 — Success */
const E7_Success = ({ goto }) => (
  <NTFrame active="" matchingActive goto={goto}>
    <div className="text-center" style={{ maxWidth: 520, margin: '40px auto' }}>
      <div style={{ fontSize: 80 }}>✨</div>
      <h1 className="wf-h1 mt-3">Gotowe</h1>
      <p className="wf-body mt-3">Twój profil Matching jest aktywny. Teraz wybierz wydarzenie i zadeklaruj swoją intencję, żeby zacząć dostawać dopasowania.</p>
      <div className="row gap-3 mt-6 center">
        <Btn variant="primary" size="lg" onClick={() => goto && goto('E1')}>Przejdź do wydarzeń</Btn>
        <Btn variant="ghost" onClick={() => goto && goto('E8')}>Zobacz mój profil</Btn>
      </div>
    </div>
  </NTFrame>
);

/* E8 — Mój profil Matching */
const E8_Profile = ({ goto, empty = false }) => {
  // Timeline of activity — newest first, individual events as they actually happen.
  // Matches arrive ONE AT A TIME; only aggregated when several pop for same event in a row.
  // 'rec' = personalizowana rekomendacja wydarzenia (interleave w feedzie).
  const feedItems = empty ? [] : [
    { kind: 'match_one', evId: 'e3', evName: 'Czerwony Wieczór · BDSM Beginners', city: 'Wrocław', evWhen: 'so. 14 cze · 22:00', when: '2 godz. temu', matchLabel: 'Kobieta · 💬 poznanie', note: '"Będę w czerwonej sukience, przyjdę z koleżanką"' },
    { kind: 'declaration', evId: 'e3', evName: 'Czerwony Wieczór · BDSM Beginners', city: 'Wrocław', evWhen: 'so. 14 cze · 22:00', when: 'wczoraj', intent: '💬 Otwarty na poznanie' },
    { kind: 'rec', evId: 'e8', evName: 'Otwarte drzwi · Klub Sukces', city: 'Kraków', evWhen: 'pt. 27 cze · 21:00', banner: 'mesh',
      reason: '11 osób z twoich preferencji zadeklarowało intencję', stat: '7 kobiet · 4 pary · ✨ 5 chce się poznać' },
    { kind: 'match_agg', evId: 'e4', evName: 'Otwarty Pokój — wieczór rozmów', city: 'Kraków', evWhen: 'so. 15 cze · 21:00', when: '2 dni temu', count: 3 },
    { kind: 'needs_intent', evId: 'e1', evName: 'Heaven · Friday Play', city: 'Warszawa', evWhen: 'pt. 14 cze · 22:00', when: '3 dni temu', rsvp: '✓ Idę' },
    { kind: 'rec', evId: 'e9', evName: 'Heaven · Saturday Edition', city: 'Warszawa', evWhen: 'so. 22 cze · 22:00', banner: 'linear',
      reason: 'Podobny klimat do Czerwonego Wieczoru', stat: 'Sobota · ten sam organizator co Heaven Friday' },
    { kind: 'rsvp', evId: 'e6', evName: 'Krąg kobiet · rozmowa o intymności', city: 'Łódź', evWhen: 'cz. 20 cze · 19:30', when: '4 dni temu', rsvp: '✓ Idę' },
    { kind: 'rec', evId: 'e10', evName: 'Tantra Lab · poziom 2', city: 'Warszawa', evWhen: 'pt. 5 lip · 19:00', banner: 'shapes',
      reason: 'Bo byłaś na Tantra Lab — spotkanie otwarte', stat: 'Sequel · ograniczona liczba miejsc' },
    { kind: 'rsvp', evId: 'e7', evName: 'Tantra Lab · spotkanie otwarte', city: 'Warszawa', evWhen: 'pt. 21 cze · 19:00', when: 'tydzień temu', rsvp: '✷ Interesuje' },
  ];

  const meta = {
    match_one: { label: 'Nowe dopasowanie', color: 'var(--purple)' },
    match_agg: { label: 'Nowe dopasowania', color: 'var(--purple)' },
    declaration: { label: 'Zadeklarowano intencję', color: 'var(--magenta)' },
    needs_intent: { label: 'Czeka na intencję', color: 'var(--magenta)' },
    rsvp: { label: 'Zapisano się', color: 'var(--ink-mute)' },
    rec: { label: 'Polecane dla ciebie', color: 'var(--magenta)' },
  };

  return (
    <NTFrame active="" matchingActive goto={goto}>
      {/* Compact profile row */}
      <Card style={{ padding: 16, display:'flex', gap: 16, alignItems:'center' }}>
        <Img w={88} h={88} label="twoje zdjęcie" />
        <div className="col flex1" style={{ gap: 4 }}>
          <div className="row gap-2" style={{ alignItems:'center', flexWrap: 'wrap' }}>
            <div className="wf-h3">Twój profil Matching</div>
            <Pill variant="active">Kobieta</Pill>
            <Pill>📍 Warszawa</Pill>
          </div>
          <div className="wf-small" style={{ color: 'var(--ink)'}}>"Otwarta, ciekawa, lubię konwersacje które nie boją się tematu."</div>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => goto && goto('NT-settings-matching-P3')}>✎ Edytuj</Btn>
      </Card>

      {/* Activity timeline */}
      <div className="row between mt-6" style={{ alignItems:'baseline' }}>
        <div className="wf-h3">Ostatnia aktywność</div>
        <div className="wf-small wf-mute">Dopasowania, deklaracje i zapisy — w kolejności jak się działy</div>
      </div>

      {empty ? (
        <>
          <Card style={{ padding: 24, marginTop: 12 }}>
            <div className="wf-body">Jeszcze nic tu nie ma — zacznij od przeglądania wydarzeń.</div>
            <div className="wf-small wf-mute mt-1">Twoje dopasowania, deklaracje i zapisy pojawią się tutaj.</div>
            <div className="mt-3"><Btn variant="primary" onClick={() => goto && goto('E1')}>Przeglądaj wydarzenia</Btn></div>
          </Card>

          {/* Recommendations even when feed is empty — bootstrap */}
          <div className="mt-6">
            <div className="row between" style={{ alignItems:'baseline' }}>
              <div className="wf-h3">Polecane na początek</div>
              <div className="wf-small wf-mute">Bo niedawno założyłaś profil Matching</div>
            </div>
            <div className="col gap-3 mt-3">
              {[
                { evId: 'e3', evName: 'Czerwony Wieczór · BDSM Beginners', city: 'Wrocław', evWhen: 'so. 14 cze · 22:00', banner: 'linear',
                  reason: 'Najczęściej wybierane przez osoby zakładające profil Matching', stat: '22 osoby idą · 9 szuka kogoś poznać' },
                { evId: 'e1', evName: 'Heaven · Friday Play', city: 'Warszawa', evWhen: 'pt. 14 cze · 22:00', banner: 'mesh',
                  reason: 'Bliski klub w Warszawie · świetny na pierwszy raz', stat: '12 osób idzie · ✨ aktywny matching' },
                { evId: 'e2', evName: 'Otwarty Pokój — wieczór rozmów', city: 'Kraków', evWhen: 'pt. 14 cze · 21:00', banner: 'shapes',
                  reason: 'Bez ciśnienia — wieczór konwersacji', stat: '"Pierwszy raz w klubie? Chętnie pogadamy"' },
              ].map((it, i) => (
                <div key={i} style={{ position:'relative', paddingLeft: 32 }}>
                  <div style={{ position:'absolute', left: 0, top: 12, width: 18, height: 18,
                    transform: 'rotate(45deg)',
                    background: 'var(--paper)', border: '2px solid var(--magenta)' }}></div>
                  <Card
                    onClick={() => goto && goto('E2', { evId: it.evId })}
                    style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', borderColor: 'var(--magenta)', borderStyle: 'dashed' }}>
                    <div style={{ display: 'flex' }}>
                      <div className={`gen-banner gv-${it.banner}`} style={{ width: 140, flexShrink: 0, borderRadius: 0, border: 'none', borderRight: '2px dashed var(--magenta)' }}></div>
                      <div className="col flex1" style={{ padding: 14, gap: 4 }}>
                        <div className="row between" style={{ alignItems:'baseline' }}>
                          <div className="wf-tiny" style={{ color: 'var(--magenta)', fontWeight: 700, textTransform:'uppercase', letterSpacing: 0.5 }}>
                            ✷ Polecane dla ciebie
                          </div>
                          <a className="wf-tiny" style={{ color: 'var(--ink-mute)', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); }}>ukryj</a>
                        </div>
                        <div className="wf-h4 mt-1">{it.evName}</div>
                        <div className="wf-small wf-mute">{it.evWhen} · {it.city}</div>
                        <div className="wf-small mt-2" style={{ color: 'var(--ink)' }}>
                          <strong>Bo: </strong>{it.reason}
                        </div>
                        <div className="wf-tiny wf-mute" style={{ fontStyle: 'italic' }}>{it.stat}</div>
                        <div className="row gap-2 mt-2">
                          <Btn size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); goto && goto('E2', { evId: it.evId }); }}>Zobacz wydarzenie →</Btn>
                          <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); goto && goto('E10'); }}>Zadeklaruj intencję</Btn>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-3" style={{ position:'relative' }}>
          {/* Timeline rail */}
          <div style={{ position:'absolute', left: 8, top: 8, bottom: 8, width: 2, background: 'var(--rule)' }}></div>

          <div className="col gap-3">
            {feedItems.map((it, i) => {
              const m = meta[it.kind];
              const isMatch = it.kind === 'match_one' || it.kind === 'match_agg';
              const isRec = it.kind === 'rec';

              // Rec cards = distinct visual: banner + magenta accent + dashed dot
              if (isRec) {
                return (
                  <div key={i} style={{ position:'relative', paddingLeft: 32 }}>
                    {/* Dot — diamond shape to distinguish */}
                    <div style={{ position:'absolute', left: 0, top: 12, width: 18, height: 18,
                      transform: 'rotate(45deg)',
                      background: 'var(--paper)', border: '2px solid var(--magenta)' }}></div>
                    <Card
                      onClick={() => goto && goto('E2', { evId: it.evId })}
                      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', borderColor: 'var(--magenta)', borderStyle: 'dashed' }}>
                      <div style={{ display: 'flex' }}>
                        <div className={`gen-banner gv-${it.banner}`} style={{ width: 140, flexShrink: 0, borderRadius: 0, border: 'none', borderRight: '2px dashed var(--magenta)' }}></div>
                        <div className="col flex1" style={{ padding: 14, gap: 4 }}>
                          <div className="row between" style={{ alignItems:'baseline' }}>
                            <div className="wf-tiny" style={{ color: 'var(--magenta)', fontWeight: 700, textTransform:'uppercase', letterSpacing: 0.5 }}>
                              ✷ Polecane dla ciebie
                            </div>
                            <a className="wf-tiny" style={{ color: 'var(--ink-mute)', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); }}>ukryj</a>
                          </div>
                          <div className="wf-h4 mt-1">{it.evName}</div>
                          <div className="wf-small wf-mute">{it.evWhen} · {it.city}</div>
                          <div className="wf-small mt-2" style={{ color: 'var(--ink)' }}>
                            <strong>Bo: </strong>{it.reason}
                          </div>
                          <div className="wf-tiny wf-mute" style={{ fontStyle: 'italic' }}>{it.stat}</div>
                          <div className="row gap-2 mt-2">
                            <Btn size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); goto && goto('E2', { evId: it.evId }); }}>Zobacz wydarzenie →</Btn>
                            <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); goto && goto('E10'); }}>Zadeklaruj intencję</Btn>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              }

              return (
                <div key={i} style={{ position:'relative', paddingLeft: 32 }}>
                  {/* Dot */}
                  <div style={{ position:'absolute', left: 2, top: 14, width: 14, height: 14, borderRadius: '50%',
                    background: m.color, border: '2px solid var(--paper)', boxShadow: '0 0 0 2px ' + m.color }}></div>

                  <Card style={{ padding: 14, cursor:'pointer', borderStyle: it.kind === 'needs_intent' ? 'dashed' : 'solid' }}
                        onClick={() => goto && goto(isMatch ? 'E3' : 'E2', { evId: it.evId })}>
                    <div className="row between" style={{ alignItems:'baseline' }}>
                      <div className="wf-tiny" style={{ color: m.color, fontWeight: 700, textTransform:'uppercase', letterSpacing: 0.5 }}>
                        {it.kind === 'match_agg' ? `${it.count} ${m.label}` : m.label}
                      </div>
                      <div className="wf-tiny wf-mute">{it.when}</div>
                    </div>

                    <div className="row between mt-1" style={{ alignItems:'baseline' }}>
                      <div className="wf-h4">{it.evName}</div>
                      {it.kind === 'declaration' && <Pill variant="accent">{it.intent}</Pill>}
                      {(it.kind === 'rsvp' || it.kind === 'needs_intent') && <Pill>{it.rsvp}</Pill>}
                    </div>
                    <div className="wf-small wf-mute">{it.evWhen} · {it.city}</div>

                    {it.kind === 'match_one' && (
                      <div className="row gap-3 mt-3" style={{ alignItems:'center' }}>
                        <div style={{ width: 64 }} onClick={(e) => { e.stopPropagation(); goto && goto('E15'); }}>
                          <Img w={64} h={64} label="zdjęcie" />
                        </div>
                        <div className="col flex1">
                          <div className="wf-small" style={{ fontWeight: 700 }}>{it.matchLabel}</div>
                          {it.note && <div className="wf-small wf-mute" style={{ fontStyle:'italic' }}>{it.note}</div>}
                        </div>
                        <Btn size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); goto && goto('E15'); }}>Zobacz profil →</Btn>
                      </div>
                    )}

                    {it.kind === 'match_agg' && (
                      <div className="mt-2">
                        <div className="row between" style={{ alignItems:'center' }}>
                          <div className="wf-small wf-mute">{it.count} osoby pasują do twojego filtra</div>
                          <a className="wf-small" style={{color:'var(--purple)', cursor:'pointer'}} onClick={(e) => { e.stopPropagation(); goto && goto('E3', { evId: it.evId }); }}>Zobacz wszystkie →</a>
                        </div>
                        <div className="mt-2" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(it.count, 6)}, 1fr)`, gap: 8 }}>
                          {[1,2,3,4,5,6].slice(0, Math.min(it.count, 6)).map(j => (
                            <div key={j} onClick={(e) => { e.stopPropagation(); goto && goto('E15'); }} style={{cursor:'pointer'}}>
                              <MatchCard compact hasNote={false} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {it.kind === 'needs_intent' && (
                      <div className="row between mt-2" style={{ alignItems:'center' }}>
                        <div className="wf-small wf-mute">Uzupełnij intencję, żeby pojawić się w dopasowaniach.</div>
                        <Btn size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); goto && goto('E10'); }}>Dodaj intencję →</Btn>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </NTFrame>
  );
};

/* E9 — edycja = E6 z edit prop */
const E9_Edit = ({ goto }) => <E6_Form goto={goto} edit />;

/* E10 — Deklaracja intencji (modal variant default) */
const E10_Intent = ({ goto, mode = 'modal' }) => {
  const intent = get('intent', 'open_chat'); // just_vibe | open_chat | open_chem
  const Inner = (
    <div className="col" style={{ padding: 24 }}>
      <div className="row between">
        <div>
          <div className="wf-h2">Twoja intencja</div>
          <div className="wf-small mt-1">na: Czerwony Wieczór · 14 czerwca, 22:00</div>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => goto && goto('E3')}>✕</Btn>
      </div>
      <p className="wf-body mt-3">Każde wydarzenie to osobna deklaracja. Nikt jej nie zobaczy poza osobami, które pasują do twojego filtra.</p>

      <div className="mt-6">
        <div className="sk-label">Intencja</div>
        <div className="col gap-2 mt-2">
          {[
            ['just_vibe','🌙','Tylko klimat','Idę poczuć atmosferę — nie przeglądam dopasowań, ale inni mogą do mnie napisać. Twój profil będzie widoczny w listach z subtelnym oznaczeniem „nie szuka aktywnie".'],
            ['open_chat','💬','Otwarty na poznanie','Chętnie kogoś poznam, zobaczymy o czym.'],
            ['open_chem','✨','Otwarty na chemię','Otwarty na to gdzie to pójdzie.'],
          ].map(([id,emoji,t,d])=>(
            <div key={id} className="sk-box" style={{ padding: 14, display:'flex', gap: 12,
              borderColor: intent === id ? 'var(--purple)' : 'var(--rule)',
              background: intent === id ? 'var(--purple-soft)' : 'var(--paper)',
              borderWidth: intent === id ? 3 : 2 }}>
              <div style={{ fontSize: 28 }}>{emoji}</div>
              <div className="col flex1">
                <div className="wf-h4">{t}</div>
                <div className="wf-small mt-1">{d}</div>
              </div>
              <div className="sk-avatar" style={{ width: 20, height: 20, background: intent === id ? 'var(--purple)' : 'var(--paper)', border: '2px solid var(--ink)' }}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6" style={{ opacity: intent === 'just_vibe' ? 0.4 : 1 }}>
        <div className="sk-label">Kogo szukasz na tym wydarzeniu?</div>
        <div className="row gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
          <Pill variant="active">Kobieta</Pill>
          <Pill variant="active">Para</Pill>
          <Pill>Mężczyzna</Pill>
          <Pill>Osoba niebinarna</Pill>
        </div>
        <div className="sk-helper mt-2">
          {intent === 'just_vibe' ? 'Przy „Tylko klimat" nie przeglądasz dopasowań — to pole nie jest używane. Inni i tak mogą do ciebie napisać.' : 'Wybierz kogo chcesz widzieć w dopasowaniach. Możesz wybrać więcej niż jedną opcję.'}
        </div>
      </div>

      <div className="mt-6">
        <div className="sk-label">Notatka na tym wydarzeniu</div>
        <div className="sk-input lg mt-1" style={{ display:'block' }}>
          {intent === 'just_vibe'
            ? 'np. "Będę przy barze, otwarta na rozmowę gdy podejdziesz"'
            : 'np. "Pierwszy raz w tym klubie, chętnie pogadam"'}
        </div>
        <div className="row between mt-1">
          <span className="sk-helper">
            {intent === 'just_vibe'
              ? 'Pojawi się przy twoim profilu w listach dopasowań — pomoże komuś zdecydować, czy do ciebie napisać.'
              : 'Pojawi się tylko przed twoimi dopasowaniami z tego wydarzenia.'}
          </span>
          <span className="wf-tiny">0/200</span>
        </div>
      </div>

      <div className="row gap-3 mt-6">
        <Btn variant="primary" size="lg" onClick={() => goto && goto('E11')}>Zapisz deklarację</Btn>
        <Btn variant="ghost" onClick={() => goto && goto('E3')}>Anuluj</Btn>
      </div>
    </div>
  );

  if (mode === 'sidebar') {
    return (
      <div style={{ position: 'relative', width: 1100, minHeight: 700 }}>
        <div style={{ filter: 'blur(2px) brightness(0.9)', pointerEvents: 'none' }}><E3_EventHub goto={() => {}} /></div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 480, background: 'var(--paper)', borderLeft: '2px solid var(--rule)', overflowY: 'auto' }}>
          {Inner}
        </div>
      </div>
    );
  }
  if (mode === 'fullscreen') {
    return <NTFrame active="events">{Inner}</NTFrame>;
  }
  // modal default
  return (
    <div style={{ position: 'relative', width: 1100, minHeight: 700 }}>
      <div style={{ filter: 'blur(2px) brightness(0.9)', pointerEvents: 'none' }}><E3_EventHub goto={() => {}} /></div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="sk-card" style={{ width: 560, maxHeight: '90%', overflowY:'auto', background: 'var(--paper)' }}>{Inner}</div>
      </div>
    </div>
  );
};

/* MatchCard — variants */
const MatchCard = ({ proportion = 'portrait', muted = false, hasNote = true, compact = false, intentLabel = '💬 poznanie', intentVariant = 'primary' }) => {
  // intentVariant: 'primary' (full purple), 'secondary' (outline), 'muted' (grey for just_vibe)
  const intentPillStyle =
    intentVariant === 'primary' ? { background: 'var(--purple-soft)', borderColor: 'var(--purple)', color: 'var(--purple)' } :
    intentVariant === 'muted' ? { background: 'transparent', borderColor: 'var(--ink-faint)', color: 'var(--ink-mute)', borderStyle: 'dashed' } :
    { background: 'var(--paper)', borderColor: 'var(--purple)', color: 'var(--purple)' };

  if (compact) {
    return (
      <Card style={{ width: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          <Img w="100%" h={120} label={muted ? '🔒' : 'zdjęcie'} style={muted ? { filter: 'blur(8px)' } : undefined} />
          {muted && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 24 }}>🔒</div>}
        </div>
        <div style={{ padding: 6 }}>
          <div className="wf-tiny" style={{ fontWeight: 700 }}>Kobieta</div>
          <div className="wf-tiny wf-mute">{intentLabel}</div>
        </div>
      </Card>
    );
  }
  const dims = proportion === 'square' ? { w: 220, h: 220 } : proportion === 'portrait' ? { w: 220, h: 280 } : { w: 220, h: 264 }; // 4:5
  return (
    <Card style={{ width: dims.w, padding: 0, overflow: 'hidden', opacity: intentVariant === 'muted' ? 0.85 : 1 }}>
      <div style={{ position: 'relative' }}>
        <Img w="100%" h={dims.h} label={muted ? '' : 'zdjęcie matcha'} style={muted ? { filter: 'blur(12px)' } : undefined} />
        {muted && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 4 }}>
            <div style={{ fontSize: 32 }}>🔒</div>
            <div className="wf-tiny" style={{ color: 'var(--paper)', background: 'rgba(0,0,0,0.55)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              ukryte do twojej deklaracji
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Pill variant="active">Kobieta</Pill>
          <Pill>📍 Wrocław</Pill>
          <span className="sk-pill" style={intentPillStyle}>{intentLabel}</span>
        </div>
        <div className="wf-small mt-2">"Pierwszy raz na takim evencie, ale ciekawa..."</div>
        {hasNote && !muted && (
          <div className="sk-box" style={{ padding: 8, marginTop: 8, background: 'var(--purple-soft)', borderColor:'var(--purple)' }}>
            <div className="wf-tiny" style={{color:'var(--purple)', fontWeight: 700}}>NOTATKA NA TYM EVENCIE</div>
            <div className="wf-small mt-1">"Będę w czerwonej sukience, przyjdę z koleżanką"</div>
          </div>
        )}
        {muted && (
          <div className="wf-tiny wf-mute mt-2" style={{ fontStyle: 'italic' }}>
            Zdjęcie odkryje się po twojej deklaracji intencji
          </div>
        )}
      </div>
    </Card>
  );
};

/* E11 — pełna lista matchów (embedded version) — grupowane wg intencji */
const E11_Embedded = ({ goto, proportion = 'portrait', empty = false }) => {
  const intent = get('intent', 'open_chat');
  const intentLabel = {
    just_vibe: '🌙 Tylko klimat',
    open_chat: '💬 Otwarty na poznanie',
    open_chem: '✨ Otwarty na chemię',
  }[intent] || '💬 Otwarty na poznanie';

  return (
  <div>
    <div className="row between" style={{ alignItems:'flex-end' }}>
      <div className="wf-h4">{empty ? 'Twoje dopasowania' : '9 osób z nietabu pasuje do twojego filtra'}</div>
      <a className="wf-small" style={{color:'var(--purple)', cursor:'pointer'}} onClick={() => goto && goto('E10')}>Zmień deklarację</a>
    </div>
    {empty ? (
      <Card style={{ padding: 24, marginTop: 12, textAlign:'center' }}>
        <div style={{ fontSize: 56 }}>🌙</div>
        <div className="wf-h4 mt-2">Jeszcze nikt nie pasuje do twojego filtra</div>
        <div className="wf-small mt-2">Bądź pierwszy/a. Twoja deklaracja jest zapisana — gdy ktoś kompatybilny się zadeklaruje, dowiesz się.</div>
        <div className="mt-3"><Btn variant="primary" onClick={() => goto && goto('E10')}>Zmień deklarację</Btn></div>
      </Card>
    ) : (
      <div className="col gap-4 mt-3">
        {/* Group 1 — same intent level */}
        <div>
          <div className="row gap-2 mt-1" style={{ alignItems: 'center' }}>
            <div className="wf-tiny" style={{ color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              ✦ Pasują do twojej intencji ({intentLabel}) · 3 osoby
            </div>
          </div>
          <div className="wf-small wf-mute mt-1">Te osoby zadeklarowały to samo co ty.</div>
          <div className="mt-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} onClick={() => goto && goto('E15')} style={{cursor:'pointer'}}>
                <MatchCard proportion={proportion} hasNote={i === 1} intentLabel={intentLabel} intentVariant="primary" />
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--rule)' }}></div>
          <div className="wf-tiny wf-mute" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Inne intencje</div>
          <div style={{ flex: 1, height: 1, background: 'var(--rule)' }}></div>
        </div>

        {/* Group 2 — other intents, same gender filter */}
        <div>
          <div className="row gap-2 mt-1" style={{ alignItems: 'center' }}>
            <div className="wf-tiny" style={{ color: 'var(--ink-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Inni którzy też się zadeklarowali · 6 osób
            </div>
          </div>
          <div className="wf-small wf-mute mt-1">Mają inny poziom poszukiwań — ale spełniają twój filtr „kogo szukam". Możesz napisać, jeśli chcesz.</div>
          <div className="mt-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { intent: '💬 poznanie', variant: 'secondary' },
              { intent: '🌙 tylko klimat', variant: 'muted' },
              { intent: '💬 poznanie', variant: 'secondary' },
              { intent: '🌙 tylko klimat', variant: 'muted' },
              { intent: '💬 poznanie', variant: 'secondary' },
              { intent: '✨ chemii', variant: 'secondary' },
            ].slice(0, 6).map((m, i) => (
              <div key={i} onClick={() => goto && goto('E15')} style={{cursor:'pointer'}}>
                <MatchCard proportion={proportion} hasNote={false} intentLabel={m.intent} intentVariant={m.variant} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

/* E11 — pełna lista matchów */
const E11_Matches = ({ goto, proportion = 'portrait', empty = false }) => (
  <NTFrame active="events" persona="P3" goto={goto}>
    <div className="row gap-2"><a className="wf-small" style={{color:'var(--ink-mute)', cursor:'pointer'}} onClick={() => goto && goto('E3')}>← Wydarzenie</a></div>
    <h1 className="wf-h1 mt-2">Dopasowania na: Czerwony Wieczór</h1>
    <div className="wf-body mt-1">sobota, 14 czerwca · 22:00 · Wrocław</div>
    <div className="row gap-3 mt-3">
      <div className="wf-small"><strong>Twoja intencja:</strong> 💬 Otwarty na poznanie · <strong>Szukasz:</strong> Kobieta, Para</div>
      <a className="wf-small" style={{color:'var(--purple)', cursor:'pointer'}} onClick={() => goto && goto('E10')}>Zmień deklarację</a>
    </div>

    {empty ? (
      <div className="text-center mt-6" style={{ padding: 40 }}>
        <div style={{ fontSize: 80 }}>🌙</div>
        <h2 className="wf-h2 mt-3">Jeszcze nikt nie pasuje do twojego filtra</h2>
        <p className="wf-body mt-3">Bądź pierwszy/a. Twoja deklaracja jest zapisana — gdy ktoś kompatybilny z nietabu się zadeklaruje, dowiesz się.</p>
        <p className="wf-small mt-2">Możesz też zmienić filtr 'Kogo szukasz', żeby zobaczyć więcej osób.</p>
        <div className="mt-6"><Btn variant="primary" onClick={() => goto && goto('E10')}>Zmień deklarację</Btn></div>
      </div>
    ) : (
      <>
        <div className="wf-h4 mt-6">9 osób z nietabu pasuje do twojego filtra</div>
        <div className="mt-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} onClick={() => goto && goto('E15')} style={{cursor:'pointer'}}>
              <MatchCard proportion={proportion} hasNote={i % 2 === 0} />
            </div>
          ))}
        </div>
      </>
    )}
  </NTFrame>
);

/* E12 — partial (embedded version) */
const E12_Embedded = () => (
  <div>
    <Card style={{ padding: 14, background: 'var(--purple-soft)', borderColor: 'var(--purple)' }}>
      <div className="row between" style={{ alignItems: 'center', gap: 12 }}>
        <div className="col" style={{ flex: 1 }}>
          <div className="wf-h4" style={{color: 'var(--purple)'}}>Widzisz dane, ale zdjęcia są ukryte</div>
          <div className="wf-small mt-1">Zadeklaruj swoją intencję żeby zobaczyć zdjęcia i móc napisać do kogoś z dopasowań.</div>
        </div>
        <Btn variant="accent">Zadeklaruj intencję →</Btn>
      </div>
    </Card>
    <div className="mt-3 sk-box" style={{ padding: 14 }}>
      <div className="wf-body"><strong>11 osób z nietabu</strong> zadeklarowało się na to wydarzenie</div>
      <div className="wf-small mt-1">Z tego: <strong>5 kobiet, 3 mężczyzn, 2 pary, 1 osoba niebinarna</strong></div>
      <div className="wf-small mt-1"><strong>6</strong> chce kogoś poznać · <strong>4</strong> otwartych na chemię · <strong>1</strong> tylko klimat</div>
    </div>
    <div className="mt-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {[
        { intent: '💬 poznanie', variant: 'secondary' },
        { intent: '💬 poznanie', variant: 'secondary' },
        { intent: '✨ chemii', variant: 'secondary' },
        { intent: '🌙 tylko klimat', variant: 'muted' },
      ].map((m, i) => (
        <MatchCard key={i} muted proportion="portrait" hasNote={false} intentLabel={m.intent} intentVariant={m.variant} />
      ))}
    </div>
    <div className="wf-tiny mt-2 wf-mute" style={{ fontStyle: 'italic' }}>
      Pokazujemy 4 z 11. Pełna lista i zdjęcia odkryją się po twojej deklaracji.
    </div>
  </div>
);

const E12_Standalone = ({ goto }) => (
  <NTFrame active="events" persona="P2" goto={goto}>
    <h1 className="wf-h1">Czerwony Wieczór · BDSM Beginners</h1>
    <div className="wf-body mt-1">sobota, 14 czerwca · 22:00</div>
    <div className="mt-6"><E12_Embedded /></div>
  </NTFrame>
);

/* E13 — ogólny licznik (embedded) */
const E13_Embedded = ({ onCreate }) => (
  <Card style={{ padding: 24, textAlign: 'center', background: 'var(--purple-soft)', borderColor: 'var(--purple)' }}>
    <div className="wf-h2" style={{color: 'var(--purple)'}}>9 osób z nietabu</div>
    <div className="wf-body mt-2">deklaruje że chce kogoś poznać na tym wydarzeniu</div>
    <div className="mt-3"><Btn variant="accent" onClick={onCreate}>Załóż profil Matching żeby zobaczyć kto →</Btn></div>
  </Card>
);

const E13_Standalone = ({ goto }) => (
  <NTFrame active="events" persona="P1" goto={goto}>
    <h1 className="wf-h1">Czerwony Wieczór · BDSM Beginners</h1>
    <div className="wf-body mt-1">sobota, 14 czerwca · 22:00</div>
    <div className="mt-6"><E13_Embedded onCreate={() => goto && goto('E5')} /></div>
  </NTFrame>
);

/* E14 — empty matches */
const E14_Empty = ({ goto }) => <E11_Matches goto={goto} empty />;

/* E15 — Profil matcha */
const E15_MatchProfile = ({ goto }) => {
  const [showHelloModal, setShowHelloModal] = React.useState(false);
  return (
  <NTFrame active="events" persona="P3" goto={goto}>
    <div className="row gap-2"><a className="wf-small" style={{color:'var(--ink-mute)', cursor:'pointer'}} onClick={() => goto && goto('E3')}>← Wydarzenie</a></div>
    <div className="mt-3 row gap-6" style={{ alignItems: 'flex-start' }}>
      <div style={{ width: 400 }}>
        <Img w="100%" h={500} label="zdjęcie matcha" />
      </div>
      <div className="flex1 col gap-3">
        <div className="row gap-2">
          <Pill variant="active">Kobieta</Pill>
          <Pill>📍 Wrocław</Pill>
          <Pill variant="accent" style={{fontSize:14}}>💬 Otwarta na poznanie</Pill>
        </div>
        <div className="wf-h2">"Otwarta, ciekawa, lubię konwersacje które nie boją się tematu. Pierwszy raz w tym klubie."</div>
        <Card style={{ padding: 14, background: 'var(--purple-soft)', borderColor: 'var(--purple)' }}>
          <div className="wf-tiny" style={{color: 'var(--purple)', fontWeight: 700, letterSpacing: 0.05 + 'em'}}>NOTATKA NA TYM EVENCIE</div>
          <div className="wf-body mt-1">"Będę w czerwonej sukience, przyjdę z koleżanką. Chętnie pogadam przy barze zanim zacznie się część właściwa."</div>
        </Card>
        <div className="wf-small wf-mute">
          Dopasowanie z: <a style={{color:'var(--ink)', cursor:'pointer'}} onClick={() => goto && goto('E3')}>Czerwony Wieczór · sobota 14 cze</a>
        </div>
        <div className="mt-3">
          <Btn variant="primary" size="lg" onClick={() => { setShowHelloModal(true); goto && goto('E18'); }}>✉ Wyślij powitalną wiadomość</Btn>
          <div className="wf-tiny mt-2 wf-mute">Wysyłamy gotową, krótką wiadomość z linkiem do twojego profilu Matching. Bez edycji — nie potrzeba „pierwszego ruchu". Druga strona widzi tylko twój profil Matching.</div>
        </div>
      </div>
    </div>
  </NTFrame>
  );
};

/* E18 — Powitalna wiadomość (modal nad E15) */
const E18_HelloMessage = ({ goto, identity = 'kobieta' }) => {
  const [sent, setSent] = React.useState(false);

  // Identity-based wording
  const sender = {
    kobieta: 'kobieta',
    mezczyzna: 'mężczyzna',
    para: 'para',
    niebinarna: 'osoba niebinarna',
  }[identity] || 'kobieta';

  const evName = 'Czerwony Wieczór · 14 czerwca';

  const ModalInner = (
    <div className="sk-card" style={{ width: 540, maxHeight: '92%', overflowY:'auto', background: 'var(--paper)', padding: 24 }}>
      <div className="row between" style={{ alignItems:'flex-start' }}>
        <div>
          <div className="wf-h2">Powitalna wiadomość</div>
          <div className="wf-small mt-1">To gotowy tekst. Nie da się go zmienić — żeby pierwszy kontakt był prosty i bez ciśnienia.</div>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => goto && goto('E15')}>✕</Btn>
      </div>

      {/* Preview — chat bubble */}
      <div className="mt-4">
        <div className="wf-tiny wf-mute" style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 8 }}>
          Podgląd
        </div>
        <div className="sk-box" style={{ padding: 14, background: 'var(--paper-2)' }}>
          <div style={{
            background: 'var(--purple)',
            color: 'var(--paper)',
            padding: '14px 18px',
            borderRadius: '16px 16px 4px 16px',
            maxWidth: '90%',
            marginLeft: 'auto',
            fontFamily: 'var(--hand)',
            fontSize: 15,
            lineHeight: 1.5,
          }}>
            Hej! Tu <strong>{sender} z Matching</strong> — też idę na <strong>{evName}</strong> i chętnie {sender === 'para' ? 'Was poznamy' : 'Cię poznam'}.
            <div style={{
              marginTop: 10,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8,
              padding: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', flexShrink: 0,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize: 18 }}>✨</div>
              <div className="col" style={{ gap: 0, fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>Mój profil Matching →</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>{sender} · 📍 Warszawa</div>
              </div>
            </div>
          </div>
          <div className="wf-tiny wf-mute mt-2" style={{ textAlign:'right' }}>14:32 · za chwilę</div>
        </div>
      </div>

      {/* What it does */}
      <div className="mt-4 sk-box" style={{ padding: 12 }}>
        <ul className="wf-small" style={{ paddingLeft: 18, lineHeight: 1.6, margin: 0 }}>
          <li>Trafi do zwykłego chatu nietabu — bez dedykowanego widgetu</li>
          <li>Druga strona widzi tylko twój profil Matching, nie konto nietabu</li>
          <li>Wyślesz tylko raz — jeśli nie odpowie, zostaje cisza</li>
        </ul>
      </div>

      <div className="mt-4 row gap-3">
        <Btn variant="primary" size="lg" onClick={() => goto && goto('E18-loader')}>
          {sent ? '✓ Wysłano' : 'Wyślij'}
        </Btn>
        <Btn variant="ghost" onClick={() => goto && goto('E15')}>Anuluj</Btn>
      </div>
      {sent && (
        <div className="wf-small mt-3" style={{ color: 'var(--purple)' }}>
          ✓ Wiadomość wysłana. Sprawdź swój chat → albo wróć do listy dopasowań.
        </div>
      )}
    </div>
  );

  // Render E15 as background with modal overlay
  return (
    <div style={{ position: 'relative', width: 1100, minHeight: 700 }}>
      <div style={{ filter: 'blur(2px) brightness(0.9)', pointerEvents: 'none' }}>
        <E15_MatchProfile goto={() => {}} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop: 60, zIndex: 100 }}>
        {ModalInner}
      </div>
    </div>
  );
};

/* E18b — Loader stan po kliknięciu Wyślij */
const E18_Loader = ({ goto, stage = 'sending', identity = 'kobieta' }) => {
  const sender = { kobieta: 'kobieta', mezczyzna: 'mężczyzna', para: 'para', niebinarna: 'osoba niebinarna' }[identity] || 'kobieta';

  const ModalInner = (
    <div className="sk-card" style={{ width: 540, padding: 40, background: 'var(--paper)', textAlign: 'center', overflow: 'hidden' }}>
      {stage === 'sending' && (
        <>
          {/* Animated SVG: paper plane flying along a dashed arc, sparkles trailing */}
          <div style={{ position: 'relative', height: 180, marginBottom: 8 }}>
            <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%' }}>
              {/* arc path (hand-drawn-ish) */}
              <path
                id="arc"
                d="M 30 140 Q 100 30, 290 80"
                fill="none"
                stroke="var(--purple)"
                strokeWidth="2"
                strokeDasharray="6 5"
                strokeLinecap="round"
                opacity="0.45">
                <animate attributeName="stroke-dashoffset" from="0" to="-44" dur="0.9s" repeatCount="indefinite" />
              </path>

              {/* sparkles */}
              <g fill="var(--magenta)">
                <text x="50" y="120" style={{ fontFamily: 'var(--display)', fontSize: 22 }}>
                  ✦
                  <animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" />
                </text>
                <text x="130" y="60" style={{ fontFamily: 'var(--display)', fontSize: 16 }}>
                  ✶
                  <animate attributeName="opacity" values="1;0.2;1" dur="1.1s" repeatCount="indefinite" />
                </text>
                <text x="240" y="100" style={{ fontFamily: 'var(--display)', fontSize: 20 }}>
                  ✦
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" repeatCount="indefinite" />
                </text>
              </g>

              {/* plane that travels the arc */}
              <g style={{ fontSize: 32 }}>
                <text style={{ fontSize: 30 }} textAnchor="middle">
                  ✉️
                  <animateMotion dur="2.4s" repeatCount="indefinite" rotate="auto">
                    <mpath href="#arc" />
                  </animateMotion>
                </text>
              </g>
            </svg>
          </div>

          <div className="wf-h2">Wysyłam...</div>
          <div className="wf-body mt-2" style={{ color: 'var(--ink-soft)' }}>
            Twoja powitalna wiadomość jest w drodze do {sender === 'para' ? 'innej osoby/pary' : 'drugiej osoby'}.
          </div>

          {/* Sketchy progress dashes */}
          <div className="row gap-1 mt-4" style={{ justifyContent: 'center' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: 18,
                height: 6,
                background: 'var(--purple)',
                borderRadius: 3,
                opacity: 0.25,
                animation: `omLoaderDash 1.4s ${i * 0.18}s ease-in-out infinite`,
              }}></div>
            ))}
          </div>
          <style>{`
            @keyframes omLoaderDash {
              0%, 100% { opacity: 0.25; transform: translateY(0); }
              50% { opacity: 1; transform: translateY(-3px); }
            }
          `}</style>

          <div className="wf-tiny wf-mute mt-4" style={{ fontStyle: 'italic' }}>
            <em>...szyfrujemy, podpinamy twój profil Matching, zapisujemy w chacie...</em>
          </div>
        </>
      )}

      {stage === 'success' && (
        <>
          <div style={{ fontSize: 72, lineHeight: 1, animation: 'omSuccessPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>✨</div>
          <style>{`
            @keyframes omSuccessPop {
              0% { transform: scale(0.4); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div className="wf-h1 mt-3">Wysłane</div>
          <div className="wf-body mt-3" style={{ maxWidth: 380, margin: '12px auto 0' }}>
            Wiadomość trafiła do chatu drugiej osoby. Jak odpowie — dostaniesz powiadomienie.
          </div>

          <div className="mt-6 sk-box" style={{ padding: 12, textAlign: 'left', background: 'var(--purple-soft)', borderColor: 'var(--purple)' }}>
            <div className="wf-tiny" style={{ color: 'var(--purple)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Co dalej</div>
            <ul className="wf-small mt-1" style={{ paddingLeft: 18, lineHeight: 1.6, margin: 0 }}>
              <li>Konwersacja jest w twoim chacie nietabu</li>
              <li>Bez „przeczytane" — żeby nikt się nie stresował</li>
              <li>Jeśli nie odpowie w tydzień, wątek zwija się sam</li>
            </ul>
          </div>

          <div className="mt-6 row gap-3" style={{ justifyContent: 'center' }}>
            <Btn variant="primary" size="lg" onClick={() => goto && goto('E15')}>Wróć do profilu</Btn>
            <Btn variant="ghost" onClick={() => goto && goto('E19')}>Przejdź do wiadomości →</Btn>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ position: 'relative', width: 1100, minHeight: 700 }}>
      <div style={{ filter: 'blur(2px) brightness(0.9)', pointerEvents: 'none' }}>
        <E15_MatchProfile goto={() => {}} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop: 60, zIndex: 100 }}>
        {ModalInner}
      </div>
    </div>
  );
};
const E16_EmptyEvents = ({ goto }) => (
  <NTFrame active="events" goto={goto}>
    <h1 className="wf-h1">Wydarzenia</h1>
    <div className="text-center mt-6" style={{ padding: 40 }}>
      <div style={{ fontSize: 80 }}>📅</div>
      <h2 className="wf-h2 mt-3">Brak nadchodzących wydarzeń</h2>
      <p className="wf-body mt-3">Pracujemy nad dodawaniem nowych eventów. Wracaj wkrótce!</p>
    </div>
    <div className="mt-6"><SubmitEventBanner /></div>
  </NTFrame>
);

/* NT_Settings — Ustawienia konta nietabu, z tabami w lewym pasku */
const NT_Settings = ({ goto, personaOverride, activeTab = 'profil' }) => {
  const p = personaOverride || get('persona', 'P1');
  const hasMatching = p === 'P2' || p === 'P3';

  const tabs = [
    { id: 'profil', label: 'Profil', show: true },
    { id: 'matching', label: '✨ Matching', show: hasMatching },
    { id: 'konto', label: 'Konto', show: true },
    { id: 'personalizacja', label: 'Personalizacja', show: true },
    { id: 'powiadomienia', label: 'Powiadomienia', show: true },
    { id: 'bezpieczenstwo', label: 'Bezpieczeństwo', show: true },
    { id: 'organizacje', label: 'Organizacje', show: true },
    { id: 'rozszerzenia', label: 'Rozszerzenia', show: true },
  ].filter(i => i.show);

  return (
    <NTFrame active="" persona={p} goto={goto} hideRail>
      <div className="row gap-2"><a className="wf-small" style={{color:'var(--ink-mute)', cursor:'pointer'}} onClick={() => goto && goto('E1')}>← nietabu</a></div>
      <h1 className="wf-h1 mt-2">Ustawienia</h1>

      <div className="mt-6" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Settings nav — tabs */}
        <aside className="col gap-1" style={{ position: 'sticky', top: 16 }}>
          {tabs.map(tab => {
            const active = tab.id === activeTab;
            return (
              <div key={tab.id} className="row gap-2" style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--paper)' : 'var(--ink-soft)',
                fontFamily: 'var(--hand)',
                fontSize: 14,
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
              }}>{tab.label}</div>
            );
          })}
        </aside>

        {/* Tab content */}
        <div className="col gap-6">
          {activeTab === 'profil' && (
            <>
              <Card style={{ padding: 20 }}>
                <div className="wf-h3">Profil</div>
                <div className="wf-small mt-1">Widoczne dla wszystkich w nietabu — na twoim publicznym profilu i przy postach.</div>

                <div className="mt-4 row gap-4" style={{ alignItems: 'center' }}>
                  <Avatar />
                  <div className="col flex1">
                    <div className="sk-label">Zdjęcie profilowe</div>
                    <div className="wf-tiny wf-mute mt-1">JPG, PNG, max 5 MB</div>
                  </div>
                  <Btn variant="ghost" size="sm">Zmień</Btn>
                </div>

                <div className="mt-4">
                  <div className="sk-label">Nazwa użytkownika</div>
                  <div className="sk-input mt-1" style={{ display:'block' }}>@kasiabp</div>
                </div>

                <div className="mt-4">
                  <div className="sk-label">Wyświetlana nazwa</div>
                  <div className="sk-input mt-1" style={{ display:'block' }}>Kasia B.</div>
                </div>

                <div className="mt-4">
                  <div className="sk-label">Bio</div>
                  <div className="sk-input lg mt-1" style={{ display:'block' }}>Kilka słów o tobie — pojawi się na twoim publicznym profilu.</div>
                </div>

                <div className="row gap-4 mt-4">
                  <div className="col flex1">
                    <div className="sk-label">Lokalizacja</div>
                    <div className="sk-input mt-1" style={{ display:'block' }}>Warszawa</div>
                  </div>
                  <div className="col flex1">
                    <div className="sk-label">Strona www</div>
                    <div className="sk-input mt-1" style={{ display:'block' }}>—</div>
                  </div>
                </div>

                <div className="mt-4 row gap-3">
                  <Btn variant="primary">Zapisz</Btn>
                  <Btn variant="ghost">Anuluj</Btn>
                </div>
              </Card>

              <StickyNote rotate={-1}>
                Sekcja Matching jest osobną zakładką w lewym pasku — nie ma jej tutaj. Profil Matching = osobny prywatny profil, nie powinien być pomieszany z publicznym profilem nietabu.
              </StickyNote>
            </>
          )}

          {activeTab === 'matching' && hasMatching && (
            <>
              <Card style={{ padding: 20, borderColor: 'var(--purple)' }}>
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="wf-h3" style={{ color: 'var(--purple)' }}>✨ Profil Matching</div>
                    <div className="wf-small mt-1">Osobny, prywatny profil. Widzą go tylko osoby kompatybilne z twoją intencją na danym wydarzeniu.</div>
                  </div>
                  <Pill variant="accent">Aktywny</Pill>
                </div>

                <div className="mt-4 sk-box" style={{ padding: 12, background: 'var(--purple-soft)', borderColor: 'var(--purple)' }}>
                  <div className="wf-tiny" style={{ color: 'var(--purple)', fontWeight: 700, letterSpacing: 0.5, textTransform:'uppercase' }}>🔒 Prywatność</div>
                  <div className="wf-small mt-1">Twoje zdjęcie i dane Matching są niepowiązane z głównym kontem nietabu. Nikt nie może skojarzyć tych dwóch tożsamości.</div>
                </div>

                <div className="mt-6">
                  <div className="sk-label">Zdjęcie *</div>
                  <div className="row gap-3 mt-2">
                    <Img w={120} h={120} label="twoje zdjęcie" />
                    <div className="col gap-2 flex1">
                      <div className="wf-small">Pojawi się tylko przed osobami z którymi masz wzajemne dopasowanie. Nie musi pokazywać twarzy.</div>
                      <div className="row gap-2">
                        <Btn size="sm">Zmień zdjęcie</Btn>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="sk-label">Kim jesteś? *</div>
                  <div className="row gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                    <Pill variant="active">Kobieta</Pill>
                    <Pill>Mężczyzna</Pill>
                    <Pill>Para</Pill>
                    <Pill>Osoba niebinarna</Pill>
                  </div>
                  <div className="sk-helper mt-2">Możesz to zmienić w każdej chwili. Dla par: zakładacie wspólne konto Matching.</div>
                </div>

                <div className="mt-6">
                  <div className="sk-label">Miasto *</div>
                  <div className="row gap-2 mt-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="sk-input" style={{ minWidth: 280, color: 'var(--ink)' }}>
                      Warszawa <span className="wf-tiny wf-mute">▾</span>
                    </div>
                    <Pill variant="accent">🌍 lub: Wszędzie / dowolne miasto</Pill>
                  </div>
                  <div className="sk-helper mt-2">Wybierz z listy polskich miast lub wpisz własne. Widoczne publicznie i używane do dobierania wydarzeń + dopasowań. Wolisz nie podawać? Wybierz „🌍 Wszędzie".</div>
                </div>

                <div className="mt-6">
                  <div className="sk-label">O tobie (bio globalne)</div>
                  <div className="sk-input lg mt-1" style={{ display:'block' }}>"Otwarta, ciekawa, lubię konwersacje które nie boją się tematu."</div>
                  <div className="row between mt-1">
                    <span className="sk-helper">To bio jest globalne. Na konkretnym wydarzeniu możesz dodać dodatkowy kontekst (deklaracja per event).</span>
                    <span className="wf-tiny">62/200</span>
                  </div>
                </div>

                <div className="mt-6 row gap-3">
                  <Btn variant="primary">Zapisz zmiany</Btn>
                  <Btn variant="ghost" onClick={() => goto && goto('E8')}>Zobacz moją aktywność →</Btn>
                </div>
              </Card>

              <Card style={{ padding: 20, borderStyle: 'dashed' }}>
                <div className="wf-h4">Strefa niebezpieczna</div>
                <div className="wf-small mt-1">Usunięcie profilu Matching nie wpływa na twoje konto nietabu. Aktywne deklaracje i konwersacje znikną.</div>
                <div className="mt-3">
                  <Btn variant="ghost" size="sm">Usuń profil Matching</Btn>
                </div>
              </Card>
            </>
          )}

          {/* Other tabs — placeholder content to show structure */}
          {activeTab === 'konto' && (
            <Card style={{ padding: 20 }}>
              <div className="wf-h3">Konto</div>
              <div className="wf-small mt-1">Email, hasło, podpięte konta.</div>
              <div className="col gap-3 mt-4" style={{ opacity: 0.6 }}>
                <div className="row between"><span className="wf-body">Email</span><span className="wf-small">kasia@example.com</span></div>
                <div className="row between"><span className="wf-body">Hasło</span><Btn size="sm" variant="ghost">Zmień</Btn></div>
                <div className="row between"><span className="wf-body">Logowanie przez Google</span><Pill>połączone</Pill></div>
              </div>
            </Card>
          )}
          {activeTab === 'powiadomienia' && (
            <Card style={{ padding: 20 }}>
              <div className="wf-h3">Powiadomienia</div>
              <div className="wf-small mt-1">Email i in-app — dla głównych zdarzeń nietabu.</div>
              <div className="col gap-2 mt-3" style={{ opacity: 0.7 }}>
                <div className="row between" style={{ padding: '6px 0', borderBottom: '1px dashed var(--rule)' }}>
                  <div className="wf-body">Komentarze pod moimi postami</div><Pill>email + in-app</Pill>
                </div>
                <div className="row between" style={{ padding: '6px 0', borderBottom: '1px dashed var(--rule)' }}>
                  <div className="wf-body">Reakcje na moje posty</div><Pill>in-app</Pill>
                </div>
                <div className="row between" style={{ padding: '6px 0', borderBottom: '1px dashed var(--rule)' }}>
                  <div className="wf-body">Nowy event w moim mieście</div><Pill>tylko in-app</Pill>
                </div>
              </div>
              {hasMatching && (
                <div className="mt-4 sk-box" style={{ padding: 10, background: 'var(--purple-soft)', borderColor: 'var(--purple)' }}>
                  <div className="wf-small">Powiadomienia z Matching są w osobnej zakładce <a style={{color:'var(--purple)', cursor:'pointer'}}>✨ Matching →</a></div>
                </div>
              )}
            </Card>
          )}
          {['personalizacja','bezpieczenstwo','organizacje','rozszerzenia'].includes(activeTab) && (
            <Card style={{ padding: 20, opacity: 0.5 }}>
              <div className="wf-h3">{tabs.find(t => t.id === activeTab)?.label}</div>
              <div className="wf-small mt-1">— placeholder —</div>
            </Card>
          )}
        </div>
      </div>
    </NTFrame>
  );
};

/* Header demo — pokazuje awatar menu otwarte (do canvasu) */
const HeaderAvatarMenuDemo = ({ goto, persona }) => {
  const p = persona || get('persona', 'P1');
  return (
    <NTFrame active="events" persona={p} avatarMenuOpen goto={goto}>
      <div style={{ minHeight: 360, padding: 8 }}>
        <h1 className="wf-h1">Wydarzenia</h1>
        <p className="wf-body mt-1">↑ Kliknięcie w awatar otwiera menu po prawej stronie nagłówka.</p>
        <div className="mt-6 wf-small wf-mute" style={{ maxWidth: 520 }}>
          <strong>P1</strong> — bez profilu Matching: dropdown pokazuje miękką propozycję założenia profilu.<br/>
          <strong>P2 / P3</strong> — z profilem Matching: w dropdownie pojawia się karta z twoim zdjęciem Matching i tożsamością (np. „Kobieta").<br/>
          Klik w kartę → przenosi do „Mój Matching" (E8 — aktywność).
        </div>
      </div>
    </NTFrame>
  );
};

/* Header demo — pokazuje wskaźnik Matching w pasku górnym */
const HeaderMatchingBadgeDemo = ({ goto, persona }) => {
  const p = persona || get('persona', 'P3');
  return (
    <NTFrame active="events" persona={p} matchingActive goto={goto}>
      <div style={{ minHeight: 320, padding: 8 }}>
        <h1 className="wf-h1">Wydarzenia</h1>
        <p className="wf-body mt-1">↑ Ikona ✨ w pasku górnym = wejście do mojego Matching, z badge'em nowych aktywności (jak powiadomienia).</p>
        <div className="mt-4 sk-box" style={{ padding: 14, maxWidth: 620 }}>
          <div className="wf-h4">Reguły wskaźnika ✨</div>
          <ul className="wf-small mt-2" style={{ paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Pojawia się TYLKO jeśli mam profil Matching (P2 / P3). Dla P1 znika z paska.</li>
            <li>Badge liczy NIEPRZECZYTANE aktywności: nowe dopasowania, czekające intencje, nowe wiadomości od matchy.</li>
            <li>Klik → przenosi do „Mój Matching" (E8) — feed aktywności (bez zmian).</li>
            <li>Badge zeruje się po wejściu w listę aktywności.</li>
          </ul>
        </div>
      </div>
    </NTFrame>
  );
};

/* E17 — Filters expanded */
const E17_Filters = ({ goto }) => (
  <NTFrame active="events" goto={goto}>
    <h1 className="wf-h1">Wydarzenia</h1>
    <p className="wf-body mt-1">Sprawdź co się dzieje w polskiej scenie i zadeklaruj swoje zainteresowanie</p>

    <Card style={{ padding: 20, marginTop: 16 }}>
      <div className="wf-h3">Filtry</div>
      <div className="mt-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <div className="sk-label">Miasto</div>
          <div className="row gap-1 mt-2" style={{flexWrap: 'wrap'}}>
            <Pill variant="active">Warszawa</Pill>
            <Pill variant="active">Kraków</Pill>
            <Pill>Wrocław</Pill>
            <Pill>Poznań</Pill>
            <Pill>Łódź</Pill>
            <Pill>Trójmiasto</Pill>
            <Pill>Inne</Pill>
          </div>
        </div>
        <div>
          <div className="sk-label">Od daty</div>
          <div className="sk-input mt-2" style={{ display:'block' }}>dziś</div>
        </div>
        <div>
          <div className="sk-label">Do daty</div>
          <div className="sk-input mt-2" style={{ display:'block' }}>za miesiąc</div>
        </div>
      </div>
      <div className="row gap-3 mt-6">
        <Btn variant="primary" onClick={() => goto && goto('E1')}>Pokaż wyniki</Btn>
        <a className="wf-small" style={{color:'var(--ink-mute)', cursor:'pointer'}}>Wyczyść filtry</a>
      </div>
    </Card>

    {/* preview underneath */}
    <div className="mt-6" style={{ opacity: 0.5 }}>
      <div className="day-header">PIĄTEK · 14 czerwca</div>
      <EventCard ev={SAMPLE_DAYS[0].events[0]} variant="a" />
    </div>
  </NTFrame>
);

/* Expose to window for app.jsx */
Object.assign(window, {
  E1_Calendar, E2_EventHub, E3_EventHub, E4_EventHub,
  E5_Intro, E6_Form, E7_Success, E8_Profile, E9_Edit,
  E10_Intent, E11_Matches, E12_Standalone, E13_Standalone,
  E14_Empty, E15_MatchProfile, E16_EmptyEvents, E17_Filters, E18_HelloMessage, E18_Loader,
  NT_Settings, HeaderAvatarMenuDemo, HeaderMatchingBadgeDemo, AvatarMenu, HeaderIcon,
  EventCard, MatchCard, SAMPLE_DAYS, NTFrame, Btn, Pill, Card, Img, Avatar, StickyNote,
});
