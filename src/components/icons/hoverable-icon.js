import { css, LitElement } from "lit";

export class HoverableIcon extends LitElement {
  static styles = css`
    svg:hover {
      animation: pulse 1s linear infinite alternate !important;
    }

    @keyframes pulse {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
      100% {
        opacity: 1;
      }
    }
  `;
}
