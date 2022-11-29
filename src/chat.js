import {wc_hex_is_light} from "./utils";

export class Chat {

    //inputs
    provider;
    mode;
    chatID;
    roomId;
    room;
    ydoc;

    //html
    rootElement;

    //members
    chatLog;
    chatLogObserver;

    constructor(room) {
        this.roomId = room.roomId;
        this.room = room;
        this.ydoc = room.ydoc;
        this.provider = room.provider;
        this.mode = room.mode;
        this.chatID = `chat_${this.roomId}-${this.mode}`
        this.chatLog = this.ydoc.getArray(this.chatID);
    }

    getRootElement = () => {
        this.chatLog = this.ydoc.getArray(this.chatID)
        this.rootElement = this.render();
        return this.rootElement;
    }

    render() {
        let rootElement = this.renderRootElement();
        let chatHeaderElement = this.renderChatHeader();
        let chatLogElement = this.renderChatLogElement();
        let chatInputElement = this.renderChatInputElement();
        let chatTrashElement = this.renderChatTrashElement();

        chatHeaderElement.appendChild(chatTrashElement);
        rootElement.appendChild(chatHeaderElement);
        rootElement.appendChild(chatLogElement);
        rootElement.appendChild(chatInputElement);

        this.renderChatLog(chatLogElement);
        this.addChatLogObserver(chatLogElement);
        return rootElement;
    }

    destroy = () => {
        this.chatLog.unobserve(this.chatLogObserver)
    }

    renderChatTrashElement = () => {
        let chatTrashElement = document.createElement('div');
        chatTrashElement.classes = 'cc-chat-trash';
        let chatTrashHTML = ''

        if (this.mode === 'edit' || cc.admins().includes(cc.p.token)) {
            chatTrashHTML = `<div class="cc-chat-trash" data-tip="Clear Chat">${cc.icons.trash}</div>`
            if ((this.roomId === 0 && !cc.admins().includes(cc.p.token)) || (cc.y.settings.get('roomLocks') && this.room.locked && !this.room.admin.includes(cc.p.token))) {
                chatTrashHTML = ``
            }
        }
        chatTrashElement.innerHTML = chatTrashHTML;

        if (((this.mode === 'edit' && this.roomId !== 0) || cc.admins().includes(cc.p.token))) {
            chatTrashElement.addEventListener('mousedown', (event) => {
                this.clearChat()
            })
        }

        return chatTrashElement;
    }

    renderChatInputElement() {
        let chatInputElement = document.createElement('input');
        chatInputElement.classes = 'cc-chat-input';
        chatInputElement.placeholder = 'chat...';

        chatInputElement.addEventListener('keyup', (event) => {
            if (event.code === "Enter") {
                let message = chatInputElement.value;
                if (message.length > 0) {
                    this.sendMessage(chatInputElement.value)
                    chatInputElement.value = '';
                }
            }
        })

        return chatInputElement;
    }

    addChatLogObserver(chatLogElement) {
        this.chatLogObserver = () => {
            // if (e.target === this.chatLog)  // => true
            this.renderChatLog(chatLogElement)
        }

        this.chatLog.observe(this.chatLogObserver)
    }

    renderChatLogElement() {
        let chatLogElement = document.createElement('div');
        chatLogElement.classes = 'cc-chat-log';
        return chatLogElement;
    }

    renderChatHeader() {
        let chatHeaderElement = document.createElement('div');
        chatHeaderElement.classes = 'cc-chat-header';
        return chatHeaderElement;
    }

    renderRootElement() {
        let rootElement = document.createElement('div');
        rootElement.className = 'cc-chat';
        return rootElement;
    }

    renderChatLog(chatLogElement) {
        //this.meta.classList.add('cc-meta-visible')
        let chatHTML = []
        if (this.chatLog)
            this.chatLog.forEach(e => {
                //make urls into urls
                let urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                let messages = e.msg.replace(urlRegex, function (url) {
                    return '<a class="cc-chat-log-link" href="' + url + '" target="_blank">' + url + '</a>';
                })

                let userNameColor = 'color-light'
                if (wc_hex_is_light(e.color)) {
                    userNameColor = 'color-dark'
                }

                chatHTML.push(
                    `<div>
                    <span class="${userNameColor}" style="background:${e.color};">
                        ${e.name.substring(0, 10)}</span>
                    <span class="color-light">${messages}</span>
                </div>`
                )
            })

        chatLogElement.innerHTML = chatHTML.join('')
        chatLogElement.scrollTop = chatLogElement.scrollHeight
    }

    sendMessage(text) {
        let userSelf = this.provider.awareness.getLocalState().user
        this.chatLog.push([{room: this.room, name: userSelf.name, color: userSelf.color, msg: text}])
    }

    clearChat() {
        vex.dialog.confirm({
            unsafeMessage: 'Clear chat for this room?',
            callback: function (value) {
                if (value) {
                    this.chatLog.delete(0, this.chatLog.length) // purge chat
                }
            }.bind(this),
            afterOpen: function () {
                cc.vexSmall(this.rootEl);
                cc.vexFocus()
            }
        })
    }
}