import { css, html, LitElement } from "lit";
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

    document.addEventListener("mousemove", (event) => {
      /*      let user = UserService.get().localUser;
      let isLeft = user.isRoomLeft(this.roomId);
      let leftSize = (user.leftSize / 100) * window.innerWidth;
      let x = event.x;
      if (!isLeft) {
        x = event.x - leftSize;
      }
      x = clamp(x, 0, window.innerWidth);
      let y = clamp(event.y, 0, window.innerHeight);
      console.log(`frame_${this.roomId} : ${x} ${event.y}`);
      let content = this.iframeReference.contentWindow;
      if (content !== null) {
        content.mouseX = x;
        content.mouseY = y;
      }*/
      this.iframeReference.contentWindow.dispatchEvent(event);
    });

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
