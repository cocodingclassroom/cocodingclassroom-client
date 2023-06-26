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

export class UserListView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  connectedCallback() {
    super.connectedCallback();
    this.addListeners();
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

  listener = () => {
    this.requestUpdate();
    initDataTips(this.renderRoot);
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
            user.isRoomRight(this.roomId) ||
            user.isRoomLeft(this.roomId)
        )
        .map((user) => {
          let backgroundColorStyle = { backgroundColor: user.color };

          return html` <div
            class="row center border ${user.needsHelp ? "pulse-on" : ""}"
            style="${styleMap(backgroundColorStyle)}"
          >
            ${this.#renderRoomAccess(user)} ${this._renderNameAndRoom(user)}
            ${this.#renderFollowedBy(user)} ${this.#renderNeedsHelp(user)}
            ${this.#renderTeacherSymbol(user)}
          </div>`;
        })}
    `;
  };

  _renderNameAndRoom(user) {
    let textColorStyle = {
      color: isColorLight(user.color) ? black() : white(),
    };
    if (user.isLocalUser()) {
      return html` <div class="row user-row grow pointer">
        <div
          class="font"
          data-tip="Set Username and Color"
          data-tip-left
          style="${styleMap(textColorStyle)}"
          @click="${() => {
            UserColorRenameModal(user);
          }}"
        >
          ${user.name}
        </div>
        ${this.#renderJumpToRoomElement(user)}
      </div>`;
    } else {
      return html` <div class="row font user-row grow pointer">
        <div
          class="user-row row"
          data-tip="${UserService.get().localUser.followingId === user.id
            ? "Follow"
            : "Unfollow"}"
          data-tip-left
          style="${styleMap(textColorStyle)}"
          @click="${() => {
            this.#onClickFollow(user);
            this.requestUpdate();
            initDataTips(this.renderRoot);
          }}"
        >
          <div class="font-emoji pulse-on">
            ${this.#renderFollowSymbol(user)}
          </div>
          <div>${user.name}</div>
        </div>
        ${this.#renderJumpToRoomElement(user)}
      </div>`;
    }
  }

  #onClickFollow(user) {
    let localUser = UserService.get().localUser;

    if (localUser.followingId === null) {
      localUser.followingId = user.id;
    } else {
      localUser.followingId = null;
    }
  }

  #renderFollowSymbol(user) {
    if (UserService.get().localUser.followingId === user.id) return "👀";
    return "";
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
    if (!user.isLocalUser()) return "";
    if (user.needsHelp) {
      return html` <div
        class="font-emoji pulse pointer help-rotation rm"
        data-tip="${user.name} needs some help"
        @click="${() => {
          user.needsHelp = false;
          this.requestUpdate();
        }}"
      >
        👋
      </div>`;
    }
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
    return html` <div class="font-emoji pointer rm" data-tip="Is Teacher">
      🎓
    </div>`;
  };

  #renderRoomAccess(user) {
    if (RoomService.get().getRoom(this.roomId).roomType === RoomType.TEACHER)
      return "";
    if (!ClassroomService.get().classroom.roomLocks) return html``;
    return html` <div>
      ${this.#renderAccessIdentifier(user)}
      ${RoomService.get().getRoom(this.roomId).isOwnedBy(user.id)
        ? html`
            <cc-icon
              class="pointer"
              data-tip="Claimed this room"
              svg="${iconSvg.lock}"
            ></cc-icon>
          `
        : ""}
    </div>`;
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

      .border {
        border: aliceblue 1px solid;
        border-top: 0;
      }
    `,
    basicFlexStyles(),
    pulseStyle(),
    cursorTipStyle(),
    toolTipStyle(),
    helpRotationStyle(),
  ];

  #renderFollowedBy(user) {
    if (UserService.get().localUser !== user) return "";
    let followedBy = UserService.get().getFollowedBy();
    if (followedBy.length === 0) return "";
    let hintString = followedBy.map((user) => user.name).join(" ");
    return html` <div class="pulse-on" data-tip="Followed by ${hintString}">
      👀
    </div>`;
  }
}

safeRegister("cc-user-list", UserListView);
