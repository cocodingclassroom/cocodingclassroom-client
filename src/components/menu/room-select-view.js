import { css, html, LitElement } from "lit";
import { repeat } from "lit-html/directives/repeat.js";
import { RoomService } from "../../services/room-service";
import { UserService } from "../../services/user-service";
import { ClassroomService } from "../../services/classroom-service";
import { safeRegister } from "../../util/util";
import {
  basicFlexStyles,
  menuBackground2,
  menuBackground2Hover,
  menuBorder1,
  menuForegroundLight,
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
    this.room = RoomService.get().getRoom(this.roomId);
    this.#setSelectedOption();
  }

  updated(_changedProperties) {
    super.updated(_changedProperties);
    this.room = RoomService.get().getRoom(this.roomId);
    this.#setSelectedOption();
  }

  render = () => {
    return html` <select
      class="cc-roomlist grow"
      name="rooms"
      id="room-select-options"
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
    let option = this.renderRoot.getElementById("room-select-options");
    option.value = `${this.roomId}`;
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
        //border: 1px solid ${menuBorder1()};
        border: none;
        //border-top: none;
        //border-bottom: none;
        //height: 26px;
        background: ${menuBackground2()};
        color: ${menuForegroundLight()};
        //padding: 1px;
        padding: 1px;
        font-size: 10pt;
        cursor: pointer;
        min-width: 150px;
        width: 100%;
        height: 100%;
        outline: none;
      }

      .cc-roomlist > option {
        background: ${menuBackground2()};
        color: ${menuForegroundLight()};
      }

      .cc-roomlist:hover {
        background: ${menuBackground2Hover()};
      }
    `,
    basicFlexStyles(),
  ];
}

safeRegister("cc-room-select", RoomSelectView);
