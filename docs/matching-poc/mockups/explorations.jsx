// Variant explorations — design canvas first row
// Banner gradient proposals, EventCard variants, hero ratios, MatchCard proportions, IntentCard styles, E1 layouts

const Frame = ({ children, w = 480, h = 320, title, sub }) => (
  <div style={{ width: w }}>
    {title && <div className="variant-label">{title}<span className="variant-sub">{sub}</span></div>}
    <div className="sk-card" style={{ width: w, minHeight: h, padding: 14, background: 'var(--paper)' }}>{children}</div>
  </div>
);

/* ===== Banner gradient proposals ===== */
const BannerProp = ({ kind, title, desc }) => (
  <div style={{ width: 280 }}>
    <div className="variant-label">{title}</div>
    <div className={`gen-banner gv-${kind}`} style={{ width: 280, height: 160 }}></div>
    <div className="wf-small mt-2">{desc}</div>
  </div>
);

const BannerProposals = () => (
  <div className="col gap-3">
    <div>
      <h2 className="wf-h2">Auto-gen banner — 3 propozycje</h2>
      <div className="wf-small">Kiedy admin nie wgra własnego bannera. Bez tekstu — tytuł leci dynamicznie jako overlay.</div>
    </div>
    <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
      <BannerProp kind="mesh" title="A · Mesh" desc="Multi-color organic mesh. Najmocniejszy wizualnie — kluby BDSM/swing." />
      <BannerProp kind="linear" title="B · Linear" desc="Soft kierunkowy gradient. Spokojniejszy — workshopy, wellness." />
      <BannerProp kind="grain" title="C · Grain" desc="Gradient + szum. Photographic feel, warm." />
    </div>
    <div className="row gap-4 mt-3" style={{ flexWrap: 'wrap' }}>
      <BannerProp kind="shapes" title="D · Shapes" desc="Geometric blobs nakładane na ciemne tło. Bardziej eksperymentalne." />
      <BannerProp kind="radial" title="E · Radial" desc="Jeden focus point. Czyste, plakatowe." />
      <div style={{ width: 280 }}>
        <div className="variant-label">F · Uploadowany</div>
        <div className="up-banner" style={{ width: 280, height: 160 }}></div>
        <div className="wf-small mt-2">Dla porównania — banner od klubu (warm photo). System obsługuje oba.</div>
      </div>
    </div>
    <StickyNote rotate={-2} style={{marginTop: 12}}>
      <strong>Rekomendacja:</strong> A (Mesh) jako default + akcent_color eventu definiowany przez admina. C (Grain) jako warm-fallback dla podtypów typu wellness.
    </StickyNote>
  </div>
);

/* ===== EventCard layout variants ===== */
const EventCardVariants = () => {
  const ev = SAMPLE_DAYS[1].events[0];
  return (
    <div className="col gap-4">
      <h2 className="wf-h2">EventCard — kompozycje</h2>
      <div className="col gap-3" style={{ width: 560 }}>
        <div>
          <div className="variant-label">A · Time | Content | Thumb <span className="variant-sub">(rekomendacja)</span></div>
          <EventCard ev={ev} variant="a" />
          <div className="wf-small mt-2">Anchor czasowy po lewej, banner po prawej. Skanowalne. Działa dla list 3-10 eventów dziennie.</div>
        </div>
        <div className="mt-3">
          <div className="variant-label">B · Thumb left, time inline</div>
          <EventCard ev={ev} variant="b" />
          <div className="wf-small mt-2">Większy banner. Czas mniej eksponowany — przeczy filozofii "agenda".</div>
        </div>
        <div className="mt-3">
          <div className="variant-label">C · Stacked, banner top</div>
          <div style={{ width: 320 }}><EventCard ev={ev} variant="c" /></div>
          <div className="wf-small mt-2">Wąskie karty grid 2-3 kolumny — dla widoku 'discover' / mobile.</div>
        </div>
      </div>
    </div>
  );
};

