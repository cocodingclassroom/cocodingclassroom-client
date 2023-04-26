import { css, html, LitElement } from "lit";
import { safeRegister } from "../util/util";

export class RoomView extends LitElement {
  static properties = {
    roomId: { type: Number },
    width: { type: Number },
    isLeft: { type: Number },
    binding: { type: Object, state: true },
  };

  render() {
    return html`
      <cc-frame
        class="frame"
        roomId="${this.roomId}"
        frameWidth="${this.width}"
        leftAlign="${this.isLeft}"
      ></cc-frame>
      <cc-editor
        class="editor"
        roomId="${this.roomId}"
        editorWidth="${this.width}"
        leftAlign="${this.isLeft}"
      >
      </cc-editor>
      <cc-menu roomId="${this.roomId}"></cc-menu>
    `;
  }

  static styles = css``;
}

safeRegister("cc-room", RoomView);
