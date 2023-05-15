import { html, LitElement } from "lit";
import { iconSvg } from "../icons/icons";
import { showModal } from "../../util/modal";
import { RoomService } from "../../services/room-service";
import { BindingService } from "../../services/binding-service";
import { safeRegister } from "../../util/util";
import { NotifyService, Notification, NotificationType } from "../../services/notify-service";
import { UserService } from "../../services/user-service";

export class NewSketchView extends LitElement {
  static properties = {
    roomId: { type: String }
  };

  render = () => {
    return html`
      <div @click="${() => this.setNewSketch()}">
        <cc-icon svg="${iconSvg.new}"></cc-icon>
      </div>`;
  };

  setNewSketch = () => {
    showModal(
      `
        <div>
          Replace code with new sketch?
        </div>
      `,
      () => {
        let room = RoomService.get().getRoom(this.roomId);
        let template = BindingService.get().binding.codeTemplate;
        room.codeContent.delete(0, room.codeContent.length);
        room.codeContent.insert(0, template);
        NotifyService.get().notify(
          new Notification(
            NotificationType.FULLREBUILDOFFRAME,
            UserService.get().localUser,
            room.id)
        );
      },
      () => {
      }
    );
  };
}

safeRegister("cc-new-sketch", NewSketchView);
