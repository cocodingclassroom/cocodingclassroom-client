import { html, LitElement } from "lit";
import { EditorView } from "./editor-view";

export class RoomView extends LitElement {
  static properties = {
    roomId: { type: Number },
    width: { type: Number },
    isLeft: { type: Number },
    binding: { type: Object, state: true },
  };

  render() {
    return html`
      <cc-editor
        roomId="${this.roomId}"
        editorWidth="${this.width}"
        leftAlign="${this.isLeft}"
      >
      </cc-editor>
    `;
  }
}

window.customElements.define("cc-room", RoomView);
