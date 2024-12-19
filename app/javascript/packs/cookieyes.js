// Skrypt do obsługi CookieYes
document.addEventListener('DOMContentLoaded', function() {
    const script = document.createElement('script');
    script.id = 'cookieyes';
    script.type = 'text/javascript';
    script.src = `https://cdn-cookieyes.com/client_data/${document.body.dataset.cookieyesApiKey}/script.js`;
    document.head.appendChild(script);
}); 