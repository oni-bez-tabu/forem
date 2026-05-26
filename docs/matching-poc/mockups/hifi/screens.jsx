// Hi-Fi screens: E1, E2/E3, E5, E6, E8, E10, E11, E15

/* ============================================================
   E1 — Kalendarium wydarzeń
   ============================================================ */
const MatchingActiveBanner = ({ onNav }) => (
  <div className="matching-banner">
    <div className="mb-icon"><Icon name="sparkle" size={26}/></div>
    <div className="flex1">
      <div className="h3" style={{ marginBottom: 4 }}>
        Twój profil Matching jest aktywny
      </div>
      <div className="body mute">
        <strong style={{ color: 'rgb(var(--grey-900))' }}>3 nowe dopasowania</strong> · 1 czeka na intencję · zobacz feed aktywności
      </div>
    </div>
    <button className="btn btn-primary btn-lg" onClick={() => onNav && onNav('E8')}>
      Mój Matching <Icon name="arrow-right" size={16}/>
    </button>
  </div>
);

const E1_Calendar = ({ persona = 'P1', onNav }) => (
  <NtFrame persona={persona} matchingActive={persona !== 'P1'} onNav={onNav} active="events">
    <div className="col gap-6">
      <div>
        <h1 className="h-display lg">Wydarzenia</h1>
        <p className="body mute" style={{ marginTop: 8, maxWidth: 580 }}>
          Sprawdź co się dzieje w polskiej scenie i zadeklaruj swoje zainteresowanie.
        </p>
      </div>

      {persona === 'P1'
        ? <MatchingCTABanner onClick={() => onNav && onNav('E5')} />
        : <MatchingActiveBanner onNav={onNav}/>}

      <div className="col gap-6">
        {SAMPLE_DAYS.map((d, i) => (
          <div key={d.day + d.month} className="col gap-6">
            <div className="col gap-3">
              <DayHeader day={d.day} dayOfWeek={d.dow} month={d.month} count={d.events.length}/>
              <div className="col gap-2">
                {d.events.map(ev => (
                  <EventCard key={ev.id} ev={ev} onClick={() => onNav && onNav(ev.rsvp === 'going' ? 'E3' : ev.rsvp === 'interested' ? 'E4' : 'E2')} />
                ))}
              </div>
            </div>
            {/* Submit-event banner injected mid-list */}
            {i === 1 && (
              <div className="submit-event">
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius)',
                  background: '#fff', border: '1px solid var(--card-border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgb(var(--grey-700))',
                }}>
                  <Icon name="plus" size={20}/>
                </div>
                <div className="flex1">
                  <div className="h4">Chcesz, żeby twoje wydarzenie znalazło się tutaj?</div>
                  <div className="caption mute" style={{ marginTop: 2 }}>
                    Napisz do nas — dodamy je ręcznie.
                  </div>
                </div>
                <button className="btn btn-outline btn-sm">
                  Napisz do nas <Icon name="arrow-right" size={14}/>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="row center" style={{ marginTop: 16 }}>
        <button className="btn btn-outline btn-lg">Pokaż kolejne wydarzenia</button>
      </div>
    </div>
  </NtFrame>
);

/* ============================================================
   E2/E3/E4 — Pośredni ekran eventu
   ============================================================ */
const E2_EventHub = ({ persona = 'P1', rsvp: rsvpProp = null, onNav, intent: intentProp = null }) => {
  const ev = {
    name: 'Czerwony Wieczór · BDSM Beginners',
    venue: 'Czerwona Kotwica', city: 'Wrocław',
    dateStr: 'sobota, 14 czerwca 2026',
    timeStr: '22:00 – 04:00',
    going: 28, interested: 17, matchPool: 12,
    organizer: 'Czerwona Kotwica',
  };

  // Stan lokalny — żeby kliknięcia Idę / Interesuje mnie uruchamiały popupy w tym samym ekranie.
  const [rsvp, setRsvp] = useState(rsvpProp);
  const [intent, setIntent] = useState(intentProp);
  // popupStage: null | 'no-profile' | 'intent' | 'share'
  const [popupStage, setPopupStage] = useState(null);

  const handleRsvpClick = (next) => {
    // Toggle off jeśli klikam ten sam stan — bez popupów.
    if (rsvp === next) { setRsvp(null); return; }
    setRsvp(next);
    if (persona === 'P1') {
      setPopupStage('no-profile');
    } else if (!intent) {
      setPopupStage('intent');
    } else {
      setPopupStage('share');
    }
  };
  return (
    <>
    <NtFrame persona={persona} matchingActive={persona !== 'P1'} onNav={onNav} active="events">
      <div className="row gap-2" style={{ marginBottom: 16 }}>
        <a className="body mute" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => onNav && onNav('E1')}>
          <Icon name="arrow-left" size={16}/> Wszystkie wydarzenia
        </a>
      </div>

      {/* Hero banner */}
      <div className="event-hero" style={{ height: 380 }}>
        <Banner variant="ember" uploaded={false} style={{ position: 'absolute', inset: 0 }} />
        <div className="hero-meta">
          <span className="hero-eyebrow">
            <Icon name="calendar" size={12}/> Sobota · za 12 dni
          </span>
          <h1 className="hero-title">{ev.name}</h1>
          <div className="hero-when">
            <span>{ev.dateStr}</span>
            <span className="sep">·</span>
            <span>{ev.timeStr}</span>
          </div>
          <div className="hero-venue">{ev.venue} · {ev.city}</div>
        </div>
      </div>

      {/* Meta + main description CTA */}
      <div className="row between gap-4 wrap" style={{ marginTop: 24 }}>
        <div className="row gap-3">
          <div className="avatar a-2" style={{ width: 44, height: 44 }} />
          <div className="col">
            <div className="caption">Organizator</div>
            <div className="h4" style={{ marginTop: 2 }}>{ev.organizer}</div>
          </div>
        </div>
        <div className="col gap-1" style={{ alignItems: 'flex-end' }}>
          <button className="btn btn-primary btn-lg">
            Zobacz pełen opis na nietabu <Icon name="arrow-right" size={16}/>
          </button>
          <span className="caption">w tej samej karcie · post od organizatora</span>
        </div>
      </div>

      <div className="divider"/>

      {/* RSVP block */}
      <section className="section">
        <div className="row between items-baseline wrap gap-3" style={{ marginBottom: 14 }}>
          <h2 className="h2">Wybierz swój udział</h2>
          <span className="caption mute">Liczby dotyczą tylko deklaracji z platformy</span>
        </div>
        <div className="row gap-3 wrap">
          <button
            className={'btn btn-lg ' + (rsvp === 'going' ? 'btn-going' : 'btn-primary')}
            onClick={() => handleRsvpClick('going')}>
            {rsvp === 'going' ? <><Icon name="check" size={16}/> Idziesz</> : 'Idę'}
          </button>
          <button
            className={'btn btn-lg ' + (rsvp === 'interested' ? 'btn-going' : 'btn-outline')}
            onClick={() => handleRsvpClick('interested')}>
            {rsvp === 'interested' ? <><Icon name="check" size={16}/> Interesuje cię</> : 'Interesuje mnie'}
          </button>
          <div className="col" style={{ marginLeft: 'auto' }}>
            <div className="body">
              <strong>{ev.going} z nietabu</strong> idzie <span className="mute">·</span>{' '}
              <strong>{ev.interested}</strong> zainteresowanych
            </div>
            <div className="caption mute" style={{ marginTop: 2 }}>
              Na evencie mogą być też osoby z innych kanałów.
            </div>
          </div>
        </div>
        {rsvp === 'going' && (
          <div className="card flat-bg card-pad" style={{ marginTop: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Icon name="check" size={18} color="rgb(5,150,105)"/>
            <div className="body">
              <strong>Zapisaliśmy że idziesz.</strong> <span className="mute">Powodzenia 🌙</span>
            </div>
          </div>
        )}
      </section>

      <div className="divider"/>

      {/* Matching section */}
      <section className="section">
        <div className="row between items-baseline wrap gap-3" style={{ marginBottom: 14 }}>
          <h2 className="h2">
            <Icon name="sparkle" size={20} color="rgb(66,65,116)"/> Matching na tym wydarzeniu
          </h2>
          {persona === 'P3' && (
            <button className="btn btn-ghost btn-sm" onClick={() => onNav && onNav('E10')}>
              <Icon name="pencil" size={13}/> Zmień deklarację
            </button>
          )}
        </div>

        {persona === 'P1' && (
          <div className="card card-pad" style={{
            background: 'linear-gradient(135deg, rgba(66,65,116,0.04), rgba(169,31,105,0.04))',
            borderColor: 'rgba(66,65,116,0.18)',
          }}>
            <div className="row between gap-4 wrap">
              <div className="flex1">
                <div className="h3" style={{ marginBottom: 6 }}>
                  Na tym wydarzeniu <span style={{ color: 'var(--accent-brand)' }}>{ev.matchPool} osób z nietabu</span> szuka kogoś poznać
                </div>
                <div className="body mute">
                  Załóż profil Matching żeby zobaczyć szczegóły i dołączyć. To osobny profil — bez powiązania z twoim głównym kontem.
                </div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => onNav && onNav('E5')}>
                Załóż profil Matching <Icon name="arrow-right" size={16}/>
              </button>
            </div>
          </div>
        )}

        {persona === 'P2' && !intent && (
          <div className="card card-pad">
            <div className="row between gap-4 wrap">
              <div className="flex1">
                <div className="h3" style={{ marginBottom: 6 }}>Zadeklaruj swoją intencję</div>
                <div className="body mute">
                  Wybierz kogo chcesz poznać na tym evencie. Twoja deklaracja będzie widoczna tylko dla osób które do ciebie pasują.
                </div>
              </div>
              <button
                className={'btn btn-lg ' + (rsvp === 'going' ? 'btn-primary' : 'btn-disabled')}
                onClick={() => rsvp === 'going' && onNav && onNav('E10')}>
                Zadeklaruj intencję <Icon name="arrow-right" size={16}/>
              </button>
            </div>
            {rsvp !== 'going' && (
              <div className="caption mute" style={{ marginTop: 10 }}>
                <Icon name="lock" size={11}/> Najpierw zaznacz że <strong>idziesz</strong>, żeby zadeklarować intencję.
              </div>
            )}
          </div>
        )}

        {persona === 'P3' && (
          <>
            <div className="card flat-bg card-pad" style={{ marginBottom: 16, borderColor: 'rgba(66,65,116,0.2)' }}>
              <div className="row between gap-3 wrap">
                <div className="col gap-1">
                  <span className="overline">Twoja aktywna deklaracja</span>
                  <div className="row gap-2 items-baseline">
                    <span className="h3">💬 Otwarty na poznanie</span>
                  </div>
                </div>
                <div className="caption">Notatka: <em>"Pierwszy raz w tym klubie, chętnie pogadam"</em></div>
              </div>
            </div>

            <E11_Inline onNav={onNav}/>
          </>
        )}
      </section>
    </NtFrame>

    {/* ============================================================
       Popupy RSVP flow:
         1) klik Idę / Interesuje mnie →
            P1 → 'no-profile'  ·  P2/P3 bez intencji → 'intent'  ·  inaczej → 'share'
         2) po zamknięciu 'no-profile' lub zapisaniu 'intent' → 'share'
       ============================================================ */}
    {popupStage === 'no-profile' && (
      <NoProfilePopup
        rsvp={rsvp}
        evName={ev.name}
        onClose={() => setPopupStage(null)}
        onSkip={() => setPopupStage('share')}
        onCreate={() => { setPopupStage(null); onNav && onNav('E5'); }}
      />
    )}
    {popupStage === 'intent' && (
      <IntentPopup
        rsvp={rsvp}
        evName={ev.name}
        onClose={() => setPopupStage(null)}
        onSave={(picked) => { setIntent(picked); setPopupStage('share'); }}
      />
    )}
    {popupStage === 'share' && (
      <SharePopup
        rsvp={rsvp}
        evName={ev.name}
        onClose={() => setPopupStage(null)}
      />
    )}
    </>
  );
};

/* ============================================================
   ShareRow — udostępnij swój udział w wydarzeniu
   ============================================================ */
const ShareRow = ({ rsvp, evName = 'Czerwony Wieczór · BDSM Beginners' }) => {
  const [copied, setCopied] = useState(false);
  const [posted, setPosted] = useState(false);
  const stance = rsvp === 'going' ? 'idę na' : rsvp === 'interested' ? 'interesuje mnie' : 'chcę pójść na';
  const postPreview = rsvp === 'going' ? `Idę na: ${evName} →`
                     : rsvp === 'interested' ? `Interesuje mnie: ${evName} →`
                     : `Sprawdź: ${evName} →`;
  return (
    <div className="share-row" style={{ marginTop: 18 }}>
      <div className="row between items-baseline wrap gap-2" style={{ marginBottom: 14 }}>
        <div className="h4">Daj znać, że {stance} to wydarzenie</div>
        <span className="caption mute">opcjonalne · pomaga zebrać ludzi</span>
      </div>
      <div className="row gap-4 wrap items-start">
        <div className="share-option">
          <button
            className={'btn btn-lg ' + (posted ? 'btn-going' : 'btn-secondary')}
            onClick={() => { setPosted(true); setTimeout(() => setPosted(false), 2800); }}
          >
            {posted ? <><Icon name="check" size={16}/> Udostępniono na nietabu</> : <>Udostępnij na nietabu</>}
          </button>
          <div className="caption mute">
            {posted
              ? 'Post pojawił się na twoim profilu nietabu — znajomi zobaczą.'
              : <>Tworzy post na twoim profilu: <em style={{ color: 'rgb(var(--grey-800))' }}>"{postPreview}"</em></>}
          </div>
        </div>
        <div className="share-option">
          <button
            className={'btn btn-lg ' + (copied ? 'btn-going' : 'btn-outline')}
            onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2400); }}
          >
            {copied ? <><Icon name="check" size={16}/> Skopiowano link</> : <>🔗 Skopiuj link</>}
          </button>
          <div className="caption mute">
            {copied ? 'Wklej gdziekolwiek — WhatsApp, Signal, mail…' : 'nietabu.pl/e/czerwony-wieczor-14-06'}
          </div>
        </div>
      </div>
    </div>
  );
};


