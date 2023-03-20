import { css, html, LitElement } from "lit";
import * as ace from "ace-builds";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/mode-javascript";
import { styleMap } from "lit/directives/style-map.js";
import { RoomService } from "../services/room-service";
import { AceBinding, AceCursors } from "../util/y-ace";
import { SyncService } from "../services/sync-service";
import { getSplitScreenWidthAndAlignStyle } from "../util/util";
import { recompile } from "../util/compiler";
import run from "../assets/icons/run.svg";

export class EditorView extends LitElement {
  static properties = {
    roomId: { type: String },
    editorWidth: { type: Number },
    leftAlign: { type: Number },
    editorIdentifier: { state: true, type: String },
  };

  room;
  editor;

  connectedCallback() {
    this.editorIdentifier = `editor-${this.roomId}`;
    this.room = RoomService.get().getRoom(this.roomId);
    super.connectedCallback();
  }

  disconnectedCallback() {
    this.editor.getSession().off("change", this.onEditorChange);
    super.disconnectedCallback();
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    let cont = this.shadowRoot.getElementById(this.editorIdentifier);
    this.editor = ace.edit(cont);
    this.editor.renderer.attachToShadowRoot();
    this.editor.setTheme("ace/theme/cobalt");
    this.editor.getSession().setMode("ace/mode/javascript");
    this.editor.session.setMode("ace/mode/javascript");
    this.editor.setOptions({
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
    this.editor.container.style.background = "rgba(1,1,1,0)";
    this.editor.commands.removeCommands([
      "gotolineend", // ctrl + e
      "transposeletters", // ctrl + t (totally removed)
    ]);
    // setup binding
    let room = RoomService.get().rooms[this.roomId];
    let binding = new AceBinding(
      room.codeContent,
      this.editor,
      SyncService.get().getAwareness()
    );
    // let cursorBinding = new AceCursors(binding);
    this.editor.session.on("change", (x) => {
      this.onEditorChange(x);
    });
  }

  onEditorChange = (delta) => {
    this.room.l_changedPositions.push(delta.start);
    // this.compile();
  };

  compile() {
    recompile(
      false,
      this.room.l_iframeForRoom,
      this.editor,
      this.room.l_iframeMeta,
      this.room.l_changedPositions,
      (message) => {
        console.log(message);
      }
    );
  }

  render() {
    const buttonStyle = {};
    buttonStyle.left = this.leftAlign === 1 ? this.editorWidth : 0;

    return html`
      <div class="editor" id=${this.editorIdentifier}></div>
      <button
        class="run-button"
        style="${styleMap(buttonStyle)}"
        @click="${() => this.compile()}"
      >
        <img width="8" height="8" src="${run}" alt="run button" />
      </button>
    `;
  }

  static styles = css`
    .editor {
      z-index: 2;
      position: absolute;
      top: 0;
      bottom: 0;
      width: 100%;
      height 100%;
    }
    .run-button {
      position: absolute;
      z-index: 3;
      border: 0;
      top: 2px;
      left: 0;
      background-color: rgba(255, 255, 255, 0);
      display: flex;
      flex-direction: row;
      align-items: flex-start;
    }
  `;
}

window.customElements.define("cc-editor", EditorView);
