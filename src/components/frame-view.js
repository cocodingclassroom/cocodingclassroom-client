import { css, html, LitElement } from "lit";
import { getSplitScreenWidthAndAlignStyle } from "../util/util";
import { styleMap } from "lit/directives/style-map.js";
import { RoomService } from "../services/room-service";

export class FrameView extends LitElement {
  static properties = {
    roomId: { type: String },
    frameWidth: { type: Number },
    leftAlign: { type: Number },
    frameIdentifier: { state: true },
  };

  room;
  iframeReference;

  connectedCallback() {
    this.frameIdentifier = `frame_${this.roomId}`;
    this.room = RoomService.get().getRoom(this.roomId);

    super.connectedCallback();
  }

  firstUpdated(_changedProperties) {
    this.iframeReference = this.shadowRoot.getElementById(this.frameIdentifier);
    this.room.l_iframeForRoom = this.iframeReference;
    super.firstUpdated(_changedProperties);
  }

  render = () => {
    return html` <iframe id="${this.frameIdentifier}" class="frame"></iframe> `;
  };

  static styles = css`
    .frame {
      z-index: 1;
      position: absolute;
      top: 0;
      bottom: 0;
      height: 99.55%;
      width: 100%;
      border: 0;
      pointer-events: none;
    }
  `;
}

window.customElements.define("cc-frame", FrameView);
