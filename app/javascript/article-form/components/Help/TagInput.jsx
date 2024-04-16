import { h } from 'preact';

export const TagInput = () => (
  <div
    data-testid="basic-tag-input-help"
    className="crayons-article-form__help crayons-article-form__help--tags"
  >
    <h4 className="mb-2 fs-l">Wytyczne dotyczące Tagowania</h4>
    <ul className="list-disc pl-6 color-base-70">
      <li>
        Tagi pomagają ludziom znaleźć Twój post - traktuj je jak tematy lub kategorie, które najlepiej opisują Twój post.
      </li>
      <li>
        Dodaj maksymalnie cztery tagi oddzielone przecinkami na post. Stosuj istniejące tagi, gdy tylko to możliwe.  
      </li>
      <li>
        Niektóre tagi mają specjalne wytyczne dotyczące publikowania - upewnij się, że Twój post jest zgodny z nimi.
      </li>
    </ul>
  </div>
);
