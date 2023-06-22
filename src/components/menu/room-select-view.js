import { css, html, LitElement } from "lit";
import { repeat } from "lit-html/directives/repeat.js";
import { RoomService } from "../../services/room-service";
import { UserService } from "../../services/user-service";
import { RoomType } from "../../models/room";
import { ClassroomService } from "../../services/classroom-service";
import { safeRegister } from "../../util/util";

export class RoomSelectView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  room;

  connectedCallback() {
    this.room = RoomService.get().getRoom(this.roomId);
    UserService.get().localUser.addListener(() => {
      this._setSelectedOption();
      this.requestUpdate();
    });
    ClassroomService.get().classroom.addListener(() => {
      this._setSelectedOption();
      this.requestUpdate();
    });
    RoomService.get().rooms.forEach((room) =>
      room.addListener(() => {
        this.requestUpdate();
      })
    );
    super.connectedCallback();
  }

  render = () => {
    return html` <select
      class="cc-roomlist"
      id="${this._getRoomSelectId()}"
      name="rooms"
      @change="${this._onChangeRoomSelection}"
    >
      ${repeat(
        RoomService.get().rooms.filter(
          (room) => room.roomType === RoomType.STUDENT
        ),
        (e) => e,
        (room) =>
          html` <option value="${room.id}">
            ${room.id}_${room.roomName} ${this._renderRoomLocks(room)}
          </option>`
      )}
    </select>`;
  };

  _getRoomSelectId = () => `room-select-${this.room.id}`;

  _onChangeRoomSelection = (e) => {
    console.log(e.target.value);
    UserService.get().localUser.selectedRoomRight = parseInt(e.target.value);
    this._setSelectedOption();
  };

  _setSelectedOption() {
    let selectDOM = this._getSelectDOMElement();
    if (selectDOM === null) return;
    for (let i = 0; i < selectDOM.options.length; i++) {
      let option = selectDOM.options[i];
      if (UserService.get().localUser.isRoomRight(option.value)) {
        option.setAttribute("selected", true);
      } else {
        option.removeAttribute("selected");
      }
    }
  }

  _getSelectDOMElement = () =>
    this.renderRoot?.querySelector(`#${this._getRoomSelectId()}`) ?? null;

  _renderRoomLocks = (room) => {
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
        border: 1px solid #aaa;
        border-top: none;
        height: 26px;
        background: #444;
        color: #fff;
        padding: 2px;
        font-size: 10pt;
        cursor: pointer;
        max-width: calc(128px);
        min-width: calc(180px);
      }

      .cc-roomlist:hover {
        background: #555;
      }
    `,
  ];
}

safeRegister("cc-room-select", RoomSelectView);
