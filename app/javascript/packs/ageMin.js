import {
    closeWindowModal,
    showWindowModal,
    WINDOW_MODAL_ID,
  } from '@utilities/showModal';

const AGE_OF_ADULT = 18;
const AGE_OF_TEEN = 15;

const element = document.getElementById("article-show-container");
const ageMin = parseInt(element.getAttribute("data-age-min"));
if (ageMin >= AGE_OF_TEEN) {
  const ageOfUser = parseInt(localStorage.getItem('age_min'));

  if (isNaN(ageOfUser) || ageOfUser < ageMin) {
    const mainContent = document.getElementById("main-content");

    mainContent.style.visibility = "hidden";

    const modalContent = ageMin === AGE_OF_ADULT ? `
      <div class="audlt-content">
        <h2>Ten post został oznaczony jako dla dorosłych +18</h2>
        <p>Post zawiera materiały z ograniczeniami wiekowymi, możliwa nagość i wyraźne przedstawienia aktywności seksualnej. Wchodząc na stronę, użytkownik potwierdza, że ma co najmniej 18 lat i wyraża zgodę na oglądanie treści o charakterze jednoznacznie seksualnym.</p>
        <button class="crayons-btn crayons-btn--success" id="confirmAge">Mam ukończone 18 lat - Wchodzę</button>
        <button class="crayons-btn crayons-btn--warning" id="denyAccess">Mam mniej niż 18 lat - Wyjdź</button>
      </div>
    ` : `
      <div class="audlt-content">
        <h2>Ten post został oznaczony jako dla młodzieży 15+</h2>
        <p>Post zawiera materiały przeznaczone dla młodzieży powyżej 15 roku życia. Mogą pojawić się treści zawierające przemoc, wulgarny język lub nieodpowiednie dla młodszych odbiorców tematy. Wchodząc na stronę, potwierdzasz że masz ukończone 15 lat.</p>
        <button class="crayons-btn crayons-btn--success" id="confirmAge">Mam ukończone 15 lat - Wchodzę</button>
        <button class="crayons-btn crayons-btn--warning" id="denyAccess">Mam mniej niż 15 lat - Wyjdź</button>
      </div>
    `;

    showWindowModal({
      document: window.parent.document,
      showHeader: false,
      modalContent: modalContent,
      title: ageMin === AGE_OF_ADULT ? 'Ten post został oznaczony jako dla dorosłych +18' : 'Ten post został oznaczony jako dla młodzieży 15+'
    });

    setTimeout(() => {
      const confirmButton = window.parent.document.getElementById("confirmAge");
      const denyButton = window.parent.document.getElementById("denyAccess");

      confirmButton.addEventListener('click', function() {
        mainContent.style.visibility = "visible";
        localStorage.setItem('age_min', ageMin);
        closeWindowModal(window.parent.document);
      });

      denyButton.addEventListener('click', function() {
        window.location.href = '/'; 
      });
    }, 0);
  }
}