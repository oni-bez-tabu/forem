// Main app — assemble canvas with all sections

const { useState, useEffect } = React;

/* ===== Tweaks panel ===== */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "persona": "P1",
  "lowCount": false,
  "linkType": "internal",
  "bannerKind": "uploaded",
  "rsvp": "none",
  "intent": "open_chat",
  "showEmpty": false,
  "heroRatio": "21:9"
}/*EDITMODE-END*/;

const TweaksApp = () => {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    window.__wfCtx = t;
    window.dispatchEvent(new CustomEvent('wf-ctx-change'));
  }, [t]);

  return (
    <TweaksPanel title="Tweaks · perspektywa">
      <TweakSection title="Persona">
        <TweakRadio value={t.persona} onChange={v => setT('persona', v)}
          options={[
            { value: 'P1', label: 'P1 · bez Matching' },
            { value: 'P2', label: 'P2 · Matching, bez deklaracji' },
            { value: 'P3', label: 'P3 · z deklaracją' },
          ]} />
      </TweakSection>
      <TweakSection title="Stan eventu">
        <TweakRadio value={t.rsvp} onChange={v => setT('rsvp', v)} label="Twój RSVP"
          options={[{value:'none', label:'brak'},{value:'going', label:'idę'},{value:'interested', label:'zainteresowany'}]} />
        <TweakToggle value={t.lowCount} onChange={v => setT('lowCount', v)} label="Low-count framing (≤2 RSVP)" />
        <TweakRadio value={t.linkType} onChange={v => setT('linkType', v)} label="Pełen opis"
          options={[{value:'internal', label:'post nietabu'},{value:'external', label:'zewn. ↗'}]} />
        <TweakRadio value={t.bannerKind} onChange={v => setT('bannerKind', v)} label="Banner"
          options={[{value:'uploaded', label:'uploadowany'},{value:'mesh', label:'auto-gen'}]} />
        <TweakSelect value={t.heroRatio} onChange={v => setT('heroRatio', v)} label="Hero ratio"
          options={[{value:'21:9', label:'21:9'},{value:'16:9', label:'16:9'},{value:'3:1', label:'3:1'}]} />
      </TweakSection>
      <TweakSection title="Matching">
        <TweakSelect value={t.intent} onChange={v => setT('intent', v)} label="Intencja w E10"
          options={[
            {value:'just_vibe', label:'🌙 Tylko klimat'},
            {value:'open_chat', label:'💬 Otwarty na poznanie'},
            {value:'open_chem', label:'✨ Otwarty na chemię'},
          ]} />
        <TweakToggle value={t.showEmpty} onChange={v => setT('showEmpty', v)} label="Empty states (E14, E16, E8 empty)" />
      </TweakSection>
    </TweaksPanel>
  );
};

/* ===== Canvas assembly ===== */
const ScreenWrap = ({ children }) => {
  // re-render on tweak change
  const [, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick(t => t + 1);
    window.addEventListener('wf-ctx-change', h);
    return () => window.removeEventListener('wf-ctx-change', h);
  }, []);
  return children;
};

