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
    initDataTips(this.renderRoot);
    UserService.get().localUser.addListener(() => {
      initDataTips(this.renderRoot);
    });
    ClassroomService.get().classroom.addListener(() => {
      this.requestUpdate();
    });
    RoomService.get()
      .getRoom(this.roomId)
      .addListener(() => {
        this.requestUpdate();
      });
  }

  render = () => html`
    <div class="cc-controls-row-container">
      <div class="cc-controls-row">
        <cc-room-select roomId="${this.roomId}"></cc-room-select>
        <div
          class="grow bg2"
          data-tip="Rename"
          @click="${() => {
            this.renameRoom();
          }}"
        >
          <cc-icon svg="${iconSvg.rename}"></cc-icon>
        </div>
      </div>
      <div class="cc-controls-row" >
        <div data-tip="New Sketch" class="bg2">
          <cc-new-sketch roomId="${this.roomId}"></cc-new-sketch>
        </div>
        <div data-tip="Export Code" class="bg2">
          <cc-export-code roomId="${this.roomId}"></cc-export-code>
        </div>
      </div>
      ${this.#renderRoomClaim()}
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
      <div class="cc-controls-row">
        <div
          class="row access bg1"
          @click="${() => {
            RoomService.get().getRoom(this.roomId).removeClaim();
          }}"
        >
          <cc-icon svg="${iconSvg.unlock}"></cc-icon>
          <div class="grow">
            Claimed by
            ${RoomService.get().getRoom(this.roomId).getOwnerAsUser().name}
          </div>
        </div>
      </div>
      ${RoomService.get()
        .getRoom(this.roomId)
        .requestIds.map((requestId) => {
          return html`
            <div
              class="cc-controls-row"
              @click="${() => {
                RoomService.get().getRoom(this.roomId).giveAccess(requestId);
              }}"
            >
              <div  class="bg1">
                ${UserService.get().getUserByID(requestId).name} wants access
              </div>
            </div>
          `;
        })}
    `;
  };

  #renderClaimedBySomeoneElse() {
    if (
      RoomService.get()
        .getRoom(this.roomId)
        .isWriter(UserService.get().localUser.id)
    ) {
      return html`
        <div class="cc-controls-row">
          <div
            class="row no-access bg1"
            data-tip="Remove own Access"
            @click="${() => {
              RoomService.get()
                .getRoom(this.roomId)
                .removeAccess(UserService.get().localUser.id);
            }}"
          >
            <cc-icon class="no-access" svg="${iconSvg.lock}"></cc-icon>
            <div class="grow no-access">Has Access</div>
          </div>
        </div>
      `;
    }
    if (RoomService.get().getRoom(this.roomId).isRequesting()) {
      return html`
        <div class="cc-controls-row">
          <div
            class="row no-access pulse-on bg1"
            @click="${() => {
              RoomService.get()
                .getRoom(this.roomId)
                .stopRequestAccess(UserService.get().localUser.id);
            }}"
          >
            <cc-icon class="no-access" svg="${iconSvg.lock}"></cc-icon>
            <div class="grow no-access">Stop requesting Access</div>
          </div>
        </div>
      `;
    }
    return html`
      <div class="cc-controls-row">
        <div
          class="row no-access bg1"
          @click="${() => {
            RoomService.get().getRoom(this.roomId).requestAccess();
          }}"
        >
          <cc-icon class="no-access" svg="${iconSvg.lock}"></cc-icon>
          <div class="grow no-access">Request Access</div>
        </div>
      </div>
    `;
  }

  #renderUnclaimedRoom = () => {
    return html`
      <div class="cc-controls-row">
        <div
          class="row bg1"
          @click="${() => {
            RoomService.get().getRoom(this.roomId).claimRoomToLocalUser();
          }}"
        >
          <cc-icon svg="${iconSvg.lock}"></cc-icon>
          <div class="grow">Claim this room</div>
        </div>
      </div>
    `;
  };

  renameRoom = () => {
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
