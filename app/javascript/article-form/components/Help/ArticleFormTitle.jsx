import { h } from 'preact';

export const ArticleFormTitle = () => (
  <div
    data-testid="title-help"
    className="crayons-article-form__help crayons-article-form__help--title"
  >
    <h4 className="mb-2 fs-l">Napisz dobry tytuł posta</h4>
    <ul className="list-disc pl-6 color-base-70">
      <li>
        Pomyśl o tytule swojego posta jak o superkrótkim (ale przekonującym!) opisie
      — jak przegląd samego posta w jednym krótkim zdaniu.
      </li>
    </ul>
  </div>
);
