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

// Banner gradient palette — mirror MeetupsHelper::BANNER_GRADIENTS Ruby.
export const BANNER_GRADIENTS = {
  dusk: 'linear-gradient(135deg, #4a0e4e 0%, #81267d 100%)',
  velvet: 'linear-gradient(135deg, #6b0f1a 0%, #d4351c 100%)',
  ember: 'linear-gradient(135deg, #c2410c 0%, #f59e0b 100%)',
  night: 'linear-gradient(135deg, #0c1e3a 0%, #1e3a8a 100%)',
  olive: 'linear-gradient(135deg, #365314 0%, #84cc16 100%)',
  sunrise: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
};

export function bannerGradient(name) {
  return BANNER_GRADIENTS[name] || BANNER_GRADIENTS.dusk;
}

// Dot timeline colors (matching MatchingHelper#dot_hex_for in Ruby).
export const DOT_HEX = {
  match_found: '#171717',
  declaration_created: '#a91f69',
  declaration_updated: '#a91f69',
  welcome_sent: '#6366f1',
  welcome_received: '#6366f1',
  needs_intent: '#d97706',
  rsvp_created: '#9ca3af',
  recommendation: '#d1d5db',
};

export function dotHex(type) {
  return DOT_HEX[type] || '#9ca3af';
}
