import { html, LitElement } from "lit";
import { basicFlexStyles, menuRowStyles } from "../../util/shared-css";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";
import { showModal } from "../../util/modal";
import { RoomService } from "../../services/room-service";

export class StudentMenuView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  render = () => html`
    <div class="cc-controls-row-container">
      <div class="cc-controls-row">
        <cc-room-select roomId="${this.roomId}"></cc-room-select>
        <div
          class="grow"
          @click="${() => {
            this.renameRoom();
          }}"
        >
          <cc-icon svg="${iconSvg.rename}"></cc-icon>
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
        let newName = nameInput.value;
        room.roomName = newName;
      },
      () => {}
    );
  };

  static styles = [menuRowStyles(), basicFlexStyles()];
}

safeRegister("cc-student-menu-view", StudentMenuView);
