import { css, html, LitElement } from "lit";
import { version } from "process";
import { initDataTips } from "../../util/tooltips";
import { showAbout } from "../modals/about-modal";
import { iconSvg } from "../icons/icons";
import { UserService } from "../../services/user-service";
import { TeacherMenuView } from "./teacher-menu-view";
import { safeRegister } from "../../util/util";
import {
  cursorTipStyle,
  menuRowStyles,
  toolTipStyle,
} from "../../util/shared-css";
import { sendBroadCastMessage } from "../modals/broad-cast-modal";

export class GalleryModeMenuView extends LitElement {
  static properties = {
    roomId: { type: String },
    settingsOpen: { type: Boolean, state: true },
  };

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    initDataTips(this.renderRoot);
  }

  render() {
    return html` <div class="cc-controls-row-container">
      <div class="cc-controls-row">
        <div
          class="cc-header-title help"
          data-tip="Cocoding Classroom ${version}"
          @click="${() => {
            showAbout();
          }}"
        >
          COCODING Classroom II
        </div>
        <div
          class="help"
          @click="${() => {
            showAbout();
          }}"
          data-tip="About"
        >
          <cc-icon svg="${iconSvg.about}"></cc-icon>
        </div>
        ${this.#renderSettings()}
      </div>
      ${this.settingsOpen ? html` <cc-settings></cc-settings>` : ""}
      <div class="cc-controls-row">
        <cc-room-select roomId="${this.roomId}"></cc-room-select>
      </div>
      <div class="cc-controls-row">${this.#renderTeacherActions()}</div>
    </div>`;
  }

  #renderSettings = () => {
    return html` <div
      class="cc-nav-settings"
      @click="${() => {
        this.settingsOpen = !this.settingsOpen;
        initDataTips(this.renderRoot);
      }}"
      data-tip="Settings"
    >
      <cc-icon svg="${iconSvg.settings}" }></cc-icon>
    </div>`;
  };

  static styles = [
    css`
      .cc-controls-row div.cc-header-title {
        font-size: 10pt;
        min-width: calc(100% - 60px);
        padding: 4px;
        background: #666;
        cursor: help;
        border-bottom: 1px solid #aaa;
      }

      .help {
        border-bottom: 1px solid #aaa !important;
      }
    `,
    menuRowStyles(),
    cursorTipStyle(),
    toolTipStyle(),
  ];

  #renderTeacherActions() {
    return html` <div data-tip="Walk rooms">
        <cc-walk-room roomId="${this.roomId}"></cc-walk-room>
      </div>
      <div
        data-tip="Send message to all students"
        @click="${() => {
          sendBroadCastMessage();
        }}"
      >
        <cc-icon svg="${iconSvg.message}"></cc-icon>
      </div>
      ${this.#renderStudentActions()}`;
  }

  #renderStudentActions() {
    return html` <div data-tip="Export Code">
      <cc-export-code roomId="${this.roomId}"></cc-export-code>
    </div>`;
  }
}

safeRegister("cc-gallery-menu-view", GalleryModeMenuView);
