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
          <div data-tip="New Sketch">
            <cc-new-sketch roomId="${this.roomId}"></cc-new-sketch>
          </div>
          <div data-tip="Push code to all rooms">
            <cc-sync-code roomId="${this.roomId}"></cc-sync-code>
          </div>
          <div data-tip="Export Code">
            <cc-export-code roomId="${this.roomId}"></cc-export-code>
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
