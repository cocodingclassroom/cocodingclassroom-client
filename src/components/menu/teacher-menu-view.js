import { css, html, LitElement } from "lit";
import {
  cursorTipStyle,
  menuRowStyles,
  toolTipStyle,
} from "../../util/shared-css";
import { initDataTips } from "../../util/tooltips";
import { version } from "../../version";
import { iconSvg } from "../icons/icons";
import { UserService } from "../../services/user-service";
import { RoomService } from "../../services/room-service";
import { BindingService } from "../../services/binding-service";
import { showModal } from "../../util/modal";
import { Room } from "../../models/room";
import { ClassroomService } from "../../services/classroom-service";
import { safeRegister } from "../../util/util";

export class TeacherMenuView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    initDataTips(this.renderRoot);
    UserService.get().localUser.addListener(() => {
      initDataTips(this.renderRoot);
    });
  }

  render = () => {
    return html`
      <div class="cc-controls-row-container">
        <div class="cc-controls-row">
          <div
            class="cc-header-title help"
            data-tip="${version}"
            @click="${() => {}}"
          >
            COCODING Classroom
          </div>

          <div class="help" @click="${() => {}}" data-tip="About">
            <cc-icon svg="${iconSvg.about}"></cc-icon>
          </div>
          <div class="cc-nav-settings" @click="${() => {}}" data-tip="Settings">
            <cc-icon svg="${iconSvg.settings}" }></cc-icon>
          </div>
        </div>
        <div class="cc-controls-row">
          <div data-tip="New Sketch" @click="${() => this.setNewSketch()}">
            <cc-icon svg="${iconSvg.new}"></cc-icon>
          </div>
          <div
            data-tip="Push code to all rooms"
            @click="${() => this.syncCode()}"
          >
            <cc-icon svg="${iconSvg.code}"></cc-icon>
          </div>
          <div data-tip="Export Code">
            <cc-icon svg="${iconSvg.save}"></cc-icon>
          </div>
          <div data-tip="Compare Code">
            <cc-icon svg="${iconSvg.merge}"></cc-icon>
          </div>
        </div>
        <div class="cc-controls-row">
          <div data-tip="Add room" @click="${() => this.addRoom()}">
            <cc-icon svg="${iconSvg.layers}"></cc-icon>
          </div>
          <div data-tip="Walk rooms">
            <cc-icon svg="${iconSvg.person}"></cc-icon>
          </div>
          <div data-tip="Send message to all rooms">
            <cc-icon svg="${iconSvg.message}"></cc-icon>
          </div>
          <div data-tip="Force split-view to all Students">
            <cc-icon svg="${iconSvg.layout}"></cc-icon>
          </div>
        </div>
      </div>
    `;
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
      },
      () => {}
    );
  };

  syncCode = () => {
    showModal(
      `
        <div>
          Push this rooms code to all rooms?
        </div>
      `,
      () => {
        let room = RoomService.get().getRoom(this.roomId);
        let template = room.codeContent.toString();
        RoomService.get().rooms.forEach((otherRoom) => {
          if (otherRoom === room) return;

          otherRoom.codeContent.delete(0, otherRoom.codeContent.length);
          otherRoom.codeContent.insert(0, template);
        });
      },
      () => {}
    );
  };

  addRoom = () => {
    RoomService.get().addRoom();
  };

  static styles = [
    css`
      .cc-header-title {
        font-size: 10pt;
        min-width: calc(100% - 60px);
      }
    `,
    menuRowStyles(),
    cursorTipStyle(),
    toolTipStyle(),
  ];
}

safeRegister("cc-teacher-menu-view", TeacherMenuView);
