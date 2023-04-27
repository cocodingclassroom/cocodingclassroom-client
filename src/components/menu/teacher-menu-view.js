import { css, html, LitElement } from "lit";
import {
  cursorTipStyle,
  menuRowStyles,
  toolTipStyle
} from "../../util/shared-css";
import { initDataTips } from "../../util/tooltips";
import { version } from "../../version";
import { iconSvg } from "../icons/icons";
import { UserService } from "../../services/user-service";
import { RoomService } from "../../services/room-service";
import { safeRegister } from "../../util/util";
import { showModal } from "../../util/modal";
import { ChatMessage } from "../../models/chat-message";
import md from "../../../README.md";
import showdown from "showdown";

export class TeacherMenuView extends LitElement {
  static properties = {
    roomId: { type: String }
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
            @click="${() => {
              this._showAbout();
            }}"
          >
            COCODING Classroom
          </div>
          <div class="help" @click="${() => {
          }}" data-tip="About">
            <cc-icon svg="${iconSvg.about}"></cc-icon>
          </div>
          <div class="cc-nav-settings" @click="${() => {
          }}" data-tip="Settings">
            <cc-icon svg="${iconSvg.settings}" }></cc-icon>
          </div>
        </div>
        ${
          UserService.get().localUser.isTeacher()
            ? this._renderActionsForTeacher()
            : html`
              <div class="cc-controls-row">
                ${this._renderActionsForStudents()}
              </div>`
        }
      </div>
      </div>
    `;
  };

  _renderActionsForTeacher = () => {
    return html`
      <div class="cc-controls-row">
        <div data-tip="New Sketch">
          <cc-new-sketch roomId="${this.roomId}"></cc-new-sketch>
        </div>
        <div data-tip="Push code to all rooms">
          <cc-sync-code roomId="${this.roomId}"></cc-sync-code>
        </div>
        ${this._renderActionsForStudents()}
      </div>
      <div class="cc-controls-row">
        <div data-tip="Add room" @click="${() => this._addRoom()}">
          <cc-icon svg="${iconSvg.layers}"></cc-icon>
        </div>
        <div data-tip="Walk rooms">
          <cc-walk-room roomId="${this.roomId}"></cc-walk-room>
        </div>
        <div data-tip="Send message to all rooms" @click="${() => {
          this._sendMessageToAll();
        }}">
          <cc-icon svg="${iconSvg.message}"></cc-icon>
        </div>
        <div
          data-tip="Force split-view to all Students"
          @click="${() => this._forceSplitView()}"
        >
          <cc-icon svg="${iconSvg.layout}"></cc-icon>
        </div>
      </div>
    `;
  };

  _renderActionsForStudents = () => {
    return html`
      <div data-tip="Export Code">
        <cc-export-code roomId="${this.roomId}"></cc-export-code>
      </div>
      <div data-tip="Compare Code">
        <cc-icon svg="${iconSvg.merge}"></cc-icon>
      </div>
    `;
  };

  _showAbout = () => {
    let converter = new showdown.Converter();
    let html = converter.makeHtml(md);
    showModal(`
    <div>
    ${html}
    <div>
    `, () => {
    }, () => {
    });
  };

  _addRoom = () => {
    RoomService.get().addRoom();
  };

  _sendMessageToAll = () => {
    showModal(`
    <div>
     Send message to all rooms?
    </div>
    <div>
     <input id="to-all-message" type="text" placeholder="Send message to all ...">
    </div>
    `, () => {
      let messageContent = document.getElementById("to-all-message");
      if (messageContent.value.length === 0) return;
      let newMessage = new ChatMessage(UserService.get().localUser.id, messageContent.value);
      RoomService.get().rooms.forEach(room => {
        room.messages.push([JSON.stringify(newMessage)]);
      });
    }, () => {
      let messageContent = document.getElementById("to-all-message");
      messageContent.focus();
    });
  };

  _forceSplitView = () => {
    let localLeftSize = UserService.get().localUser.leftSize;
    UserService.get().otherUsers.forEach((otherUser) => {
      otherUser.leftSize = localLeftSize;
    });
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
    toolTipStyle()
  ];
}

safeRegister("cc-teacher-menu-view", TeacherMenuView);
