import { css, html, LitElement } from "lit";
import { getSplitScreenWidthAndAlignStyle } from "../util/util";
import { styleMap } from "lit/directives/style-map.js";

export class FrameView extends LitElement {
  static properties = {
    roomId: { type: String },
    frameWidth: { type: Number },
    leftAlign: { type: Number },
    frameIdentifier: { state: true },
  };

  connectedCallback() {
    this.frameIdentifier = `frame_${this.roomId}`;
    super.connectedCallback();
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
  }

  render = () => {
    const styles = getSplitScreenWidthAndAlignStyle(
      this.frameWidth,
      this.leftAlign
    );
    return html`
      <iframe id="" class="frame" style="${styleMap(styles)}"></iframe>
    `;
  };

  static styles = css`
    .frame {
      position: absolute;
      top: 0;
      bottom: 0;
      height: 99.55%;
      border: 0;
      pointer-events: none;
    }
  `;
}

window.customElements.define("cc-frame", FrameView);