/* ============================================================
   NoProfilePopup — popup po RSVP gdy użytkownik nie ma profilu Matching
   ============================================================ */
const NoProfilePopup = ({ rsvp, evName, onClose, onSkip, onCreate }) => {
  const stance = rsvp === 'going' ? 'idziesz' : 'jesteś zainteresowany';
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="h2">Zapisaliśmy że {stance}</h2>
            <p className="caption mute" style={{ marginTop: 6 }}>
              <strong style={{ color: 'rgb(var(--grey-900))' }}>{evName}</strong>
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body col gap-5">
          <div className="row gap-4 items-start">
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-brand), rgb(var(--nietabu-magenta)))',
              color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 12px 24px rgba(66,65,116,0.20)',
            }}>
              <Icon name="sparkle" size={26}/>
            </div>
            <div className="col gap-2 flex1">
              <div className="h3">Chcesz kogoś poznać na tym evencie?</div>
              <p className="body" style={{ color: 'rgb(var(--grey-800))' }}>
                Załóż profil <strong>Matching</strong> — osobny, prywatny profil niepowiązany z twoim kontem nietabu. Zobaczysz kto z drugiej strony też kogoś szuka.
              </p>
            </div>
          </div>
          <PrivacyInfo>
            Twój profil Matching jest oddzielony od głównego konta. Zdjęcie widzą tylko osoby do których pasujesz.
          </PrivacyInfo>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onSkip}>Może później</button>
          <button className="btn btn-primary" onClick={onCreate}>
            Załóż profil Matching <Icon name="arrow-right" size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   IntentPopup — popup deklaracji intencji (skrócona wersja E10)
   ============================================================ */
