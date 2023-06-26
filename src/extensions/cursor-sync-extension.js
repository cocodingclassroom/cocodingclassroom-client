import { UserService } from "../services/user-service";
import { Range } from "ace-builds";
import { isColorLight, newShade, numberOfTabs } from "../util/util";
import { black, white } from "../util/shared-css";
import { ClassroomService } from "../services/classroom-service";

export class CursorSyncExtension {
  editor;
  room;
  view;

  activeSelectionMarkerIds = [];

  constructor(editor, room, view) {
    this.editor = editor;
    this.room = room;
    this.view = view;
    this.#setup();
  }

  #setup() {
    UserService.get().otherUsers.forEach((otherUser) => {
      otherUser.addListener(() => {
        this.#rerender();
      });
    });
    ClassroomService.get().classroom.addListener(() => {
      this.#rerender();
    });
    this.editor.session.selection.on("changeSelection", () => {
      this.#updateSelection();
      this.#rerender();
    });
    this.editor.session.on("changeScrollTop", () => {
      this.#rerender();
    });
    this.editor.commands.on("afterExec", (data) => {
      if (data.command.name === "insertstring") {
        this.#updateSelection();
        this.#rerender();
      }
    });
    this.room.addListener(() => {
      this.#rerender();
    });
  }

  #rerender() {
    this.#clearSelections();
    this.#renderSelectionsInEditor();
    this.#removeAllCursorsAndFlags();
    this.#renderUserCursorsAndFlags();
  }

  #updateSelection() {
    let user = UserService.get().localUser;
    let selection = this.editor.getSelectionRange();
    user.activeRoom = this.room.id;
    user.selection = JSON.parse(JSON.stringify(selection)); // to simple object so y-js can easily sync it.
  }

  #clearSelections() {
    this.activeSelectionMarkerIds.forEach((id) => {
      this.editor.session.removeMarker(id);
    });
    this.activeSelectionMarkerIds = [];
  }

  #renderSelectionsInEditor() {
    UserService.get().otherUsers.forEach((user) => {
      if (user.activeRoom !== this.room.id) return;
      this.#createUserSelectionStyleIfNotExistingYet(user);
      let id = this.editor.session.addMarker(
        new Range(
          user.selection.start.row,
          user.selection.start.column,
          user.selection.end.row,
          user.selection.end.column
        ),
        "selection-" + user.id,
        "text",
        true
      );
      this.activeSelectionMarkerIds.push(id);
    });
  }

  #removeAllCursorsAndFlags() {
    this.view.renderRoot.querySelectorAll(".synced_flag").forEach((elm) => {
      elm.remove();
    });
    this.view.renderRoot.querySelectorAll(".synced_cursor").forEach((elm) => {
      elm.remove();
    });
  }

  #renderUserCursorsAndFlags() {
    UserService.get().otherUsers.forEach((user) => {
      if (user.activeRoom !== this.room.id) return;
      this.#renderFlag(user);
      this.#renderCursor(user);
    });
  }

  #renderCursor(user) {
    let scroll = this.editor.renderer.session.getScrollTop();
    let leftOffsetLineNumbers = this.#getWidthOfLineNumbers();
    let height = this.editor.renderer.lineHeight;
    let width = this.editor.renderer.characterWidth;
    let left =
      this.#adjustColumnByNumberOfTabs(user) * width + leftOffsetLineNumbers;
    let top = user.selection.end.row * height - scroll;

    let cursor = document.createElement("div");
    cursor.id = "cursor_" + user.id;
    cursor.className = "synced_cursor";
    cursor.style = `
      	position: absolute;
							background: ${user.color};
							height: ${height}px;
							width: ${width * 0.3}px;
							top: ${top}px;
							left: ${left + width * 0.3}px;
							z-index: 100;
							cursor: help;
    `;
    this.view.renderRoot.appendChild(cursor);
  }

  #renderFlag(user) {
    let scroll = this.editor.renderer.session.getScrollTop();
    let leftOffsetLineNumbers = this.#getWidthOfLineNumbers();
    let height = this.editor.renderer.lineHeight;
    let width = this.editor.renderer.characterWidth;
    let left =
      this.#adjustColumnByNumberOfTabs(user) * width + leftOffsetLineNumbers;
    let top = (user.selection.end.row - 1) * height - scroll;

    let flag = document.createElement("div");
    flag.id = "flag_" + user.id;
    flag.className = "synced_flag";
    flag.style = `
							position: absolute;
							background: ${user.color};
							height: ${height - 5}px;
							width: ${user.name.length * width * 0.8}px;
							top: ${top + 5}px;
							left: ${left + width * 0.3}px;
							z-index: 100;
							color: ${isColorLight(user.color) ? black() : white()};
							cursor: help;
						`;
    flag.innerHTML =
      '<div class="cursor-label" style="white-space: nowrap;">' +
      user.name +
      "</div>";

    this.view.renderRoot.appendChild(flag);
  }

  #adjustColumnByNumberOfTabs(user) {
    let line = this.editor.session.getLine(user.selection.end.row);
    let tabSize = this.editor.session.getOption("tabSize");
    let tabs = numberOfTabs(line);
    let extraColumn = tabs * (tabSize - 1);
    return user.selection.end.column + extraColumn;
  }

  #getWidthOfLineNumbers() {
    let lineNumbers = this.editor.getOption("showLineNumbers");
    let gutter =
      this.editor.container.getElementsByClassName("ace_gutter-layer");
    let leftOffsetLineNumbers = 0;
    if (lineNumbers && gutter) {
      let gutterElement = gutter[0];
      let gutterWidth = gutterElement.style.width;
      let removedPx = gutterWidth.substring(0, gutterWidth.length - 2);
      leftOffsetLineNumbers = parseInt(removedPx);
    }
    return leftOffsetLineNumbers;
  }

  #createUserSelectionStyleIfNotExistingYet(user) {
    let customStyle = this.view.renderRoot.getElementById(
      "selection-style" + user.id
    );
    if (customStyle) {
      customStyle.innerHTML =
        ".selection-" +
        user.id +
        " { position: absolute; z-index: 20; opacity: 0.3; background: " +
        newShade(user.color, 50) +
        "; }";
    } else {
      let style = document.createElement("style");
      style.type = "text/css";
      style.id = "selection-style" + user.id;
      this.view.renderRoot.appendChild(style);
    }
  }
}
