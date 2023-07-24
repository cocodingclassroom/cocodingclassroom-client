import { showModal } from "../../util/modal";
import { RoomService } from "../../services/room-service";

export const clearChat = (roomId) => {
  showModal(
    `
        <div>
         Clear chat for this room?
        </div>
    `,
    () => {
      let messages = RoomService.get().getRoom(roomId).messages;
      messages.delete(0, messages.length);
    },
    () => {}
  );
};