/* ===== Hero ratios E2 ===== */
const HeroRatioVariants = () => (
  <div className="col gap-4">
    <h2 className="wf-h2">Hero E2/E3/E4 — proporcje</h2>
    {[
      { r: '21:9', h: 180, label: 'A · 21:9 cinematic (rekomendacja)', desc: 'Wystarczająco dużo na metadane bez dominacji nad meta + RSVP.' },
      { r: '16:9', h: 240, label: 'B · 16:9 standard', desc: 'Klasyk. Bezpieczne ale ciężkie — RSVP odpłynie poniżej fold-a.' },
      { r: '3:1', h: 140, label: 'C · 3:1 wide banner', desc: 'Super płaski. Ledwo mieści typografię — wymaga ascetycznego overlay.' },
    ].map(opt => (
      <div key={opt.r} style={{ width: 540 }}>
        <div className="variant-label">{opt.label}</div>
        <div style={{ position: 'relative', height: opt.h }}>
          <div className="gen-banner gv-mesh" style={{ position: 'absolute', inset: 0 }}></div>
          <div className="hero-overlay">
            <div style={{ fontFamily: 'var(--display)', fontSize: 14, opacity: 0.9 }}>sobota, 14 czerwca</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>Czerwony Wieczór</div>
            <div style={{ fontFamily: 'var(--hand)', fontSize: 12 }}>Czerwona Kotwica · Wrocław</div>
          </div>
        </div>
        <div className="wf-small mt-2">{opt.desc}</div>
      </div>
    ))}
  </div>
);

/* ===== MatchCard proportions ===== */
const MatchCardVariants = () => (
  <div className="col gap-4">
    <h2 className="wf-h2">MatchCard — proporcje zdjęcia</h2>
    <div className="row gap-4">
      <div>
        <div className="variant-label">A · Square 1:1</div>
        <MatchCard proportion="square" />
        <div className="wf-small mt-2" style={{maxWidth: 220}}>Demokratyczne — zdjęcie tylko jeden element z wielu.</div>
      </div>
      <div>
        <div className="variant-label">B · 4:5 portret <span className="variant-sub">(rekomendacja)</span></div>
        <MatchCard proportion="45" />
        <div className="wf-small mt-2" style={{maxWidth: 220}}>Standard portret SoMe. Naturalne dla zdjęć ludzi.</div>
      </div>
      <div>
        <div className="variant-label">C · Tall 5:6 / portret długi</div>
        <MatchCard proportion="portrait" />
        <div className="wf-small mt-2" style={{maxWidth: 220}}>Dramatyczny, "Tinder-like". Najmocniej akcentuje zdjęcie — może wzmacniać appearance-focus.</div>
      </div>
    </div>
  </div>
);

