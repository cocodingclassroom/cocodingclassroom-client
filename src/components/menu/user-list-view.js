import { css, html, LitElement } from "lit";
import { UserService } from "../../services/user-service";
import { isColorLight, safeRegister } from "../../util/util";
import { styleMap } from "lit/directives/style-map.js";
import {
  basicFlexStyles,
  cursorTipStyle,
  pulseStyle,
  helpRotationStyle,
  toolTipStyle,
  menuForeground1,
  menuForegroundDark,
} from "../../util/shared-css";
import { initDataTips } from "../../util/tooltips";
import { UserColorRenameModal } from "../user-color-rename-modal";
import { ClassroomService } from "../../services/classroom-service";
import { RoomService } from "../../services/room-service";
import { RoomType } from "../../models/room";
import { sortUsers } from "../../util/user";

export class UserListView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  adminIcon = "🔐";
  writerIcon = "🔏";

  connectedCallback() {
    this.addListeners();
    super.connectedCallback();
  }

  addListeners() {
    UserService.get()
      .getAllUsers()
      .forEach((user) => user.addListener(this.listener));
    UserService.get().localUser.addListener(this.listener);
    ClassroomService.get().classroom.addListener(this.classroomListener);
    RoomService.get().getRoom(this.roomId).addListener(this.listener);
  }

  disconnectedCallback() {
    this.removeListeners();
    super.disconnectedCallback();
  }

  removeListeners() {
    UserService.get()
      .getAllUsers()
      .forEach((user) => user.removeListener(this.listener));
    UserService.get().localUser.removeListener(this.listener);
    ClassroomService.get().classroom.removeListener(this.classroomListener);
    RoomService.get().getRoom(this.roomId).removeListener(this.listener);
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    initDataTips(this.renderRoot);
  }

  updated(_changedProperties) {
    super.updated(_changedProperties);
    initDataTips(this.renderRoot);
  }

  listener = () => {
    this.requestUpdate();
  };

  classroomListener = () => {
    this.removeListeners();
    this.addListeners();
    this.listener();
  };

  render = () => {
    let room = RoomService.get().getRoom(this.roomId);
    return html`
      ${UserService.get()
        .getAllUsers()
        .filter(
          (user) =>
            room.isTeacherRoom() ||
            ClassroomService.get().isGalleryMode() ||
            user.isRoomRight(this.roomId) ||
            user.isRoomLeft(this.roomId)
        )
        .sort((a, b) => sortUsers(a, b, this.roomId))
        .reverse()
        .map((user) => {
          let backgroundColorStyle = { backgroundColor: user.color };
          return html` <div
            class="row center border ${user.needsHelp ? "pulse-on" : ""}"
            style="${styleMap(backgroundColorStyle)}"
          >
            ${this.#renderSplitIndicator(user)}
            ${this.#renderNameAndRoom(user)} ${this.#renderNeedsHelp(user)}
            ${this.#renderTeacherSymbol(user)} ${this.#renderRoomAccess(user)}
          </div>`;
        })}
    `;
  };

  #renderNameAndRoom(user) {
    let textColorStyle = {
      color: isColorLight(user.color) ? menuForegroundDark() : menuForeground1(),
    };
    if (user.isLocalUser()) {
      return html` <div
        class="row user-row grow pointer font"
        @click="${() => {
          UserColorRenameModal(user);
        }}"
      >
        <div
          data-tip="Set Username and Color"
          data-tip-left
          style="${styleMap(textColorStyle)}"
        >
          ${user.getNameShortened()}
        </div>
        ${this.#renderJumpToRoomElement(user)}
      </div>`;
    } else {
      let localUser = UserService.get().localUser;
      return html` <div class="row font user-row grow pointer">
        <div
          class="row"
          data-tip="${localUser.getTrackingByRoom(this.roomId)
            ? "Stop Tracking"
            : "Track Cursor"}"
          data-tip-left
          style="${styleMap(textColorStyle)}"
          @click="${() => {
            this.#onClickFollow(user);
            this.requestUpdate();
            initDataTips(this.renderRoot);
          }}"
        >
          <div>${this.#renderFollowing(user)}</div>
          <div>${user.getNameShortened()}</div>
        </div>
        ${this.#renderJumpToRoomElement(user)}
      </div>`;
    }
  }

  #onClickFollow(user) {
    let localUser = UserService.get().localUser;
    localUser.toggleTrackingInRoom(this.roomId, user);
  }

  #renderSplitIndicator(user) {
    let localUser = UserService.get().localUser;
    let splitindicator = user.isTeacher() && user != localUser && user.isRoomLeft(this.roomId);
    if (splitindicator) {
      let leftSize = user.leftSize <= 0.5 ? 0.5 : user.leftSize >= 99.5 ? 99.5 : user.leftSize;
      return html`<div class="splitindicator" style="left:${leftSize}%"></div>`;
    } else 
      return '';
  }

  #renderJumpToRoomElement(user) {
    let isLight = isColorLight(user.color);
    let backgroundStyle = {
      backgroundColor: isLight ? menuForeground1() : menuForegroundDark(),
    };
    let fontStyle = {
      color: isLight ? menuForegroundDark() : menuForeground1(),
    };
    return html` <div
      class="little-box row center alias center-cross-axis"
      style="${styleMap(backgroundStyle)}"
      data-tip="Jump to Room"
      data-tip-left
      @click="${() => {
        this.#jumpToRoomOfUser(user);
      }}"
    >
      <p style="${styleMap(fontStyle)}">${user.selectedRoomRight}</p>
    </div>`;
  }

  #jumpToRoomOfUser(user) {
    UserService.get().localUser.selectedRoomRight = user.selectedRoomRight;
  }

  #renderNeedsHelp = (user) => {
    let localIsStudent = UserService.get().localUser.isStudent();
    if (user.needsHelp) {
      return html` <div
        class="font-emoji pulse pointer help-rotation rm"
        data-tip="Needs Help"
        @click="${() => {
          this.#onClickLowerHand(localIsStudent, user);
        }}"
      >
        👋
      </div>`;
    }

    if (!user.isLocalUser()) return html``;
    return html` <div
      class="font-emoji pulse pointer rm"
      data-tip="Request Help"
      @click="${() => {
        this.#onClickRaiseHand(user);
      }}"
    >
      ✋
    </div>`;
  };

  #onClickLowerHand(localIsStudent, user) {
    if (
      RoomService.get().getRoom(this.roomId).isTeacherRoom() &&
      !user.isLocalUser
    ) {
      this.#jumpToRoomOfUser(user);
      return;
    }

    if (localIsStudent && !user.isLocalUser()) return;
    user.needsHelp = false;
    this.requestUpdate();
  }

  #onClickRaiseHand = (user) => {
    user.needsHelp = true;
    this.requestUpdate();
  };

  #renderTeacherSymbol = (user) => {
    if (user.isStudent()) return html``;
    return html` <div class="font-emoji pointer rm" data-tip="Teacher">
      🎓
    </div>`;
  };

  #renderRoomAccess(user) {
    let room = RoomService.get().getRoom(this.roomId);
    if (room.roomType === RoomType.STUDENT) {
      return this.#renderRoomAccessStudentRoom(user);
    }

    return this.#renderRoomAccessTeacherRoom(user);
  }

  #renderRoomAccessTeacherRoom = (user) => {
    let room = RoomService.get().getRoom(this.roomId);

    if (UserService.get().localUser.isStudent()) {
      if (room.isWriter(user.id)) {
        return html` <div class="pointer emoji-font" data-tip="Has Access">
          ${this.writerIcon}
        </div>`;
      }
    }

    if (UserService.get().localUser.isTeacher()) {
      if (user.id === UserService.get().localUser.id) return "";

      if (room.isWriter(user.id)) {
        return html` <div
          class="pointer emoji-font"
          data-tip="Remove Access"
          @click=${() => {
            RoomService.get().getRoom(this.roomId).removeAccess(user.id);
            this.requestUpdate();
          }}
        >
          ${this.writerIcon}
        </div>`;
      }

      return html` <div
        class="pointer emoji-font grey-out"
        data-tip="Give Access"
        @click=${() => {
          RoomService.get().getRoom(this.roomId).giveAccess(user.id);
          this.requestUpdate();
        }}
      >
        ${this.writerIcon}
      </div>`;
    }
  };

  #renderRoomAccessStudentRoom = (user) => {
    if (!ClassroomService.get().classroom.roomLocks) return html``;

    if (RoomService.get().getRoom(this.roomId).isUnclaimed()) return html``;

    if (RoomService.get().getRoom(this.roomId).isOwnedBy(user.id)) {
      return html`
        <div class="pointer emoji-font" data-tip="Room Owner">
          ${this.adminIcon}
        </div>
      `;
    }

    if (
      RoomService.get()
        .getRoom(this.roomId)
        .isWriter(UserService.get().localUser.id)
    ) {
      if (RoomService.get().getRoom(this.roomId).isWriter(user.id)) {
        // make sure you cannot remove yourself from the list of writers.
        if (UserService.get().localUser.id === user.id) {
          return html` <div
            class="pointer emoji-font"
            data-tip="You have Access"
          >
            ${this.writerIcon}
          </div>`;
        }

        return html` <div
          class="pointer emoji-font"
          data-tip="Remove Access"
          @click="${() => {
            RoomService.get().getRoom(this.roomId).removeAccess(user.id);
            this.requestUpdate();
          }}"
        >
          ${this.writerIcon}
        </div>`;
      }
      if (user.isStudent()) {
        return html` <div
          class="pointer emoji-font grey-out"
          data-tip="Give Access"
          @click="${() => {
            RoomService.get().getRoom(this.roomId).giveAccess(user.id);
            this.requestUpdate();
          }}"
        >
          ${this.writerIcon}
        </div>`;
      }
    }

    return html``;
  };

  #renderFollowing(user) {
    if (
      UserService.get().localUser.getTrackingByRoom(this.roomId) === user.id
    ) {
      return html` <div class="font-emoji pulse-on rm">👀</div> `;
    }

    return "";
  }

  static styles = [
    css`
      .grey-out {
        opacity: 0.5;
      }

      .rm {
        margin-right: 2px;
      }

      .font {
        font-size: 9pt;
      }

      .font-emoji {
        font-size: 11pt;
      }

      .user-row {
        padding: 1px 1px 1px 3px;
        bottom: 0;
        height: 24px;
        align-items: center;
      }

      .little-box {
        padding: 1px;
        font-size: 7pt;
        border-radius: 5px;
        height: 11px;
        width: 11px;
        margin: 2px;
      }

      .splitindicator {
        position: absolute;
				z-index: 0;
				filter: brightness(1);
				height: 26px;
        border-left:4px solid rgb(102, 102, 102, 0.4)};
      }
    `,
    basicFlexStyles(),
    pulseStyle(),
    cursorTipStyle(),
    toolTipStyle(),
    helpRotationStyle(),
  ];
}

safeRegister("cc-user-list", UserListView);
