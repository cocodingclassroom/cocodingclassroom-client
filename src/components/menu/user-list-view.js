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
    return html`
      ${UserService.get()
        .getAllUsers()
        .map((user) => {
          let backgroundColorStyle = { backgroundColor: user.color };

          return html` <div
            class="row center border ${user.needsHelp ? "pulse-on" : ""}"
            style="${styleMap(backgroundColorStyle)}"
          >
            ${this._renderRoomAccess(user)} ${this._renderNameAndRoom(user)}
            ${this._renderNeedsHelp(user)} ${this._renderTeacherSymbol(user)}
          </div>`;
        })}
    `;
  };

  _renderNameAndRoom(user) {
    let textColorStyle = {
      color: isColorLight(user.color) ? "black" : "white",
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
        ${this._renderJumpToRoomElement(user)}
      </div>`;
    } else {
      return html` <div class="row font user-row grow pointer">
        <div class="user-row" data-tip-left style="${styleMap(textColorStyle)}">
          ${user.name}
        </div>
        ${this._renderJumpToRoomElement(user)}
      </div>`;
    }
  }

  _renderJumpToRoomElement(user) {
    let isLight = isColorLight(user.color);
    let backgroundStyle = {
      backgroundColor: isLight ? white() : black(),
    };
    let fontStyle = {
      color: isLight ? black() : white(),
    };
    return html` <div
      class="little-box row center alias"
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

  _renderNeedsHelp = (user) => {
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

  _renderTeacherSymbol = (user) => {
    if (user.isStudent()) return html``;
    return html`<div class="font-emoji pointer rm" data-tip="Is Teacher">
      🎓
    </div>`;
  };

  _renderRoomAccess(user) {
    if (RoomService.get().getRoom(this.roomId).roomType === RoomType.TEACHER)
      return "";
    if (!ClassroomService.get().classroom.roomLocks) return html``;
    return html` <div>
      ${this._renderAccessIdentifier(user)}
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

  _renderAccessIdentifier = (user) => {
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
        font-size: 12pt;
      }

      .user-row {
        padding: 1px;
        bottom: 0;
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
}

safeRegister("cc-user-list", UserListView);
