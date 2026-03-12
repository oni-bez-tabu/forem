import { h, render, Fragment } from 'preact';
import { closeWindowModal, showWindowModal } from '@utilities/showModal';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

// ══════════════════════════════════════════════
// WAVEFORM CANVAS
// ══════════════════════════════════════════════
const PALETTE = [[124,58,237],[168,85,247],[224,64,160],[59,91,219],[139,92,246]];

function initWaveformBg(canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, bars = [];
  let t = 0;
  let animId;

  function getAlphaMult() {
    return document.body.classList.contains('dark-theme') ? 1 : 0.85;
  }

  function buildBars() {
    bars = [];
    const spacing = 8;
    const count = Math.floor(W / spacing);
    for (let i = 0; i < count; i++) {
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      bars.push({
        x: i * spacing + spacing / 2,
        maxH: 80 + Math.random() * 350,
        phase: Math.random() * Math.PI * 2,
        freq: 0.5 + Math.random() * 1.2,
        freq2: 0.25 + Math.random() * 0.6,
        phase2: Math.random() * Math.PI * 2,
        w: 3 + Math.random() * 2.5,
        color: c,
        alpha: 0.07 + Math.random() * 0.19,
      });
    }
  }

  function resize() {
    W = canvas.width = canvas.parentElement.clientWidth;
    H = canvas.height = canvas.parentElement.clientHeight;
    buildBars();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    const alphaMult = getAlphaMult();
    for (const b of bars) {
      const s1 = Math.sin(t * b.freq + b.phase);
      const s2 = Math.sin(t * b.freq2 + b.phase2);
      const norm = (s1 * 0.7 + s2 * 0.3) * 0.5 + 0.5;
      const h = b.maxH * (0.03 + 0.97 * norm);
      const a = b.alpha * (0.35 + 0.65 * norm) * alphaMult;
      const [r, g, bl] = b.color;
      const y0 = H / 2 - h / 2, y1 = H / 2 + h / 2;
      const gr = ctx.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0,   `rgba(${r},${g},${bl},0)`);
      gr.addColorStop(0.2, `rgba(${r},${g},${bl},${(a*0.55).toFixed(3)})`);
      gr.addColorStop(0.5, `rgba(${r},${g},${bl},${a.toFixed(3)})`);
      gr.addColorStop(0.8, `rgba(${r},${g},${bl},${(a*0.55).toFixed(3)})`);
      gr.addColorStop(1,   `rgba(${r},${g},${bl},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.roundRect(b.x - b.w / 2, y0, b.w, h, 2.5);
      ctx.fill();
    }
    t += 0.014;
    animId = requestAnimationFrame(frame);
  }

  resize();
  frame();
  window.addEventListener('resize', resize);

  return {
    t: () => t,
    destroy() {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    }
  };
}

function initMiniWaveform(canvas, getT) {
  const ctx = canvas.getContext('2d');
  const mBars = Array.from({length: 14}, () => ({
    phase: Math.random() * Math.PI * 2,
    freq: 0.4 + Math.random() * 0.8,
    freq2: 0.2 + Math.random() * 0.4,
    phase2: Math.random() * Math.PI * 2,
  }));
  let animId;

  function miniFrame() {
    const t = getT();
    ctx.clearRect(0, 0, 80, 28);
    const spacing = 80 / mBars.length;
    mBars.forEach((b, i) => {
      const s1 = Math.sin(t * b.freq + b.phase);
      const s2 = Math.sin(t * b.freq2 + b.phase2);
      const norm = (s1 * 0.7 + s2 * 0.3) * 0.5 + 0.5;
      const h = 4 + norm * 20;
      const x = i * spacing + spacing / 2;
      const gr = ctx.createLinearGradient(0, 14 - h/2, 0, 14 + h/2);
      gr.addColorStop(0, 'rgba(168,85,247,0)');
      gr.addColorStop(0.5, `rgba(168,85,247,${(0.3 + norm * 0.5).toFixed(2)})`);
      gr.addColorStop(1, 'rgba(168,85,247,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.roundRect(x - 2, 14 - h/2, 3.5, h, 2);
      ctx.fill();
    });
    animId = requestAnimationFrame(miniFrame);
  }

  miniFrame();

  return {
    destroy() {
      cancelAnimationFrame(animId);
    }
  };
}

// ══════════════════════════════════════════════
// ROOM CARD ITEM
// ══════════════════════════════════════════════
const Item = ({ item, children, currentUserId }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [duration, setDuration] = useState('');

  const adaptedItem = {
    id: item.id,
    channelId: item.channel_id,
    title: item.title,
    user: item.user,
    publishedDate: new Date(item.start_date),
    status: item.status
  };

  useEffect(() => {
    const closeMenu = (e) => {
      if (isMenuOpen && !e.target.closest('.talks-dots-btn')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [isMenuOpen]);

  useEffect(() => {
    let intervalId;
    if (adaptedItem.status === 'started') {
      const updateDuration = () => {
        const now = new Date();
        const diff = Math.max(0, now - adaptedItem.publishedDate);
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      updateDuration();
      intervalId = setInterval(updateDuration, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [adaptedItem.status, adaptedItem.publishedDate]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDelete = async () => {
    if (confirm('Czy na pewno chcesz usunąć?')) {
      try {
        const response = await fetch(`/talks/${adaptedItem.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('[name="csrf-token"]')?.content
          }
        });
        if (response.ok) {
          window.location.reload();
        } else {
          alert('Nie udało się usunąć...');
        }
      } catch (error) {
        console.error(error);
      }
    }
    setIsMenuOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/talks?activeTalk=${adaptedItem.channelId}`);
    setIsMenuOpen(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: adaptedItem.title,
          url: window.location.origin + `/talks?activeTalk=${adaptedItem.channelId}`
        });
      } catch (e) {
        // user cancelled share
      }
    } else {
      handleCopyLink();
    }
    setIsMenuOpen(false);
  };

  return (
    <div className={`talks-room-card${isMenuOpen ? ' talks-room-card--menu-open' : ''}`}>
      {adaptedItem.status === 'started' && (
        <span className="talks-live-pill">LIVE</span>
      )}
      <div className="talks-rc-left">
        <a href={`/${adaptedItem.user.username}`} className={`talks-host-av ${adaptedItem.status === 'started' ? 'talks-host-av--live' : ''}`}>
          <img
            src={adaptedItem.user.profile_image_90 || '/images/default-avatar.png'}
            alt={adaptedItem.user.username}
          />
        </a>
        <div className="talks-rc-info">
          <div className="talks-rc-title">{adaptedItem.title}</div>
          <div className="talks-rc-meta">
            <span className="talks-rc-host">{adaptedItem.user.username}</span>
            {adaptedItem.status === 'started' && duration && (
              <span className="talks-rc-timer">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>{duration}</span>
              </span>
            )}
            {adaptedItem.status !== 'started' && adaptedItem.status !== 'finished' && (
              <span className="talks-rc-timer">
                {adaptedItem.publishedDate.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="talks-rc-right">
        {children}
        <div className="talks-dots-btn" onClick={toggleMenu}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.8"/>
            <circle cx="12" cy="12" r="1.8"/>
            <circle cx="12" cy="19" r="1.8"/>
          </svg>
          <div className={`talks-dropdown ${isMenuOpen ? 'open' : ''}`}>
            {adaptedItem.status === 'started' && (
              <button className="talks-dd-item" onClick={handleCopyLink}>
                <span className="talks-dd-icon">🔗</span>Kopiuj link do pokoju
              </button>
            )}
            {adaptedItem.status === 'started' && (
              <button className="talks-dd-item" onClick={handleShare}>
                <span className="talks-dd-icon">📤</span>Udostępnij
              </button>
            )}
            <a href="/report-abuse" className="talks-dd-item">
              <span className="talks-dd-icon">🚩</span>Zgłoś
            </a>
            {currentUserId === item.user.id && (
              <>
                <div className="talks-dd-sep" />
                <button className="talks-dd-item danger" onClick={handleDelete}>
                  <span className="talks-dd-icon">🛑</span>Usuń pokój
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// CREATE TALK BUTTON (bottom bar CTA)
// ══════════════════════════════════════════════
const CreateTalkButton = ({ isDisabled, currentUserId, adminOnlyCreationDescription, isAdmin }) => {
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('input[type="submit"]');
    submitButton.disabled = true;
    submitButton.value = 'Tworzenie...';

    const title = form.querySelector('#talk_title').value;
    const video = form.querySelector('#talk_video').checked;
    const startDateInput = form.querySelector('#talk_start_date');
    const startDate = startDateInput?.value;
    const body = { talk: { title: title, video: video } };
    if (startDate) {
      const dateWithTimezone = new Date(startDate).toISOString();
      body.talk.start_date = dateWithTimezone;
    }
    try {
      const response = await fetch('/talks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]')?.content
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        closeWindowModal();
        const { channel_id } = await response.json();

        if (startDate) {
          window.dispatchEvent(new CustomEvent('scheduledTalksUpdated'));
        } else {
          const url = new URL(window.location.href);
          url.searchParams.set('activeTalk', channel_id);
          window.location.href = url.toString();
        }
      } else {
        const errorData = await response.json();
        console.error(errorData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openCreateTalkModal = () => {
    if (!currentUserId) {
      showLoginModal({
        referring_source: 'talks',
        trigger: 'talks',
      });
      return false;
    }

    const modalContentElement =
      window.parent.document.querySelector('#talks-form').innerHTML;

    showWindowModal({
      document: window.parent.document,
      modalContent: modalContentElement,
      title: 'Utwórz pokój',
      size: 'small',
      onOpen: () => {
        const modalForm = window.parent.document.querySelector('#window-modal form');
        modalForm.addEventListener('submit', handleFormSubmit);

        const futureCheckbox = window.parent.document.querySelector('#window-modal .future-meeting-checkbox');
        const startDateField = window.parent.document.querySelector('#window-modal .start-date-field');

        futureCheckbox.addEventListener('change', (e) => {
          startDateField.style.display = e.target.checked ? 'block' : 'none';
        });
      }
    });
  };

  return (
    <div className="talks-btn-bar-wrap">
      <button
        className="talks-btn-bar"
        onClick={openCreateTalkModal}
        disabled={isDisabled || (!isAdmin && adminOnlyCreationDescription)}
      >
        <span className="talks-btn-bar-icon">🎙️</span>
        Otwórz swój pokój
      </button>
    </div>
  );
};

// ══════════════════════════════════════════════
// JOIN TALK BUTTON
// ══════════════════════════════════════════════
const JoinTalkButton = ({ channelId, userId, isDisabled, currentUserId, children }) => {
  const handleJoin = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('activeTalk', channelId);
    window.location.href = url.toString();
  };

  return (
    <button
      onClick={handleJoin}
      className="talks-btn-join"
      disabled={isDisabled}
    >
      {children || (currentUserId === userId ? 'Wejdź jako host' : 'Wejdź →')}
    </button>
  );
};

// ══════════════════════════════════════════════
// LOADER
// ══════════════════════════════════════════════
const Loader = () => {
  return (
    <div className="loader-overlay fixed inset-0 z-50">
      <div className="loader-content">
        <iframe
          src="https://lottie.host/embed/e1194cb2-a25b-4090-a308-6a7ee9637bb6/ImvuNShUCA.lottie"
          style={{
            width: '100%',
            height: '300px',
            border: 'none',
            backgroundColor: 'transparent',
            pointerEvents: 'none',
            colorScheme: 'light'
          }}
        />
        <p>Mamy nadzieje na Twoją aktywność :) <br/> Baw się dobrze!</p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// LOADING PLACEHOLDER
// ══════════════════════════════════════════════
const LoadingPlaceholder = () => {
  return (
    <div className="talks-loading-placeholder">
      <div className="crayons-story__indention w-100">
        <div className="crayons-scaffold-loading w-40 h-0 py-4 mb-2" />
        <div className="crayons-story__meta w-100 mb-5">
          <div className="crayons-scaffold-loading w-10 h-0 py-3 mr-2" />
          <div className="crayons-scaffold-loading w-15 h-0 py-3" />
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// TALKS LIST (active rooms)
// ══════════════════════════════════════════════
const TalksList = ({ activeTalkId, currentUserId, allow_anonymous_listening_description, talks, loading }) => {
  if (loading) {
    return <LoadingPlaceholder />;
  }

  if (talks.length === 0) {
    return null;
  }

  return (
    <Fragment>
      {talks.map((talk) => (
        <Item key={talk.id} item={talk} currentUserId={currentUserId}>
          <JoinTalkButton
            channelId={talk.channel_id}
            userId={talk.user.id}
            isDisabled={!!activeTalkId || (!currentUserId && !allow_anonymous_listening_description)}
            currentUserId={currentUserId}
          />
        </Item>
      ))}
    </Fragment>
  );
};

// ══════════════════════════════════════════════
// SCHEDULED TALKS LIST
// ══════════════════════════════════════════════
const ScheduledTalksList = ({ currentUserId, onCountChange }) => {
  const [scheduledTalks, setScheduledTalks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduledTalks = async () => {
    try {
      const response = await fetch('/talks/scheduled');
      if (response.ok) {
        const data = await response.json();
        setScheduledTalks(data);
        if (onCountChange) onCountChange(data.length);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledTalks();

    const handleUpdate = () => {
      fetchScheduledTalks();
    };

    window.addEventListener('scheduledTalksUpdated', handleUpdate);
    return () => {
      window.removeEventListener('scheduledTalksUpdated', handleUpdate);
    };
  }, []);

  if (loading) {
    return <LoadingPlaceholder />;
  }

  if (scheduledTalks.length === 0) {
    return null;
  }

  return (
    <div className="talks-scheduled-section">
      <div className="talks-scheduled-label">Nadchodzące</div>
      {scheduledTalks.map((talk) => (
        <Item key={talk.id} item={talk} currentUserId={currentUserId}>
          {talk.scheduled_channel_id && (
            <JoinTalkButton
              channelId={talk.scheduled_channel_id}
              userId={talk.user.id}
              isDisabled={false}
              currentUserId={currentUserId}
            >
              Rozpocznij
            </JoinTalkButton>
          )}
        </Item>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════
// VIDEO EMBED (YouTube lazy-load)
// ══════════════════════════════════════════════
const YOUTUBE_ID = 'sNqazWi4M9s';

const VideoEmbed = () => {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="talks-video-wrap">
        <iframe
          src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1`}
          title="Zobacz jak to działa w krótkim filmie"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="talks-video-wrap" onClick={() => setPlaying(true)} style={{ cursor: 'pointer' }}>
      <img
        className="talks-video-thumb"
        src={`https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`}
        alt="Video thumbnail"
      />
      <div className="talks-video-ph">
        <div className="talks-play-ring">
          <div className="talks-triangle" />
        </div>
        <div className="talks-vid-cap">
          <strong>Zobacz jak to działa w krótkim filmie</strong>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// MAIN VIEW
