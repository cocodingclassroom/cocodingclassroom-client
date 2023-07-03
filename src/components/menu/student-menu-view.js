import { css, html, LitElement } from "lit";
import {
  basicFlexStyles,
  menuRowStyles,
  pulseStyle,
  toolTipStyle,
} from "../../util/shared-css";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";
import { showModal } from "../../util/modal";
import { RoomService } from "../../services/room-service";
import { initDataTips } from "../../util/tooltips";
import { UserService } from "../../services/user-service";
import { ClassroomService } from "../../services/classroom-service";
import { Room } from "../../models/room";

export class StudentMenuView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    UserService.get().localUser.addListener(() => {
      initDataTips(this.renderRoot);
    });
    ClassroomService.get().classroom.addListener(() => {
      this.requestUpdate();
    });
    RoomService.get().rooms.forEach((room) =>
      room.addListener(() => {
        this.requestUpdate();
      })
    );
    initDataTips(this.renderRoot);
  }

  update(changedProperties) {
    super.update(changedProperties);
    initDataTips(this.renderRoot);
  }

  render = () => html`
    <div class="cc-controls-row-container">
      <div class="cc-controls-row">
        <cc-room-select roomId="${this.roomId}"></cc-room-select>
        <div
          class="grow bg2"
          data-tip="Rename"
          @click="${() => {
            this.#renameRoom();
          }}"
        >
          <cc-icon svg="${iconSvg.rename}"></cc-icon>
        </div>
      </div>
      <div class="cc-controls-row">
        <div data-tip="New Sketch" class="bg2">
          <cc-new-sketch roomId="${this.roomId}"></cc-new-sketch>
        </div>
        <div data-tip="Export Code" class="bg2">
          <cc-export-code roomId="${this.roomId}"></cc-export-code>
        </div>
        ${this.#renderRoomClaim()}
      </div>
    </div>
  `;

  #renderRoomClaim = () => {
    if (!ClassroomService.get().classroom.roomLocks) return "";

    if (RoomService.get().getRoom(this.roomId).ownerId) {
      if (RoomService.get().getRoom(this.roomId).isOwnedByLocalUser()) {
        return this.#renderClaimedRoomByYou();
      }
      return this.#renderClaimedBySomeoneElse();
    }

    return this.#renderUnclaimedRoom();
  };

  #renderClaimedRoomByYou = () => {
    return html`
      <div
        class="bg2"
        data-tip="You locked this room"
        @click="${() => {
          RoomService.get().getRoom(this.roomId).removeClaim();
        }}"
      >
        <cc-icon svg="${iconSvg.unlock}"></cc-icon>
      </div>
    `;
  };

  #renderClaimedBySomeoneElse() {
    if (
      RoomService.get()
        .getRoom(this.roomId)
        .isWriter(UserService.get().localUser.id)
    ) {
      return html`
        <div class="bg2" data-tip="You have write access">
          <cc-icon svg="${iconSvg.lock}"></cc-icon>
        </div>
      `;
    }
    return html`
      <div class="bg2" data-tip="You have no write access">
        <cc-icon svg="${iconSvg.lock}"></cc-icon>
      </div>
    `;
  }

  #renderUnclaimedRoom = () => {
    return html`
      <div
        class="bg2"
        data-tip="Lock room"
        @click="${() => {
          RoomService.get().getRoom(this.roomId).claimRoomToLocalUser();
        }}"
      >
        <cc-icon svg="${iconSvg.lock}"></cc-icon>
      </div>
    `;
  };

  #renameRoom = () => {
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
        room.roomName = nameInput.value;
      },
      () => {
        let nameInput = document.getElementById("roomname");
        nameInput.select();
      }
    );
  };

  static styles = [
    menuRowStyles(),
    basicFlexStyles(),
    toolTipStyle(),
    pulseStyle(),
    css`
      .access {
        background-color: #5ffa67;
      }

      .no-access {
        background-color: #fa5f5f;
      }
    `,
  ];
}

safeRegister("cc-student-menu-view", StudentMenuView);
