import { css, html, LitElement } from "lit";
import { safeRegister } from "../../util/util";
import {
  basicFlexStyles,
  inputStyle,
  menuBackground3Hover,
  menuForegroundDark,
  menuForegroundLight,
  toolTipStyle,
} from "../../util/shared-css";
import { ClassroomMode } from "../../models/classroom-model";
import { ClassroomService } from "../../services/classroom-service";
import { UserService } from "../../services/user-service";
import { RoomService } from "../../services/room-service";
import { initDataTips } from "../../util/tooltips";

export class SettingsView extends LitElement {
  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    this._setSelectedMode();
    initDataTips(this.renderRoot);
    UserService.get().localUser.addListener(() => {
      initDataTips(this.renderRoot);
    });
  }

  render = () => {
    return html`
      <div class="settings-panel col">
        ${UserService.get().localUser.isTeacher()
          ? html` <div>Classroom</div>
              <div class="line"></div>
              <div class="row">
                <div class="grow" data-tip="Set Classroom Mode" data-tip-left>
                  Mode
                </div>
                <div>
                  <input
                    @change="${() => this._onChangeMode()}"
                    name="mode"
                    id="editInput"
                    type="radio"
                    value="${ClassroomMode.EDIT}"
                  />
                  <label for="editInput">Edit</label>
                  <input
                    @change="${() => this._onChangeMode()}"
                    name="mode"
                    id="galleryInput"
                    type="radio"
                    value="${ClassroomMode.GALLERY}"
                  />
                  <label for="galleryInput">Gallery</label>
                </div>
              </div>
              <div
                class="row center-cross-axis"
                data-tip="Auto compile on keyup"
                data-tip-left
              >
                <input
                  id="live-coding"
                  type="checkbox"
                  .checked="${ClassroomService.get().classroom.liveCoding}"
                  @change="${() => {
                    this._onChangeLiveCoding();
                  }}"
                />
                <label for="live-coding"
                  >Live Coding
                  <select
                    id="seconds-delay"
                    class="input input-slim"
                    @change="${() => {
                      this._onChangeLiveCodingDelay();
                    }}"
                    data-tip="Keyup delay in seconds"
                  >
                    <option class="option" value="0.5">0.5</option>
                    <option class="option" value="1">1</option>
                    <option class="option" value="1.5">1.5</option>
                    <option class="option" value="2">2</option>
                  </select>
                  sec
                </label>
              </div>
              <div
                class="row center-cross-axis"
                data-tip="Display code line numbers"
                data-tip-left
              >
                <input
                  id="line-numbers"
                  type="checkbox"
                  .checked="${ClassroomService.get().classroom.lineNumbers}"
                  @change="${() => {
                    this._onChangeLineNumbers();
                  }}"
                />
                <label for="line-numbers">Line Numbers</label>
              </div>
              <div
                class="row center-cross-axis"
                data-tip="Anyone can lock their own room"
                data-tip-left
              >
                <input
                  id="room-locks"
                  type="checkbox"
                  .checked="${ClassroomService.get().classroom.roomLocks}"
                  @change="${() => {
                    this._onChangeRoomLocks();
                  }}"
                />
                <label for="room-locks">Room Locks</label>
              </div>
              <div
                class="row"
                data-tip="Time stayed in each room during 'Walk Rooms'"
                data-tip-left
              >
                <label for="walk-delay">Walk Delay:</label>
                <input
                  class="input input-slim"
                  id="walk-delay"
                  type="number"
                  value="${ClassroomService.get().classroom.walkDelay}"
                  @change="${() => {
                    this._onChangeWalkDelay();
                  }}"
                />
                <div>sec</div>
              </div>`
          : ""}

        <div>Editor</div>
        <div class="line"></div>
        <div class="row" data-tip="Set editor font-size" data-tip-left>
          <label for="font-size">Font Size:</label>
          <input
            class="input"
            id="font-size"
            type="number"
            min="5"
            max="60"
            value="${UserService.get().localUser.editorFontSize}"
            @change="${() => {
              this._onChangeEditorFontSize();
            }}"
          />
          <div>pt</div>
        </div>
      </div>
    `;
  };

  _onChangeLiveCodingDelay = () => {
    ClassroomService.get().classroom.liveCodingDelay = parseInt(
      this.renderRoot.getElementById("seconds-delay").value
    );
    this.requestUpdate();
  };

  _onChangeLiveCoding = () => {
    ClassroomService.get().classroom.liveCoding =
      this.renderRoot.getElementById("live-coding").checked;
    this.requestUpdate();
  };

  _onChangeWalkDelay() {
    ClassroomService.get().classroom.walkDelay =
      this.renderRoot.getElementById("walk-delay").value;
    this.requestUpdate();
  }

  _onChangeLineNumbers() {
    ClassroomService.get().classroom.lineNumbers =
      this.renderRoot.getElementById("line-numbers").checked;
    this.requestUpdate();
  }

  _onChangeRoomLocks() {
    ClassroomService.get().classroom.roomLocks =
      this.renderRoot.getElementById("room-locks").checked;
    if (!ClassroomService.get().classroom.roomLocks) {
      RoomService.get()
        .rooms.filter((room) => room.isStudentRoom())
        .forEach((room) => room.clearAllAuthorizationOnRoom());
    }
    this.requestUpdate();
  }

  _onChangeEditorFontSize() {
    UserService.get().localUser.editorFontSize =
      this.renderRoot.getElementById("font-size").value;
    this.requestUpdate();
  }

  _setSelectedMode = () => {
    if (ClassroomService.get().classroom.mode === ClassroomMode.EDIT) {
      this.renderRoot.getElementById("editInput").checked = true;
      this.renderRoot.getElementById("galleryInput").checked = false;
    }
    if (ClassroomService.get().classroom.mode === ClassroomMode.GALLERY) {
      this.renderRoot.getElementById("editInput").checked = false;
      this.renderRoot.getElementById("galleryInput").checked = true;
    }
  };

  _getSelectedMode = () => {
    return this.renderRoot.querySelector('input[name="mode"]:checked').value;
  };

  _onChangeMode = () => {
    let newMode = this._getSelectedMode();
    ClassroomService.get().classroom.mode = newMode;

    if (newMode === ClassroomMode.EDIT) {
      RoomService.get().clearAllGalleryChats();
    }

    if (newMode === ClassroomMode.GALLERY) {
      UserService.get().localUser.selectedRoomRight = -1;
    }
  };

  static styles = [
    css`
      .settings-panel {
        min-height: 50px;
        max-height: 500px;
        padding: 5px;
        border-left: 1px solid #aaa;
        border-right: 1px solid #aaa;
        border-top: none;
        border-bottom: 1.5px solid #aaa;
        font-size: 10pt;
        background-color: ${menuBackground3Hover()};
      }

      .settings-panel div {
        padding: 2px;
      }

      .line {
        height: 5px;
        width: 95%;
        border-top: solid 1px ${menuForegroundLight()};
      }

      .input {
        border: none;
        width: 20%;
        border-bottom: solid 1px ${menuForegroundLight()};
        background-color: transparent;
        color: ${menuForegroundLight()};
      }

      .option {
        color: ${menuForegroundDark()};
      }

      #seconds-delay {
        width: 50px;
      }
    `,
    basicFlexStyles(),
    toolTipStyle(),
    inputStyle(),
  ];
}

safeRegister("cc-settings", SettingsView);
