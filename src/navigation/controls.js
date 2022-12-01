import { CocodingMode } from "../enums";
import { makeElementFromHtmlString } from "../utils";

export class Controls {
  room;
  rootElement;

  constructor(room) {
    this.room = room;
    this.rootElement = document.createElement("div");
    this.rootElement.className = "cc-controls";
    this.render();
  }

  getRootElement = () => {
    return this.rootElement;
  };

  render = () => {
    if (this.room.roomId !== 0 && this.room.mode === CocodingMode.EDIT) {
      let locked = !this.room.s.locked;
      let roomLocks = !cc.y.settings.get("roomLocks");
      let isRoomAdmin = this.room.s.admin.includes(cc.p.token);
      let isAdmin = cc.admins().includes(cc.p.token);

      let html = `
			  <div class="cc-controls-row">
			     ${this._renderReset(locked, roomLocks, isRoomAdmin)}
			     ${this._renderExport()}
			     ${this._renderScreenCast(roomLocks, isAdmin, isRoomAdmin)}
			  </div>
		`;

      this.rootElement.innerHTML = html;
    }
  };

  _renderReset = (locked, roomLocks, isAdmin) => {
    if (locked || roomLocks || (isAdmin && !locked)) {
      return `<div onclick="cc.reset(${this.room.roomId})" data-tip="New Sketch">${cc.icons.new}</div>`;
    } else {
      return ""
    }
  };

  _renderExport = () => {
    return `<div onclick="cc.roomExport(${this.room.roomId})" data-tip="Export Code">${cc.icons.save}</div>`;
  }

  _renderScreenCast = (roomLocks, isAdmin, isRoomAdmin) => {
    if (roomLocks && (isAdmin || isRoomAdmin)) {
      return `<div class="cc-nav-radio" onclick="cc.toggleSyncEvents(${this.room.roomId})" data-tip="Broadcast mouse/keyboard">${cc.icons.screencast}</div>`;
    } else {
      return "";
    }
  }
}
