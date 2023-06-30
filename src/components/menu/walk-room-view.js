import { css, html, LitElement } from "lit";
import { safeRegister } from "../../util/util";
import { iconSvg } from "../icons/icons";
import { pulseStyle } from "../../util/shared-css";
import { UserService } from "../../services/user-service";
import { RoomService } from "../../services/room-service";
import { RoomType } from "../../models/room";
import { ClassroomService } from "../../services/classroom-service";

export class WalkRoomView extends LitElement {
  static properties = {
    roomId: { type: String },
    isWalking: { type: Boolean, state: true },
  };

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);

    ClassroomService.get().classroom.addListener(() => {
      if (this.isWalking) {
        this.#stopWalking();
        this.walkRooms();
      }
    });
  }

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
      this.#startWalking();
    } else {
      this.#stopWalking();
    }
  };

  #startWalking() {
    this.interval = setInterval(() => {
      let currentRoom = UserService.get().localUser.selectedRoomRight;
      let nextRoom = RoomService.get().getRoom(
        (currentRoom + 1) % RoomService.get().rooms.length
      );
      while (this.#nextRoomNotOkay(nextRoom)) {
        nextRoom = RoomService.get().getRoom(
          (nextRoom.id + 1) % RoomService.get().rooms.length
        );
      }
      UserService.get().localUser.selectedRoomRight = nextRoom.id;
    }, 1000 * ClassroomService.get().classroom.walkDelay);
  }

  #nextRoomNotOkay(nextRoom) {
    if (ClassroomService.get().isGalleryMode()) {
      return nextRoom.roomType === RoomType.TEACHER;
    }
    return nextRoom.roomType === RoomType.TEACHER || !nextRoom.hasUsers();
  }

  #stopWalking = () => {
    clearInterval(this.interval);
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
