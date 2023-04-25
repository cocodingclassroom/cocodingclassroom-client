import { css, html, LitElement, unsafeCSS } from "lit";
import { pulseStyle } from "../../util/shared-css";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";

export class HoverableIcon extends LitElement {
  static properties = {
    svg: { type: String },
  };
  render = () => {
    return html`
      <lit-icon icon="add" iconset="iconset"></lit-icon>
      <lit-iconset iconset="iconset"> ${unsafeHTML(this.svg)}</lit-iconset>
    `;
  };

  static styles = [
    css`
      svg {
        height: 20px;
        width: 20px;
      }

      .svg:hover {
        animation: pulse 1s linear infinite alternate !important;
      }
    `,
    pulseStyle(),
  ];
}

window.customElements.define("cc-icon", HoverableIcon);
