// Main app — hi-fi design canvas with all screens

const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "persona": "P3",
  "rsvp": "going",
  "intent": "open_chat",
  "bannerStyle": "ember"
}/*EDITMODE-END*/;

const TweaksApp = () => {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);
  useEffectApp(() => {
    window.__ctx = t;
    window.dispatchEvent(new CustomEvent('ctx-change'));
  }, [t]);
  return (
    <TweaksPanel title="Tweaks · perspektywa">
      <TweakSection title="Persona">
        <TweakRadio value={t.persona} onChange={v => setT('persona', v)}
          options={[
            { value: 'P1', label: 'P1 · bez Matching' },
            { value: 'P2', label: 'P2 · z Matching' },
            { value: 'P3', label: 'P3 · z deklaracją' },
          ]} />
      </TweakSection>
      <TweakSection title="Stan RSVP użytkownika">
        <TweakRadio value={t.rsvp} onChange={v => setT('rsvp', v)}
          options={[
            { value: 'none', label: 'brak' },
            { value: 'going', label: 'idę' },
            { value: 'interested', label: 'zainteresowany' },
          ]} />
      </TweakSection>
      <TweakSection title="Intencja w E10">
        <TweakSelect value={t.intent} onChange={v => setT('intent', v)} label="Intencja"
          options={[
            { value: 'not_looking', label: '🌑 Nie szukam nikogo' },
            { value: 'just_vibe', label: '🌙 Tylko klimat' },
            { value: 'open_chat', label: '💬 Otwarty na poznanie' },
          ]} />
      </TweakSection>
    </TweaksPanel>
  );
};

const ScreenWrap = ({ children }) => {
  const [, tick] = useStateApp(0);
  useEffectApp(() => {
    const h = () => tick(x => x + 1);
    window.addEventListener('ctx-change', h);
    return () => window.removeEventListener('ctx-change', h);
  }, []);
  return children;
};

