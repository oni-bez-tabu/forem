import {
    closeWindowModal,
    showWindowModal,
    WINDOW_MODAL_ID,
  } from '@utilities/showModal';

const AGE_OF_ADULT = "18";

const element = document.getElementById("article-show-container");
const ageMin = element.getAttribute("data-age-min");

if (ageMin === AGE_OF_ADULT) {
  const ageOfUser = localStorage.getItem('age_min');

  if (ageOfUser !== AGE_OF_ADULT) {
    var mainContent = document.getElementById("main-content");

    mainContent.style.visibility = "hidden";

    showWindowModal({
      document: window.parent.document,
      showHeader: false,
      modalContent: `
      <div class="audlt-content">
        <h2>Ten post został oznaczony jako dla dorosłych</h2>
        <p>Post zawiera materiały z ograniczeniami wiekowymi, możliwa nagość i wyraźne przedstawienia aktywności seksualnej. Wchodząc na stronę, użytkownik potwierdza, że ma co najmniej 18 lat i wyraża zgodę na oglądanie treści o charakterze jednoznacznie seksualnym.</p>
        <button class="crayons-btn crayons-btn--success" id="confirmAge">Mam ukończone 18 lat - Wchodzę</button>
        <button class="crayons-btn crayons-btn--warning" id="denyAccess">Mam mniej niż 18 lat - Wyjdź</button>
      </div>
      `,
      title: 'Ten post został oznaczony jako dla dorosłych'
    });

    setTimeout(() => {
      const confirmButton = window.parent.document.getElementById("confirmAge");
      const denyButton = window.parent.document.getElementById("denyAccess");

      confirmButton.addEventListener('click', function() {
        mainContent.style.visibility = "visible";
        localStorage.setItem('age_min', AGE_OF_ADULT);
        closeWindowModal(window.parent.document);
      });

      denyButton.addEventListener('click', function() {
        window.location.href = '/'; 
      });
    }, 0);
  }
}