const goto = (id) => {
  // jump artboard into focus
  const el = document.querySelector(`[data-artboard-id="${id}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // try clicking focus on the wrapped artboard
    const focusBtn = el.querySelector('[data-focus-trigger]');
    if (focusBtn) focusBtn.click();
  }
};

const App = () => {
  const t = window.__wfCtx || TWEAK_DEFAULTS;
  const showEmpty = t.showEmpty;
  const rsvpState = t.rsvp === 'none' ? null : t.rsvp;

  return (
    <>
      <TweaksApp />
      <DesignCanvas
        title="nie!tabu · Matching + Events — wireframes (low-fi)"
        subtitle="17 ekranów + eksploracje · klikalne · v5 spec"
      >
        {/* SECTION 0 — Intro */}
        <DCSection id="intro" title="📋 Kontekst" defaultCollapsed={false}>
          <DCArtboard id="intro" label="Read me first" width={760} height={580}>
            <div style={{ padding: 32, fontFamily: 'var(--hand)', background: 'var(--paper)', height: '100%' }}>
              <h1 className="wf-h1">nie<span style={{color:'var(--magenta)'}}>!</span>tabu · Matching + Events</h1>
              <div className="wf-h3 mt-2" style={{color: 'var(--ink-soft)'}}>Low-fi wireframes — exploring structure & flow</div>

              <div className="mt-4 wf-body">
                17 ekranów według specyfikacji v5, w stylu sketchy. Cel: szybko zobaczyć strukturę zanim wejdziemy w hi-fi.
              </div>

              <div className="mt-6">
                <div className="wf-h4">Jak czytać tę tablicę</div>
                <ul className="wf-body mt-2" style={{paddingLeft: 20, lineHeight: 1.7}}>
                  <li><strong>Eksploracje</strong> — warianty kluczowych komponentów (banner, EventCard, hero, MatchCard, IntentCard, E10 modal vs sidebar, E1 layout)</li>
                  <li><strong>Events flow</strong> (E1–E4, E16, E17) — discovery do RSVP</li>
                  <li><strong>Matching onboarding</strong> (E5–E9) — profil i edycja</li>
                  <li><strong>Matching · dopasowania</strong> (E10–E15) — deklaracja, lista, profil matcha</li>
                </ul>
              </div>

              <div className="mt-6">
                <div className="wf-h4">Panel Tweaks ↗ (góra)</div>
                <div className="wf-body mt-2">Włącz Tweaks w toolbarze, żeby przełączać:</div>
                <ul className="wf-body mt-1" style={{paddingLeft: 20, lineHeight: 1.6}}>
                  <li>Personę (P1/P2/P3) — wpływa na E2/E4 i sekcję Matching</li>
                  <li>Low-count framing (≤2 RSVP) — pokazuje "Bądź pierwszą osobą"</li>
                  <li>Internal vs external link na pełen opis</li>
                  <li>Banner uploadowany vs auto-gen</li>
                  <li>Stan RSVP użytkownika (brak / idę / zainteresowany)</li>
                  <li>Intencja w E10 (just_vibe → wyłącza pola "Kogo szukasz" i notatkę)</li>
                  <li>Empty states (E14, E16, E8 pusty)</li>
                </ul>
              </div>

              <div className="mt-6">
                <div className="wf-h4">Nawigacja</div>
                <div className="wf-body mt-2">Każdy artboard można otworzyć fullscreen przez ikonę w prawym górnym rogu (lub Enter na fokus). Klikalne linki wewnątrz prototypu scrollują do odpowiedniego ekranu i otwierają go w focus mode.</div>
              </div>

              <StickyNote rotate={-2} style={{marginTop: 24}}>
                Specka v5 = source of truth. Copy 1:1 z dokumentu. Dane testowe: realne polskie miasta + fikcyjne kluby (Heaven, Czerwona Kotwica, Klub Sukces…).
              </StickyNote>
            </div>
          </DCArtboard>
        </DCSection>

        {/* SECTION 1 — EXPLORATIONS */}
        <DCSection id="explorations" title="🔍 Eksploracje wariantów" defaultCollapsed={false}>
          <DCArtboard id="exp-banner" label="Auto-gen banner — propozycje" width={920} height={520}>
            <div style={{padding: 20, background: 'var(--paper)', height:'100%', overflow:'auto'}}><BannerProposals /></div>
          </DCArtboard>
          <DCArtboard id="exp-eventcard" label="EventCard — kompozycje" width={620} height={760}>
            <div style={{padding: 20, background: 'var(--paper)', height:'100%', overflow:'auto'}}><EventCardVariants /></div>
          </DCArtboard>
          <DCArtboard id="exp-hero" label="Hero — proporcje E2/E3/E4" width={620} height={780}>
            <div style={{padding: 20, background: 'var(--paper)', height:'100%', overflow:'auto'}}><HeroRatioVariants /></div>
          </DCArtboard>
          <DCArtboard id="exp-matchcard" label="MatchCard — proporcje zdjęcia" width={780} height={520}>
            <div style={{padding: 20, background: 'var(--paper)', height:'100%', overflow:'auto'}}><MatchCardVariants /></div>
          </DCArtboard>
          <DCArtboard id="exp-intent" label="IntentCard — wybór intencji" width={560} height={780}>
            <div style={{padding: 20, background: 'var(--paper)', height:'100%', overflow:'auto'}}><IntentCardVariants /></div>
          </DCArtboard>
          <DCArtboard id="exp-e10-mode" label="E10 — modal vs sidebar vs strona" width={1320} height={420}>
            <div style={{padding: 20, background: 'var(--paper)', height:'100%', overflow:'hidden'}}><E10ModeVariants /></div>
          </DCArtboard>
          <DCArtboard id="exp-e1-layout" label="E1 — układ kalendarium" width={1280} height={620}>
            <div style={{padding: 20, background: 'var(--paper)', height:'100%', overflow:'auto'}}><E1LayoutVariants /></div>
          </DCArtboard>
        </DCSection>

        {/* SECTION 1b — INTEGRACJA Z SYSTEMEM NIETABU */}
        <DCSection id="system-integration" title="🧩 Integracja z systemem nietabu" defaultCollapsed={false}>
          <DCArtboard id="NT-header-badge-P3" label="Pasek górny · ✨ Matching z badge (P3)" width={1100} height={500}>
            <ScreenWrap><HeaderMatchingBadgeDemo goto={goto} persona="P3" /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="NT-header-badge-P2" label="Pasek górny · ✨ Matching z badge (P2)" width={1100} height={500}>
            <ScreenWrap><HeaderMatchingBadgeDemo goto={goto} persona="P2" /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="NT-avatar-menu-P3" label="Awatar nietabu · dropdown z profilem Matching (P3)" width={1100} height={620}>
            <ScreenWrap><HeaderAvatarMenuDemo goto={goto} persona="P3" /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="NT-avatar-menu-P1" label="Awatar nietabu · dropdown bez Matching (P1)" width={1100} height={620}>
            <ScreenWrap><HeaderAvatarMenuDemo goto={goto} persona="P1" /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="NT-settings-profil-P3" label="Ustawienia · zakładka Profil (P3 — ma Matching w pasku, ale jest na Profil)" width={1100} height={1240}>
            <ScreenWrap><NT_Settings goto={goto} personaOverride="P3" activeTab="profil" /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="NT-settings-matching-P3" label="Ustawienia · zakładka ✨ Matching (P3)" width={1100} height={1820}>
            <ScreenWrap><NT_Settings goto={goto} personaOverride="P3" activeTab="matching" /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="NT-settings-profil-P1" label="Ustawienia · zakładka Profil (P1 — bez Matching w pasku)" width={1100} height={1240}>
            <ScreenWrap><NT_Settings goto={goto} personaOverride="P1" activeTab="profil" /></ScreenWrap>
          </DCArtboard>
        </DCSection>
        <DCSection id="events" title="📅 Events flow" defaultCollapsed={false}>
          <DCArtboard id="E1" label="E1 · Kalendarium" width={1100} height={1420}>
            <ScreenWrap><E1_Calendar goto={goto} /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="E2" label="E2 · Pośredni ekran (bez RSVP)" width={1100} height={1240}>
            <ScreenWrap><E2_EventHub goto={goto} rsvpState={null} /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="E3" label="E3 · Po RSVP 'Idę' (z dopasowaniami inline · P3)" width={1100} height={2040}>
            <ScreenWrap><E3_EventHub goto={goto} /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="E4" label="E4 · Po 'Interesuje mnie' (z partial / general count inline)" width={1100} height={1540}>
            <ScreenWrap><E4_EventHub goto={goto} /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="E16" label="E16 · Empty events" width={1100} height={700}>
            <E16_EmptyEvents goto={goto} />
          </DCArtboard>
          <DCArtboard id="E17" label="E17 · Filtry rozwinięte" width={1100} height={900}>
            <E17_Filters goto={goto} />
          </DCArtboard>
        </DCSection>

        {/* SECTION 3 — MATCHING ONBOARDING */}
        <DCSection id="matching-onboarding" title="✨ Matching · onboarding & profil" defaultCollapsed={false}>
          <DCArtboard id="E5" label="E5 · Onboarding intro" width={1100} height={1100}>
            <E5_Intro goto={goto} />
          </DCArtboard>
          <DCArtboard id="E6" label="E6 · Formularz profilu" width={1100} height={1180}>
            <E6_Form goto={goto} />
          </DCArtboard>
          <DCArtboard id="E7" label="E7 · Success" width={1100} height={700}>
            <E7_Success goto={goto} />
          </DCArtboard>
          <DCArtboard id="E8" label="E8 · Mój profil Matching" width={1100} height={2300}>
            <ScreenWrap><E8_Profile goto={goto} empty={false} /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="E8e" label="E8 · empty (bez aktywności, z polecanymi)" width={1100} height={1400}>
            <E8_Profile goto={goto} empty />
          </DCArtboard>
          <DCArtboard id="E9" label="E9 · Edycja profilu" width={1100} height={1180}>
            <E9_Edit goto={goto} />
          </DCArtboard>
        </DCSection>

        {/* SECTION 4 — MATCHING DOPASOWANIA */}
        <DCSection id="matching-matches" title="💬 Matching · dopasowania (inline w evencie)" defaultCollapsed={false}>
          <DCArtboard id="E10" label="E10 · Deklaracja intencji (modal)" width={1100} height={780}>
            <ScreenWrap><E10_Intent goto={goto} mode="modal" /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="E11" label="E11 · Event z dopasowaniami inline (P3) · grupy intencji" width={1100} height={2540}>
            <ScreenWrap><E2_EventHub goto={goto} rsvpState="going" personaOverride="P3" /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="E12" label="E12 · Event z partial counter inline (P2 + Interested)" width={1100} height={1640}>
            <ScreenWrap><E2_EventHub goto={goto} rsvpState="interested" personaOverride="P2" /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="E14" label="E14 · Event z empty matches inline (P3)" width={1100} height={1840}>
            <ScreenWrap><E2_EventHub goto={goto} rsvpState="going" personaOverride="P3" matchesEmpty /></ScreenWrap>
          </DCArtboard>
          <DCArtboard id="E15" label="E15 · Profil matcha" width={1100} height={900}>
            <E15_MatchProfile goto={goto} />
          </DCArtboard>
          <DCArtboard id="E18" label="E18 · Powitalna wiadomość (modal nad E15)" width={1100} height={900}>
            <E18_HelloMessage goto={goto} identity="kobieta" />
          </DCArtboard>
          <DCArtboard id="E18-para" label="E18 · Powitalna wiadomość (modal · para)" width={1100} height={900}>
            <E18_HelloMessage goto={goto} identity="para" />
          </DCArtboard>
          <DCArtboard id="E18-loader" label="E18b · Loader · wysyłam (animacja: lecąca koperta + iskierki)" width={1100} height={900}>
            <E18_Loader goto={goto} stage="sending" />
          </DCArtboard>
          <DCArtboard id="E18-success" label="E18c · Sukces · wiadomość wysłana" width={1100} height={900}>
            <E18_Loader goto={goto} stage="success" />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
