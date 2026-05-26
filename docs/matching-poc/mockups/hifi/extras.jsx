// Hi-Fi — extras: NT_Settings, E18 message flow, E12/E13/E14/E16/E17, header demos

/* ============================================================
   AvatarMenu — dropdown pod awatarem (z kartą profilu Matching)
   ============================================================ */
const AvatarMenuPanel = ({ persona = 'P1', onNav }) => {
  const hasMatching = persona === 'P2' || persona === 'P3';
  return (
    <div className="avatar-menu">
      <div className="am-head">
        <div className="avatar a-1" style={{ width: 44, height: 44 }}/>
        <div className="col">
          <div className="h4">Kasia B.</div>
          <div className="caption mute">@kasiabp · nietabu.pl</div>
        </div>
      </div>
      <div className="col" style={{ padding: '6px 0' }}>
        <div className="am-row">
          <span className="glyph"><Icon name="profile" size={16}/></span>
          <span>Mój profil nietabu</span>
          <span className="arrow"><Icon name="arrow-right" size={14}/></span>
        </div>
        {hasMatching ? (
          <div className="am-matching" onClick={() => onNav && onNav('E8')}>
            <div className="photo photo-3" style={{ width: 40, height: 40, borderRadius: '50%' }}/>
            <div className="col flex1" style={{ gap: 2 }}>
              <div className="overline" style={{ color: 'var(--accent-brand)', fontSize: 10 }}>
                Twój profil Matching
              </div>
              <div className="body" style={{ fontSize: 13, fontWeight: 700 }}>
                Kobieta · <span className="mute" style={{ fontWeight: 500 }}>📍 Warszawa</span>
              </div>
            </div>
            <Icon name="arrow-right" size={14} color="rgb(66,65,116)"/>
          </div>
        ) : (
          <div className="am-suggest" onClick={() => onNav && onNav('E5')}>
            <div style={{ width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(66,65,116,0.10)', color: 'var(--accent-brand)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkle" size={18}/>
            </div>
            <div className="col flex1" style={{ gap: 2 }}>
              <div className="body" style={{ fontSize: 13, fontWeight: 700 }}>Załóż profil Matching</div>
              <div className="caption mute">osobny, prywatny</div>
            </div>
          </div>
        )}
        <div className="am-divider"/>
        <div className="am-row" onClick={() => onNav && onNav('NT-settings-profil')}>
          <span className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
          <span>Ustawienia</span>
        </div>
        <div className="am-row">
          <span className="glyph">🌙</span>
          <span>Tryb ciemny</span>
          <span className="switch" style={{ marginLeft: 'auto' }}/>
        </div>
        <div className="am-row" style={{ color: 'rgb(var(--grey-600))' }}>
          <span className="glyph"><Icon name="arrow-left" size={16}/></span>
          <span>Wyloguj</span>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   Header demos — badge ✨ + avatar dropdown
   ============================================================ */
const HeaderBadgeDemo = ({ persona = 'P3', onNav }) => (
  <NtFrame persona={persona} matchingActive onNav={onNav} active="events">
    <div className="col gap-4">
      <h1 className="h-display">Pasek górny · ✨ Matching</h1>
      <p className="body mute" style={{ maxWidth: 640 }}>
        Ikona <strong>✨</strong> w pasku górnym = wejście do mojego Matching, z badge'em nowych aktywności (jak powiadomienia).
      </p>
      <div className="card card-pad" style={{ maxWidth: 720 }}>
        <span className="overline">Reguły wskaźnika ✨</span>
        <ul className="body" style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
          <li>Pojawia się <strong>tylko</strong> jeśli masz profil Matching (P2 / P3). Dla P1 znika z paska.</li>
          <li>Badge liczy <strong>nieprzeczytane</strong> aktywności: nowe dopasowania, czekające intencje, nowe wiadomości od matchy.</li>
          <li>Klik → przenosi do „Mój Matching" (E8 — feed aktywności).</li>
          <li>Badge zeruje się po wejściu w listę aktywności.</li>
        </ul>
      </div>
    </div>
  </NtFrame>
);

const HeaderAvatarMenuDemo = ({ persona = 'P3', onNav }) => (
  <div style={{ position: 'relative', minHeight: '100%' }}>
    <NtFrame persona={persona} matchingActive={persona !== 'P1'} onNav={onNav} active="events">
      <div className="col gap-4">
        <h1 className="h-display">Awatar nietabu · dropdown</h1>
        <p className="body mute" style={{ maxWidth: 640 }}>
          Klik w awatar (w prawym górnym rogu) otwiera menu z kartą profilu Matching ({persona === 'P1' ? 'P1 → miękka propozycja założenia' : 'P2/P3 → karta z twoim zdjęciem i tożsamością'}).
        </p>
        <div className="card card-pad" style={{ maxWidth: 720 }}>
          <span className="overline">Co jest w menu</span>
          <ul className="body" style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li><strong>Mój profil nietabu</strong> — publiczny profil</li>
            <li><strong>{persona === 'P1' ? 'Załóż profil Matching' : 'Twój profil Matching'}</strong> — {persona === 'P1' ? 'miękka propozycja, dashed border' : 'karta z fotką + tożsamością, klik → E8'}</li>
            <li>Ustawienia, tryb ciemny, wyloguj</li>
          </ul>
        </div>
      </div>
    </NtFrame>
    {/* Render avatar menu as overlay positioned to header avatar */}
    <div style={{ position: 'absolute', top: 12, right: 20, zIndex: 60 }}>
      <AvatarMenuPanel persona={persona} onNav={onNav}/>
    </div>
  </div>
);

/* ============================================================
   NT_Settings — Ustawienia, z zakładką ✨ Matching (edycja profilu)
   ============================================================ */
const NT_Settings = ({ activeTab = 'profil', persona = 'P3', onNav }) => {
  const hasMatching = persona === 'P2' || persona === 'P3';
  const [identity, setIdentity] = useState('Kobieta');
  const [city, setCity] = useState('Warszawa');
  const [bio, setBio] = useState('Otwarta, ciekawa, lubię konwersacje które nie boją się tematu.');
  const [active, setActive] = useState(true);
  const [notifMatches, setNotifMatches] = useState(true);
  const [notifMsg, setNotifMsg] = useState(true);

  const tabs = [
    { id: 'profil', label: 'Profil', icon: 'profile' },
    ...(hasMatching ? [{ id: 'matching', label: 'Matching', icon: 'sparkle', count: 3 }] : []),
    { id: 'konto', label: 'Konto', icon: 'lock' },
    { id: 'personalizacja', label: 'Personalizacja', icon: 'eye' },
    { id: 'powiadomienia', label: 'Powiadomienia', icon: 'bell' },
    { id: 'bezpieczenstwo', label: 'Bezpieczeństwo', icon: 'lock' },
    { id: 'organizacje', label: 'Organizacje', icon: 'users' },
    { id: 'rozszerzenia', label: 'Rozszerzenia', icon: 'plus' },
  ];

  return (
    <NtFrame persona={persona} matchingActive={hasMatching} onNav={onNav} active="" noRail>
      <div className="row gap-2" style={{ marginBottom: 8 }}>
        <a className="body mute" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
           onClick={() => onNav && onNav('E1')}>
          <Icon name="arrow-left" size={16}/> nietabu
        </a>
      </div>
      <h1 className="h-display lg" style={{ marginBottom: 24 }}>Ustawienia</h1>

      <div className="settings-shell">
        <aside className="settings-nav">
          {tabs.map(tab => (
            <a key={tab.id}
               className={'tab' + (activeTab === tab.id ? ' active' : '')}
               onClick={() => onNav && onNav(tab.id === 'matching' ? 'NT-settings-matching' : `NT-settings-${tab.id}`)}>
              <span className="glyph"><Icon name={tab.icon} size={16}/></span>
              <span>{tab.label}</span>
              {tab.count && <span className="count">{tab.count}</span>}
            </a>
          ))}
        </aside>

        <div className="col gap-5">
          {activeTab === 'profil' && (
            <>
              <div className="card card-pad" style={{ padding: 28 }}>
                <div className="ss-head">
                  <h2 className="h2">Profil publiczny</h2>
                  <p className="caption mute" style={{ marginTop: 4 }}>
                    Widoczne dla wszystkich w nietabu — na twoim profilu i przy postach.
                  </p>
                </div>

                <div className="row gap-4 items-center" style={{ marginBottom: 20 }}>
                  <div className="avatar a-1" style={{ width: 64, height: 64 }}/>
                  <div className="col flex1">
                    <div className="field-label">Zdjęcie profilowe</div>
                    <div className="caption mute">JPG, PNG, max 5 MB</div>
                  </div>
                  <button className="btn btn-outline btn-sm">Zmień</button>
                </div>

                <div className="col gap-5">
                  <div className="field-group">
                    <label className="field-label">Nazwa użytkownika</label>
                    <input className="field-input" defaultValue="@kasiabp"/>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Wyświetlana nazwa</label>
                    <input className="field-input" defaultValue="Kasia B."/>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Bio</label>
                    <textarea className="field-textarea" defaultValue="Kilka słów o tobie — pojawi się na twoim publicznym profilu."/>
                  </div>
                  <div className="row gap-4">
                    <div className="field-group flex1">
                      <label className="field-label">Lokalizacja</label>
                      <input className="field-input" defaultValue="Warszawa"/>
                    </div>
                    <div className="field-group flex1">
                      <label className="field-label">Strona www</label>
                      <input className="field-input" placeholder="—"/>
                    </div>
                  </div>
                </div>

                <div className="row gap-3" style={{ marginTop: 24 }}>
                  <button className="btn btn-primary">Zapisz</button>
                  <button className="btn btn-ghost">Anuluj</button>
                </div>
              </div>

              {hasMatching && (
                <div className="card card-pad" style={{
                  background: 'linear-gradient(135deg, rgba(66,65,116,0.04), rgba(169,31,105,0.04))',
                  borderColor: 'rgba(66,65,116,0.20)',
                }}>
                  <div className="row between gap-3 wrap">
                    <div className="col flex1 gap-1">
                      <div className="row gap-2 items-baseline">
                        <Icon name="sparkle" size={18} color="rgb(66,65,116)"/>
                        <span className="h3">Profil Matching jest osobny</span>
                      </div>
                      <p className="body mute">
                        Edytujesz go w zakładce <strong style={{ color: 'var(--accent-brand)' }}>✨ Matching</strong>.
                        To prywatny profil — nie miesza się z publicznym.
                      </p>
                    </div>
                    <button className="btn btn-secondary"
                            onClick={() => onNav && onNav('NT-settings-matching')}>
                      Przejdź do Matching <Icon name="arrow-right" size={14}/>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'matching' && hasMatching && (
            <>
              {/* Privacy banner */}
              <div className="card card-pad" style={{
                background: 'linear-gradient(135deg, rgba(66,65,116,0.06), rgba(169,31,105,0.04))',
                borderColor: 'rgba(66,65,116,0.20)',
                padding: 24,
              }}>
                <div className="row gap-4 items-center wrap">
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'var(--accent-brand)', color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon name="lock" size={24}/>
                  </div>
                  <div className="col flex1 gap-1">
                    <div className="row gap-2 items-baseline">
                      <h2 className="h2"><Icon name="sparkle" size={20}/> Profil Matching</h2>
                      <span className="pill pill-brand pill-lg">{active ? 'Aktywny' : 'Wyłączony'}</span>
                    </div>
                    <p className="body" style={{ color: 'rgb(var(--grey-800))' }}>
                      Osobny, prywatny profil. Twoje zdjęcie i dane Matching są <strong>niepowiązane</strong> z głównym kontem nietabu. Nikt nie skojarzy tych tożsamości.
                    </p>
                  </div>
                  <div className="col gap-1 items-center">
                    <div className={'switch' + (active ? ' on' : '')} onClick={() => setActive(!active)}/>
                    <span className="caption mute">aktywny</span>
                  </div>
                </div>
              </div>

              {/* Photo + identity + city + bio */}
              <div className="card card-pad" style={{ padding: 28 }}>
                <h2 className="h2" style={{ marginBottom: 4 }}>Profil widoczny dla dopasowań</h2>
                <p className="caption mute" style={{ marginBottom: 24 }}>
                  Tak widzą cię osoby, które same szukają kogoś takiego jak ty.
                </p>

                <div className="col gap-6">
                  <div className="field-group">
                    <label className="field-label">Zdjęcie <span className="req">*</span></label>
                    <div className="row gap-4 items-start">
                      <div className="photo photo-3" style={{ width: 140, height: 175, borderRadius: 'var(--radius)', flexShrink: 0 }}/>
                      <div className="col gap-2 flex1">
                        <div className="field-helper">
                          Pojawi się tylko przed osobami z którymi masz wzajemne dopasowanie. Nie musi pokazywać twarzy — może być sylwetka, plecy, cokolwiek czujesz że cię reprezentuje.
                        </div>
                        <div className="row gap-2">
                          <button className="btn btn-outline btn-sm">Zmień zdjęcie</button>
                          <button className="btn btn-ghost btn-sm">Usuń</button>
                        </div>
                      </div>
                    </div>
                  </div>

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
                    <div className="field-helper">Możesz to zmienić w każdej chwili. Dla par: zakładacie wspólne konto Matching.</div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Miasto <span className="req">*</span></label>
                    <div className="row gap-2 wrap">
                      <input className="field-input" style={{ flex: 1, minWidth: 240 }}
                             value={city} onChange={e => setCity(e.target.value)}/>
                      <button className="chip">🌍 Wszędzie</button>
                    </div>
                    <div className="field-helper">
                      Widoczne publicznie na profilu Matching i używane do dobierania wydarzeń + dopasowań.
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Bio (globalne)</label>
                    <textarea className="field-textarea" maxLength={200}
                              value={bio} onChange={e => setBio(e.target.value)}/>
                    <div className="row between">
                      <span className="field-helper">Bio jest globalne. Na wydarzeniu możesz dodać dodatkowy kontekst (notatka w E10).</span>
                      <span className="field-counter">{bio.length}/200</span>
                    </div>
                  </div>
                </div>

                <div className="row gap-3" style={{ marginTop: 24 }}>
                  <button className="btn btn-primary">Zapisz zmiany</button>
                  <button className="btn btn-ghost" onClick={() => onNav && onNav('E8')}>
                    Zobacz moją aktywność <Icon name="arrow-right" size={14}/>
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="danger-zone">
                <h3 className="h3" style={{ marginBottom: 6 }}>Strefa niebezpieczna</h3>
                <p className="caption mute" style={{ marginBottom: 14 }}>
                  Usunięcie profilu Matching nie wpływa na twoje konto nietabu. Aktywne deklaracje i konwersacje znikną.
                </p>
                <div className="row gap-3">
                  <button className="btn btn-outline">Wyłącz profil tymczasowo</button>
                  <button className="btn" style={{ background: 'rgb(var(--red-600))', color: '#fff' }}>
                    Usuń profil Matching
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Placeholder tabs */}
          {!['profil','matching'].includes(activeTab) && (
            <div className="card card-pad">
              <h2 className="h2">{tabs.find(t => t.id === activeTab)?.label}</h2>
              <p className="body mute" style={{ marginTop: 8 }}>
                — sekcja zaślepka, poza zakresem v5 spec —
              </p>
            </div>
          )}
        </div>
      </div>
    </NtFrame>
  );
};

/* ============================================================
   E18 — Hello message · 3-step flow
     stage = 'compose' | 'sending' | 'success'
   ============================================================ */
const E18_HelloMessage = ({ stage = 'compose', identity = 'kobieta', onNav }) => {
  const sender = { kobieta: 'kobieta', mezczyzna: 'mężczyzna', para: 'para', niebinarna: 'osoba niebinarna' }[identity] || 'kobieta';
  const evName = 'Czerwony Wieczór · 14 czerwca';

  // Background: blurred E15
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'rgb(var(--grey-200))' }}>
      <div style={{ filter: 'blur(6px) brightness(0.85)', pointerEvents: 'none', height: '100%', overflow: 'hidden' }}>
        <E15_MatchProfile onNav={() => {}} />
      </div>

      <div className="modal-backdrop">
        {stage === 'compose' && (
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div>
                <h2 className="h2">Powitalna wiadomość</h2>
                <p className="caption mute" style={{ marginTop: 6, maxWidth: 420 }}>
                  To gotowy tekst. Nie da się go zmienić — żeby pierwszy kontakt był prosty i bez ciśnienia.
                </p>
              </div>
              <button className="modal-close" onClick={() => onNav && onNav('E15')}>✕</button>
            </div>
            <div className="modal-body col gap-5">
              <div>
                <span className="overline">Podgląd</span>
                <div className="chat-window" style={{ marginTop: 10 }}>
                  <div className="chat-bubble">
                    Hej! Tu <strong>{sender} z Matching</strong> — też idę na <strong>{evName}</strong> i chętnie {sender === 'para' ? 'Was poznamy' : 'Cię poznam'}.
                    <div className="profile-link">
                      <div className="pl-photo"><Icon name="sparkle" size={16} color="#fff"/></div>
                      <div className="pl-info">
                        <div className="pl-title">Mój profil Matching →</div>
                        <div className="pl-sub">{sender} · 📍 Warszawa</div>
                      </div>
                    </div>
                  </div>
                  <span className="chat-timestamp">teraz</span>
                </div>
              </div>

              <div className="info-box">
                <div className="ib-icon"><Icon name="lock" size={14}/></div>
                <div className="col gap-1" style={{ fontSize: 13 }}>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, color: 'rgb(var(--grey-800))' }}>
                    <li>Trafi do zwykłego chatu nietabu — bez dedykowanego widgetu</li>
                    <li>Druga strona widzi <strong>tylko twój profil Matching</strong>, nie konto nietabu</li>
                    <li>Wyślesz <strong>tylko raz</strong> — jeśli nie odpowie, zostaje cisza</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => onNav && onNav('E15')}>Anuluj</button>
              <button className="btn btn-primary" onClick={() => onNav && onNav('E18-sending')}>
                <Icon name="send" size={16}/> Wyślij
              </button>
            </div>
          </div>
        )}

        {stage === 'sending' && (
          <div className="modal" style={{ maxWidth: 480, padding: 48, textAlign: 'center' }}>
            <div className="send-stage">
              <svg viewBox="0 0 360 200" style={{ width: '100%', height: '100%' }}>
                <path id="arc" d="M 40 160 Q 120 30, 330 90"
                      fill="none" stroke="rgb(66,65,116)" strokeWidth="2"
                      strokeDasharray="6 6" strokeLinecap="round" opacity="0.45">
                  <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="1s" repeatCount="indefinite"/>
                </path>
                <g fill="rgb(169,31,105)">
                  <text x="60" y="140" style={{ fontSize: 22 }}>✦
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite"/>
                  </text>
                  <text x="160" y="70" style={{ fontSize: 16 }}>✶
                    <animate attributeName="opacity" values="1;0.2;1" dur="1.1s" repeatCount="indefinite"/>
                  </text>
                  <text x="280" y="110" style={{ fontSize: 20 }}>✦
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" repeatCount="indefinite"/>
                  </text>
                </g>
                <g>
                  <text style={{ fontSize: 32 }} textAnchor="middle">✉️
                    <animateMotion dur="2.4s" repeatCount="indefinite" rotate="auto">
                      <mpath href="#arc"/>
                    </animateMotion>
                  </text>
                </g>
              </svg>
            </div>
            <h2 className="h2">Wysyłam…</h2>
            <p className="body mute" style={{ marginTop: 8 }}>
              Twoja powitalna wiadomość jest w drodze do {sender === 'para' ? 'innej osoby/pary' : 'drugiej osoby'}.
            </p>
            <div className="send-dots">
              <span className="dot"/><span className="dot"/><span className="dot"/><span className="dot"/><span className="dot"/>
            </div>
            <p className="caption mute" style={{ marginTop: 24, fontStyle: 'italic' }}>
              …szyfrujemy, podpinamy twój profil Matching, zapisujemy w chacie…
            </p>
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => onNav && onNav('E18-success')}>
                (demo) pokaż success →
              </button>
            </div>
          </div>
        )}

        {stage === 'success' && (
          <div className="modal" style={{ maxWidth: 480, padding: 48, textAlign: 'center' }}>
            <div className="success-pop" style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-brand), rgb(var(--nietabu-magenta)))',
              color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(66,65,116,0.25)',
              margin: '0 auto 20px',
            }}>
              <Icon name="check" size={48} strokeWidth={2.5}/>
            </div>
            <h2 className="h-display">Wysłane ✨</h2>
            <p className="body" style={{ marginTop: 12, color: 'rgb(var(--grey-800))' }}>
              Wiadomość trafiła do chatu drugiej osoby. Jak odpowie — dostaniesz powiadomienie.
            </p>

            <div className="card flat-bg" style={{ marginTop: 24, padding: 16, textAlign: 'left', borderColor: 'rgba(66,65,116,0.16)' }}>
              <span className="overline" style={{ color: 'var(--accent-brand)' }}>Co dalej</span>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.7, fontSize: 13.5, color: 'rgb(var(--grey-800))' }}>
                <li>Konwersacja jest w twoim chacie nietabu</li>
                <li>Bez „przeczytane" — żeby nikt się nie stresował</li>
                <li>Jeśli nie odpowie w tydzień, wątek zwija się sam</li>
              </ul>
            </div>

            <div className="row center gap-3" style={{ marginTop: 28 }}>
              <button className="btn btn-primary btn-lg" onClick={() => onNav && onNav('E15')}>
                Wróć do profilu
              </button>
              <button className="btn btn-outline btn-lg">
                Przejdź do wiadomości <Icon name="arrow-right" size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   E12 — partial matches (Interested + Matching, bez deklaracji)
   ============================================================ */
