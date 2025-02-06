import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { joinTalk } from './joinTalk';

const AppBuilder = ({access, channelId, token, username, isHost, video }) => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState(false);

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
      } catch (error) {
        alert("Error");
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
        setIsLive(true);
      });

      window.AgoraAppBuilder.default.on("ready-to-join", () => {  
        window.dispatchEvent(new CustomEvent('joiningTalk', { detail: { joining: false }}));
      });
    };
  }, [sdkLoaded]);

  useEffect(() => {
    if (isLive) {
        const element = document.querySelector('app-builder');
        if (element && isLive) {
          const container = element.closest('.app-builder-container');
          const isMobileView = window.innerWidth < 768;
          if (isMobileView) {
            const minimizeButton = document.createElement('div');
            minimizeButton.className = 'minimize-button';
            minimizeButton.classList.add('minimized'); 

            container.prepend(minimizeButton);

            let isMinimized = false;
            minimizeButton.addEventListener('click', () => {
              if (!isMinimized) {
                container.style.height = '128px';
                minimizeButton.classList.remove('minimized');
                minimizeButton.classList.add('maximized');
                container.querySelector('.r-417010').style.display = 'none';
              } else {
                container.style.height = '100%';
                minimizeButton.classList.remove('maximized');
                minimizeButton.classList.add('minimized'); 
                container.querySelector('.r-417010').style.display = '';
              }
              isMinimized = !isMinimized;
            });
          } else {
            let isDragging = false;
            let isResizing = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;
            let initialWidth;
            let initialHeight;
            let initialMouseX;
            let initialMouseY;
  
            const updatePosition = () => {
              const marginRight = 20;
              const marginBottom = 20;
              const width = Math.max(window.innerWidth * 0.3, 500); // 30vw jako piksele lub minimalna szerokość
              const height = Math.max(window.innerHeight * 0.8, 550); // 80vh jako piksele lub minimalna wysokość
              
              container.style.width = `${width}px`;
              container.style.height = `${height}px`;
              container.style.left = `${window.innerWidth - width - marginRight}px`;
              container.style.top = `${window.innerHeight - height - marginBottom}px`;
            };
  
            // Początkowe ustawienie pozycji
            container.style.position = 'fixed';
            container.style.transform = 'none';
            container.style.right = 'auto';
            container.style.bottom = 'auto';
            updatePosition();
            
            // Nasłuchiwanie na zmianę rozmiaru okna
            window.addEventListener('resize', updatePosition);
  
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            
            // Dodajemy przycisk fullscreen
            const fullscreenButton = document.createElement('div');
            fullscreenButton.className = 'fullscreen-button';
            fullscreenButton.innerHTML = '⛶';
            dragHandle.appendChild(fullscreenButton);
            
            container.prepend(dragHandle);
  
            // Dodajemy uchwyt do resize
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            container.appendChild(resizeHandle);
  
            // Obsługa fullscreen
            let isFullscreen = false;
            fullscreenButton.addEventListener('click', (e) => {
              e.stopPropagation(); // Zapobiegamy propagacji do dragHandle
              if (!isFullscreen) {
                container.dataset.prevWidth = container.style.width;
                container.dataset.prevHeight = container.style.height;
                container.dataset.prevLeft = container.style.left;
                container.dataset.prevTop = container.style.top;
  
                container.style.width = '100vw';
                container.style.height = '100vh';
                container.style.left = '0';
                container.style.top = '0';
                fullscreenButton.innerHTML = 'X';
                resizeHandle.style.display = 'none'; // Ukrywamy resize handle w trybie fullscreen
              } else {
                container.style.width = container.dataset.prevWidth;
                container.style.height = container.dataset.prevHeight;
                container.style.left = container.dataset.prevLeft;
                container.style.top = container.dataset.prevTop;
                fullscreenButton.innerHTML = '⛶';
                resizeHandle.style.display = 'block'; // Pokazujemy resize handle
              }
              isFullscreen = !isFullscreen;
            });
  
            dragHandle.addEventListener('mousedown', (e) => {
              if (e.target === fullscreenButton) return; // Ignorujemy przeciąganie gdy klikamy fullscreen
              isDragging = true;
              document.body.style.userSelect = 'none';
              const rect = container.getBoundingClientRect();
              xOffset = rect.left;
              yOffset = rect.top;
              initialX = e.clientX - xOffset;
              initialY = e.clientY - yOffset;
            });
  
            resizeHandle.addEventListener('mousedown', (e) => {
              isResizing = true;
              document.body.style.userSelect = 'none';
              e.stopPropagation();
              initialWidth = container.offsetWidth;
              initialHeight = container.offsetHeight;
              initialMouseX = e.clientX;
              initialMouseY = e.clientY;
            });
  
            document.addEventListener('mousemove', (e) => {
              if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                container.style.right = 'auto';
                container.style.bottom = 'auto';
                container.style.left = `${currentX}px`;
                container.style.top = `${currentY}px`;
              } else if (isResizing) {
                e.preventDefault();
                const deltaWidth = e.clientX - initialMouseX;
                const deltaHeight = e.clientY - initialMouseY;
                const newWidth = Math.max(500, initialWidth + deltaWidth);
                const newHeight = Math.max(550, initialHeight + deltaHeight);
                container.style.width = `${newWidth}px`;
                container.style.height = `${newHeight}px`;
              }
            });
  
            document.addEventListener('mouseup', () => {
              isDragging = false;
              isResizing = false;
              document.body.style.userSelect = '';
            });
  
            // Sprzątanie
            return () => {
              window.removeEventListener('resize', updatePosition);
            };
          }
        }
    }
  }, [isLive]);

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

