// nie!tabu Matching + Events — Hi-Fi · shared components

const { useState, useEffect, useMemo, Fragment } = React;

/* ============================================================
   Icons — small inline SVGs (Lucide-style, 2px stroke)
   ============================================================ */
const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 2 }) => {
  const props = {
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  switch (name) {
    case 'search':
      return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
    case 'bell':
      return <svg {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
    case 'message':
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'sparkle':
      return <svg {...props}><path d="M12 3v3M12 18v3M5.05 5.05l2.12 2.12M16.83 16.83l2.12 2.12M3 12h3M18 12h3M5.05 18.95l2.12-2.12M16.83 7.17l2.12-2.12"/></svg>;
    case 'check':
      return <svg {...props}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'arrow-right':
      return <svg {...props}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case 'arrow-left':
      return <svg {...props}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
    case 'external':
      return <svg {...props}><path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7"/></svg>;
    case 'lock':
      return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case 'pin':
      return <svg {...props}><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'users':
      return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'plus':
      return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'pencil':
      return <svg {...props}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>;
    case 'filter':
      return <svg {...props}><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>;
    case 'send':
      return <svg {...props}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>;
    case 'chevron-down':
      return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'star':
      return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case 'home':
      return <svg {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>;
    case 'play':
      return <svg {...props}><polygon points="6 3 20 12 6 21 6 3"/></svg>;
    case 'mic':
      return <svg {...props}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/></svg>;
    case 'hash':
      return <svg {...props}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>;
    case 'rooms':
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'video':
      return <svg {...props}><path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>;
    case 'eye':
      return <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off':
      return <svg {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
    default:
      return null;
  }
};

/* ============================================================
   nie!tabu chrome — header + sidebar
   ============================================================ */
const NtHeader = ({ persona = 'P3', matchingActive = false, onNav }) => {
  const hasMatching = persona === 'P2' || persona === 'P3';
  const matchingUnread = persona === 'P3' ? 3 : persona === 'P2' ? 1 : 0;
  return (
    <header className="nt-topbar">
      <img className="nt-logo" src="assets/logo-nietabu.png" alt="nie!tabu" />
      <div className="nt-search">
        <Icon name="search" size={16} />
        <input placeholder="szukaj na nietabu..." />
      </div>
      <div className="nt-top-actions">
        <button className="btn btn-outline btn-sm">utwórz post</button>
        <button className="nt-iconbtn" title="Powiadomienia">
          <Icon name="bell" />
          <span className="dot">2</span>
        </button>
        <button className="nt-iconbtn" title="Wiadomości">
          <Icon name="message" />
        </button>
        {(hasMatching || matchingActive) && (
          <button
            className={'nt-iconbtn' + (matchingActive ? ' active' : '')}
            title="Mój Matching"
            onClick={() => onNav && onNav('E8')}
          >
            <Icon name="sparkle" />
            {matchingUnread > 0 && <span className="dot">{matchingUnread}</span>}
          </button>
        )}
        <div className="avatar a-1" style={{ width: 36, height: 36, marginLeft: 4 }} />
      </div>
    </header>
  );
};

const NtSidebar = ({ active = 'events' }) => {
  const items = [
    { id: 'home', label: 'Strona główna', icon: 'home' },
    { id: 'videos', label: 'Filmy', icon: 'video' },
    { id: 'podcasts', label: 'Podcasty', icon: 'mic' },
    { id: 'rooms', label: 'Pokoje', icon: 'rooms' },
    { id: 'tags', label: 'Tagi', icon: 'hash' },
    { id: 'events', label: 'Wydarzenia', icon: 'calendar', isNew: true },
  ];
  return (
    <aside className="nt-rail">
      {items.map(i => (
        <a key={i.id} className={'item' + (active === i.id ? ' active' : '')}>
          <span className="glyph"><Icon name={i.icon} size={18}/></span>
          <span>{i.label}</span>
          {i.isNew && <span className="badge">NEW</span>}
        </a>
      ))}
      <div className="section-label">Popularne</div>
      <a className="tag-row"><span className="hash">#</span>swingerski</a>
      <a className="tag-row"><span className="hash">#</span>bdsm</a>
      <a className="tag-row"><span className="hash">#</span>edukacja</a>
      <a className="tag-row"><span className="hash">#</span>tantra</a>
      <a className="tag-row"><span className="hash">#</span>relacje</a>
      <div className="section-label">Inne</div>
      <a className="tag-row">🎯 Misja</a>
      <a className="tag-row">🪙 Educoin</a>
      <a className="tag-row">📖 Przewodnik</a>
    </aside>
  );
};

const NtFrame = ({ children, persona, matchingActive, onNav, active = 'events', noRail = false }) => (
  <div className="nt-shell">
    <NtHeader persona={persona} matchingActive={matchingActive} onNav={onNav} />
    <div className={'nt-body' + (noRail ? ' no-rail' : '')}>
      {!noRail && <NtSidebar active={active} />}
      <main className="nt-main">{children}</main>
    </div>
  </div>
);

/* ============================================================
   Banner — auto-gen or uploaded (just selects a style)
   ============================================================ */
const Banner = ({ variant = 'dusk', uploaded = false, className = '', style, children }) => {
  // uploaded === true → use banner-photo with a real-photo placeholder
  // uploaded === false → use abstract auto-gen gradient
  const cls = uploaded
    ? `banner-photo ${variant}`
    : `banner bg-${variant}`;
  return (
    <div className={`${cls} ${className}`} style={style}>
      {children}
    </div>
  );
};

/* ============================================================
   Day header — agenda-style
   ============================================================ */
const DAYS_PL = ['Niedz.','Pon.','Wt.','Śr.','Czw.','Pt.','Sob.'];
const DAYS_PL_FULL = ['NIEDZIELA','PONIEDZIAŁEK','WTOREK','ŚRODA','CZWARTEK','PIĄTEK','SOBOTA'];
const MONTHS_PL = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];

const DayHeader = ({ day, dayOfWeek, month, count }) => (
  <div className="day-header">
    <div className="day-num">{day}</div>
    <div className="day-label">
      <span className="day-of-week">{dayOfWeek}</span>
      <span className="day-month">{month}</span>
    </div>
    <div className="day-rule"/>
    <div className="day-count">{count} {count === 1 ? 'wydarzenie' : count < 5 ? 'wydarzenia' : 'wydarzeń'}</div>
  </div>
);

/* ============================================================
   Event card — agenda row
   ============================================================ */
const EventCard = ({ ev, onClick }) => {
  const counts = (ev.going + ev.interested <= 2)
    ? <em style={{ color: 'rgb(var(--nietabu-magenta))', fontStyle: 'normal', fontWeight: 700 }}>Bądź pierwszą osobą z nietabu</em>
    : <><strong>{ev.going} z nietabu</strong> idzie <span className="dot">·</span> <strong>{ev.interested}</strong> zainteresowanych</>;
  return (
    <div className="event-card" onClick={onClick}>
      <div className="ec-time">
        <div className="start">{ev.time}</div>
        <div className="end">do {ev.end}</div>
      </div>
      <div className="ec-content">
        <div className="ec-title">{ev.name}</div>
        <div className="ec-venue">{ev.venue} · <span className="mute">{ev.city}</span></div>
        <div className="ec-counts">
          <span>{counts}</span>
          {ev.matchPool > 0 && (
            <span className="match-flag">
              <Icon name="sparkle" size={12}/> {ev.matchPool} szuka kogoś
            </span>
          )}
        </div>
      </div>
      <Banner variant={ev.banner} uploaded={ev.uploaded} className="ec-banner">
        {ev.rsvp === 'going' && (
          <span className="ec-rsvp-flag going">
            <Icon name="check" size={12}/> Idziesz
          </span>
        )}
        {ev.rsvp === 'interested' && (
          <span className="ec-rsvp-flag interested">
            <Icon name="star" size={12}/> Interesuje cię
          </span>
        )}
      </Banner>
    </div>
  );
};

/* ============================================================
   Matching banner (P1 CTA)
   ============================================================ */
const MatchingCTABanner = ({ onClick }) => (
  <div className="matching-banner">
    <div className="mb-icon"><Icon name="sparkle" size={26}/></div>
    <div className="flex1">
      <div className="h3" style={{ marginBottom: 4 }}>
        Chcesz tu kogoś poznać?
      </div>
      <div className="body mute">
        Załóż profil Matching — odseparowany od twojego konta nietabu, widoczny tylko dla osób które same szukają.
      </div>
    </div>
    <button className="btn btn-primary btn-lg" onClick={onClick}>
      Załóż profil Matching <Icon name="arrow-right" size={16}/>
    </button>
  </div>
);

/* ============================================================
   Privacy info-box (reusable)
   ============================================================ */
const PrivacyInfo = ({ children }) => (
  <div className="info-box">
    <div className="ib-icon"><Icon name="lock" size={14}/></div>
    <div className="body" style={{ color: 'rgb(var(--grey-800))' }}>
      {children}
    </div>
  </div>
);

/* ============================================================
   Sample data — realistic Polish names/clubs
   ============================================================ */
const SAMPLE_DAYS = [
  {
    day: 14, dow: 'PIĄTEK', month: 'czerwca 2026',
    events: [
      { id: 'e1', time: '22:00', end: '04:00', name: 'Heaven · Friday Play', venue: 'Heaven Warsaw', city: 'Warszawa',
        going: 18, interested: 11, matchPool: 7, banner: 'dusk', uploaded: false, rsvp: null },
      { id: 'e2', time: '21:00', end: '02:00', name: 'Otwarty Pokój — wieczór rozmów', venue: 'Klub Sukces', city: 'Kraków',
        going: 6, interested: 4, matchPool: 3, banner: 'olive', uploaded: false, rsvp: null },
    ]
  },
  {
    day: 15, dow: 'SOBOTA', month: 'czerwca 2026',
    events: [
      { id: 'e3', time: '22:00', end: '04:00', name: 'Czerwony Wieczór · BDSM Beginners', venue: 'Czerwona Kotwica', city: 'Wrocław',
        going: 28, interested: 17, matchPool: 12, banner: 'ember', uploaded: false, rsvp: 'going' },
      { id: 'e4', time: '19:00', end: '23:00', name: 'Slow Touch · Warsztat dotyku', venue: 'Studio Wellness', city: 'Warszawa',
        going: 14, interested: 9, matchPool: 4, banner: 'workshop', uploaded: true, rsvp: 'interested' },
      { id: 'e5', time: '23:00', end: '05:00', name: 'After Hours · electronic edition', venue: 'Klub Kruk', city: 'Poznań',
        going: 1, interested: 1, matchPool: 0, banner: 'night', uploaded: false, rsvp: null },
    ]
  },
  {
    day: 20, dow: 'CZWARTEK', month: 'czerwca 2026',
    events: [
      { id: 'e6', time: '19:30', end: '22:30', name: 'Krąg kobiet · rozmowa o intymności', venue: 'Przestrzeń Kotłownia', city: 'Łódź',
        going: 9, interested: 6, matchPool: 2, banner: 'sunrise', uploaded: false, rsvp: null },
    ]
  },
  {
    day: 21, dow: 'PIĄTEK', month: 'czerwca 2026',
    events: [
      { id: 'e7', time: '20:00', end: '23:00', name: 'Tantra Lab · spotkanie otwarte', venue: 'Akademia Tantry', city: 'Warszawa',
        going: 22, interested: 13, matchPool: 8, banner: 'velvet', uploaded: false, rsvp: null },
      { id: 'e8', time: '22:00', end: '03:00', name: 'Pink Night · ladies first', venue: 'Heaven Warsaw', city: 'Warszawa',
        going: 31, interested: 24, matchPool: 19, banner: 'studio', uploaded: true, rsvp: null },
    ]
  },
];

/* ============================================================
   Match data
   ============================================================ */
const INTENT_LABELS = {
  open_chat:   'Otwarty na poznanie',
  just_vibe:   'Tylko klimat',
  not_looking: 'Nie szukam',
};
const INTENT_EMOJI = {
  open_chat: '💬', just_vibe: '🌙', not_looking: '🌑',
};

const SAMPLE_MATCHES = [
  { id: 'm1', identity: 'Kobieta',   intent: 'open_chat', city: 'Warszawa', photo: 'photo-1',
    bio: 'Otwarta, ciekawa świata. Lubię konwersacje, które nie boją się tematu — i muzykę gdzieś w tle.',
    note: 'Pierwszy raz na takim evencie, będę z koleżanką. Czerwona sukienka.' },
  { id: 'm2', identity: 'Para',      intent: 'open_chat', city: 'Kraków', photo: 'photo-2',
    bio: 'My — Ania i Tomek, razem 4 lata. Otwarci na nowe doświadczenia, najpierw rozmowa.',
    note: '' },
  { id: 'm3', identity: 'Kobieta',   intent: 'just_vibe', city: 'Wrocław', photo: 'photo-3',
    bio: 'Idę poczuć klimat. Nie polowanko. Jeśli się złapiemy — super.',
    note: 'Będę przy barze przez większość wieczoru.' },
  { id: 'm4', identity: 'Mężczyzna', intent: 'open_chat', city: 'Warszawa', photo: 'photo-4',
    bio: 'Pierwszy raz w tym klubie. Ciekawy ludzi, lubię słuchać. Nie naciskam.',
    note: '' },
  { id: 'm5', identity: 'Para',      intent: 'open_chat', city: 'Poznań', photo: 'photo-5',
    bio: 'Spokojne wieczory > tłumy. Chętnie porozmawiamy z kimś przy stoliku.',
    note: 'Wpadamy ok. 22:30, ubrani na czarno.' },
  { id: 'm6', identity: 'Kobieta',   intent: 'open_chat', city: 'Łódź', photo: 'photo-6',
    bio: 'Otwarta na to gdzie nas to zaprowadzi. Ważne: szczerze.',
    note: '' },
].map(m => ({ ...m, intentEmoji: INTENT_EMOJI[m.intent], intentLabel: INTENT_LABELS[m.intent] }));

/* ============================================================
   Match card
   ============================================================ */
const MatchCard = ({ m, onClick, hideIntent = false }) => (
  <div className="match-card" onClick={onClick}>
    <div className={`photo mc-photo ${m.photo}`}>
      <div className="badges">
        <span className="pill-onphoto">{m.identity}</span>
      </div>
      <div className="intent-glyph" title={m.intentLabel}>{m.intentEmoji}</div>
    </div>
    <div className="mc-body">
      <div className="mc-meta">
        <span className="mc-meta-identity">{m.identity}</span>
        <span className="mc-meta-sep">·</span>
        <span className="mc-meta-city"><Icon name="pin" size={11}/> {m.city}</span>
      </div>
      {!hideIntent && (
        <div className="mc-meta-intent">{m.intentEmoji} {m.intentLabel}</div>
      )}
      <div className="mc-bio">{m.bio}</div>
      {m.note && (
        <div className="mc-note">"{m.note}"</div>
      )}
    </div>
  </div>
);

/* Blurred (E12) version */
const MatchCardBlurred = ({ m }) => (
  <div className="match-card" style={{ cursor: 'default' }}>
    <div className={`photo mc-photo ${m.photo} photo-blurred`}>
      <div className="badges">
        <span className="pill-onphoto" style={{ opacity: 0.85 }}>{m.identity}</span>
      </div>
    </div>
    <div className="mc-body">
      <div className="mc-meta">
        <span className="mc-meta-identity">{m.identity}</span>
        <span className="mc-meta-sep">·</span>
        <span className="mc-meta-city"><Icon name="pin" size={11}/> {m.city}</span>
      </div>
      <div className="mc-meta-intent">{m.intentEmoji} {m.intentLabel}</div>
      <div className="mc-bio" style={{ filter: 'blur(3px)', userSelect: 'none' }}>
        ████████ ████ ███████ ████ ███████.
      </div>
    </div>
  </div>
);

// Make available globally
Object.assign(window, {
  Icon, NtHeader, NtSidebar, NtFrame, Banner, DayHeader, EventCard,
  MatchingCTABanner, PrivacyInfo, MatchCard, MatchCardBlurred,
  SAMPLE_DAYS, SAMPLE_MATCHES, INTENT_LABELS, INTENT_EMOJI,
});