const goto = (id) => {
  const el = document.querySelector(`[data-artboard-id="${id}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const btn = el.querySelector('[data-focus-trigger]');
    if (btn) btn.click();
  }
};

const App = () => {
  const ctx = window.__ctx || TWEAK_DEFAULTS;

  return (
    <>
      <TweaksApp />
      <DesignCanvas
        title="nie!tabu · Matching + Events — UI docelowe (hi-fi)"
        subtitle="Wszystkie kluczowe ekrany na bazie design systemu nietabu · v5 spec"
      >
        {/* Intro */}
        <DCSection id="intro" title="📋 Read me" defaultCollapsed={false}>
          <DCArtboard id="intro" label="Kontekst" width={720} height={520}>
            <div style={{ padding: 36, fontFamily: 'var(--ff-sans-serif)', background: '#fff', height: '100%', overflow: 'auto' }}>
              <h1 className="h-display lg">nie<span className="bang">!</span>tabu · Matching + Events</h1>
              <p className="body" style={{ marginTop: 12, fontSize: 16 }}>
                UI docelowe na bazie design systemu nietabu (Forem fork). Brand purple <code>#424174</code>, magenta accent <code>#A91F69</code>, Roboto Medium/Bold, capsule pills, hairline cards.
              </p>
              <div className="divider"/>
              <h3 className="h3" style={{ marginBottom: 8 }}>Co tutaj jest</h3>
              <ul className="body" style={{ paddingLeft: 20, lineHeight: 1.7 }}>
                <li><strong>E1</strong> — Kalendarium wydarzeń (agenda + day headers + EventCard z banner thumbnail)</li>
                <li><strong>E2/E3</strong> — Pośredni ekran eventu (hero + RSVP + Matching) · z tweakiem persony/RSVP</li>
                <li><strong>E5</strong> — Onboarding intro do Matching (privacy-first)</li>
                <li><strong>E6/E9</strong> — Formularz profilu Matching (zdjęcie / kim jesteś / miasto / bio)</li>
                <li><strong>E7</strong> — Success po założeniu profilu</li>
                <li><strong>E8</strong> — Mój profil Matching · timeline aktywności (dopasowania, deklaracje, polecane)</li>
                <li><strong>E10</strong> — Modal deklaracji intencji (3 karty + chip group + notatka)</li>
                <li><strong>E11</strong> — Lista matchów (grupowana po intencji, inline w E2/E3 dla P3)</li>
                <li><strong>E15</strong> — Profil matcha (duże zdjęcie + CTA "Napisz")</li>
              </ul>

              <div className="divider"/>
              <h3 className="h3" style={{ marginBottom: 8 }}>Komponenty zaprojektowane od zera</h3>
              <ul className="body" style={{ paddingLeft: 20, lineHeight: 1.7 }}>
                <li><strong>Auto-gen banner</strong> — 6 wariantów mesh gradient (dusk, velvet, ember, night, olive, sunrise) z subtelnym ziarnem · konsystentne z paletą brandu</li>
                <li><strong>EventCard</strong> — grid: czas / treść / banner thumb + RSVP overlay flag</li>
                <li><strong>DayHeader</strong> — duża cyfra dnia + dzień tygodnia w magenta uppercase</li>
                <li><strong>MatchCard</strong> — fotografia 4:5 + intent glyph + identity pill + notatka magenta accent</li>
                <li><strong>IntentCard</strong> — radio card z dużym emoji w purple square</li>
                <li><strong>Activity timeline</strong> — kolorowe kropki, sticky rail, kafelki różne dla matchów/deklaracji/poleceń</li>
                <li><strong>Hero overlay</strong> — gradient od dołu + eyebrow pill z blur</li>
                <li><strong>PrivacyInfo</strong> — purple-tinted box z ikoną kłódki</li>
              </ul>

              <div className="divider"/>
              <p className="caption mute">
                Włącz <strong>Tweaks</strong> w toolbarze żeby zmieniać personę i stan RSVP — ekrany E2/E3/E4 reagują na zmiany.
              </p>
            </div>
          </DCArtboard>
        </DCSection>

        {/* Events */}
        <DCSection id="events" title="📅 Events flow" defaultCollapsed={false}>
          <DCArtboard id="E1" label="E1 · Kalendarium · P1 (CTA: załóż profil Matching)" width={1280} height={1700}>
            <E1_Calendar persona="P1" onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="E2" label="E2 · Event hub · bez RSVP (P1)" width={1280} height={1500}>
            <E2_EventHub persona="P1" rsvp={null} onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="E4" label="E4 · Event hub · po 'Interesuje mnie' (P2 bez intencji)" width={1280} height={1500}>
            <E2_EventHub persona="P2" rsvp="interested" onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="E2-live" label="E2/E3/E4 · live (reaguje na Tweaks)" width={1280} height={2400}>
            <ScreenWrap>
              <E2_EventHub
                persona={ctx.persona}
                rsvp={ctx.rsvp === 'none' ? null : ctx.rsvp}
                intent={ctx.intent}
                onNav={goto}
              />
            </ScreenWrap>
          </DCArtboard>
        </DCSection>

        {/* Matching onboarding */}
        <DCSection id="matching-onboarding" title="✨ Matching · onboarding" defaultCollapsed={false}>
          <DCArtboard id="E5" label="E5 · Onboarding intro" width={1280} height={1280}>
            <E5_Intro onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="E6" label="E6 · Formularz profilu" width={1280} height={1320}>
            <E6_Form onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="E7" label="E7 · Success" width={1280} height={760}>
            <E7_Success onNav={goto}/>
          </DCArtboard>
        </DCSection>

        {/* Matching matches */}
        <DCSection id="matching-matches" title="💬 Matching · dopasowania" defaultCollapsed={false}>
          <DCArtboard id="E8" label="E8 · Mój profil Matching · timeline" width={1280} height={2000}>
            <E8_Profile onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="E10" label="E10 · Deklaracja intencji (modal)" width={1280} height={900}>
            <E10_Intent onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="E15" label="E15 · Profil matcha" width={1280} height={920}>
            <E15_MatchProfile onNav={goto}/>
          </DCArtboard>
        </DCSection>

        {/* E18 — proces wysyłania powitalnej wiadomości */}
        <DCSection id="message-flow" title="✉ Proces wysyłania wiadomości (E18)" defaultCollapsed={false}>
          <DCArtboard id="E18-para" label="E18 · Powitalna wiadomość (modal · para)" width={1280} height={920}>
            <E18_HelloMessage stage="compose" identity="para" onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="E18-sending" label="E18b · Loader · wysyłam (lecąca koperta + iskierki)" width={1280} height={920}>
            <E18_HelloMessage stage="sending" identity="kobieta" onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="E18-success" label="E18c · Sukces · wiadomość wysłana" width={1280} height={920}>
            <E18_HelloMessage stage="success" identity="kobieta" onNav={goto}/>
          </DCArtboard>
        </DCSection>

        {/* Ustawienia — edycja profilu Matching w zakładce ustawień */}
        <DCSection id="settings" title="⚙ Ustawienia · edycja profilu" defaultCollapsed={false}>
          <DCArtboard id="NT-settings-profil" label="Ustawienia · Profil publiczny (P3 — ma Matching w pasku)" width={1280} height={1320}>
            <NT_Settings activeTab="profil" persona="P3" onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="NT-settings-matching" label="Ustawienia · ✨ Matching (P3 — edycja profilu)" width={1280} height={2000}>
            <NT_Settings activeTab="matching" persona="P3" onNav={goto}/>
          </DCArtboard>
        </DCSection>

        {/* Integracja z chrome nietabu */}
        <DCSection id="system-integration" title="🧩 Integracja z chrome nietabu" defaultCollapsed={false}>
          <DCArtboard id="NT-badge-P3" label="Pasek górny · ✨ Matching z badge (P3)" width={1280} height={620}>
            <HeaderBadgeDemo persona="P3" onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="NT-badge-P2" label="Pasek górny · ✨ Matching z badge (P2)" width={1280} height={620}>
            <HeaderBadgeDemo persona="P2" onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="NT-avatar-menu-P3" label="Awatar · dropdown z kartą Matching (P3)" width={1280} height={720}>
            <HeaderAvatarMenuDemo persona="P3" onNav={goto}/>
          </DCArtboard>
          <DCArtboard id="NT-avatar-menu-P1" label="Awatar · dropdown bez Matching (P1 — propozycja)" width={1280} height={720}>
            <HeaderAvatarMenuDemo persona="P1" onNav={goto}/>
          </DCArtboard>
        </DCSection>

        {/* Empty states */}
        <DCSection id="states" title="🪧 Empty states" defaultCollapsed={false}>
          <DCArtboard id="E16" label="E16 · Empty events" width={1280} height={900}>
            <E16_EmptyEvents onNav={goto}/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
