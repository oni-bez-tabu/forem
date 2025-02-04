import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { joinTalk } from './joinTalk';

const AppBuilder = ({access, channelId, token, username, isHost, video }) => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
      const script = document.createElement('script');
      script.src = video ? '/app-builder-web-sdk-video.var.js' : '/app-builder-web-sdk-voice.var.js';
      script.async = true;
      
      script.onload = () => {
        if (window.AgoraAppBuilder) {
          setSdkLoaded(true);
        }
      };    

      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
  }, []);

  useEffect(() => {
    const initializeSDK = async () => {
      if (!sdkLoaded) return;

      const handleSuccessfulJoin = () => {
        setIsConnected(true);
        window.dispatchEvent(new Event('activeTalkChanged'));
      };

      const sdk = window.AgoraAppBuilder.default;
      try {
        await sdk.login(token);
    
        sdk.joinPrecall(
          access,
          username,
          false,
          { disableShareTile: true }
        ).then((enterRoom) => {
          handleSuccessfulJoin();
          return enterRoom();
        });
        
        const element = document.querySelector('app-builder');
        if (element) {
          const isMobile = window.innerWidth < 768;
          
          if (!isMobile) {
            const resizer = document.createElement('div');
            resizer.className = 'resizer';
            element.parentNode.insertBefore(resizer, element);
            element.style.width = '950px';

            const toggleButton = document.createElement('button');
            toggleButton.className = 'toggle-size-button';
            toggleButton.innerHTML = '⇄';
            resizer.appendChild(toggleButton);
            
            let currentExpanded = false;
            
            toggleButton.addEventListener('click', () => {
              currentExpanded = !currentExpanded;            
              if (currentExpanded) {
                element.style.width = '100vw';
              } else {
                element.style.width = '350px';
              }
            });
      
            let x = 0;
            let w = 0;
      
            const mouseMoveHandler = (e) => {
              e.preventDefault();
              const dx = e.clientX - x;
              const newWidth = Math.max(350, w - dx);
              element.style.width = `${newWidth}px`;
            };
      
            const mouseUpHandler = () => {
              document.removeEventListener('mousemove', mouseMoveHandler);
              document.removeEventListener('mouseup', mouseUpHandler);
            };
      
            const mouseDownHandler = (e) => {
              e.preventDefault();
              x = e.clientX;
              w = parseInt(getComputedStyle(element).width, 10);
              document.addEventListener('mousemove', mouseMoveHandler);
              document.addEventListener('mouseup', mouseUpHandler);
            };
      
            resizer.addEventListener('mousedown', mouseDownHandler);
          } else {
            const calculateHeight = () => {
              const topbarHeight = document.getElementById('topbar')?.offsetHeight || 56;
              const availableHeight = window.innerHeight - topbarHeight;
              element.style.height = `${availableHeight}px`;
            };

            calculateHeight();
            
            window.addEventListener('resize', calculateHeight);
            
            const toggleButton = document.createElement('button');
            toggleButton.className = 'toggle-size-button mobile';
            toggleButton.innerHTML = '⇄';
            element.parentNode.insertBefore(toggleButton, element);
            
            let isExpanded = true;
            
            toggleButton.addEventListener('click', () => {
              isExpanded = !isExpanded;
              if (isExpanded) {
                calculateHeight();
              } else {
                element.style.height = '130px';
              }
            });
          }
        }
      } catch (error) {
        alert("error");
        console.error("Error joining room:", error);
      }
    };

    initializeSDK();
  }, [sdkLoaded, access, token, username, isHost, channelId]);

  useEffect(() => {
    if (sdkLoaded){
      window.AgoraAppBuilder.default.on("leave", () => {  
        setIsConnected(false);
        sessionStorage.removeItem('activeTalkId');
        
        const url = new URL(window.location);
        url.searchParams.delete('activeTalk');
        window.history.replaceState({}, '', url);
        
        window.dispatchEvent(new Event('activeTalkChanged'));
      });

      window.AgoraAppBuilder.default.on("join", () => {  
        sessionStorage.setItem('activeTalkId', channelId);
      });

      window.AgoraAppBuilder.default.on("ready-to-join", () => {  
        window.dispatchEvent(new CustomEvent('joiningTalk', { detail: { joining: false }}));
      });
    };
  }, [sdkLoaded]);

  if (!sdkLoaded) return null;
    
  return <div className={`app-builder-container`} style={{visibility: isConnected ? 'visible' : 'hidden'}}><app-builder /></div>;
};

const renderAppBuilder = (channelId, access, token, username, isHost=false, video=false) => {
  const container = document.getElementById('talkscontent');
  if (container) {
    render(<AppBuilder channelId={channelId} token={token} username={username} access={access} isHost={isHost} video={video} />, container);
  }
}

window.renderAppBuilder = renderAppBuilder;

export function initializeTalks() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlActiveTalk = urlParams.get('activeTalk');
  
  if (urlActiveTalk) {
    joinTalk(urlActiveTalk);
  } else {
    const storedActiveTalkId = sessionStorage.getItem('activeTalkId');
    if (storedActiveTalkId) {
      joinTalk(storedActiveTalkId);
    }
  }
}

