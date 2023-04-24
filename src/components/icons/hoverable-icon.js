import { css, LitElement } from "lit";
import { pulseStyle } from "../../util/shared-css";

export class HoverableIcon extends LitElement {
  static styles = [css`

    svg {
      height: 20px;
      width: 20px;
    }

    .svg:hover {
      animation: pulse 1s linear infinite alternate !important;
    }

  `, pulseStyle()];
}
