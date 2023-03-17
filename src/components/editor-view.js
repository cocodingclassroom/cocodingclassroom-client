import { css, html, LitElement } from "lit";
import * as ace from "ace-builds";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/mode-javascript";
import { styleMap } from "lit/directives/style-map.js";
import { RoomService } from "../services/room-service";
import { AceBinding, AceCursors } from "../util/y-ace";
import { SyncService } from "../services/sync-service";
import { getSplitScreenWidthAndAlignStyle } from "../util/util";

export class EditorView extends LitElement {
  static properties = {
    roomId: { type: String },
    editorWidth: { type: Number },
    leftAlign: { type: Number },
    editorIdentifier: { state: true, type: String },
  };

  connectedCallback() {
    this.editorIdentifier = `editor-${this.roomId}`;
    super.connectedCallback();
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    let cont = this.shadowRoot.getElementById(this.editorIdentifier);
    let editor = ace.edit(cont);
    editor.renderer.attachToShadowRoot();
    editor.setTheme("ace/theme/cobalt");
    editor.getSession().setMode("ace/mode/javascript");
    editor.session.setMode("ace/mode/javascript");
    editor.setOptions({
      showPrintMargin: false,
      animatedScroll: true,
      displayIndentGuides: false,
      useWorker: false,
      scrollPastEnd: 1,
      showLineNumbers: true,
      showGutter: true,
      tabSize: 4,
      useSoftTabs: false,
    });
    editor.container.style.background = "rgba(1,1,1,0)";
    editor.commands.removeCommands([
      "gotolineend", // ctrl + e
      "transposeletters", // ctrl + t (totally removed)
    ]);
    // setup binding
    let room = RoomService.get().rooms[this.roomId];
    let binding = new AceBinding(
      room.codeContent,
      editor,
      SyncService.get().getAwareness()
    );
    // let cursorBinding = new AceCursors(binding);
  }

  render() {
    const styles = getSplitScreenWidthAndAlignStyle(
      this.editorWidth,
      this.leftAlign
    );
    return html`
      <div
        class="editor"
        id=${this.editorIdentifier}
        style="${styleMap(styles)}"
      ></div>
    `;
  }

  static styles = css`
    .editor {
      position: absolute;
      top: 0;
      bottom: 0;
    }
  `;
}

window.customElements.define("cc-editor", EditorView);
