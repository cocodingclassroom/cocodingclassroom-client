import { css, html, LitElement } from "lit";
import { safeRegister } from "../../util/util";
import { basicFlexStyles, black, white } from "../../util/shared-css";
import { ClassroomMode } from "../../models/classroom-model";
import { ClassroomService } from "../../services/classroom-service";
import { UserService } from "../../services/user-service";
import { RoomService } from "../../services/room-service";

export class SettingsView extends LitElement {
  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    this._setSelectedMode();
  }

  render = () => {
    return html`
      <div class="settings-panel col">
        ${UserService.get().localUser.isTeacher()
          ? html` <div>Classroom Settings</div>
              <div class="line"></div>
              <div class="row">
                <div class="grow">Mode</div>
                <div>
                  <input
                    @change="${() => this._onChangeMode()}"
                    name="mode"
                    id="editInput"
                    type="radio"
                    value="Edit"
                  />
                  <label for="editInput">Edit</label>
                  <input
                    @change="${() => this._onChangeMode()}"
                    name="mode"
                    id="galleryInput"
                    type="radio"
                    value="Gallery"
                  />
                  <label for="galleryInput">Gallery</label>
                </div>
              </div>
              <div class="row">
                <input
                  id="live-coding"
                  type="checkbox"
                  .checked="${ClassroomService.get().classroom.liveCoding}"
                  @change="${() => {
                    this._onChangeLiveCoding();
                  }}"
                />
                <label for="live-coding" class="grow"
                  >Live Coding
                  <select
                    id="seconds-delay"
                    class="input"
                    @change="${() => {
                      this._onChangeLiveCodingDelay();
                    }}"
                  >
                    <option class="option" value="0.5">0.5</option>
                    <option class="option" value="1">1</option>
                    <option class="option" value="1.5">1.5</option>
                    <option class="option" value="2">2</option>
                  </select>
                  /s Delay
                </label>
              </div>
              <div>
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
              <div>
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
              <div class="row">
                <label for="walk-delay">Walk Delay:</label>
                <input
                  class="input"
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

        <div>Editor Settings</div>
        <div class="line"></div>
        <div class="row">
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
      RoomService.get().rooms.forEach((room) =>
        room.clearAllAuthorizationOnRoom()
      );
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
    ClassroomService.get().classroom.mode = this._getSelectedMode();
  };

  static styles = [
    css`
      .settings-panel {
        min-height: 50px;
        max-height: 500px;
        padding: 5px;
        border: 1px solid ${white()};
      }

      .settings-panel div {
        font-size: 8pt;
        padding: 2px;
      }

      .line {
        height: 5px;
        width: 90%;
        border-top: solid 1px ${white()};
      }

      .input {
        border: none;
        width: 20%;
        border-bottom: solid 1px ${white()};
        background-color: transparent;
        color: ${white()};
      }

      .option {
        color: ${black()};
      }
    `,
    basicFlexStyles(),
  ];
}

safeRegister("cc-settings", SettingsView);
