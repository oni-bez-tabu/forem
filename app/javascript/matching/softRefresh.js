// Soft-refresh the current page by re-fetching its HTML and swapping the
// [data-soft-refresh-root] container's innerHTML. Preserves scroll position
// and any DOM outside the root (e.g. Preact modal mount points on <body>,
// fixed-position toasts).
//
// After the swap we dispatch `matching:dom-refreshed` so Preact packs that
// mount inside the swapped region (RsvpButtons, Dashboard, …) know to
// re-mount themselves into the fresh DOM nodes.
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
    if (!stillThere) return;
    stillThere.innerHTML = newRoot.innerHTML;
    document.dispatchEvent(new CustomEvent('matching:dom-refreshed'));
  } catch (_e) {
    // Stale UI stays; toast already confirmed the save.
  }
}