const E12_Partial = ({ onNav }) => (
  <NtFrame persona="P2" matchingActive onNav={onNav} active="events">
    <h1 className="h-display">Czerwony Wieczór · BDSM Beginners</h1>
    <p className="body mute" style={{ marginTop: 6 }}>sobota, 14 czerwca · 22:00 · Wrocław</p>

    <div className="card card-pad" style={{
      marginTop: 24,
      background: 'linear-gradient(135deg, rgba(66,65,116,0.06), rgba(169,31,105,0.04))',
      borderColor: 'rgba(66,65,116,0.20)',
    }}>
      <div className="row between gap-4 wrap items-center">
        <div className="col flex1 gap-1">
          <div className="h3">Widzisz dane, ale zdjęcia są ukryte</div>
          <p className="body mute">Zadeklaruj swoją intencję, żeby zobaczyć zdjęcia i móc napisać do kogoś z dopasowań.</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => onNav && onNav('E10')}>
          Zadeklaruj intencję <Icon name="arrow-right" size={16}/>
        </button>
      </div>
    </div>

    <div className="card card-pad" style={{ marginTop: 16 }}>
      <span className="overline">Statystyki dopasowań</span>
      <div className="h3" style={{ marginTop: 8 }}>
        <strong>11 osób z nietabu</strong> zadeklarowało się na to wydarzenie
      </div>
      <div className="stat-row" style={{ marginTop: 16 }}>
        <div className="stat-cell"><div className="num">5</div><div className="lbl">kobiet</div></div>
        <div className="stat-cell"><div className="num">3</div><div className="lbl">mężczyzn</div></div>
        <div className="stat-cell"><div className="num">2</div><div className="lbl">pary</div></div>
        <div className="stat-cell"><div className="num">1</div><div className="lbl">osoba niebinarna</div></div>
      </div>
      <div className="stat-row" style={{ marginTop: 12 }}>
        <div className="stat-cell"><div className="num">10</div><div className="lbl">💬 chce kogoś poznać</div></div>
        <div className="stat-cell"><div className="num">1</div><div className="lbl">🌙 tylko klimat</div></div>
      </div>
    </div>

    <div className="match-grid" style={{ marginTop: 24 }}>
      {SAMPLE_MATCHES.slice(0,4).map(m => (
        <MatchCardBlurred key={m.id} m={m}/>
      ))}
    </div>
    <p className="caption mute" style={{ marginTop: 8, fontStyle: 'italic' }}>
      Pokazujemy 4 z 11. Pełna lista i zdjęcia odkryją się po twojej deklaracji.
    </p>
  </NtFrame>
);

