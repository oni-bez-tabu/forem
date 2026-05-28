// Shared toast helper for matching SPA widgets. Single instance: re-shown
// toast replaces the previous one. Fixed top-center, brand-coloured pill.
const VARIANT_BG = {
  success: 'rgb(5,150,105)',
  error: 'rgb(220,38,38)',
};

export function showToast(message, variant = 'success') {
  const existing = document.getElementById('matching-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'matching-toast';
  toast.textContent = message;
  toast.style.cssText = [
    'position: fixed',
    'left: 50%',
    'top: 24px',
    'transform: translateX(-50%)',
    `background: ${VARIANT_BG[variant] || VARIANT_BG.success}`,
    'color: #fff',
    'padding: 12px 20px',
    'border-radius: 999px',
    'font-size: 14px',
    'font-weight: 600',
    'box-shadow: 0 10px 30px rgba(0,0,0,0.18)',
    'z-index: 2000',
    'opacity: 0',
    'transition: opacity 180ms ease',
  ].join('; ');
  document.body.appendChild(toast);
  window.requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 220);
  }, 2400);
}
