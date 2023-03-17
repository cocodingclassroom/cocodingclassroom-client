import { html, LitElement } from "lit";

export class RoomView extends LitElement {
  static properties = {
    room: { type: Object },
  };

  connectedCallback() {
    super.connectedCallback();
  }

  render() {
    return html`
      <cc-editor
        editorIdentifier="editor-${this.room.id}"
        editorWidth="${this.roomWidth}"
        leftAlign="${this.isLeft}"
      >
      </cc-editor>
    `;
  }
}

window.customElements.define("cc-room", RoomView);
