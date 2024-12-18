import { h } from 'preact';
import { ButtonNew as Button, Icon } from '@crayons';
import { currentOS, currentContext } from '@utilities/runtime';
import CloseIcon from '@images/x.svg';
import SmallBell from '@images/small-bell.svg';

const BANNER_DISMISS_KEY = 'runtimeBannerDismissed';
const DAYS_TO_AGAIN_SHOW = 5;
const URL_TUTORIAL_IOS = "/page/instrukcja-pwa-ios", URL_TUTORIAL_ANDROID = "/page/instrukcja-pwa-android";

function dismissBanner() {
  localStorage.setItem(BANNER_DISMISS_KEY, Date.now().toString());
  removeFromDOM();
}

function removeFromDOM() {
  const container = document.getElementById('runtime-banner-container');
  container?.remove();
}

function isMobileDevice() {
  return currentContext().match(/Browser-((iOS)|(Android))/) !== null;
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function shouldShowBanner() {
  if (!isMobileDevice()) {
    return false;
  }

  if (isInStandaloneMode()) {
    return false;
  }

  const dismissedAt = localStorage.getItem(BANNER_DISMISS_KEY);
  if (dismissedAt) {
    const dismissedTime = new Date(parseInt(dismissedAt, 10));
    const now = new Date();
    const diffDays = (now - dismissedTime) / (1000 * 60 * 60 * 24);
    if (diffDays < DAYS_TO_AGAIN_SHOW) {
      return false;
    }
  }
  return true;
}

/**
 * A banner that checks if the user is on a mobile browser and not in PWA mode.
 * If so, it displays a banner directing to the PWA installation instructions.
 * If dismissed, the banner will reappear after DAYS_TO_AGAIN_SHOW days.
 */
export const RuntimeBanner = () => {
  if (!shouldShowBanner()) {
    removeFromDOM();
    return;
  }

  const targetURL = currentOS() === 'Android' ? URL_TUTORIAL_ANDROID : URL_TUTORIAL_IOS;

  const bannerText = currentOS() === 'Android'
    ? {
        title: "Dodaj nie!tabu do swoich aplikacji",
        description: "Bądź jeszcze bliżej Twojej społeczności!"
      }
    : {
        title: "Dodaj nie!tabu do swoich aplikacji",
        description: "Dzięki temu będziesz otrzymywać notyfikacje."
      };

  return (
    <div class="runtime-banner">
      <a
        href={targetURL}
        class="flex items-center flex-1"
        rel="noopener noreferrer"
      >
        <Icon src={SmallBell} native />
        <div class="flex flex-col pl-3">
          <span>{bannerText.title}</span>
          <span>{bannerText.description}</span>
        </div>
      </a>
      <Button
        onClick={dismissBanner}
        class="runtime-banner__dismiss color-base-inverted"
        icon={CloseIcon}
        tooltip="Zamknij baner"
      />
    </div>
  );
};