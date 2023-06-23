import { UserService } from "../services/user-service";
import { Range } from "ace-builds";
import { isColorLight, newShade } from "../util/util";
import { black, white } from "../util/shared-css";

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
    let localUser = UserService.get().localUser;

    UserService.get().otherUsers.forEach((otherUser) => {
      otherUser.addListener(() => {
        this.#rerender(localUser);
      });
    });

    this.editor.session.selection.on("changeSelection", () => {
      this.#updateSelection(localUser);
      this.#rerender(localUser);
    });
  }

  #rerender() {
    this.#clearSelections();
    this.#renderSelectionsInEditor();
    this.#removeAllCursorsAndFlags();
    this.#renderUserCursorsAndFlags();
  }

  #updateSelection(user) {
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
    this.view.renderRoot.querySelectorAll(".synced_cursor").forEach((elm) => {
      elm.remove();
    });
  }

  #renderUserCursorsAndFlags() {
    UserService.get().otherUsers.forEach((user) => {
      if (user.activeRoom !== this.room.id) return;
      let scroll = this.editor.renderer.session.getScrollTop();
      console.log(scroll);

      let height = this.editor.renderer.lineHeight;
      let width = this.editor.renderer.characterWidth;
      let left = user.selection.end.column * width + 5;
      let top = (user.selection.end.row - 1) * height;

      let flag = document.createElement("div");
      flag.id = "cursor_" + user.id;
      flag.className = "synced_cursor";
      flag.style = `
							position: absolute;
							background: ${user.color};
							height: ${height - 5}px;
							width: ${user.name.length * width * 0.8}px;
							top: ${top}px;
							left: ${left}px;
							border-left: 2px solid ${user.color};
							z-index: 100;
							color: ${isColorLight(user.color) ? black() : white()};
							cursor: help;
						`;
      flag.innerHTML =
        '<div class="cursor-label" style="background: ' +
        user.color +
        ';top: -1.3em;white-space: nowrap;">' +
        user.name +
        "</div>";

      this.view.renderRoot.appendChild(flag);
    });
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
