document.addEventListener('DOMContentLoaded', function() {
    const script = document.createElement('script');
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);

    script.onload = function() {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
                appId: document.body.dataset.onesignalAppId,
            });

            if (window.currentUser !== undefined && window.currentUser !== null) {
                let currentUser = window.currentUser;
                if (typeof window.currentUser === 'string') {
                    currentUser = JSON.parse(window.currentUser);
                }

                await OneSignal.login(String(currentUser.id));
            } else {
                await OneSignal.logout();
            }
              
            OneSignal.Notifications.addEventListener("click", (event) => {
                if (event.result.url !== window.location.href) {
                    InstantClick.preload(event.result.url);
                    InstantClick.display(event.result.url);
                }
            });
        });
    };
});