import { css, html, LitElement } from "lit";
import { UserService } from "../../services/user-service";
import { isColorLight, safeRegister } from "../../util/util";
import { styleMap } from "lit/directives/style-map.js";
import {
  basicFlexStyles,
  black,
  cursorTipStyle,
  pulseStyle,
  helpRotationStyle,
  toolTipStyle,
  white,
} from "../../util/shared-css";
import { initDataTips } from "../../util/tooltips";
import { UserColorRenameModal } from "../user-color-rename-modal";
import { ClassroomService } from "../../services/classroom-service";
import { RoomService } from "../../services/room-service";
import { iconSvg } from "../icons/icons";
import { RoomType } from "../../models/room";
import { sortUsers } from "../../util/user";

export class UserListView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

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
            class="cc-controlls-view row center border ${user.needsHelp
              ? "pulse-on"
              : ""}"
            style="${styleMap(backgroundColorStyle)}"
          >
            ${this.#renderNameAndRoom(user)} ${this.#renderNeedsHelp(user)}
            ${this.#renderTeacherSymbol(user)}
          </div>`;
        })}
    `;
  };

  #renderNameAndRoom(user) {
    let textColorStyle = {
      color: isColorLight(user.color) ? black() : white(),
    };
    if (user.isLocalUser()) {
      return html` <div
        class="row user-row grow pointer font"
        @click="${() => {
          UserColorRenameModal(user);
        }}"
      >
        ${this.#renderRoomAccess(user)}
        <div
          data-tip="Set Username and Color"
          data-tip-left
          style="${styleMap(textColorStyle)}"
        >
          ${this.#trimUserName(user)}
        </div>
        ${this.#renderJumpToRoomElement(user)}
      </div>`;
    } else {
      let localUser = UserService.get().localUser;
      return html` <div class="row font user-row grow pointer">
        ${this.#renderRoomAccess(user)}
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
          <div>${this.#trimUserName(user)}</div>
        </div>
        ${this.#renderJumpToRoomElement(user)}
      </div>`;
    }
  }

  #trimUserName(user, maxLength = 15) {
    return user.name.length < maxLength
      ? user.name
      : `${user.name.substring(0, maxLength)}...`;
  }

  #onClickFollow(user) {
    let localUser = UserService.get().localUser;
    localUser.toggleTrackingInRoom(this.roomId, user);
  }

  #renderJumpToRoomElement(user) {
    let isLight = isColorLight(user.color);
    let backgroundStyle = {
      backgroundColor: isLight ? white() : black(),
    };
    let fontStyle = {
      color: isLight ? black() : white(),
    };
    return html` <div
      class="little-box row center alias center-cross-axis"
      style="${styleMap(backgroundStyle)}"
      data-tip="Jump to Room"
      data-tip-left
      @click="${() => {
        UserService.get().localUser.selectedRoomRight = user.selectedRoomRight;
      }}"
    >
      <p style="${styleMap(fontStyle)}">${user.selectedRoomRight}</p>
    </div>`;
  }

  #renderNeedsHelp = (user) => {
    let localIsStudent = UserService.get().localUser.isStudent();
    if (user.needsHelp) {
      return html` <div
        class="font-emoji pulse ${localIsStudent && !user.isLocalUser()
          ? ""
          : "pointer"} help-rotation rm"
        data-tip="${user.name} needs some help"
        @click="${() => {
          if (localIsStudent && !user.isLocalUser()) return;
          user.needsHelp = false;
          this.requestUpdate();
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
        user.needsHelp = true;
        this.requestUpdate();
      }}"
    >
      ✋
    </div>`;
  };

  #renderTeacherSymbol = (user) => {
    if (user.isStudent()) return html``;
    return html` <div class="font-emoji pointer rm" data-tip="Teacher">
      🎓
    </div>`;
  };

  #renderRoomAccess(user) {
    if (RoomService.get().getRoom(this.roomId).roomType === RoomType.TEACHER)
      return "";
    if (!ClassroomService.get().classroom.roomLocks) return html``;
    if (RoomService.get().getRoom(this.roomId).isOwnedBy(user.id)) {
      return html`
        <div class="pointer emoji-font" data-tip="Room Admin">🔐</div>
      `;
    }
    if (
      RoomService.get()
        .getRoom(this.roomId)
        .isOwnedBy(UserService.get().localUser.id)
    ) {
      if (RoomService.get().getRoom(this.roomId).isWriter(user.id)) {
        return html` <div
          class="pointer emoji-font"
          data-tip="Make Viewer"
          @click="${() => {
            RoomService.get().getRoom(this.roomId).removeAccess(user.id);
            this.requestUpdate();
          }}"
        >
          📝
        </div>`;
      }
      return html` <div
        class="pointer emoji-font"
        data-tip="Make Writer"
        @click="${() => {
          RoomService.get().getRoom(this.roomId).giveAccess(user.id);
          this.requestUpdate();
        }}"
      >
        👁️
      </div>`;
    }

    if (RoomService.get().getRoom(this.roomId).isWriter(user.id)) {
      return html` <div class="pointer emoji-font" data-tip="Writer">📝</div>`;
    }
    return html` <div class="pointer emoji-font" data-tip="Viewer">👁️</div>`;
  }

  #renderAccessIdentifier = (user) => {
    if (
      RoomService.get().getRoom(this.roomId).isWriter(user.id) &&
      (RoomService.get().getRoom(this.roomId).isOwnedByLocalUser() ||
        user.id === UserService.get().localUser.id)
    ) {
      return html`
        <cc-icon
          class="pointer"
          data-tip="Revoke Access"
          svg="${iconSvg.rename}"
          @click="${() => {
            RoomService.get().getRoom(this.roomId).removeAccess(user.id);
          }}"
        ></cc-icon>
      `;
    } else if (RoomService.get().getRoom(this.roomId).isWriter(user.id)) {
      return html`
        <cc-icon
          class="pointer"
          data-tip="Has Access"
          svg="${iconSvg.rename}"
        ></cc-icon>
      `;
    }
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
    `,
    basicFlexStyles(),
    pulseStyle(),
    cursorTipStyle(),
    toolTipStyle(),
    helpRotationStyle(),
  ];
}

safeRegister("cc-user-list", UserListView);
