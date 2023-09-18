import { css, html, LitElement } from "lit";
import {
  basicFlexStyles,
  menuRowStyles,
  pulseStyle,
  toolTipStyle,
} from "../../util/shared-css";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";
import { RoomService } from "../../services/room-service";
import { initDataTips } from "../../util/tooltips";
import { UserService } from "../../services/user-service";
import { ClassroomService } from "../../services/classroom-service";
import { renameRoom } from "../modals/rename-room-modal";

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
    <div class="cc-controls-row">
      <div class="grow bg2">
        <cc-room-select roomId="${this.roomId}"></cc-room-select>
      </div>

      ${this.#renderRoomRename()} ${this.#renderRoomClaim()}
    </div>
    <div class="cc-controls-row">
      <div data-tip="New Sketch" class="bg2">
        <cc-new-sketch roomId="${this.roomId}"></cc-new-sketch>
      </div>
      <div data-tip="Export Code" class="bg2">
        <cc-export-code roomId="${this.roomId}"></cc-export-code>
      </div>
    </div>
  `;

  #renderRoomRename = () => {
    if (RoomService.get().getRoom(this.roomId).isLobby()) return "";
    return html` <div
      class="grow bg2"
      data-tip="Rename"
      @click="${() => {
        renameRoom(this.roomId);
      }}"
    >
      <cc-icon svg="${iconSvg.rename}"></cc-icon>
    </div>`;
  };

  #renderRoomClaim = () => {
    let room = RoomService.get().getRoom(this.roomId);
    if (!ClassroomService.get().classroom.roomLocks) return "";
    if (room.isLobby() && UserService.get().localUser.isStudent()) return "";

    if (room.isClaimed()) {
      if (
        room.isOwnedByLocalUser() ||
        UserService.get().localUser.isTeacher()
      ) {
        return this.#renderOwnedUnlockableByThisUser();
      }
      return this.#renderOwnedButNotUnlockableByThisUser();
    }

    return this.#renderNotOwned();
  };

  #renderOwnedUnlockableByThisUser = () => {
    return html`
      <div
        class="highlight"
        data-tip="Free room"
        @click="${() => {
          RoomService.get().getRoom(this.roomId).removeClaim();
        }}"
      >
        <cc-icon svg="${iconSvg.lock}"></cc-icon>
      </div>
    `;
  };

  #renderOwnedButNotUnlockableByThisUser() {
    return html`
      <div
        class="disabled"
        data-tip="${RoomService.get()
          .getRoom(this.roomId)
          .getOwnerAsUser()
          .getNameShortened()} locked room"
      >
        <cc-icon svg="${iconSvg.lock}"></cc-icon>
      </div>
    `;
  }

  #renderNotOwned = () => {
    if (!UserService.get().localUser.canClaimRoom()) {
      return html` <div class="disabled" data-tip="You own another room">
        <cc-icon svg="${iconSvg.unlock}"></cc-icon>
      </div>`;
    }

    return html`
      <div
        class="bg2"
        data-tip="Lock room"
        @click="${() => {
          RoomService.get().getRoom(this.roomId).claimRoomToLocalUser();
        }}"
      >
        <cc-icon svg="${iconSvg.unlock}"></cc-icon>
      </div>
    `;
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

      .red-background {
        background-color: #6e0909;
      }
    `,
  ];
}

safeRegister("cc-student-menu-view", StudentMenuView);
