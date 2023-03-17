import { css, html, LitElement } from "lit";

export class MetaView extends LitElement {
  render() {
    return html`
      <div class="menu">
        <div class="container-row">
          <div></div>
        </div>
      </div>
    `;
  }

  static styles = css`
    .container-row {
      display: flex;
      flex-direction: row;
    }

    .container-col {
      display: flex;
      flex-direction: column;
    }

    .menu {

      /* MENU */
      .cc-meta {
        position: absolute;
        z-index: 3;
        top: 5px;
        right: 5px;
        background: #333;
        border: 1px solid #aaa;
        width: 220px;
        min-height: 100px;
        height: auto;
        opacity: .3;
        transition: opacity .5s;
    }
  `;
}
