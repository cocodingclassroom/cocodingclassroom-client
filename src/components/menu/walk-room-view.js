import { css, html, LitElement } from "lit";
import { safeRegister } from "../../util/util";
import { iconSvg } from "../icons/icons";
import { pulseStyle } from "../../util/shared-css";
import { UserService } from "../../services/user-service";
import { RoomService } from "../../services/room-service";
import { RoomType } from "../../models/room";

export class WalkRoomView extends LitElement {
  static properties = {
    roomId: { type: String },
    isWalking: { type: Boolean, state: true },
  };

  render = () => {
    return html` <div
      class="box ${this.isWalking ? "green-background pulse-on" : ""}"
      @click="${() => {
        this.walkRooms();
      }}"
    >
      <cc-icon svg="${iconSvg.person}"></cc-icon>
    </div>`;
  };

  walkRooms = () => {
    this.isWalking = !this.isWalking;
    if (this.isWalking) {
      this.interval = setInterval(() => {
        let currentRoom = UserService.get().localUser.selectedRoomRight;
        let nextRoom = RoomService.get().getRoom(
          (currentRoom + 1) % RoomService.get().rooms.length
        );
        while (nextRoom.roomType === RoomType.TEACHER) {
          nextRoom = RoomService.get().getRoom(
            (nextRoom.id + 1) % RoomService.get().rooms.length
          );
        }
        UserService.get().localUser.selectedRoomRight = nextRoom.id;
      }, 2000); //TODO: change timout to a defined value in the settings
    } else {
      clearInterval(this.interval);
    }
  };

  static styles = [
    pulseStyle(),
    css`
      .green-background {
        background-color: green;
        margin: 0;
      }

      .box {
        width: 100%;
        height: 100%;
      }
    `,
  ];
}

safeRegister("cc-walk-room", WalkRoomView);
