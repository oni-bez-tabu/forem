import { h } from 'preact';
import PropTypes from 'prop-types';

export const EditorFormattingHelp = ({ openModal }) => (
  <div
    data-testid="format-help"
    className="crayons-article-form__help crayons-article-form__help--body"
  >
    <h4 className="mb-2 fs-l">Podstawy edytora</h4>
    <ul className="list-disc pl-6 color-base-70">
      <li>
        Użyj{' '}
        <a href="#markdown" onClick={() => openModal('markdownShowing')}>
          Markdown
        </a>{' '}
        do napisania posta.
        <details className="fs-s my-1">
          <summary class="cursor-pointer">Powszechnie używana składnia</summary>
          <table className="crayons-card crayons-card--secondary crayons-table crayons-table--compact w-100 mt-2 mb-4 lh-tight">
            <tbody>
              <tr>
                <td className="ff-monospace">
                  # Nagłówek
                  <br />
                  ...
                  <br />
                  ###### Nagłówek
                </td>
                <td>
                  H1 Nagłówek
                  <br />
                  ...
                  <br />
                  H6 Nagłówek
                </td>
              </tr>
              <tr>
                <td className="ff-monospace">*kursywa* lub _kursywa_</td>
                <td>
                  <em>kursywa</em>
                </td>
              </tr>
              <tr>
                <td className="ff-monospace">**pogrubienie**</td>
                <td>
                  <strong>pogrubienie</strong>
                </td>
              </tr>
              <tr>
                <td className="ff-monospace">[Link](https://...)</td>
                <td>
                  <a href="https://nietabu.pl">Link</a>
                </td>
              </tr>
              <tr>
                <td className="ff-monospace">
                  * podpunkt 1<br />* podpunkt 2
                </td>
                <td>
                  <ul class="list-disc ml-5">
                    <li>podpunkt 1</li>
                    <li>podpunkt 2</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td className="ff-monospace">
                  1. podpunkt 1<br />
                  2. podpunkt 2
                </td>
                <td>
                  <ul class="list-decimal ml-5">
                    <li>1. podpunkt 1</li>
                    <li>2. podpunkt 2</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td className="ff-monospace">&gt; cytat</td>
                <td>
                  <span className="pl-2 border-0 border-solid border-l-2 border-base-50">
                    cytat
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </details>
      </li>
      <li>
      Osadź bogate treści, takie jak Tiktoki, filmy z YouTube czy post Instagram itp. Użyj składni
        URL: <code>{'{% embed https://... %}.'}</code>{' '}
        <a href="#liquid" onClick={() => openModal('liquidShowing')}>
          Zobacz listę wszystkich dostępnych platfo
        </a>
        .
      </li>
      <li>
        Za pomocą "drag&dropa" możesz dodawać zdjęcia do treści posta jak również zmieniać jego okładkę.
      </li>
    </ul>
  </div>
);

EditorFormattingHelp.propTypes = {
  openModal: PropTypes.func.isRequired,
};