/* ============================================================
   E13 — ogólny licznik (Interested + bez Matching)
   ============================================================ */
const E13_General = ({ onNav }) => (
  <NtFrame persona="P1" onNav={onNav} active="events">
    <h1 className="h-display">Czerwony Wieczór · BDSM Beginners</h1>
    <p className="body mute" style={{ marginTop: 6 }}>sobota, 14 czerwca · 22:00 · Wrocław</p>

    <div className="card card-pad" style={{
      marginTop: 32,
      padding: 40,
      textAlign: 'center',
      background: 'linear-gradient(135deg, rgba(66,65,116,0.06), rgba(169,31,105,0.04))',
      borderColor: 'rgba(66,65,116,0.20)',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--accent-brand)', color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <Icon name="sparkle" size={28}/>
      </div>
      <h2 className="h-display" style={{ color: 'var(--accent-brand)' }}>9 osób z nietabu</h2>
      <p className="body" style={{ marginTop: 10, fontSize: 17, maxWidth: 460, margin: '10px auto 0' }}>
        deklaruje, że chce kogoś poznać na tym wydarzeniu.
      </p>
      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary btn-lg" onClick={() => onNav && onNav('E5')}>
          Załóż profil Matching, żeby zobaczyć kto <Icon name="arrow-right" size={16}/>
        </button>
      </div>
    </div>
  </NtFrame>
);

/* ============================================================
   E14 — empty matches
   ============================================================ */
const E14_EmptyMatches = ({ onNav }) => (
  <NtFrame persona="P3" matchingActive onNav={onNav} active="events">
    <div className="row gap-2" style={{ marginBottom: 16 }}>
      <a className="body mute" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
         onClick={() => onNav && onNav('E3')}>
        <Icon name="arrow-left" size={16}/> Wróć do wydarzenia
      </a>
    </div>
    <h1 className="h-display">Dopasowania · Czerwony Wieczór</h1>
    <p className="body mute" style={{ marginTop: 6 }}>sobota, 14 czerwca · 22:00 · Wrocław</p>

    <div className="row gap-2 wrap" style={{ marginTop: 12 }}>
      <span className="pill pill-brand pill-lg">💬 Otwarty na poznanie</span>
    </div>

    <div className="card card-pad empty-state" style={{ marginTop: 24, padding: 60 }}>
      <div className="glyph" style={{ background: 'rgba(66,65,116,0.10)', color: 'var(--accent-brand)' }}>
        🌙
      </div>
      <h2 className="h2">Jeszcze nikt nie pasuje do twojego filtra</h2>
      <p className="body" style={{ marginTop: 12, maxWidth: 460, margin: '12px auto 0' }}>
        Bądź pierwszy/a. Twoja deklaracja jest zapisana — gdy ktoś kompatybilny z nietabu się zadeklaruje, dowiesz się.
      </p>
      <p className="caption mute" style={{ marginTop: 8 }}>
        Możesz też zmienić filtr „Kogo szukasz", żeby zobaczyć więcej osób.
      </p>
      <div className="row center gap-3" style={{ marginTop: 24 }}>
        <button className="btn btn-primary btn-lg" onClick={() => onNav && onNav('E10')}>
          Zmień deklarację
        </button>
        <button className="btn btn-outline btn-lg" onClick={() => onNav && onNav('E1')}>
          Wróć do wydarzeń
        </button>
      </div>
    </div>
  </NtFrame>
);

/* ============================================================
   E16 — empty events
   ============================================================ */
const E16_EmptyEvents = ({ onNav }) => (
  <NtFrame persona="P3" matchingActive onNav={onNav} active="events">
    <h1 className="h-display lg">Wydarzenia</h1>
    <p className="body mute" style={{ marginTop: 8, maxWidth: 580 }}>
      Sprawdź co się dzieje w polskiej scenie i zadeklaruj swoje zainteresowanie.
    </p>

    <div className="card card-pad empty-state" style={{ marginTop: 32, padding: 80 }}>
      <div className="glyph">📅</div>
      <h2 className="h2">Brak nadchodzących wydarzeń</h2>
      <p className="body" style={{ marginTop: 12, maxWidth: 460, margin: '12px auto 0' }}>
        Pracujemy nad dodawaniem nowych eventów. Wracaj wkrótce!
      </p>
      <div className="row center gap-3" style={{ marginTop: 24 }}>
        <button className="btn btn-outline btn-lg" onClick={() => onNav && onNav('E5')}>
          Jak działa Matching? <Icon name="arrow-right" size={14}/>
        </button>
      </div>
    </div>

    <div className="submit-event" style={{ marginTop: 24 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius)',
        background: '#fff', border: '1px solid var(--card-border)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgb(var(--grey-700))',
      }}>
        <Icon name="plus" size={20}/>
      </div>
      <div className="flex1">
        <div className="h4">Organizujesz wydarzenie?</div>
        <div className="caption mute" style={{ marginTop: 2 }}>Napisz do nas — dodamy je ręcznie.</div>
      </div>
      <button className="btn btn-outline btn-sm">Napisz do nas <Icon name="arrow-right" size={14}/></button>
    </div>
  </NtFrame>
);

