import { html, LitElement } from "lit";
import {
  basicFlexStyles,
  menuRowStyles,
  toolTipStyle,
} from "../../util/shared-css";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";
import { showModal } from "../../util/modal";
import { RoomService } from "../../services/room-service";
import { initDataTips } from "../../util/tooltips";
import { UserService } from "../../services/user-service";

export class StudentMenuView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    initDataTips(this.renderRoot);
    UserService.get().localUser.addListener(() => {
      initDataTips(this.renderRoot);
    });
  }

  render = () => html`
    <div class="cc-controls-row-container">
      <div class="cc-controls-row">
        <cc-room-select roomId="${this.roomId}"></cc-room-select>
        <div
          class="grow"
          data-tip="Rename"
          @click="${() => {
            this.renameRoom();
          }}"
        >
          <cc-icon svg="${iconSvg.rename}"></cc-icon>
        </div>
      </div>
      <div class="cc-controls-row">
        <div data-tip="New Sketch">
          <cc-new-sketch roomId="${this.roomId}"></cc-new-sketch>
        </div>
        <div data-tip="Export Code">
          <cc-export-code roomId="${this.roomId}"></cc-export-code>
        </div>
      </div>
    </div>
  `;

  renameRoom = () => {
    let room = RoomService.get().getRoom(this.roomId);
    showModal(
      `
      <div>
      Rename Room
      </div>
     <input id="roomname" class="cc-user-rename" name="roomname" type="text" value="${room.roomName.replace(
       /["']/g,
       ""
     )}">
    `,
      () => {
        let nameInput = document.getElementById("roomname");
        room.roomName = nameInput.value;
      },
      () => {}
    );
  };

  static styles = [menuRowStyles(), basicFlexStyles(), toolTipStyle()];
}

safeRegister("cc-student-menu-view", StudentMenuView);
