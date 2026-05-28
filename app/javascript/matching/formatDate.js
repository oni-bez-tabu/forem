// Lightweight date formatters for matching dashboards. ISO string → human
// shortform ("dzisiaj o 15:32", "wczoraj", "12 cze", "1 maj 2027").
const SHORT_MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

const FULL_MONTHS = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear) return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fullDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const UNITS = [
  { limit: 60, label: 'teraz' },
  { limit: 60 * 60, divisor: 60, suffix: 'min' },
  { limit: 60 * 60 * 24, divisor: 60 * 60, suffix: 'h' },
  { limit: 60 * 60 * 24 * 7, divisor: 60 * 60 * 24, suffix: 'd' },
];

export function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const seconds = Math.max(0, Math.floor((now - d) / 1000));
  for (const unit of UNITS) {
    if (seconds < unit.limit) {
      if (unit.divisor) {
        const v = Math.max(1, Math.floor(seconds / unit.divisor));
        return `${v} ${unit.suffix} temu`;
      }
      return unit.label;
    }
  }
  if (isSameDay(d, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return 'wczoraj';
  return shortDate(iso);
}
