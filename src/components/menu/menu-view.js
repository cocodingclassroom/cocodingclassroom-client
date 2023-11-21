import { css, html, LitElement } from "lit";
import { RoomService } from "../../services/room-service";
import { UserService } from "../../services/user-service";
import { isColorLight, linkifyText, safeRegister } from "../../util/util";
import { iconSvg } from "../icons/icons";
import { ChatMessage } from "../../models/chat-message";
import {
    basicFlexStyles,
    cursorTipStyle,
    inputStyle,
    menuBackground1,
    menuBackground2,
    menuBorder2,
    menuForegroundDark,
    menuForegroundLight,
    menuRowStyles,
    pulseStyle,
    secondary,
    toolTipStyle,
} from "../../util/shared-css";
import { styleMap } from "lit/directives/style-map.js";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { Shortcut, ShortcutExtension } from "../../extensions/shortcut-extension";
import { initDataTips } from "../../util/tooltips";
import { ClassroomService } from "../../services/classroom-service";
import { clearChat } from "../modals/clear-chat-modal";
import { ClassroomMode } from "../../models/classroom-model";

export class MenuView extends LitElement {
    static properties = {
        roomId: { type: String },
    };

    connectedCallback() {
        UserService.get().localUser.addListener(() => {
            this.requestUpdate();
            initDataTips(this.renderRoot);
        });
        this.shortcutExtension = ShortcutExtension.get();
        this.shortcutExtension.addShortcuts(this.#shortCuts());

        UserService.get()
            .getAllUsers()
            .forEach((user) => {
                user.addListener(() => {
                    this.requestUpdate();
                    initDataTips(this.renderRoot);
                });
            });
        super.connectedCallback();
        RoomService.get().rooms.forEach((room) =>
            room.addListener(() => {
                this.requestUpdate();
                this.#scrollToBottom();
            })
        );
    }

    firstUpdated = (change) => {
        super.firstUpdated(change);
        initDataTips(this.renderRoot);
        this.#scrollToBottom();
    };

    update(changedProperties) {
        super.update(changedProperties);
        initDataTips(this.renderRoot);
        this.#scrollToBottom();
    }

    render = () => {
        let room = RoomService.get().getRoom(this.roomId);
        if (ClassroomService.get().isGalleryMode())
            return html`
        <div class="cc-meta">
          <cc-gallery-menu-view roomId="${room.id}"></cc-gallery-menu-view>
          <cc-user-list roomId="${room.id}"></cc-user-list>
          ${this.#renderChat()}
        </div>
      `;

        return html`
      <div class="cc-meta">
        ${room.isTeacherRoom()
                ? html` <cc-teacher-menu-view
              roomId="${room.id}"
            ></cc-teacher-menu-view>`
                : html` <cc-student-menu-view
              roomId="${room.id}"
            ></cc-student-menu-view>`}
        <cc-user-list roomId="${room.id}"></cc-user-list>
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
        ${this.#renderMessages()}
      </div>
      <div class="cc-controls-row" style="border-top-style:none;">
        <input
          id="chatInput"
          placeholder="Send message ..."
          class="chat-input grow input-slim"
          type="text"
          @keydown="${(event) => {
                this.#sendMessageIfEnter(event);
            }}"
        />
      </div>
    </div>`;
    };

    #renderMessages() {
        if (ClassroomService.get().classroom.mode === ClassroomMode.GALLERY) {
            return RoomService.get()
                .getRoom(this.roomId)
                .galleryMessages.toArray()
                .map((message) => this.#renderMessage(message));
        }
        return RoomService.get()
            .getRoom(this.roomId)
            .messages.toArray()
            .map((message) => this.#renderMessage(message));
    }

    #renderTrash = () => {
        let room = RoomService.get().getRoom(this.roomId);
        if (room.isTeacherRoom() && UserService.get().localUser.isStudent())
            return html``;

        return html` <div
      data-tip="Clear Chat"
      class="pointer pulse"
      @click="${() => clearChat(this.roomId)}"
    >
      <cc-icon class="grey-text" svg="${iconSvg.trash}"></cc-icon>
    </div>`;
    };

    #renderMessage = (message) => {
        let chatMessage = ChatMessage.fromJSON(message);
        let user = UserService.get().getUserByID(chatMessage.userid);
        let messageNameStyle = {
            "background-color": user.color,
            color: isColorLight(user.color)
                ? menuForegroundDark()
                : menuForegroundLight(),
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
        if (ClassroomService.get().classroom.mode === ClassroomMode.GALLERY) {
            RoomService.get()
                .getRoom(this.roomId)
                .galleryMessages.push([JSON.stringify(newMessage)]);
        } else {
            RoomService.get()
                .getRoom(this.roomId)
                .messages.push([JSON.stringify(newMessage)]);
        }
        messageContent.value = "";
    };

    #shortCuts = () => {
        return [
            ...Shortcut.fromPattern(
                "toggle menu",
                ["ctrl+m"],
                ["ctrl+m"],
                () => {
                    this.#toggleMenu();
                },
                () => {
                    return true;
                }
            ),
        ];
    };


    #toggleMenu = () => {
        const menus = this.renderRoot.querySelectorAll(".cc-meta");
        for (var i = 0; i < menus.length; i++) {
            menus[i].classList.toggle("cc-meta-hide");
        }
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
            z-index: 50;
            top: 6px;
            right: 15px;
            background: ${menuBackground2()};
            width: 220px;
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

        .cc-meta-hide {
            display:none;
        }

        .messages {
            overflow-y: scroll;
            min-height: 50px;
            max-height: 200px;
        }

        .chat-input {
            background-color: ${menuBackground1()};
            border: none;
            border-top: 1px solid ${menuBorder2()};
            padding: 4px 2px 4px 4px;
            font-size: 10pt;
            color: ${menuForegroundLight()};
        }

        .message {
            margin: 1px;
            background-color: ${menuBackground1()};
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
            background-color: ${menuBackground1()};
        }

        .chat-header {
            border-bottom: 1px solid ${menuBorder2()};
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
    `,
        menuRowStyles(),
        basicFlexStyles(),
        cursorTipStyle(),
        toolTipStyle(),
        pulseStyle(),
        inputStyle(),
    ];
}

safeRegister("cc-menu", MenuView);
