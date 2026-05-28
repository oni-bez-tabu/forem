// Style helpers shared by all matching widgets. Mirrors MatchingHelper#pill_style
// and #intent_emoji in Ruby — port stays in sync until Crayons exposes proper
// CSS tokens for these.

const PILL_BASE =
  'display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap;';

const PILL_VARIANTS = {
  solid: 'background: var(--base-90, #171717); color: #fff;',
  brand: 'background: var(--accent-brand, #6366f1); color: #fff;',
  brand_soft: 'background: var(--accent-brand-lighter, #ede9fe); color: var(--accent-brand, #6366f1);',
  magenta: 'background: rgba(169,31,105,0.12); color: rgb(169,31,105);',
  success: 'background: rgba(5,150,105,0.12); color: rgb(5,150,105);',
  warning: 'background: rgba(217,119,6,0.12); color: rgb(217,119,6);',
  danger: 'background: rgba(220,38,38,0.12); color: rgb(220,38,38);',
  outline:
    'background: transparent; border: 1px solid var(--card-border, #e5e5e5); color: var(--base-90, #171717); font-weight: 500;',
};

export function pillStyle(variant) {
  const tail = PILL_VARIANTS[variant] || PILL_VARIANTS.outline;
  return `${PILL_BASE} ${tail}`;
}

export const INTENT_EMOJI = {
  open_to_meet: '💬',
  just_vibe: '🌙',
  not_looking: '🌑',
};

export function intentEmoji(level) {
  return INTENT_EMOJI[level] || '✨';
}

export const IDENTITY_LABELS = {
  woman: 'Kobieta',
  man: 'Mężczyzna',
  couple: 'Para',
  non_binary: 'Osoba niebinarna',
};

export function identityLabel(type) {
  return IDENTITY_LABELS[type] || type;
}

export const INTENT_LABELS = {
  open_to_meet: 'Otwarty na poznanie',
  just_vibe: 'Tylko klimat',
  not_looking: 'Nie szukam',
};

export function intentLabel(level) {
  return INTENT_LABELS[level] || level;
}
