import { html, LitElement } from "lit";
import { iconSvg } from "../icons/icons";
import { showModal } from "../../util/modal";
import { RoomService } from "../../services/room-service";
import { safeRegister } from "../../util/util";
import {
  NotifyService,
  Notification,
  NotificationType,
} from "../../services/notify-service";
import { UserService } from "../../services/user-service";

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

          NotifyService.get().notify(
            new Notification(
              NotificationType.FULLREBUILDOFFRAME,
              UserService.get().localUser,
              otherRoom.id
            )
          );
        });
      },
      () => {}
    );
  };
}

safeRegister("cc-sync-code", SyncCodeView);
