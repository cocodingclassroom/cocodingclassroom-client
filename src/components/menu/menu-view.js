import { css, html, LitElement } from "lit";
import { RoomService } from "../../services/room-service";
import { UserService } from "../../services/user-service";
import { isColorLight, linkifyText, safeRegister } from "../../util/util";
import { iconSvg } from "../icons/icons";
import { ChatMessage } from "../../models/chat-message";
import {
  basicFlexStyles,
  black,
  cursorTipStyle,
  menuRowStyles,
  pulseStyle,
  secondary,
  toolTipStyle,
  white,
} from "../../util/shared-css";
import { styleMap } from "lit/directives/style-map.js";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { initDataTips } from "../../util/tooltips";
import { showModal } from "../../util/modal";
import { ClassroomService } from "../../services/classroom-service";
import { ClassroomMode } from "../../models/classroom-model";

export class MenuView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  room;

  connectedCallback() {
    this.room = RoomService.get().getRoom(this.roomId);
    UserService.get().localUser.addListener(() => {
      this.requestUpdate();
      initDataTips(this.renderRoot);
    });
    UserService.get()
      .getAllUsers()
      .forEach((user) => {
        user.addListener(() => {
          this.requestUpdate();
          initDataTips(this.renderRoot);
        });
      });
    super.connectedCallback();
    RoomService.get()
      .getRoom(this.roomId)
      .addListener(() => {
        this.requestUpdate();
        this.#scrollToBottom();
      });
  }

  firstUpdated = (change) => {
    super.firstUpdated(change);
    initDataTips(this.renderRoot);
    this.#scrollToBottom();
  };

  render = () => {
    if (ClassroomService.get().isGalleryMode())
      return html`
        <div class="cc-meta">
          <cc-gallery-menu-view roomId="${this.room.id}"></cc-gallery-menu-view>
          <cc-user-list roomId="${this.room.id}"></cc-user-list>
          ${this.#renderChat()}
        </div>
      `;

    return html`
      <div class="cc-meta">
        ${this.room.isTeacherRoom()
          ? html` <cc-teacher-menu-view
              roomId="${this.room.id}"
            ></cc-teacher-menu-view>`
          : html` <cc-student-menu-view
              roomId="${this.room.id}"
            ></cc-student-menu-view>`}
        <cc-user-list roomId="${this.room.id}"></cc-user-list>
        ${this.#renderChat()}
      </div>
    `;
  };

  #renderChat = () => {
    return html` <div class="border-left-right background-dark">
      <div class="row chat-header">
        <div class="grow grey-text">CHAT</div>
        ${this.#renderTrash()}
      </div>
      <div id="message_container" class="messages">
        ${RoomService.get()
          .getRoom(this.roomId)
          .messages.toArray()
          .map((message) => this.#renderMessage(message))}
      </div>
      <div class="cc-controls-row">
        <input
          id="chatInput"
          placeholder="Send message ..."
          class="chat-input grow"
          type="text"
          @keydown="${(event) => {
            this.#sendMessageIfEnter(event);
          }}"
        />
      </div>
    </div>`;
  };

  #renderTrash = () => {
    if (this.room.isTeacherRoom() && UserService.get().localUser.isStudent())
      return html``;

    return html` <div
      data-tip="Clear Chat"
      class="pointer pulse"
      @click="${() => this.#clearChat()}"
    >
      <cc-icon class="grey-text" svg="${iconSvg.trash}"></cc-icon>
    </div>`;
  };

  #renderMessage = (message) => {
    let chatMessage = ChatMessage.fromJSON(message);
    var user = UserService.get().getUserByID(chatMessage.userid);
    let messageNameStyle = {
      "background-color": user.color,
      color: isColorLight(user.color) ? black() : white(),
    };
    return html` <div class="message row">
      <div class="message-name" style="${styleMap(messageNameStyle)}">
        ${user.name.substring(0, 10)}
      </div>
      <div class="message-text grow">
        ${unsafeHTML(linkifyText(chatMessage.text))}
      </div>
    </div>`;
  };

  #sendMessageIfEnter = (event) => {
    if (event.key === "Enter") {
      this.#sendNewMessageToChat();
      this.#scrollToBottom();
    }
  };

  #sendNewMessageToChat = () => {
    let messageContent = this.renderRoot.getElementById("chatInput");
    if (messageContent.value.length === 0) return;
    let newMessage = new ChatMessage(
      UserService.get().localUser.id,
      messageContent.value
    );
    RoomService.get()
      .getRoom(this.roomId)
      .messages.push([JSON.stringify(newMessage)]);
    messageContent.value = "";
  };

  #clearChat = () => {
    showModal(
      `
        <div>
         Clear chat for this room?
        </div>
    `,
      () => {
        let messages = RoomService.get().getRoom(this.roomId).messages;
        messages.delete(0, messages.length);
      },
      () => {}
    );
  };

  #scrollToBottom() {
    setTimeout(() => {
      let scrollable = this.renderRoot.getElementById("message_container");
      scrollable.scrollTop = scrollable.scrollHeight;
    }, 20);
  }

  static styles = [
    css`
      .cc-meta {
        position: absolute;
        z-index: 4;
        top: 6px;
        right: 15px;
        background: #333;
        width: 250px;
        height: auto;
        opacity: 0.3;
        transition: opacity 0.5s;
      }

      .cc-meta:hover {
        opacity: 1;
      }

      .cc-meta-visible {
        opacity: 1;
      }

      .messages {
        overflow-y: scroll;
        min-height: 50px;
        max-height: 200px;
      }

      .chat-input {
        background-color: #222;
        border: none;
        border-top: 1px solid #444;
        padding: 4px 2px 4px 4px;
        font-size: 10pt;
        color: ${white()}
      }


      .message {
        margin: 1px;
        background-color: #222;
        border: none;
        font-size: 10pt;
      }

      .message-name {
        margin-right: 5px;
      }

      .message-text {
        width: 60%;
        overflow-wrap: break-word;
      }

      .background-dark {
        background-color: #222;
      }

      .chat-header {
        border-bottom: 1px solid #444;
      }

      .chat-header div {
        padding: 3px;
      }

      .border-left-right {
        border-left: 1px solid #aaa;
        border-right: 1px solid #aaa;
      }

      .grey-text {
        font-size: 10pt;
        margin: auto;
        color: ${secondary()};
      }

      a {
        color: cornflowerblue;
      }

    ,
    `,
    menuRowStyles(),
    basicFlexStyles(),
    cursorTipStyle(),
    toolTipStyle(),
    pulseStyle(),
  ];
}

safeRegister("cc-menu", MenuView);
