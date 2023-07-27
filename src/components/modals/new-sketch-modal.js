import { showModal } from "../../util/modal";
import { RoomService } from "../../services/room-service";
import { BindingService } from "../../services/binding-service";
import {
  Notification,
  NotificationType,
  NotifyService,
} from "../../services/notify-service";
import { UserService } from "../../services/user-service";

export const setNewSketch = (roomId) => {
  showModal(
    `
        <div>
          Replace code with new sketch?
        </div>
      `,
    () => {
      let room = RoomService.get().getRoom(roomId);
      let template = BindingService.get().binding.codeTemplate;
      room.codeContent.delete(0, room.codeContent.length);
      room.codeContent.insert(0, template);
      NotifyService.get().notify(
        new Notification(
          NotificationType.FULLREBUILDOFFRAME,
          UserService.get().localUser,
          room.id
        )
      );
    },
    () => {}
  );
};
