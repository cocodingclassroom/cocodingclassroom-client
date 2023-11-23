import { css, html, LitElement } from "lit";
import { safeRegister } from "../util/util";

export class OutputView extends LitElement {
  static properties = {
    message: { type: String },
  };

  render() {
    let hasMessage = this.message !== undefined;
    return html`${hasMessage ? html` <p>${this.message}</p>` : ""} `;
  }

  static styles = css`
    p {
      position: absolute;
      z-index: 9999;
      bottom: 0;
      left: 0;
      height: 25px;
      width: 100%;
      /*font-size:9pt;*/
      resize: none;
      outline: none;
      color: #fff;
      background: #000;
      border: none;
      border-top: 1px solid #222;
      margin: 0 0 0 0;
      overflow-x: hidden;
    }
  `;
}

safeRegister("cc-console", OutputView);
