import { h, render, Fragment } from 'preact';
import { closeWindowModal, showWindowModal } from '@utilities/showModal';
import { useState, useEffect } from 'preact/hooks';
import { Spinner } from '@crayons/Spinner/Spinner';

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
      if (isMenuOpen && !e.target.closest('.menu-container')) {
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
        const diff = now - adaptedItem.publishedDate;
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDelete = async () => {
    if (confirm('Czy na pewno chcesz usunąć tę audycję?')) {
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
          const error = await response.json();
          alert('Nie udało się usunąć audycji: ' + (error.error || 'Nieznany błąd'));
        }
      } catch (error) {
        console.error(error);
        alert('Wystąpił błąd podczas usuwania audycji');
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <article className="flex p-4 m:p-6 pb-0 m:pb-2 pr-2 m:pr-6">
      <a
        className="crayons-avatar crayons-avatar--l"
        href={`/${adaptedItem.user.username}`}
        datatestid="item-user"
      >
        <img
          src={adaptedItem.user.profile_image_90 || '/images/default-avatar.png'} 
          alt={adaptedItem.user.username}
          className="crayons-avatar__image"
        />
      </a>

      <div className="flex-1 pl-2 m:pl-4">
        <h2 className="fs-base lh-tight m:fs-l fw-bold break-word">
          {adaptedItem.title}
        </h2>
        <p className="fs-s">
          <a
            href={`/${adaptedItem.user.username}`}
            className="crayons-link fw-medium"
          >
            {adaptedItem.user.username}
          </a>
          {adaptedItem.status === 'started' ? (
            <>
             <span className="color-base-30"> • </span>
             <span className="inline-flex items-center color-accent-danger relative" style={{ top: '4px' }}>
              <svg className="mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}>
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8" cy="8" r="3" fill="currentColor"/>
              </svg>
              live {duration && `• ${duration}`}
            </span>
            </>
          ) : adaptedItem.status === 'finished' ? (
            null
          ) : (
            <>
              <span className="color-base-30"> • </span>
              <span className="color-base-60">
                {adaptedItem.publishedDate.toLocaleString()}
              </span>
            </>
          )}
        </p>
      </div>
      <div className="m:self-center">
        {children}
        <div className="relative inline-block ml-2 menu-container">
          <button
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            className="crayons-btn crayons-btn--ghost crayons-btn--s crayons-btn--icon"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" className="crayons-icon">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 17a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0-7a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0-7a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="crayons-dropdown top-100 right-0 align-left block">
              {adaptedItem.status === 'started' && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + `/talks?activeTalk=${adaptedItem.channelId}`);
                    setIsMenuOpen(false);
                  }}
                  className="crayons-link crayons-link--block w-100 border-0 bg-transparent"
                >
                  Kopiuj link
                </button>
              )}
              <a href="https://3000-onibeztabu-forem-rulnqudx0es.ws-eu117.gitpod.io/report-abuse" className="crayons-link crayons-link--block w-100">
                Zgłoś audycję
              </a>
              {currentUserId === item.user.id && (
                <button
                  onClick={handleDelete}
                  className="crayons-link crayons-link--block w-100 color-accent-danger border-0 bg-transparent"
                >
                  Usuń audycję
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

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
      title: 'Utwórz nową audycję',
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
    <div className="mb-2 mt-2 m:mt-0 pl-2 m:pl-0 pr-2 m:pr-0"> 
      <button 
        onClick={openCreateTalkModal}
        className="c-btn c-btn--primary whitespace-nowrap w-100"
        disabled={isDisabled || (!isAdmin && adminOnlyCreationDescription)}
      >
        Rozpocznij audycję
      </button>
      <p className="fs-s color-base-60 align-center m:align-left mt-2" >
        Dziel się wiedzą na żywo i buduj społeczność wokół swoich zainteresowań
      </p>
    </div>
   
  );
};

const JoinTalkButton = ({ channelId, userId, isDisabled, currentUserId }) => {
  const handleJoin = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('activeTalk', channelId);
    window.location.href = url.toString();
  };

  return (
    <button 
      onClick={handleJoin}
      className={`c-btn c-btn--secondary`}
      disabled={isDisabled}
    >
      {currentUserId === userId ? 'Wejdź jako host' : 'Wejdź'}
    </button>
  );
};

const Loader = () => {
  return (
    <div className="loader-overlay fixed inset-0 bg-white/80 z-50">
      <div className="loader-content">
        <iframe 
          src="https://lottie.host/embed/e1194cb2-a25b-4090-a308-6a7ee9637bb6/ImvuNShUCA.lottie"
          style={{
            width: '100%',
            height: '300px',
            border: 'none',
            background: 'transparent',
            pointerEvents: 'none'
          }}
        />
        <p>Mamy nadzieje na Twoją aktywność :) <br/> Baw się dobrze!</p>
      </div>
    </div>
  );
};

