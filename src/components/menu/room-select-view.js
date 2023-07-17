import { css, html, LitElement } from "lit";
import { repeat } from "lit-html/directives/repeat.js";
import { RoomService } from "../../services/room-service";
import { UserService } from "../../services/user-service";
import { RoomType } from "../../models/room";
import { ClassroomService } from "../../services/classroom-service";
import { safeRegister } from "../../util/util";
import {
  menuBackground2,
  menuBackground2Hover,
  menuBorder1,
  menuForeground1,
} from "../../util/shared-css";

export class RoomSelectView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  room;

  connectedCallback() {
    this.room = RoomService.get().getRoom(this.roomId);
    UserService.get().localUser.addListener(() => {
      this.requestUpdate();
    });
    ClassroomService.get().classroom.addListener(() => {
      this.requestUpdate();
    });
    RoomService.get().rooms.forEach((room) =>
      room.addListener(() => {
        this.requestUpdate();
      })
    );
    super.connectedCallback();
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    this.#setSelectedOption();
  }

  updated(_changedProperties) {
    super.updated(_changedProperties);
  }

  render = () => {
    return html` <select
      class="cc-roomlist"
      name="rooms"
      @change="${this.#onChangeRoomSelection}"
    >
      ${repeat(
        RoomService.get().rooms.filter((room) => room.isStudentRoomOrLobby()),
        (e) => e,
        (room) =>
          html` <option id="${this.#thisRoomValue(room.id)}" value="${room.id}">
            ${this.#getRoomNameDisplay(room)} ${this.#renderRoomLocks(room)}
          </option>`
      )}
    </select>`;
  };

  #getRoomNameDisplay(room) {
    if (room.isLobby()) return html`${room.roomName}`;
    return html` ${room.id}_${room.roomName}`;
  }

  #thisRoomValue(roomId) {
    return `room-option-${roomId}`;
  }

  #onChangeRoomSelection = (e) => {
    UserService.get().localUser.selectedRoomRight = parseInt(e.target.value);
  };

  #setSelectedOption() {
    let option = this.renderRoot.getElementById(
      this.#thisRoomValue(this.roomId)
    );
    option.setAttribute("selected", true);
  }

  #renderRoomLocks = (room) => {
    if (!ClassroomService.get().classroom.roomLocks) return "";
    if (room.isUnclaimed()) return "";
    if (room.isOwnedByLocalUser()) {
      return "🔐";
    }
    return "🔒";
  };

  static styles = [
    css`
      .cc-roomlist {
        border: 1px solid ${menuBorder1()};
        border-top: none;
        border-bottom: none;
        height: 26px;
        background: ${menuBackground2()};
        color: ${menuForeground1()};
        padding: 2px;
        font-size: 10pt;
        cursor: pointer;
        min-width: calc(150px);
        outline: none;
      }

      .cc-roomlist > option {
        background: ${menuBackground2()};
        color: ${menuForeground1()};
      }

      .cc-roomlist:hover {
        background: ${menuBackground2Hover()};
      }
    `,
  ];
}

safeRegister("cc-room-select", RoomSelectView);
