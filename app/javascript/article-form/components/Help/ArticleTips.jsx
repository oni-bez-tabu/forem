import { h } from 'preact';

export const ArticleTips = () => (
  <div
    data-testid="article-publishing-tips"
    className="crayons-article-form__help crayons-article-form__help--tags"
  >
    <h4 className="mb-2 fs-l">Zalecenia publikacji</h4>
    <ul className="list-disc pl-6 color-base-70">
      <li>
        Upewnij się, że Twój post ma ustawioną okładkę, aby jak najlepiej wyglądać na stronie głównej i mediach społecznościowych.
      </li>
      <li>
        Udostępnij swój post na platformach społecznościowych i na innych grupach Twoich kontaktów.
      </li>
      <li>
        Poproś ludzi o pozostawienie pytań dla Ciebie w komentarzach. To świetny sposób na wywołanie dodatkowej dyskusji, opisując, dlaczego napisałeś to lub dlaczego ludzie mogą uznać to za pomocne. 
      </li>
    </ul>
  </div>
);