// ══════════════════════════════════════════════
const TalksView = () => {
  const userData = document.body.dataset.user ? JSON.parse(document.body.dataset.user) : {};
  const currentUserId = userData?.id || null;
  const isAdmin = userData?.admin || false;

  const { admin_only_creation_description, allow_anonymous_listening_description } =
    JSON.parse(document.getElementById('talks-list').dataset.settings || '{}');

  const getActiveTalkId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('activeTalk') || sessionStorage.getItem('activeTalkId');
  };

  const [activeTalkId, setActiveTalkId] = useState(getActiveTalkId());
  const [isLoading, setIsLoading] = useState(!!getActiveTalkId());

  // Lifted talks state from TalksList
  const [talks, setTalks] = useState([]);
  const [talksLoading, setTalksLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);

  const totalItems = talks.length + scheduledCount;

  const bgCanvasRef = useRef(null);
  const miniCanvasRef = useRef(null);
  const bgWaveRef = useRef(null);
  const miniWaveRef = useRef(null);

  // Fetch active talks (lifted from TalksList)
  useEffect(() => {
    const fetchTalks = async () => {
      try {
        const response = await fetch('/talks/active');
        if (response.ok) {
          const data = await response.json();
          setTalks(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setTalksLoading(false);
      }
    };

    fetchTalks();
    const interval = setInterval(fetchTalks, 5000);
    return () => clearInterval(interval);
  }, []);

  // Active talk change listener
  useEffect(() => {
    const handleActiveTalkChange = () => {
      setActiveTalkId(getActiveTalkId());
    };
    window.addEventListener('activeTalkChanged', handleActiveTalkChange);
    return () => window.removeEventListener('activeTalkChanged', handleActiveTalkChange);
  }, []);

  // Joining talk listener
  useEffect(() => {
    const handleJoiningTalk = (event) => {
      setIsLoading(event.detail.joining);
    };
    window.addEventListener('joiningTalk', handleJoiningTalk);
    return () => window.removeEventListener('joiningTalk', handleJoiningTalk);
  }, []);

  // Canvas waveform initialization
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (bgCanvasRef.current) {
      bgWaveRef.current = initWaveformBg(bgCanvasRef.current);
    }
    if (miniCanvasRef.current && bgWaveRef.current) {
      miniWaveRef.current = initMiniWaveform(miniCanvasRef.current, bgWaveRef.current.t);
    }

    return () => {
      if (bgWaveRef.current) bgWaveRef.current.destroy();
      if (miniWaveRef.current) miniWaveRef.current.destroy();
    };
  }, []);

  return (
    <div className="talks-landing">
      <canvas ref={bgCanvasRef} className="talks-canvas-bg" />
      <div className="talks-vignette" />

      <div className="talks-page">
        {activeTalkId && <div className="talks-active-overlay" />}
        {/* ── LEFT COLUMN: Hero ── */}
        <div className="talks-left">
          <div className="talks-eyebrow">
            <span className="talks-eyebrow-dot" />
            Pokoje – live audio &amp; wideo
          </div>
          <h1>
            Twoja scena.<br />
            Rozmowa <em>bez tabu</em>.<br />
            Prawdziwa społeczność.
          </h1>
          <p className="talks-sub">
            Otwórz pokój głosowy lub wideo w kilka sekund. Słuchacze wchodzą jednym kliknięciem, podnoszą rękę i dołączają do dyskusji.
          </p>
          <div className="talks-steps">
            <div className="talks-step">
              <div className="talks-sn">1</div>
              <div className="talks-st">
                <strong>Host otwiera pokój</strong>
                <span>Jeden klik – jesteś live. Wybierasz audio lub wideo.</span>
              </div>
            </div>
            <div className="talks-step">
              <div className="talks-sn">2</div>
              <div className="talks-st">
                <strong>Słuchacze dołączają</strong>
                <span>Obserwujący widzą pokój i wchodzą natychmiast.</span>
              </div>
            </div>
            <div className="talks-step">
              <div className="talks-sn">3</div>
              <div className="talks-st">
                <strong>Jesteś słuchaczem? Podnieś rękę i zabierz głos</strong>
                <span>Host akceptuje – słuchacz staje się rozmówcą.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Rooms + Video ── */}
        <div className="talks-right">
          <TalksList
            activeTalkId={activeTalkId}
            allow_anonymous_listening_description={allow_anonymous_listening_description}
            currentUserId={currentUserId}
            talks={talks}
            loading={talksLoading}
          />
          <ScheduledTalksList currentUserId={currentUserId} onCountChange={setScheduledCount} />
          {/* TODO: odkomentować po nagraniu filmu i wrzuceniu na YT
          <div className={`talks-video-section ${totalItems > 2 ? 'talks-video-section--hidden' : ''}`}>
            {totalItems > 0 && <div className="talks-divider" />}
            <VideoEmbed />
          </div>
          */}
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR (hidden during active talk) ── */}
      {!activeTalkId && (
        <div className="talks-bottom-bar">
          <div className="talks-bar-left">
            {talks.length > 0 && (
              <>
                <span className="talks-bar-live-dot" />
                <span className="talks-bar-live-text">
                  <span>{talks.length}</span>
                  {' '}
                  {talks.length === 1 ? 'pokój na żywo teraz' : 'pokoje na żywo teraz'}
                </span>
              </>
            )}
          </div>
          <div className="talks-bar-center">
            <CreateTalkButton
              isDisabled={false}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              adminOnlyCreationDescription={admin_only_creation_description}
            />
          </div>
          <div className="talks-bar-right">
            <canvas ref={miniCanvasRef} width="80" height="28" />
          </div>
        </div>
      )}

      {isLoading && <Loader />}
    </div>
  );
};

// ══════════════════════════════════════════════
// MOUNT
// ══════════════════════════════════════════════
function loadElement() {
  const root = document.getElementById('talks-list');
  if (root) {
    render(<TalksView />, root);
  }
}

window.InstantClick.on('change', () => {
  loadElement();
});

loadElement();
