import { UserService } from "../services/user-service";
import { Range } from "ace-builds";

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

    this.editor.session.selection.on("changeSelection", (e) => {
      this.#updateSelection(localUser);
      this.#rerender(localUser);
    });
  }

  #rerender() {
    this.#clearSelections();
    this.#renderSelectionsInEditor();
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

  #createUserSelectionStyleIfNotExistingYet(user) {
    let customStyle = this.view.renderRoot.getElementById(
      "selection-style" + user.id
    );
    if (customStyle) {
      customStyle.innerHTML =
        ".selection-" +
        user.id +
        " { position: absolute; z-index: 20; opacity: 0.5; background: " +
        user.color +
        "; }";
    } else {
      let style = document.createElement("style");
      style.type = "text/css";
      style.id = "selection-style" + user.id;
      this.view.renderRoot.appendChild(style);
    }
  }
}
