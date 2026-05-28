// Soft-refresh the current page by re-fetching its HTML and swapping the
// [data-soft-refresh-root] container's innerHTML. Preserves scroll position
// and any DOM outside the root (e.g. modal mount points, fixed-position
// toasts). No-op if the container isn't present in either the current DOM
// or the freshly-fetched HTML.
export async function softRefreshCurrentPage() {
  const currentRoot = document.querySelector('[data-soft-refresh-root]');
  if (!currentRoot) return;
  try {
    const response = await fetch(window.location.href, {
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'text/html' },
    });
    if (!response.ok) return;
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newRoot = doc.querySelector('[data-soft-refresh-root]');
    if (!newRoot) return;
    const stillThere = document.querySelector('[data-soft-refresh-root]');
    if (stillThere) stillThere.innerHTML = newRoot.innerHTML;
  } catch (_e) {
    // Stale UI stays; toast already confirmed the save.
  }
}
