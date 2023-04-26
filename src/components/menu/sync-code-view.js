import { html, LitElement } from "lit";
import { iconSvg } from "../icons/icons";
import { showModal } from "../../util/modal";
import { RoomService } from "../../services/room-service";
import { safeRegister } from "../../util/util";

export class SyncCodeView extends LitElement {
  static properties = {
    roomId: { type: String },
  };
  render = () => {
    return html` <div @click="${() => this.syncCode()}">
      <cc-icon svg="${iconSvg.code}"></cc-icon>
    </div>`;
  };

  syncCode = () => {
    showModal(
      `
        <div>
          Push this room's code to all other rooms?
        </div>
      `,
      () => {
        let room = RoomService.get().getRoom(this.roomId);
        let template = room.codeContent.toString();
        RoomService.get().rooms.forEach((otherRoom) => {
          if (otherRoom === room) return;

          otherRoom.codeContent.delete(0, otherRoom.codeContent.length);
          otherRoom.codeContent.insert(0, template);
        });
      },
      () => {}
    );
  };
}

safeRegister("cc-sync-code", SyncCodeView);