const IntentPopup = ({ rsvp, evName, onClose, onSave }) => {
  const [intent, setIntent] = useState('open_chat');
  const [seeking, setSeeking] = useState(['Kobieta', 'Para']);
  const [note, setNote] = useState('');
  const toggleSeek = (s) => setSeeking(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const intents = [
    { id: 'not_looking', emoji: '🌑', title: 'Nie szukam nikogo',
      desc: 'Idę, ale nie chcę żadnego kontaktu — nikt mnie nie widać w dopasowaniach i nikt do mnie nie napisze.' },
    { id: 'just_vibe', emoji: '🌙', title: 'Tylko klimat',
      desc: 'Idę poczuć atmosferę — nie przeglądam dopasowań, ale inni mogą do mnie napisać.' },
    { id: 'open_chat', emoji: '💬', title: 'Otwarty na poznanie',
      desc: 'Chętnie kogoś poznam, zobaczymy o czym.' },
  ];
  const disabled = intent === 'just_vibe' || intent === 'not_looking';
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="h2">Twoja intencja</h2>
            <div className="meta" style={{ marginTop: 4 }}>
              na: <strong style={{ color: 'rgb(var(--grey-900))' }}>{evName}</strong>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body col gap-6">
          <p className="body mute">
            Każde wydarzenie to osobna deklaracja. Nikt jej nie zobaczy poza osobami, które pasują do twojego filtra.
          </p>
          <div className="field-group">
            <label className="field-label">Intencja</label>
            <div className="col gap-2">
              {intents.map(it => (
                <div key={it.id}
                     className={'intent-card' + (intent === it.id ? ' selected' : '')}
                     onClick={() => setIntent(it.id)}>
                  <div className="ic-glyph">{it.emoji}</div>
                  <div className="col flex1 gap-1">
                    <div className="h4">{it.title}</div>
                    <div className="caption" style={{ color: 'rgb(var(--grey-700))', fontSize: 13, lineHeight: 1.45 }}>
                      {it.desc}
                    </div>
                  </div>
                  <div className="ic-radio"/>
                </div>
              ))}
            </div>
          </div>
          {intent !== 'not_looking' && (
            <>
              <div className="field-group" style={{ opacity: intent === 'just_vibe' ? 0.45 : 1 }}>
                <label className="field-label">Kogo szukasz na tym wydarzeniu?</label>
                <div className="chip-group">
                  {['Kobieta','Mężczyzna','Para','Osoba niebinarna'].map(opt => (
                    <button key={opt}
                            className={'chip' + (seeking.includes(opt) ? ' selected' : '')}
                            disabled={intent === 'just_vibe'}
                            onClick={() => intent !== 'just_vibe' && toggleSeek(opt)}>
                      {seeking.includes(opt) && <Icon name="check" size={14}/>}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Notatka na tym wydarzeniu</label>
                <textarea className="field-textarea"
                          value={note} onChange={e => setNote(e.target.value)}
                          maxLength={200}
                          placeholder='np. "Pierwszy raz w tym klubie, chętnie pogadam"'/>
                <div className="row between">
                  <span className="field-helper">Pojawi się tylko przed twoimi dopasowaniami z tego wydarzenia.</span>
                  <span className="field-counter">{note.length}/200</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" onClick={() => onSave(intent)}>
            Zapisz deklarację
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SharePopup — popup udostępniania udziału w evencie
   ============================================================ */
const SharePopup = ({ rsvp, evName, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [posted, setPosted] = useState(false);
  const stance = rsvp === 'going' ? 'idę na' : rsvp === 'interested' ? 'interesuje mnie' : 'chcę pójść na';
  const postPreview = rsvp === 'going' ? `Idę na: ${evName} →`
                     : rsvp === 'interested' ? `Interesuje mnie: ${evName} →`
                     : `Sprawdź: ${evName} →`;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="h2">Daj znać, że {stance} to wydarzenie</h2>
            <p className="caption mute" style={{ marginTop: 6, maxWidth: 420 }}>
              Opcjonalne — pomaga zebrać ludzi. <strong style={{ color: 'rgb(var(--grey-900))' }}>{evName}</strong>
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body col gap-5">
          <div className="card card-pad" style={{ padding: 18 }}>
            <div className="row between items-start gap-3 wrap">
              <div className="col flex1 gap-1">
                <div className="h4">Udostępnij na nietabu</div>
                <div className="caption mute">
                  {posted
                    ? 'Post pojawił się na twoim profilu nietabu — znajomi zobaczą.'
                    : <>Tworzy post na twoim profilu: <em style={{ color: 'rgb(var(--grey-800))' }}>"{postPreview}"</em></>}
                </div>
              </div>
              <button
                className={'btn ' + (posted ? 'btn-going' : 'btn-secondary')}
                onClick={() => { setPosted(true); setTimeout(() => setPosted(false), 2800); }}>
                {posted ? <><Icon name="check" size={14}/> Udostępniono</> : <>Udostępnij</>}
              </button>
            </div>
          </div>
          <div className="card card-pad" style={{ padding: 18 }}>
            <div className="row between items-start gap-3 wrap">
              <div className="col flex1 gap-1">
                <div className="h4">🔗 Skopiuj link</div>
                <div className="caption mute">
                  {copied ? 'Wklej gdziekolwiek — WhatsApp, Signal, mail…' : 'nietabu.pl/e/czerwony-wieczor-14-06'}
                </div>
              </div>
              <button
                className={'btn ' + (copied ? 'btn-going' : 'btn-outline')}
                onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2400); }}>
                {copied ? <><Icon name="check" size={14}/> Skopiowano</> : <>Kopiuj</>}
              </button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Gotowe</button>
        </div>
      </div>
    </div>
  );
};

const E11_Inline = ({ onNav }) => {
  // Group by intent
  const groups = [
    { key: 'open_chat', emoji: '💬', label: 'Otwarci na poznanie', matches: SAMPLE_MATCHES.filter(m => m.intent === 'open_chat') },
    { key: 'just_vibe', emoji: '🌙', label: 'Tylko klimat', matches: SAMPLE_MATCHES.filter(m => m.intent === 'just_vibe') },
  ];
  return (
    <div className="col gap-5">
      <div className="row between items-baseline wrap gap-2">
        <div className="h3"><strong>{SAMPLE_MATCHES.length} osób</strong> z nietabu pasuje do twojego filtra</div>
      </div>

      {groups.map(g => (
        <div key={g.key} className="col gap-3">
          <div className="row gap-2 items-baseline">
            <span className="overline" style={{ color: 'rgb(var(--grey-800))' }}>
              {g.emoji} {g.label}
            </span>
            <span className="caption mute">— {g.matches.length}</span>
          </div>
          <div className="match-grid">
            {g.matches.map(m => (
              <MatchCard key={m.id} m={m} hideIntent onClick={() => onNav && onNav('E15')}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   E5 — Onboarding intro
   ============================================================ */
const E5_Intro = ({ onNav }) => (
  <NtFrame matchingActive onNav={onNav} active="" noRail>
    <div style={{ maxWidth: 640, margin: '20px auto 60px' }}>
      <div className="text-center">
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-brand), rgb(var(--nietabu-magenta)))',
          color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, marginBottom: 24,
          boxShadow: '0 20px 40px rgba(66,65,116,0.25)',
        }}>
          <Icon name="sparkle" size={44} strokeWidth={1.5}/>
        </div>
        <h1 className="h-display xl" style={{ textWrap: 'balance' }}>Poznaj kogoś na wydarzeniu</h1>
        <p className="body" style={{ marginTop: 14, fontSize: 17, textWrap: 'pretty' }}>
          Matching to osobny profil, który pozwala ci określić kogo chcesz spotkać na konkretnym wydarzeniu — i kto chce spotkać ciebie.
        </p>
      </div>

      <div className="col gap-3" style={{ marginTop: 32 }}>
        {[
          { icon: 'lock', title: 'Pełna prywatność',
            text: 'Twój profil Matching jest oddzielony od twojego głównego konta nietabu. Nikt nie zobaczy że to ty.' },
          { icon: 'calendar', title: 'Per wydarzenie',
            text: 'Każdy event = osobna deklaracja. Możesz być inną osobą na różnych imprezach.' },
          { icon: 'message', title: 'Bez nacisku',
            text: 'Zdjęcie zobaczy tylko osoba, która sama szuka kogoś takiego jak ty.' },
        ].map((item, i) => (
          <div key={i} className="card card-pad" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius)',
              background: 'rgba(66,65,116,0.10)', color: 'var(--accent-brand)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name={item.icon} size={20}/>
            </div>
            <div className="col gap-1 flex1">
              <div className="h4">{item.title}</div>
              <div className="body" style={{ color: 'rgb(var(--grey-700))' }}>{item.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <PrivacyInfo>
          <strong>Twoje zdjęcie z profilu Matching pojawia się TYLKO przed osobami, które same szukają kogoś takiego jak ty.</strong> Inni go nie zobaczą — nawet w listach. Nikt też nie ma jak skojarzyć profilu Matching z twoim głównym kontem na nietabu.
        </PrivacyInfo>
      </div>

      <div className="col center gap-3" style={{ marginTop: 36 }}>
        <button className="btn btn-primary btn-lg" style={{ minWidth: 280, padding: '16px 28px', fontSize: 16 }}
                onClick={() => onNav && onNav('E6')}>
          Załóż profil Matching
        </button>
        <a className="body mute" style={{ cursor: 'pointer' }} onClick={() => onNav && onNav('E1')}>
          Może później
        </a>
      </div>
    </div>
  </NtFrame>
);

/* ============================================================
   E6 — Onboarding formularz
   ============================================================ */
const E6_Form = ({ onNav, edit = false }) => {
  const [identity, setIdentity] = useState('Kobieta');
  const [bio, setBio] = useState(edit ? 'Otwarta, ciekawa, lubię konwersacje które nie boją się tematu.' : '');
  const [city, setCity] = useState(edit ? 'Warszawa' : '');
  return (
    <NtFrame matchingActive onNav={onNav} active="" noRail>
      <div style={{ maxWidth: 580, margin: '20px auto 60px' }}>
        <div style={{ marginBottom: 8 }}>
          <span className="overline">{edit ? 'Edycja' : 'Krok 2 z 3'}</span>
        </div>
        <h1 className="h-display">{edit ? 'Edytuj profil Matching' : 'Twój profil Matching'}</h1>
        <p className="body mute" style={{ marginTop: 10 }}>3 pola. Możesz to zmienić w każdej chwili.</p>

        <div className="col gap-6" style={{ marginTop: 32 }}>
          {/* Photo */}
          <div className="field-group">
            <label className="field-label">Zdjęcie <span className="req">*</span></label>
            <div className="row gap-4 items-start">
              {edit
                ? <div className="photo photo-3" style={{ width: 140, aspectRatio: '4 / 5', borderRadius: 'var(--radius)' }}/>
                : <div className="photo-upload">
                    <Icon name="plus" size={24}/>
                    <span className="caption" style={{ color: 'inherit' }}>Dodaj zdjęcie</span>
                  </div>
              }
              <div className="field-helper flex1">
                Pojawi się tylko przed osobami z którymi masz wzajemne dopasowanie. Nie musi pokazywać twarzy — może być sylwetka, plecy, cokolwiek czujesz że cię reprezentuje.
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="field-group">
            <label className="field-label">Kim jesteś? <span className="req">*</span></label>
            <div className="chip-group">
              {['Kobieta','Mężczyzna','Para','Osoba niebinarna'].map(opt => (
                <button key={opt}
                        className={'chip' + (identity === opt ? ' selected' : '')}
                        onClick={() => setIdentity(opt)}>
                  {identity === opt && <Icon name="check" size={14}/>}
                  {opt}
                </button>
              ))}
            </div>
            <div className="field-helper">
              Możesz to zmienić w każdej chwili. Dla par: zakładacie wspólne konto Matching.
            </div>
          </div>

          {/* City */}
          <div className="field-group">
            <label className="field-label">Miasto <span className="req">*</span></label>
            <div className="row gap-2 wrap">
              <input className="field-input" style={{ flex: 1, minWidth: 240 }}
                     value={city} onChange={e => setCity(e.target.value)}
                     placeholder="np. Warszawa"/>
              <button className="chip">🌍 Wszędzie</button>
            </div>
            <div className="field-helper">
              Wybierz z polskich miast lub wpisz własne. Widoczne publicznie na twoim profilu Matching i używane do dobierania wydarzeń.
            </div>
          </div>

          {/* Bio */}
          <div className="field-group">
            <label className="field-label">O tobie</label>
            <textarea className="field-textarea"
                      value={bio} onChange={e => setBio(e.target.value)}
                      maxLength={200}
                      placeholder="Krótko: czego ludzie powinni się o tobie spodziewać"/>
            <div className="row between">
              <span className="field-helper">Bio jest globalne. Na wydarzeniu możesz dodać dodatkowy kontekst.</span>
              <span className="field-counter">{bio.length}/200</span>
            </div>
          </div>

          <div className="row gap-3" style={{ marginTop: 8 }}>
            <button className="btn btn-primary btn-lg" onClick={() => onNav && onNav(edit ? 'E8' : 'E7')}>
              {edit ? 'Zapisz zmiany' : 'Zapisz profil'}
            </button>
            {edit && (
              <button className="btn btn-ghost btn-lg" onClick={() => onNav && onNav('E8')}>Anuluj</button>
            )}
          </div>
        </div>
      </div>
    </NtFrame>
  );
};

/* ============================================================
   E7 — Success
   ============================================================ */
const E7_Success = ({ onNav }) => (
  <NtFrame matchingActive onNav={onNav} active="" noRail>
    <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center' }}>
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-brand), rgb(var(--nietabu-magenta)))',
        color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 40, marginBottom: 24,
        boxShadow: '0 20px 40px rgba(66,65,116,0.25)',
      }}>
        <Icon name="check" size={48} strokeWidth={2.5}/>
      </div>
      <h1 className="h-display xl">Gotowe ✨</h1>
      <p className="body" style={{ marginTop: 14, fontSize: 17 }}>
        Twój profil Matching jest aktywny. Teraz wybierz wydarzenie i zadeklaruj swoją intencję, żeby zacząć dostawać dopasowania.
      </p>
      <div className="row center gap-3" style={{ marginTop: 32 }}>
        <button className="btn btn-primary btn-lg" onClick={() => onNav && onNav('E1')}>
          Przejdź do wydarzeń
        </button>
        <button className="btn btn-outline btn-lg" onClick={() => onNav && onNav('E8')}>
          Zobacz mój profil
        </button>
      </div>
    </div>
  </NtFrame>
);

/* ============================================================
   E8 — Mój profil Matching
   ============================================================ */
const E8_Profile = ({ onNav }) => (
  <NtFrame persona="P3" matchingActive onNav={onNav} active="">
    <div className="col gap-6">
      {/* Profile header card */}
      <div className="card card-pad" style={{ padding: 28 }}>
        <div className="row gap-5 wrap">
          <div className="photo photo-3" style={{ width: 120, height: 150, borderRadius: 'var(--radius-large)' }}/>
          <div className="col flex1 gap-2">
            <div className="row gap-2 wrap items-baseline">
              <h1 className="h1">Twój profil Matching</h1>
              <span className="pill pill-brand pill-lg">Aktywny</span>
            </div>
            <div className="row gap-2 wrap" style={{ marginTop: 4 }}>
              <span className="pill pill-solid">Kobieta</span>
              <span className="pill"><Icon name="pin" size={11}/> Warszawa</span>
              <span className="pill">3 nowe dopasowania</span>
            </div>
            <p className="body" style={{ marginTop: 8, fontStyle: 'italic', color: 'rgb(var(--grey-800))' }}>
              "Otwarta, ciekawa, lubię konwersacje które nie boją się tematu."
            </p>
            <div className="caption mute" style={{ marginTop: 4 }}>
              <Icon name="eye-off" size={12}/> Twoje zdjęcie widzą tylko osoby pasujące do twojego filtra
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onNav && onNav('E9')}>
            <Icon name="pencil" size={13}/> Edytuj
          </button>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="col gap-3">
        <div className="row between items-baseline wrap">
          <h2 className="h2">Ostatnia aktywność</h2>
          <span className="caption mute">Dopasowania, deklaracje i zapisy — w kolejności jak się działy</span>
        </div>

        <div className="timeline">
          {/* Match — single */}
          <div className="timeline-item">
            <span className="timeline-dot"/>
            <div className="card card-pad">
              <div className="row between items-baseline">
                <span className="ti-kind">Nowe dopasowanie</span>
                <span className="caption mute">2 godz. temu</span>
              </div>
              <div className="row between items-baseline" style={{ marginTop: 4 }}>
                <div className="h3">Czerwony Wieczór · BDSM Beginners</div>
                <span className="pill pill-magenta">💬 Otwarty na poznanie</span>
              </div>
              <div className="meta" style={{ marginTop: 2 }}>sob. 14 cze · 22:00 · Wrocław</div>

              <div className="row gap-4 items-start" style={{ marginTop: 16 }}>
                <div className="photo photo-1" style={{ width: 80, height: 100, borderRadius: 'var(--radius)' }}/>
                <div className="col flex1 gap-2">
                  <div className="row gap-2"><span className="pill pill-solid">Kobieta</span><span className="pill"><Icon name="pin" size={11}/> Warszawa</span><span className="pill">💬 Otwarta na poznanie</span></div>
                  <div className="body" style={{ fontStyle: 'italic', color: 'rgb(var(--grey-800))' }}>
                    "Będę w czerwonej sukience, przyjdę z koleżanką"
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => onNav && onNav('E15')}>
                  Zobacz profil <Icon name="arrow-right" size={14}/>
                </button>
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="timeline-item">
            <span className="timeline-dot magenta"/>
            <div className="card card-pad">
              <div className="row between items-baseline">
                <span className="ti-kind magenta">Zadeklarowano intencję</span>
                <span className="caption mute">wczoraj</span>
              </div>
              <div className="row between items-baseline wrap" style={{ marginTop: 4 }}>
                <div className="h3">Czerwony Wieczór · BDSM Beginners</div>
                <span className="pill pill-brand">💬 Otwarty na poznanie</span>
              </div>
              <div className="meta" style={{ marginTop: 2 }}>sob. 14 cze · 22:00 · Wrocław</div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="timeline-item">
            <span className="timeline-dot grey"/>
            <div className="card" style={{ borderColor: 'rgba(169,31,105,0.25)', borderStyle: 'dashed' }}>
              <div style={{ display: 'flex' }}>
                <Banner variant="dusk" style={{ width: 140, flexShrink: 0, borderRadius: 0 }}/>
                <div className="col flex1 card-pad">
                  <div className="row between items-baseline">
                    <span className="ti-kind magenta">✷ Polecane dla ciebie</span>
                    <a className="caption mute" style={{ cursor: 'pointer' }}>ukryj</a>
                  </div>
                  <div className="h4" style={{ marginTop: 4 }}>Otwarte drzwi · Klub Sukces</div>
                  <div className="meta">pt. 27 cze · 21:00 · Kraków</div>
                  <div className="body" style={{ marginTop: 8, color: 'rgb(var(--grey-800))' }}>
                    <strong>Bo:</strong> 11 osób z twoich preferencji zadeklarowało intencję
                  </div>
                  <div className="caption mute" style={{ fontStyle: 'italic' }}>
                    7 kobiet · 4 pary · ✨ 5 chce się poznać
                  </div>
                  <div className="row gap-2" style={{ marginTop: 12 }}>
                    <button className="btn btn-primary btn-sm">Zobacz wydarzenie <Icon name="arrow-right" size={14}/></button>
                    <button className="btn btn-ghost btn-sm">Zadeklaruj intencję</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match — aggregated */}
          <div className="timeline-item">
            <span className="timeline-dot"/>
            <div className="card card-pad">
              <div className="row between items-baseline">
                <span className="ti-kind">3 nowe dopasowania</span>
                <span className="caption mute">2 dni temu</span>
              </div>
              <div className="h3" style={{ marginTop: 4 }}>Otwarty Pokój — wieczór rozmów</div>
              <div className="meta">sob. 15 cze · 21:00 · Kraków</div>
              <div className="caption mute" style={{ marginTop: 8 }}>3 osoby z twoich preferencji zadeklarowały intencję</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
                {SAMPLE_MATCHES.slice(0,3).map(m => (
                  <div
                    key={m.id}
                    className="match-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onNav && onNav('E15')}
                  >
                    <div className={`photo mc-photo ${m.photo}`} style={{ aspectRatio: '1 / 1' }}>
                      <div className="badges">
                        <span className="pill-onphoto" style={{ fontSize: 10, padding: '3px 8px' }}>{m.identity}</span>
                      </div>
                      <div
                        className="intent-glyph"
                        title={m.intent}
                        style={{ width: 26, height: 26, fontSize: 12, top: 8, right: 8 }}
                      >{m.intentEmoji}</div>
                    </div>
                    <div className="mc-body" style={{ padding: '10px 12px 12px', gap: 4 }}>
                      <div className="caption" style={{ fontWeight: 700, color: 'rgb(var(--grey-900))' }}>
                        {m.identity} · <Icon name="pin" size={10}/> {m.city}
                      </div>
                      <div className="caption" style={{ color: 'rgb(var(--grey-700))' }}>
                        {m.intentEmoji} {m.intentLabel}
                      </div>
                      <div className="mc-bio" style={{ fontSize: 12, WebkitLineClamp: 2 }}>{m.bio}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 14 }}>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => onNav && onNav('E3')}>
                  Zobacz wszystkie 3 <Icon name="arrow-right" size={14}/>
                </button>
              </div>
            </div>
          </div>

          {/* Needs intent */}
          <div className="timeline-item">
            <span className="timeline-dot magenta"/>
            <div className="card card-pad" style={{ borderStyle: 'dashed', borderColor: 'rgba(169,31,105,0.4)' }}>
              <div className="row between items-baseline">
                <span className="ti-kind magenta">Czeka na intencję</span>
                <span className="caption mute">3 dni temu</span>
              </div>
              <div className="row between items-baseline wrap" style={{ marginTop: 4 }}>
                <div className="h3">Heaven · Friday Play</div>
                <span className="pill"><Icon name="check" size={11}/> Idę</span>
              </div>
              <div className="meta">pt. 14 cze · 22:00 · Warszawa</div>
              <div className="row between items-center" style={{ marginTop: 12 }}>
                <div className="caption mute">Uzupełnij intencję żeby pojawić się w dopasowaniach.</div>
                <button className="btn btn-magenta btn-sm" onClick={() => onNav && onNav('E10')}>
                  Dodaj intencję <Icon name="arrow-right" size={14}/>
                </button>
              </div>
            </div>
          </div>

          {/* Simple RSVP */}
          <div className="timeline-item">
            <span className="timeline-dot grey"/>
            <div className="card card-pad">
              <div className="row between items-baseline">
                <span className="ti-kind grey">Zapisano się</span>
                <span className="caption mute">4 dni temu</span>
              </div>
              <div className="row between items-baseline wrap" style={{ marginTop: 4 }}>
                <div className="h3">Krąg kobiet · rozmowa o intymności</div>
                <span className="pill pill-green"><Icon name="check" size={11}/> Idę</span>
              </div>
              <div className="meta">cz. 20 cze · 19:30 · Łódź</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NtFrame>
);

/* ============================================================
   E10 — Deklaracja intencji (modal over E3)
   ============================================================ */
const E10_Intent = ({ onNav }) => {
  const [intent, setIntent] = useState('open_chat');
  const [seeking, setSeeking] = useState(['Kobieta', 'Para']);
  const [note, setNote] = useState('');

  const toggleSeek = (s) => setSeeking(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const intents = [
    { id: 'not_looking', emoji: '🌑', title: 'Nie szukam nikogo',
      desc: 'Idę, ale nie chcę żadnego kontaktu — nikt mnie nie widać w dopasowaniach i nikt do mnie nie napisze.' },
    { id: 'just_vibe', emoji: '🌙', title: 'Tylko klimat',
      desc: 'Idę poczuć atmosferę — nie przeglądam dopasowań, ale inni mogą do mnie napisać.' },
    { id: 'open_chat', emoji: '💬', title: 'Otwarty na poznanie',
      desc: 'Chętnie kogoś poznam, zobaczymy o czym.' },
  ];

  const disabled = intent === 'just_vibe' || intent === 'not_looking';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'rgb(var(--grey-300))' }}>
      {/* Faded backdrop — mimics being over E3 */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }}>
        <Banner variant="ember" style={{ height: 280 }}/>
      </div>

      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-header">
            <div>
              <h2 className="h2">Twoja intencja</h2>
              <div className="meta" style={{ marginTop: 4 }}>
                na: <strong style={{ color: 'rgb(var(--grey-900))' }}>Czerwony Wieczór · BDSM Beginners</strong> · 14 czerwca, 22:00
              </div>
            </div>
            <button className="modal-close" onClick={() => onNav && onNav('E3')}>✕</button>
          </div>
          <div className="modal-body col gap-6">
            <p className="body mute">
              Każde wydarzenie to osobna deklaracja. Nikt jej nie zobaczy poza osobami, które pasują do twojego filtra.
            </p>

            {/* Intent */}
            <div className="field-group">
              <label className="field-label">Intencja</label>
              <div className="col gap-2">
                {intents.map(it => (
                  <div key={it.id}
                       className={'intent-card' + (intent === it.id ? ' selected' : '')}
                       onClick={() => setIntent(it.id)}>
                    <div className="ic-glyph">{it.emoji}</div>
                    <div className="col flex1 gap-1">
                      <div className="h4">{it.title}</div>
                      <div className="caption" style={{ color: 'rgb(var(--grey-700))', fontSize: 13, lineHeight: 1.45 }}>
                        {it.desc}
                      </div>
                    </div>
                    <div className="ic-radio"/>
                  </div>
                ))}
              </div>
            </div>

            {intent !== 'not_looking' && (
              <>
                {/* Seeking */}
                <div className="field-group" style={{ opacity: intent === 'just_vibe' ? 0.45 : 1 }}>
                  <label className="field-label">Kogo szukasz na tym wydarzeniu?</label>
                  <div className="chip-group">
                    {['Kobieta','Mężczyzna','Para','Osoba niebinarna'].map(opt => (
                      <button key={opt}
                              className={'chip' + (seeking.includes(opt) ? ' selected' : '')}
                              disabled={intent === 'just_vibe'}
                              onClick={() => intent !== 'just_vibe' && toggleSeek(opt)}>
                        {seeking.includes(opt) && <Icon name="check" size={14}/>}
                        {opt}
                      </button>
                    ))}
                  </div>
                  {intent === 'just_vibe' && (
                    <div className="field-helper">
                      Przy „Tylko klimat" nie przeglądasz dopasowań — to pole nie jest używane.
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="field-group">
                  <label className="field-label">Notatka na tym wydarzeniu</label>
                  <textarea className="field-textarea"
                            value={note} onChange={e => setNote(e.target.value)}
                            maxLength={200}
                            placeholder='np. "Pierwszy raz w tym klubie, chętnie pogadam"'/>
                  <div className="row between">
                    <span className="field-helper">Pojawi się tylko przed twoimi dopasowaniami z tego wydarzenia.</span>
                    <span className="field-counter">{note.length}/200</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => onNav && onNav('E3')}>Anuluj</button>
            <button className="btn btn-primary" onClick={() => onNav && onNav('E11')}>
              Zapisz deklarację
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   E15 — Profil matcha
   ============================================================ */
const E15_MatchProfile = ({ onNav }) => {
  const m = SAMPLE_MATCHES[0];
  return (
    <NtFrame persona="P3" matchingActive onNav={onNav} active="events">
      <div className="row gap-2" style={{ marginBottom: 16 }}>
        <a className="body mute" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
           onClick={() => onNav && onNav('E3')}>
          <Icon name="arrow-left" size={16}/> Wróć do dopasowań
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Photo column */}
        <div className={`photo ${m.photo}`} style={{ aspectRatio: '4 / 5', borderRadius: 'var(--radius-large)' }}>
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 6 }}>
            <span className="pill-onphoto pill-lg">{m.identity}</span>
          </div>
          <div style={{ position: 'absolute', top: 16, right: 16,
            width: 40, height: 40, background: 'rgba(255,255,255,0.95)', borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            backdropFilter: 'blur(8px)' }}>
            {m.intentEmoji}
          </div>
        </div>

        {/* Content column */}
        <div className="col gap-5">
          <div className="col gap-2">
            <span className="overline">Dopasowanie z wydarzenia</span>
            <a className="h3" style={{ cursor: 'pointer', color: 'var(--accent-brand)' }}
               onClick={() => onNav && onNav('E3')}>
              Czerwony Wieczór · BDSM Beginners
            </a>
            <div className="meta">sobota, 14 czerwca 2026 · Czerwona Kotwica, Wrocław</div>
          </div>

          <div className="row gap-2 wrap">
            <span className="pill pill-brand pill-lg">{m.intentEmoji} {m.intentLabel}</span>
            <span className="pill pill-lg"><Icon name="pin" size={11}/> {m.city}</span>
          </div>

          <div className="card card-pad">
            <span className="overline">O sobie</span>
            <p className="body" style={{ marginTop: 8, fontSize: 16, color: 'rgb(var(--grey-900))' }}>
              {m.bio}
            </p>
          </div>

          {m.note && (
            <div className="card card-pad" style={{ background: 'rgba(169,31,105,0.05)', borderColor: 'rgba(169,31,105,0.25)' }}>
              <span className="overline" style={{ color: 'rgb(var(--nietabu-magenta))' }}>Notatka na tym wydarzeniu</span>
              <p className="body" style={{ marginTop: 8, fontSize: 16, fontStyle: 'italic', color: 'rgb(var(--grey-900))' }}>
                "{m.note}"
              </p>
            </div>
          )}

          <div className="card card-pad" style={{
            background: 'linear-gradient(135deg, rgba(66,65,116,0.06), rgba(169,31,105,0.04))',
            borderColor: 'rgba(66,65,116,0.18)',
          }}>
            <div className="row between gap-4 wrap">
              <div className="col gap-1">
                <div className="h3">Chcesz coś napisać?</div>
                <div className="caption mute">Konwersacja zacznie się w twoim chacie nietabu. Druga strona widzi tylko twój profil Matching.</div>
              </div>
              <button className="btn btn-primary btn-lg">
                <Icon name="send" size={16}/> Napisz
              </button>
            </div>
          </div>
        </div>
      </div>
    </NtFrame>
  );
};

Object.assign(window, {
  E1_Calendar, E2_EventHub, E5_Intro, E6_Form, E7_Success, E8_Profile,
  E10_Intent, E11_Inline, E15_MatchProfile,
});
