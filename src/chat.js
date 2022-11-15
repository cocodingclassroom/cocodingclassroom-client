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
    chatElement;
    chatLogElement;
    chatHeaderElement;

    //members
    chatLog;

    constructor(mode, roomId, ydoc, provider, room) {
        this.roomId = roomId;
        this.room = room;
        this.ydoc = ydoc;

        this.provider = provider;
        this.mode = mode
        this.chatID = `chat_${roomId}-${this.mode}`//"chat_" + this.editor.id + mode

        this.chatLog = ydoc.getArray(this.chatID)
        this.registerChatLogObserver();
    }

    getElement = () => {
        this.chatLog = this.ydoc.getArray(this.chatID)
        this.renderChat();
        this.renderChatLog();
        return this.chatElement;
    }

    registerChatLogObserver() {
        let _chatLogObserver = (e, t) => {
            // if (e.target === this.chatLog)  // => true
            this.renderChatLog()
        }
        this.chatLog.observe(_chatLogObserver)
    }

    renderChat() {
        this.chatElement = document.createElement('div');
        this.chatElement.className = 'cc-chat';

        this.chatHeaderElement = document.createElement('div');
        this.chatHeaderElement.classes = 'cc-chat-header';

        this.chatLogElement = document.createElement('div');
        this.chatLogElement.classes = 'cc-chat-log';

        this.chatInputElement = document.createElement('input');
        this.chatInputElement.classes = 'cc-chat-input';
        this.chatInputElement.placeholder = 'chat...';

        // chat trash
        this.chatTrashElement = document.createElement('div');
        this.chatTrashElement.classes = 'cc-chat-trash';
        let chatTrashHTML = ''

        //add clear chat, if logged-in user is admin
        if (this.mode === 'edit' || cc.admins().includes(cc.p.token)) {
            chatTrashHTML = `<div class="cc-chat-trash" data-tip="Clear Chat">${cc.icons.trash}</div>`
            if ((this.roomId === 0 && !cc.admins().includes(cc.p.token)) || (cc.y.settings.get('roomLocks') && this.room.locked && !this.room.admin.includes(cc.p.token))) {
                chatTrashHTML = ``
            }
        }
        this.chatTrashElement.innerHTML = chatTrashHTML;

        if (((this.mode === 'edit' && this.roomId !== 0) || cc.admins().includes(cc.p.token))) {
            this.chatTrashElement.addEventListener('mousedown', (event) => {
                this.clearChat()
            })
        }

        // chat container
        this.chatHeaderElement.appendChild(this.chatTrashElement);
        this.chatElement.appendChild(this.chatHeaderElement);
        this.chatElement.appendChild(this.chatLogElement);
        this.chatElement.appendChild(this.chatInputElement);

        this.chatInputElement.addEventListener('keyup', (event) => {
            if (event.code === "Enter") {
                let message = this.chatInputElement.value;
                if (message.length > 0) {
                    this.sendMessage(this.chatInputElement.value)
                    this.chatInputElement.value = '';
                }
            }
        })
    }

    renderChatLog() {
        //this.meta.classList.add('cc-meta-visible')
        let chatHTML = []
        if (this.chatLog)
            this.chatLog.forEach(e => {
                //make urls into urls
                let urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                let messages = e.msg.replace(urlRegex, function (url) {
                    return '<a class="cc-chat-log-link" href="' + url + '" target="_blank">' + url + '</a>';
                })

                // invert name color if light/dark background
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

        this.chatLogElement.innerHTML = chatHTML.join('')

        setTimeout(() => {
            this.chatLogElement.scrollTop = this.chatLogElement.scrollHeight
        }, 10)

        // setTimeout(() => {
        //     this.meta.classList.remove('cc-meta-visible')
        // }, 1000)
    }

    sendMessage(text) {
        let userSelf = this.provider.awareness.getLocalState().user
        // console.log(this.room, userSelf, elm.value)
        this.chatLog.push([{room: this.room, name: userSelf.name, color: userSelf.color, msg: text}])
    }

    clearChat() {
        // let confirmClear = confirm('Clear chat for this room?')
        // if(confirmClear){
        // 	this.chatLog.delete(0, this.chatLog.length) // purge chat
        // }
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