/* ===== IntentCard styling variants ===== */
const IntentCardVariants = () => {
  const items = [
    ['🌙','Tylko klimat','Idę, ale nie szukam nikogo.'],
    ['💬','Otwarty na poznanie','Chętnie kogoś poznam.'],
    ['✨','Otwarty na chemię','Otwarty na to gdzie to pójdzie.'],
  ];
  return (
    <div className="col gap-4">
      <h2 className="wf-h2">IntentCard — wybór intencji (E10)</h2>

      <div>
        <div className="variant-label">A · Radio rows <span className="variant-sub">(rekomendacja — czytelne, dłuższy opis ma miejsce)</span></div>
        <div className="col gap-2" style={{ width: 460 }}>
          {items.map(([e,t,d], i) => (
            <div key={t} className="sk-box" style={{ padding: 12, display:'flex', gap: 10,
              borderColor: i === 1 ? 'var(--purple)' : 'var(--rule)',
              background: i === 1 ? 'var(--purple-soft)' : 'var(--paper)',
              borderWidth: i === 1 ? 3 : 2 }}>
              <div style={{ fontSize: 24 }}>{e}</div>
              <div className="flex1"><div className="wf-h4">{t}</div><div className="wf-small mt-1">{d}</div></div>
              <div className="sk-avatar" style={{ width: 18, height: 18, background: i === 1 ? 'var(--purple)' : 'var(--paper)', border: '2px solid var(--ink)' }}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="variant-label">B · Card grid 3-up</div>
        <div className="row gap-2" style={{ width: 460 }}>
          {items.map(([e,t,d], i) => (
            <div key={t} className="sk-box flex1" style={{ padding: 14, textAlign: 'center',
              borderColor: i === 1 ? 'var(--purple)' : 'var(--rule)',
              background: i === 1 ? 'var(--purple-soft)' : 'var(--paper)',
              borderWidth: i === 1 ? 3 : 2 }}>
              <div style={{ fontSize: 32 }}>{e}</div>
              <div className="wf-h4 mt-2">{t}</div>
            </div>
          ))}
        </div>
        <div className="wf-small mt-2">Bardziej kompaktowe ale opis musi być w tooltipie / poniżej.</div>
      </div>

      <div className="mt-4">
        <div className="variant-label">C · Pill row (segmented)</div>
        <div className="row gap-2">
          {items.map(([e,t], i) => (
            <Pill key={t} variant={i === 1 ? 'active' : ''}>{e} {t}</Pill>
          ))}
        </div>
        <div className="wf-small mt-2">Najszybsze. Traci nuans między "poznanie" a "chemia".</div>
      </div>
    </div>
  );
};

/* ===== E10 modal vs sidebar vs fullscreen ===== */
const E10ModeVariants = () => (
  <div className="col gap-4">
    <h2 className="wf-h2">E10 Deklaracja — modal vs sidebar vs strona</h2>
    <div className="row gap-4" style={{flexWrap: 'wrap'}}>
      {['modal','sidebar','fullscreen'].map(m => (
        <div key={m}>
          <div className="variant-label">{m === 'modal' ? 'A · Modal (rekomendacja)' : m === 'sidebar' ? 'B · Sidebar slide' : 'C · Osobna strona'}</div>
          <div style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: 1100, height: 245, marginBottom: -160 }}>
            <E10_Intent goto={()=>{}} mode={m} />
          </div>
          <div className="wf-small" style={{ width: 380, marginTop: 8 }}>
            {m === 'modal' && 'User nie traci kontekstu eventu. Forma 3-sekcyjna mieści się.'}
            {m === 'sidebar' && 'Kontekst eventu widoczny po lewej. Lepiej dla mobile (full-screen sheet).'}
            {m === 'fullscreen' && 'Najwięcej miejsca, ale traci się ścisły kontekst eventu (header tylko nazwa).'}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ===== E1 layout variants — agenda vs other ===== */
const E1LayoutVariants = () => (
  <div className="col gap-4">
    <h2 className="wf-h2">E1 — układ kalendarium</h2>
    <div className="row gap-4" style={{flexWrap: 'wrap', alignItems: 'flex-start'}}>
      <div>
        <div className="variant-label">A · Agenda + mini-calendar <span className="variant-sub">(specka v5)</span></div>
        <div className="sk-box" style={{width: 380, padding: 14}}>
          <div className="row between">
            <div className="wf-h3">Wydarzenia</div>
            <div className="sk-dash" style={{width: 100, height: 70}}>mini-cal</div>
          </div>
          <div className="row gap-1 mt-2"><Pill>📍 wszystkie</Pill><Pill>📅 cze</Pill></div>
          <div className="day-header mt-3" style={{fontSize: 11}}>PIĄ · 14 CZE</div>
          <div className="sk-box" style={{padding: 8, marginTop: 6, display:'flex', gap: 6}}>
            <div className="wf-h4" style={{width:40}}>22:00</div>
            <div className="flex1"><div className="wf-h4" style={{fontSize:12}}>Heaven Friday Play</div><div className="wf-tiny">Heaven · WAW</div></div>
            <div className="gen-banner gv-mesh" style={{width: 50, height: 30}}></div>
          </div>
          <div className="sk-box" style={{padding: 8, marginTop: 6, display:'flex', gap: 6}}>
            <div className="wf-h4" style={{width:40}}>21:00</div>
            <div className="flex1"><div className="wf-h4" style={{fontSize:12}}>Otwarty Pokój</div><div className="wf-tiny">Sukces · KRK</div></div>
            <div className="up-banner" style={{width: 50, height: 30}}></div>
          </div>
        </div>
        <div className="wf-small mt-2" style={{maxWidth: 380}}>Mini-cal jest opcjonalny — daje quick nav do gęstych dni. Można schować w sidebar.</div>
      </div>

      <div>
        <div className="variant-label">B · Agenda bez mini-cal</div>
        <div className="sk-box" style={{width: 380, padding: 14}}>
          <div className="wf-h3">Wydarzenia</div>
          <div className="row gap-1 mt-2"><Pill>📍 wszystkie</Pill><Pill>📅 czerwiec</Pill></div>
          <div className="day-header mt-3" style={{fontSize: 11}}>PIĄ · 14 CZE</div>
          <div className="sk-box" style={{padding: 8, marginTop: 6, display:'flex', gap: 6}}>
            <div className="wf-h4" style={{width:40}}>22:00</div>
            <div className="flex1"><div className="wf-h4" style={{fontSize:12}}>Heaven Friday Play</div><div className="wf-tiny">Heaven · WAW</div></div>
            <div className="gen-banner gv-mesh" style={{width: 50, height: 30}}></div>
          </div>
          <div className="day-header mt-3" style={{fontSize: 11}}>SOB · 15 CZE</div>
          <div className="sk-box" style={{padding: 8, marginTop: 6, display:'flex', gap: 6}}>
            <div className="wf-h4" style={{width:40}}>20:00</div>
            <div className="flex1"><div className="wf-h4" style={{fontSize:12}}>Czerwony Wieczór</div><div className="wf-tiny">Kotwica · WRO</div></div>
            <div className="gen-banner gv-linear" style={{width: 50, height: 30}}></div>
          </div>
        </div>
        <div className="wf-small mt-2" style={{maxWidth: 380}}>Czyste. Skanowanie tylko od góry — dla 30+ eventów może być męczące.</div>
      </div>

      <div>
        <div className="variant-label">C · Calendar grid (klasyk)</div>
        <div className="sk-box" style={{width: 380, padding: 14}}>
          <div className="wf-h3">Wydarzenia</div>
          <div className="row between mt-2">
            <span className="wf-small">← czerwiec 2026 →</span>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginTop: 8}}>
            {[...Array(30)].map((_,i) => (
              <div key={i} className="sk-box" style={{height: 44, padding: 3, fontSize: 10}}>
                <div className="wf-tiny">{i+1}</div>
                {[13,14,19].includes(i) && <div style={{height: 4, background: 'var(--purple)', borderRadius: 2, marginTop: 2}}></div>}
              </div>
            ))}
          </div>
        </div>
        <div className="wf-small mt-2" style={{maxWidth: 380}}>Tradycyjny widok kalendarza. Słaby dla sceny gdzie eventy są punktowe (1-3 na tydzień) — dużo pustki.</div>
      </div>
    </div>
    <StickyNote rotate={1}>
      <strong>Wybór:</strong> A (Agenda + mini-cal) zgodnie ze specką. Mini-cal pomaga z navigacją gdy lista urośnie.
    </StickyNote>
  </div>
);

Object.assign(window, {
  BannerProposals, EventCardVariants, HeroRatioVariants,
  MatchCardVariants, IntentCardVariants, E10ModeVariants, E1LayoutVariants,
  Frame
});
