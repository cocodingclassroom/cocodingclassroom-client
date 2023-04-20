import { css, html, LitElement } from "lit";
import { RoomService } from "../services/room-service";
import { RoomType } from "../models/room";
import { UserService } from "../services/user-service";
import { repeat } from "lit-html/directives/repeat.js";

export class MenuView extends LitElement {
  static properties = {
    roomId: { type: String },
    isTeacherRoom: { type: Boolean, state: true },
  };

  room;

  connectedCallback() {
    this.room = RoomService.get().getRoom(this.roomId);
    this.isTeacherRoom = this.room.roomType === RoomType.TEACHER;
    UserService.get().localUser.addListener(() => {
      this.requestUpdate();
    });
    super.connectedCallback();
  }

  firstUpdated = () => {
    console.log(this.room);
    super.connectedCallback();
  };

  render = () => {
    return html`
      <div class="cc-meta">
        ${this.isTeacherRoom
          ? html` <div class="cc-roomlist-holder">
              <div class="cc-controls-row">
                <div
                  class="cc-header-title"
                  style="cursor: help;"
                  data-tip=""
                  onclick="${() => {}}"
                >
                  COCODING Classroom
                </div>

                <div
                  style="cursor: help;"
                  @onclick="${() => {}}"
                  data-tip="About"
                >
                  <cc-about></cc-about>
                </div>
                <div
                  class="cc-nav-settings"
                  @onclick="${() => {}}"
                  data-tip="Settings"
                >
                  <cc-settings></cc-settings>
                </div>
              </div>
            </div>`
          : html` <div>
              <div class="cc-roomlist-holder">
                <select name="rooms" @change="${this.onChangeRoomSelection}">
                  ${repeat(
                    RoomService.get().rooms.filter(
                      (room) => room.roomType === RoomType.STUDENT
                    ),
                    (e) => e,
                    (room) => html` <option
                      value="${room.id}"
                      ?selected="${this.isSelectedString(room)}"
                    >
                      ${room.roomName}
                    </option>`
                  )}
                </select>
              </div>
            </div>`}
        <div></div>
      </div>
    `;
  };

  isSelectedString(room) {
    var result = UserService.get().localUser.isRoomRight(room.id)
      ? "true"
      : "false";
    return result;
  }

  onChangeRoomSelection = (e) => {
    console.log(e.target.value);
    UserService.get().localUser.selectedRoomRight = parseInt(e.target.value);
  };

  static styles = css`
    .cc-meta {
      position: absolute;
      z-index: 3;
      top: 5px;
      right: 5px;
      background: #333;
      border: 1px solid #aaa;
      width: 220px;
      min-height: 100px;
      height: auto;
      opacity: 0.3;
      transition: opacity 0.5s;
    }

    .cc-meta:hover {
      opacity: 1;
    }

    .cc-meta-visible {
      opacity: 1;
    }

    .cc-roomlist-holder {
      /*max-width: 80%;*/
      display: flex;
      flex-direction: row;
      align-items: center;
      //flex: 1;
      //border-bottom: 1px solid #aaa;
      /*height: 26px;*/
    }

    .cc-header-title {
      font-size: 10pt;
      //color: #fff;
      //background: #666;
      max-width: calc(100% - 62px);
      min-width: calc(100% - 62px);
      //border-right: 1px solid #aaa;
      cursor: help;
    }

    .cc-controls-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex: 1;
      height: 24px;
      border-bottom: 1px solid #aaa;
    }

    .cc-controls-row div {
      flex-grow: 1;
      flex-basis: 100%;
      /*width: 100%;*/
      height: 100%;
      background: #444;
      border-right: 1px solid #aaa;
      text-align: center;
      cursor: pointer;
    }

    .cc-controls-row div:hover {
      background: #555;
    }

    .cc-controls-row div:hover svg {
      animation: pulse 1s linear infinite alternate !important;
    }
  `;
}

window.customElements.define("cc-menu", MenuView);