const TalksList = ({ activeTalkId, currentUserId, allow_anonymous_listening_description }) => {
  const [talks, setTalks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTalks = async () => {
      try {
        const response = await fetch('/talks/active');
        if (response.ok) {
          const data = await response.json();
          setTalks(data);
        } else {
          setError('Nie udało się pobrać listy audycji');
        }
      } catch (error) {
        setError('Wystąpił błąd podczas pobierania danych');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTalks();
    const interval = setInterval(fetchTalks, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <LoadingPlaceholder />;
  }

  return (
    <Fragment>
      {talks.length === 0 ? (
        null
      ) : (
        talks.map((talk) => (
          <Item key={talk.id} item={talk} currentUserId={currentUserId}>
            <JoinTalkButton 
              channelId={talk.channel_id} 
              userId={talk.user.id} 
              isDisabled={!!activeTalkId || (!currentUserId && !allow_anonymous_listening_description)}
              currentUserId={currentUserId}
            />
          </Item>
        ))
      )}
    </Fragment>
  );
};

const LoadingPlaceholder = () => {
  return (
    <div className="crayons-story__indention w-100 mt-6">
      <div className="crayons-scaffold-loading w-50 h-0 py-4 mb-2" />
      <div className="crayons-story__meta w-100 mb-5">
        <div className="crayons-scaffold-loading w-10 h-0 py-3 mr-2" />
        <div className="crayons-scaffold-loading w-15 h-0 py-3" />
      </div>
    </div>
  );
};

const ScheduledTalksList = ({ currentUserId }) => {
  const [scheduledTalks, setScheduledTalks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScheduledTalks = async () => {
    try {
      const response = await fetch('/talks/scheduled');
      if (response.ok) {
        const data = await response.json();
        setScheduledTalks(data);
      } else {
        setError('Nie udało się pobrać listy zaplanowanych audycji');
      }
    } catch (error) {
      setError('Wystąpił błąd podczas pobierania danych');
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

  return (
    <Fragment>
      <div className="pt-2 flex justify-center">
        <strong>Nadchodzące audycje</strong>
      </div>
      {scheduledTalks.length > 0 ? (
        scheduledTalks.map((talk) => (
          <Item key={talk.id} item={talk} currentUserId={currentUserId}>
            {talk.scheduled_channel_id && (
              <JoinTalkButton
                channelId={talk.scheduled_channel_id} 
                userId={talk.user.id}
                isDisabled={false}
                currentUserId={currentUserId}
              />
            )}
          </Item>
        ))
      ) : (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center p-2 text-base text-gray-600">
            Brak zaplanowanych audycji
          </div>
        </div>
      )}
    </Fragment>
  );
};

const TalksView = () => {
  const userData = document.body.dataset.user ? JSON.parse(document.body.dataset.user) : {};
  const currentUserId = userData?.id || null;
  const isAdmin = userData?.admin || false;

  const {admin_only_creation_description, allow_anonymous_listening_description} = JSON.parse(document.getElementById('talks-list').dataset.settings || '{}');

  const getActiveTalkId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('activeTalk') || sessionStorage.getItem('activeTalkId');
  };

  const [activeTalkId, setActiveTalkId] = useState(getActiveTalkId());
  const [isLoading, setIsLoading] = useState(!!getActiveTalkId());

  useEffect(() => {
    const handleActiveTalkChange = () => {
      setActiveTalkId(getActiveTalkId());
    };

    window.addEventListener('activeTalkChanged', handleActiveTalkChange);

    return () => {
      window.removeEventListener('activeTalkChanged', handleActiveTalkChange);
    };
  }, []);

  useEffect(() => {
    const handleJoiningTalk = (event) => {
      setIsLoading(event.detail.joining);
    };

    window.addEventListener('joiningTalk', handleJoiningTalk);

    return () => {
      window.removeEventListener('joiningTalk', handleJoiningTalk);
    };
  }, []);

  return (
    <main class="crayons-layout crayons-layout--header-inside crayons-layout--2-cols mb-10">
      <header class="crayons-page-header block s:flex p-0">
        <img src="/assets/talks-banner.png" style="aspect-ratio: auto 2376 / 594;" width="2376" height="594" class="crayons-article__cover__image" alt="" />
      </header>
      <div className="crayons-layout__sidebar-left">
        <CreateTalkButton 
          isDisabled={!!activeTalkId} 
          currentUserId={currentUserId} 
          isAdmin={isAdmin}
          adminOnlyCreationDescription={admin_only_creation_description} />
      </div>
      <section class="crayons-layout__content crayons-card pb-4"> 
        {isLoading && <Loader />}
        <TalksList activeTalkId={activeTalkId} allow_anonymous_listening_description={allow_anonymous_listening_description} currentUserId={currentUserId} />
        <ScheduledTalksList currentUserId={currentUserId} />
      </section>
    </main>
  );
};

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