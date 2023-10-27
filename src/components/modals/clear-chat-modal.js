import { showModal } from "../../util/modal";
import { RoomService } from "../../services/room-service";
import { ClassroomService } from "../../services/classroom-service";
import { ClassroomMode } from "../../models/classroom-model";

export const clearChat = (roomId) => {
  showModal(
    `
        <div>
         Clear chat for this room?
        </div>
    `,
    () => {
      let room = RoomService.get().getRoom(roomId);
      let messages = room.messages;
      if (ClassroomService.get().classroom.mode === ClassroomMode.GALLERY) {
        messages = room.galleryMessages;
      }
      messages.delete(0, messages.length);
    },
    () => {}
  );
};
