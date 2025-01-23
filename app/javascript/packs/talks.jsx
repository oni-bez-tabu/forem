import { h, render } from 'preact';
import { closeWindowModal, showWindowModal } from '@utilities/showModal';
import { useState, useEffect } from 'preact/hooks';
import { joinTalk } from '@utilities/talks/joinTalk';

const CreateTalkButton = ({ isDisabled }) => {
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
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
    <button 
      onClick={openCreateTalkModal}
      className="btn btn-primary"
      disabled={isDisabled}
    >
      Rozpocznij audycję
    </button>
  );
};

const JoinTalkButton = ({ channelId, userId, isDisabled }) => {
  const isHost = window.currentUser && window.currentUser.id === userId;

  const handleJoin = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('activeTalk', channelId);
    window.location.href = url.toString();
  };

  return (
    <button 
      onClick={handleJoin}
      className={`btn btn-sm ${isHost ? 'btn-primary' : 'btn-success'}`}
      disabled={isDisabled}
    >
      {isHost ? 'Wejdź jako Host' : 'Słuchaj'}
    </button>
  );
};

const TalksList = ({ activeTalkId }) => {
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
    return <div>Ładowanie...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="talks-list mt-4">
      <h2>Aktywne audycje</h2>
      {talks.length === 0 ? (
        <p>Brak aktywnych audycji</p>
      ) : (
        <div className="row">
          {talks.map((talk) => (
            <div key={talk.id} className="col-md-4 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{talk.title}</h5>
                  <p className="card-text">
                    Prowadzący: {talk.user.username}
                  </p>
                  <p className="card-text">
                    <small className="text-muted">
                      Rozpoczęto: {new Date(talk.start_date).toLocaleString()}
                    </small>
                  </p>
                  <JoinTalkButton 
                    channelId={talk.channel_id} 
                    userId={talk.user.id} 
                    isDisabled={!!activeTalkId} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ScheduledTalksList = () => {
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
    return <div>Ładowanie...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="scheduled-talks-list mt-4">
      <h2>Zaplanowane audycje</h2>
      {scheduledTalks.length === 0 ? (
        <p>Brak zaplanowanych audycji</p>
      ) : (
        <div className="row">
          {scheduledTalks.map((talk) => (
            <div key={talk.id} className="col-md-4 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{talk.title}</h5>
                  <p className="card-text">
                    Prowadzący: {talk.user.username}
                  </p>
                  <p className="card-text">
                    <small className="text-muted">
                      Zaplanowano na: {new Date(talk.start_date).toLocaleString()}
                    </small>
                  </p>
                  {talk.scheduled_channel_id && (
                    <JoinTalkButton 
                      channelId={talk.scheduled_channel_id}
                      userId={talk.user.id}
                      isDisabled={false}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TalksView = () => {
  const getActiveTalkId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('activeTalk') || sessionStorage.getItem('activeTalkId');
  };

  const [activeTalkId, setActiveTalkId] = useState(getActiveTalkId());

  useEffect(() => {
    const handleActiveTalkChange = () => {
      setActiveTalkId(getActiveTalkId());
    };

    window.addEventListener('activeTalkChanged', handleActiveTalkChange);

    return () => {
      window.removeEventListener('activeTalkChanged', handleActiveTalkChange);
    };
  }, []);

  return (
    <div>
      <h1>Lista audycji</h1>
      <CreateTalkButton isDisabled={!!activeTalkId} />
      <TalksList activeTalkId={activeTalkId} />
      <ScheduledTalksList />
    </div>
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