/* ============================================================
   E17 — Filters expanded
   ============================================================ */
const E17_Filters = ({ onNav }) => {
  const [cities, setCities] = useState(['Warszawa', 'Kraków']);
  const toggleCity = (c) => setCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  return (
    <NtFrame onNav={onNav} active="events">
      <h1 className="h-display lg">Wydarzenia</h1>
      <p className="body mute" style={{ marginTop: 8 }}>Filtruj wydarzenia po mieście i dacie.</p>

      <div className="card card-pad" style={{ marginTop: 24, padding: 28 }}>
        <div className="row between items-baseline" style={{ marginBottom: 20 }}>
          <h2 className="h2"><Icon name="filter" size={20}/> Filtry</h2>
          <a className="caption mute" style={{ cursor: 'pointer' }}>Wyczyść filtry</a>
        </div>

        <div className="col gap-6">
          <div className="field-group">
            <label className="field-label">Miasto</label>
            <div className="chip-group">
              {['Warszawa','Kraków','Wrocław','Poznań','Łódź','Trójmiasto','Katowice','Lublin','Białystok','Bydgoszcz','Szczecin','Inne'].map(c => (
                <button key={c}
                        className={'chip' + (cities.includes(c) ? ' selected' : '')}
                        onClick={() => toggleCity(c)}>
                  {cities.includes(c) && <Icon name="check" size={14}/>}
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="row gap-4 wrap">
            <div className="field-group flex1" style={{ minWidth: 220 }}>
              <label className="field-label">Od daty</label>
              <input type="date" className="field-input" defaultValue="2026-06-14"/>
            </div>
            <div className="field-group flex1" style={{ minWidth: 220 }}>
              <label className="field-label">Do daty</label>
              <input type="date" className="field-input" defaultValue="2026-07-14"/>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Typ wydarzenia</label>
            <div className="chip-group">
              {['Klubowe','Warsztat','Spotkanie / krąg','Wykład','BDSM','Tantra','Swing','Otwarte'].map(c => (
                <button key={c} className="chip">{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="row gap-3" style={{ marginTop: 24 }}>
          <button className="btn btn-primary btn-lg" onClick={() => onNav && onNav('E1')}>
            Pokaż wyniki (12)
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => onNav && onNav('E1')}>Anuluj</button>
        </div>
      </div>

      {/* Preview underneath */}
      <div style={{ marginTop: 24, opacity: 0.5 }}>
        <DayHeader day={14} dayOfWeek="PIĄTEK" month="czerwca 2026" count={2}/>
        <div className="col gap-2" style={{ marginTop: 12 }}>
          <EventCard ev={SAMPLE_DAYS[0].events[0]}/>
        </div>
      </div>
    </NtFrame>
  );
};

Object.assign(window, {
  AvatarMenuPanel, HeaderBadgeDemo, HeaderAvatarMenuDemo,
  NT_Settings, E18_HelloMessage,
  E12_Partial, E13_General, E14_EmptyMatches, E16_EmptyEvents, E17_Filters,
});
