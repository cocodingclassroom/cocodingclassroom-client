import { css, html, LitElement } from "lit";
import * as ace from "ace-builds";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/mode-javascript";
import { styleMap } from "lit/directives/style-map.js";
import { RoomService } from "../services/room-service";
import { AceBinding } from "../util/y-ace";
import { SyncService } from "../services/sync-service";
import { formatCode, interpret } from "../util/compiler";
import run from "../assets/icons/run.svg";
import { Shortcut, ShortcutExtension } from "./shortcut-extension";

export class EditorView extends LitElement {
  static properties = {
    roomId: { type: String },
    editorWidth: { type: Number },
    leftAlign: { type: Number },
    editorIdentifier: { state: true, type: String },
    message: { type: String, state: true },
    editorVisible: { type: Boolean, state: true },
  };

  room;
  editor;
  activeError = false;
  pressedKeys;
  shortcutExtension;

  connectedCallback() {
    this.editorIdentifier = `editor-${this.roomId}`;
    this.room = RoomService.get().getRoom(this.roomId);
    this.editorVisible = true;
    this.pressedKeys = new Set();
    this.shortcutExtension = new ShortcutExtension();
    this.shortcutExtension.register();
    this.shortcutExtension.addShortcuts(this._shortCuts());
    super.connectedCallback();
  }

  disconnectedCallback() {
    this.editor.getSession().off("change", this.onEditorChange);
    this.shortcutExtension.unregister();
    super.disconnectedCallback();
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    this.setupEditor();
  }

  updated(_changedProperties) {
    super.updated(_changedProperties);
    if (_changedProperties.has("roomId")) {
      this.setupEditor();
    }
  }

  setupEditor = () => {
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
      fontSize: "13pt",
    });
    this.editor.container.style.background = "rgba(1,1,1,0)";
    // this.editor.commands.removeCommands([
    //   this.editor.commands.commands["enterfullscreen"], // ctrl + e
    //   // "transposeletters", // ctrl + t (totally removed)
    //   // "enterfullscreen",
    // ]);
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
    this.room.l_editorForRoom = this.editor;
    this.runCode(true);
  };

  _shortCuts = () => {
    return [
      new Shortcut(
        "Toggle Editor",
        ["Control", "e"],
        () => {
          this.toggleEditor();
        },
        () => {
          return true;
        }
      ),
      new Shortcut(
        "Run Code",
        ["Control", "Enter"],
        () => {
          this.runCode(false);
        },
        () => {
          return this.isEditorFocused();
        }
      ),
      new Shortcut(
        "Rebuild",
        ["Control", "Shift", "Enter"],
        () => {
          this.runCode(true);
        },
        () => {
          return this.isEditorFocused();
        }
      ),
      new Shortcut(
        "Format Code",
        ["Control", "Alt", "t"],
        () => {
          formatCode(this.editor);
        },
        () => {
          return this.isEditorFocused();
        }
      ),
    ];
  };

  isEditorFocused = () => {
    return this.editor.isFocused();
  };

  onEditorChange = (delta) => {
    this.room.l_changedPositions.push(delta.start);
  };

  runCode(fullRebuild = false) {
    interpret(
      fullRebuild,
      this.room,
      (message) => {
        this.message = message;
        console.log(this.message);
        this.requestUpdate();
      },
      (message) => {
        this.message = message;
        console.log(this.message);
        this.requestUpdate();
        this.activeError = true;
      },
      () => {
        this.activeError = false;
        this.message = "✅ No Interpreter Errors";
      },
      this.activeError
    );
  }

  toggleEditor = () => {
    this.editorVisible = !this.editorVisible;
  };

  render() {
    const buttonStyle = {};
    buttonStyle.left = this.leftAlign === 1 ? this.editorWidth : 0;

    const hiddenStyle = {};
    if (!this.editorVisible) hiddenStyle.visibility = "hidden";

    return html`
      <div
        class="editor"
        style="${styleMap(hiddenStyle)}"
        id=${this.editorIdentifier}
      ></div>
      ${this.editorVisible
        ? html` <button
              class="run-button"
              style="${styleMap(buttonStyle)}"
              @click="${() => this.runCode(true)}"
            >
              <img width="8" height="8" src="${run}" alt="run button" />
            </button>
            <cc-console message="${this.message}"></cc-console>`
        : ""}
    `;
  }

  static styles = css`
    .editor {
      z-index: 2;
      position: absolute;
      top: 0;
      bottom: 0;
      width: 100%;
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

    .ace_line span {
      background: rgba(0, 50, 50, 1);
      border-right: 1em solid rgba(0, 50, 50, 1);
      margin-right: -1em;
      padding-bottom: 2px;
      /*color: #fff;*/
    }

    .ace_line span:last-child {
      border-right: none;
      margin-right: 0;
    }

    .marker-del,
    .marker-ins {
      position: absolute;
      z-index: 99;
      background: rgba(0, 255, 0, 0.5) !important;
    }

    .marker-del {
      background: rgba(255, 0, 0, 0.5) !important;
    }

    .ace_marker-layer {
      z-index: 99;
    }

    #merge-holder .ace_marker-layer {
      z-index: 0;
    }

    .ace_active-line {
      width: 0px;
    }

    .ace_gutter-active-line {
      background-color: rgba(150, 150, 0, 0.5) !important;
    }
  `;
}

window.customElements.define("cc-editor", EditorView);
