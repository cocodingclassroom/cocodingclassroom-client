import { RoomService } from "../../services/room-service";
import { showModal } from "../../util/modal";

export const renameRoom = (roomId) => {
  let room = RoomService.get().getRoom(roomId);
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
    () => {
      let nameInput = document.getElementById("roomname");
      nameInput.select();
    }
  );
};