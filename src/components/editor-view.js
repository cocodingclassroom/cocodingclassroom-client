import { css, html, LitElement } from "lit";
import * as ace from "ace-builds";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/mode-javascript";
import { styleMap } from "lit/directives/style-map.js";
import { RoomService } from "../services/room-service";
import { AceBinding } from "../util/y-ace";
import { SyncService } from "../services/sync-service";
import { formatCode, interpret } from "../util/compiler";
import run from "../assets/resource/run.svg";
import { Shortcut, ShortcutExtension } from "../extensions/shortcut-extension";
import { safeRegister } from "../util/util";
import { UserService } from "../services/user-service";
import { UserRole } from "../models/user";
import { RoomType } from "../models/room";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { ClassroomService } from "../services/classroom-service";
import {
  NotificationType,
  NotifyService,
  Notification,
} from "../services/notify-service";
import { CursorSyncExtension } from "../extensions/cursor-sync-extension";

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
  shortcutExtension;
  currentlyFollowing = null;

  connectedCallback() {
    this.editorIdentifier = `editor-${this.roomId}`;
    this.room = RoomService.get().getRoom(this.roomId);
    this.editorVisible = true;
    this.shortcutExtension = new ShortcutExtension();
    this.shortcutExtension.register();
    this.shortcutExtension.addShortcuts(this.#shortCuts());
    let localUser = UserService.get().localUser;
    localUser.addListener(() => {
      this.editor.setOptions({ fontSize: localUser.getEditorFontSize() });
      this.#updateFollowing(localUser);
    });
    let classroom = ClassroomService.get().classroom;
    classroom.addListener(() => {
      this.editor.setOptions({ showLineNumbers: classroom.lineNumbers });
      this.editor.setOptions({ showGutter: classroom.lineNumbers });
      this.requestUpdate();
    });
    this.room.addListener((changes) => {
      changes.forEach(() => {
        this.#updateOnRoomAccess();
      });
    });
    NotifyService.get().addListener((notification) => {
      if (notification.type !== NotificationType.FULLREBUILDOFFRAME) return;
      if (notification.message === this.room.id) {
        this.#runCode(true, false);
      }
    });
    super.connectedCallback();
  }

  #updateFollowing(localUser) {
    if (localUser.followingId !== this.currentlyFollowing) {
      let following = UserService.get().getUserByID(localUser.followingId);
      let oldFollowUser = UserService.get().getUserByID(
        this.currentlyFollowing
      );
      if (oldFollowUser) oldFollowUser.removeListener(this.#followUser);
      if (following) {
        following.addListener(this.#followUser);
      }
      this.currentlyFollowing = localUser.followingId;
    }
  }

  #followUser = () => {
    let following = UserService.get().getUserByID(
      UserService.get().localUser.followingId
    );
    let lineToGoTo = following.getSelectedRow();
    this.editor.scrollToLine(lineToGoTo, true, true, () => {});
  };

  disconnectedCallback() {
    this.editor.getSession().off("change", this.#onEditorChange);
    this.shortcutExtension.unregister();
    super.disconnectedCallback();
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    this.#setupEditor();
  }

  #setupEditor = () => {
    let cont = this.shadowRoot.getElementById(this.editorIdentifier);
    this.editor = ace.edit(cont);
    this.editor.renderer.attachToShadowRoot();
    this.editor.setTheme("ace/theme/cobalt");
    this.editor.getSession().setMode("ace/mode/javascript");
    this.editor.session.setMode("ace/mode/javascript");
    let classroom = ClassroomService.get().classroom;
    this.editor.setOptions({
      showPrintMargin: false,
      animatedScroll: true,
      displayIndentGuides: false,
      useWorker: false,
      scrollPastEnd: 1,
      showLineNumbers: classroom.lineNumbers,
      showGutter: classroom.lineNumbers,
      tabSize: 4,
      useSoftTabs: false,
      fontSize: UserService.get().localUser.getEditorFontSize(),
    });
    this.editor.container.style.background = "rgba(1,1,1,0)";

    if (
      this.room.roomType === RoomType.TEACHER &&
      UserService.get().localUser.role === UserRole.STUDENT
    ) {
      this.editor.setReadOnly(true);
    }

    this.#updateOnRoomAccess();

    // setup binding
    let room = RoomService.get().rooms[this.roomId];
    new AceBinding(
      room.codeContent,
      this.editor,
      SyncService.get().getAwareness()
    );
    new CursorSyncExtension(this.editor, this.room, this);

    this.editor.session.on("change", (x) => {
      this.#onEditorChange(x);
    });

    this.room.l_editorForRoom = this.editor;
    this.#runCode(true);

    this.editor.commands.on("afterExec", (data) => {
      if (data.command.name === "insertstring") {
        this.#stopLiveCoding();
        this.#startLiveCoding();
      }
    });
    ClassroomService.get().classroom.addListener((changes) => {
      changes.forEach((change) => {
        if (change.keysChanged === undefined) return;
        if (
          change.keysChanged.has("liveCoding") ||
          change.keysChanged.has("liveCodingDelay")
        ) {
          this.#stopLiveCoding();
          this.#startLiveCoding();
        }
      });
    });
  };

  #updateOnRoomAccess = () => {
    if (ClassroomService.get().classroom.roomLocks) {
      let localId = UserService.get().localUser.id;
      if (this.room.isWriter(localId) || this.room.isOwnedByLocalUser()) {
        this.editor.setReadOnly(false);
      } else {
        this.editor.setReadOnly(true);
      }
    }
  };

  #stopLiveCoding = () => {
    clearTimeout(this.liveCodingInterval);
  };

  #startLiveCoding = () => {
    let classroom = ClassroomService.get().classroom;
    if (classroom.liveCoding) {
      this.liveCodingInterval = setTimeout(() => {
        console.log("live coding recompile!");
        this.#runCode(false);
      }, classroom.liveCodingDelay * 1000);
    }
  };

  #shortCuts = () => {
    return [
      new Shortcut(
        "Toggle Editor",
        ["e"],
        () => {
          this.#toggleEditor();
        },
        true,
        false,
        false,
        () => {
          return true;
        }
      ),
      new Shortcut(
        "Rebuild",
        ["Enter"],
        () => {
          this.#runCode(true);
        },
        true,
        false,
        true,
        () => {
          return this.#isEditorFocused();
        }
      ),
      new Shortcut(
        "Run Code",
        ["Enter"],
        () => {
          this.#runCode(false);
        },
        true,
        false,
        false,
        () => {
          return this.#isEditorFocused();
        }
      ),
      new Shortcut(
        "Format Code",
        ["t"],
        () => {
          formatCode(this.editor);
        },
        true,
        true,
        false,
        () => {
          return this.#isEditorFocused();
        }
      ),
    ];
  };

  #isEditorFocused = () => {
    return this.editor.isFocused();
  };

  #onEditorChange = (delta) => {
    this.room.l_changedPositions.push(delta.start);
  };

  #runCode(fullRebuild = false, onRebuildSuccessfulShare = true) {
    console.log("RunCode");
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
        console.log("compiled good");
        this.activeError = false;
        this.requestUpdate();
        this.#notifyOthersOfFullRebuild(fullRebuild, onRebuildSuccessfulShare);
      },
      this.activeError
    );
  }

  #notifyOthersOfFullRebuild(fullRebuild, onRebuildSuccessfulShare) {
    if (fullRebuild && onRebuildSuccessfulShare) {
      NotifyService.get().notify(
        new Notification(
          NotificationType.FULLREBUILDOFFRAME,
          UserService.get().localUser,
          this.room.id
        )
      );
    }
  }

  #toggleEditor = () => {
    this.editorVisible = !this.editorVisible;
  };

  render() {
    const hiddenStyle = {};
    if (!this.editorVisible) hiddenStyle.visibility = "hidden";

    return html`
      <div
        class="editor"
        style="${styleMap(hiddenStyle)}"
        id="${this.editorIdentifier}"
      ></div>
      ${this.editorVisible
        ? html`${this.#renderRunButton()} ${this.#renderConsole()}`
        : ""}
    `;
  }

  #renderRunButton = () => {
    const buttonStyle = {};
    buttonStyle.left = this.leftAlign === 1 ? this.editorWidth : 0;
    let lineNumbers = ClassroomService.get().classroom.lineNumbers;
    if (!lineNumbers) return html``;
    return html` <button
      class="run-button"
      style="${styleMap(buttonStyle)}"
      @click="${() => this.#runCode(true)}"
    >
      <lit-icon icon="add" iconset="iconset"></lit-icon>
      <lit-iconset iconset="iconset"> ${unsafeHTML(run)}</lit-iconset>
    </button>`;
  };

  #renderConsole = () => {
    if (!this.activeError) return html``;
    return html` <cc-console message="${this.message}"></cc-console>`;
  };

  static styles = css`
    .editor {
      z-index: 2;
      position: absolute;
      top: 0;
      bottom: 0;
      width: 100%;
    }

    svg {
      width: 10px;
      height: 10px;
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
      width: 0;
    }

    .ace_gutter-active-line {
      background-color: rgba(150, 150, 0, 0.5) !important;
    }

    .synced_flag {
      font-size: 9pt;
    }

    .synced_cursor {
      animation: blink-animation 1s steps(5, start) infinite;
      -webkit-animation: blink-animation 1s steps(5, start) infinite;
    }

    .cursor-label {
      width: 8px;
      height: 8px;
      color: transparent;
    }

    .cursor-label:hover {
      width: auto;
      height: auto;
      color: inherit;
    }

    @keyframes blink-animation {
      to {
        visibility: hidden;
      }
    }

    @-webkit-keyframes blink-animation {
      to {
        visibility: hidden;
      }
    }
  `;
}

safeRegister("cc-editor", EditorView);
