import { CocodingMode, RoomType } from "../enums";
import { SettingsPanel } from "./settingsPanel";
import { TeacherRoomHeader } from "./teacherRoomHeader";

export class Navigation {

  room;
  nav;
  rootElement;

  constructor(room) {
    this.room = room;
    this.initializeNavigationMap(room.roomId);
  }

  initializeNavigationMap(id) {
    this.nav = {
      reset: `<div onclick="cc.reset(${id})" data-tip="New Sketch">${cc.icons.new}</div>`,
      code: `<div onclick="cc.code()" data-tip="Sync Code">${cc.icons.code}</div>`,
      save: `<div onclick="cc.roomExport(${id})" data-tip="Export Code">${cc.icons.save}</div>`,
      rename: `<div onclick="cc.roomRename(${id})" data-tip="Rename">${cc.icons.rename}</div>`,
      renameDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.rename}</div>`,
      adminDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.shield.empty}</div>`,
      merge: `<div onclick="cc.mergeDialog()" data-tip="« Compare Code »">${cc.icons.merge}</div>`,
      login: `<div onclick="cc.userAuth()" data-tip="Admin Login">${cc.icons.shield.empty}</div>`,
      layers: `<div onclick="cc.roomAdd(this)" data-tip="Add Room">${cc.icons.layers}</div>`,
      layersFull: `<div data-tip="Add Rooms - Limit 30" style="opacity:.5;">${cc.icons.layers}</div>`,
      walk: `<div class="cc-roomwalk" onclick="cc.roomWalk()" data-tip="Walk Classroom">${cc.icons.users}</div>`,
      trash: `<div onclick="cc.roomRemove(${id}, this)" data-tip="Remove">${cc.icons.trash}</div>`,
      splitter: `<div onclick="cc.splitterSync()" data-tip="Sync Split-Screen">${cc.icons.layout}</div>`,
      message: `<div onclick="cc.broadcastMessage()" data-tip="Broadcast Message">${cc.icons.message}</div>`,
      screencast: `<div class="cc-nav-radio" onclick="cc.toggleSyncEvents(${id})" data-tip="Broadcast mouse/keyboard">${cc.icons.screencast}</div>`,
      lock: `<div class="cc-nav-lock" ${
        this.room.s.admin.includes(cc.p.token) ||
        cc.admins().includes(cc.p.token)
          ? 'onclick="cc.roomLock(' + id + ', false)" data-tip="Unlock Editor"'
          : 'data-tip="Locked Editor" style="opacity:.6;cursor:help;"'
      }>${cc.icons.lock}</div>`,
      lockDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.lock}</div>`,
      unlock: `<div class="cc-nav-lock unlock" ${
        this.room.s.admin.includes(cc.p.token) ||
        cc.admins().includes(cc.p.token) ||
        this.room.s.admin.length === 1
          ? 'onclick="cc.roomLock(' + id + ', true)" data-tip="Lock Editor"'
          : 'data-tip="Lock Editor" style="opacity:.6;cursor:help;"'
      }>${cc.icons.unlock}</div>`,
      unlockDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.unlock}</div>`,
    };
    if (cc.y.rooms.size > 30 || this.room.mode !== CocodingMode.EDIT) {
      this.nav.layers = `<div data-tip="Add Rooms - Limit 30" style="opacity:.5;">${cc.icons.layers}</div>`;
    }
  }

  render = () => {
    let rootElement = document.createElement("div");

    let teacherHeader = new TeacherRoomHeader(this.room);


    let headerElement = teacherHeader.getRootElement();
    let controls = this.renderControlElement();
    let extendedSessionNav = this.renderSessionExtendedNavElement();
    let extendedNav = this.navExtended();

    rootElement.append(headerElement);
    rootElement.append(controls);
    // rootElement.append(extendedSessionNav);
    rootElement.append(extendedNav);

    this.rootElement = rootElement;
  };

  getRootElement = () => {
    this.render();
    return this.rootElement;
  };

  renderControlElement() {
    let controls = document.createElement("div");
    controls.className = "cc-controls";
    return controls;
  }

  // renderTeacherRoomHeader = () => {
  //   let header = document.createElement("div");
  //   if (
  //     this.room.roomType === RoomType.TEACHER &&
  //     this.room.mode === CocodingMode.EDIT
  //   ) {
  //     header.innerHTML = `<teacher-room-header roomId="${this.room.roomId}" ></teacher-room-header>`;
  //   }
  //   return header;
  // };

  renderSessionExtendedNavElement() {
    let isAdminOfRoom = this.room.s.admin.includes(cc.p.token);
    let isTeacherRoom = this.room.roomType === RoomType.TEACHER;
    let isEditMode = this.room.mode === CocodingMode.EDIT;

    let sessionExtendedNav = document.createElement("div");
    sessionExtendedNav.innerHTML = `<div class="cc-controls-row">
				${
          isTeacherRoom && isAdminOfRoom && isEditMode
            ? this.nav.reset + this.nav.code
            : ""
        } ${this.nav.save} ${isAdminOfRoom ? this.nav.screencast : ""}
				${isTeacherRoom && isEditMode ? this.nav.merge : ""}
			</div>

			<!-- potential extended save nav ***** -->
			<div class="cc-controls-extended-save" style="display:none;">
				<div class="cc-controls-row">
					${this.nav.reset}${this.nav.about}
				</div>
			</div>
		`;

    return sessionExtendedNav;
  }

  update() {
    let navRoom = `
			<div class="cc-controls-row">
				${
          !this.room.s.locked ||
          !cc.y.settings.get("roomLocks") ||
          (this.s.locked && this.s.admin.includes(cc.p.token))
            ? this.nav.reset
            : ""
        }
				${this.nav.save}
				${
          (cc.y.settings.get("roomLocks") &&
            this.room.s.admin.includes(cc.p.token)) ||
          cc.admins().includes(cc.p.token)
            ? this.nav.screencast
            : ""
        }
			</div>
		`;

    if (this.room.roomId !== 0 && this.room.mode === CocodingMode.EDIT) {
      this.rootElement.querySelector(".cc-controls").innerHTML = navRoom;
    }

    // nav options
    let lockStatus = "";
    if (this.room.roomId > 0 && cc.y.settings.get("roomLocks")) {
      if (this.room.roomId === 1 && !cc.admins().includes(cc.p.token)) {
        lockStatus = this.nav.unlockDisabled;
      } else if (this.s.locked) {
        lockStatus = this.nav.lock;
      } else {
        lockStatus = this.nav.unlock;
      }
    }

    let renameStatus = this.nav.renameDisabled;
    if (this.room.roomId > 1) {
      renameStatus = this.nav.rename;
    }
    if (
      cc.y.settings.get("roomLocks") &&
      this.room.s.locked &&
      !this.room.s.admin.includes(cc.p.token)
    ) {
      renameStatus = this.nav.renameDisabled;
    }

    if (this.room.mode === CocodingMode.EDIT) {
      let roomlistNav = this.rootElement.querySelector(".cc-roomlist-nav");
      if (roomlistNav !== null) {
        this.rootElement.querySelector(
          ".cc-roomlist-nav"
        ).innerHTML = `${renameStatus}${lockStatus}`;
      }
      this.room.toggleWrite();
      this.room.roomList();
    }
    cc.tipsInit();
  }

  navExtended() {
    let nav = ``;
    if (this.room.mode === CocodingMode.EDIT) {
      nav = `
				<div class="cc-controls-row" ${
          cc.admins().includes(cc.p.token) ? "" : 'style="display:none;"'
        }>
					${
            cc.admins().includes(cc.p.token)
              ? this.nav.layers +
                this.nav.walk +
                this.nav.message +
                this.nav.splitter
              : ""
          }
				</div>
			`;
    } else if (this.room.mode === CocodingMode.GALLERY) {
      nav = `
				<div class="cc-controls-row" ${
          cc.admins().includes(cc.p.token) ? "" : 'style="display:none;"'
        }>
					${cc.admins().includes(cc.p.token) ? this.nav.walk + this.nav.message : ""}
				</div>
			`;
    }
    let extendedNav = document.createElement("div");
    extendedNav.classList.add("cc-control-extended");
    extendedNav.innerHTML = nav;
    //this.rootElement.querySelector(".cc-controls-extended").innerHTML = nav;
    cc.tipsInit();
    return extendedNav;
  }

  navSettings() {
    // if (this.rootElement.querySelector(".cc-settings") !== undefined) {
    //   this.rootElement.querySelector(".cc-settings").innerHTML = settingsHTML;
    // }
  }
}
