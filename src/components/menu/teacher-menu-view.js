import { css, html, LitElement } from "lit";
import {
  cursorTipStyle,
  menuBackground3,
  menuBorder1,
  menuRowStyles,
  toolTipStyle,
} from "../../util/shared-css";
import { initDataTips } from "../../util/tooltips";
import { version } from "../../version";
import { iconSvg } from "../icons/icons";
import { UserService } from "../../services/user-service";
import { RoomService } from "../../services/room-service";
import { safeRegister } from "../../util/util";
import {
  NotifyService,
  Notification,
  NotificationType,
} from "../../services/notify-service";
import {
  sendBroadCastMessage,
  showBroadcastViewModal,
} from "../modals/broad-cast-modal";
import { forceSplitView } from "../modals/split-view-modal";
import { showAbout } from "../modals/about-modal";

export class TeacherMenuView extends LitElement {
  static properties = {
    roomId: { type: String },
    settingsOpen: { type: Boolean, state: true },
  };

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    initDataTips(this.renderRoot);
    UserService.get().localUser.addListener(() => {
      initDataTips(this.renderRoot);
    });
    NotifyService.get().addListener((notification) => {
      if (notification.type !== NotificationType.BROADCAST) return;
      if (!Notification.isSentByMe(notification)) {
        showBroadcastViewModal(notification.message);
      }
    });
  }

  render = () => {
    return html`
      <div class="cc-controls-row-container">
        <div class="cc-controls-row bg3">
          <div
            class="cc-header-title help"
            data-tip="Cocoding Classroom ${version}"
            @click="${() => {
              showAbout();
            }}"
          >
            COCODING Classroom
          </div>
          <div
            class="help bg3"
            @click="${() => {
              showAbout();
            }}"
            data-tip="About"
          >
            <cc-icon svg="${iconSvg.about}"></cc-icon>
          </div>
          <div
            class="cc-nav-settings ${this.settingsOpen ? 'bg3 active' : 'bg3 help'}"
            @click="${() => {
              this.settingsOpen = !this.settingsOpen;
              initDataTips(this.renderRoot);
            }}"
            data-tip="Settings"
          >
            <cc-icon svg="${iconSvg.settings}" }></cc-icon>
          </div>
        </div>
        ${this.settingsOpen ? html` <cc-settings></cc-settings>` : ""}
        ${UserService.get().localUser.isTeacher()
          ? this._renderActionsForTeacher()
          : html` <div class="cc-controls-row">
              ${this._renderActionsForStudents()}
            </div>`}
      </div>
    `;
  };

  _renderActionsForTeacher = () => {
    return html`
      <div class="cc-controls-row">
        <div data-tip="New Sketch" class="bg2">
          <cc-new-sketch roomId="${this.roomId}"></cc-new-sketch>
        </div>
        <div data-tip="Push code to all rooms"  class="bg2">
          <cc-sync-code roomId="${this.roomId}"></cc-sync-code>
        </div>
        ${this._renderActionsForStudents()}
      </div>
      <div class="cc-controls-row">
        <div data-tip="Add room" @click="${() => this._addRoom()}"  class="bg2">
          <cc-icon svg="${iconSvg.layers}"></cc-icon>
        </div>
        <div data-tip="Walk rooms" class="bg2">
          <cc-walk-room roomId="${this.roomId}"></cc-walk-room>
        </div>
        <div
          data-tip="Send message to all students" 
          class="bg2"
          @click="${() => {
            sendBroadCastMessage();
          }}"
        >
          <cc-icon svg="${iconSvg.message}"></cc-icon>
        </div>
        <div
          data-tip="Set split screen"
          @click="${() => forceSplitView()}"
          class="bg2"
        >
          <cc-icon svg="${iconSvg.layout}"></cc-icon>
        </div>
      </div>
    `;
  };

  _renderActionsForStudents = () => {
    return html`
      <div data-tip="Export Code" class="bg2">
        <cc-export-code roomId="${this.roomId}"></cc-export-code>
      </div>
      <div data-tip="Compare Code" class="bg2">
        <cc-icon svg="${iconSvg.merge}"></cc-icon>
      </div>
    `;
  };

  _addRoom = () => {
    RoomService.get().addRoom();
  };

  static styles = [
    css`
      .cc-controls-row div.cc-header-title {
        font-size: 10pt;
        min-width: calc(100% - 60px);
        padding: 4px;
        background: ${menuBackground3()};
        cursor: help;
        margin-bottom: -1px;
        border-bottom: 1px solid ${menuBorder1()};
      }

      .help {
        border-bottom: 1px solid ${menuBorder1()} !important;
        margin-bottom: -1px;
      }
    `,
    menuRowStyles(),
    cursorTipStyle(),
    toolTipStyle(),
  ];
}

safeRegister("cc-teacher-menu-view", TeacherMenuView);
