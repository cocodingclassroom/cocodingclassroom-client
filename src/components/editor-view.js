import { css, html, LitElement } from 'lit'
import * as ace from 'ace-builds'
import 'ace-builds/src-noconflict/theme-cobalt'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/ext-language_tools'
import { styleMap } from 'lit/directives/style-map.js'
import { RoomService } from '../services/room-service'
import { AceBinding } from '../util/y-ace'
import { SyncService } from '../services/sync-service'
import { formatCode, interpret } from '../util/compiler'
import run from '../assets/resource/run.svg'
import { Shortcut, ShortcutExtension } from '../extensions/shortcut-extension'
import { safeRegister } from '../util/util'
import { UserService } from '../services/user-service'
import { UserRole } from '../models/user'
import { RoomType } from '../models/room'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
import { ClassroomService } from '../services/classroom-service'
import { NotificationType, NotifyService, Notification } from '../services/notify-service'
import { CursorSyncExtension } from '../extensions/cursor-sync-extension'
import { debugLog } from '../index'
import { BindingService } from '../services/binding-service'
import { loadAutoComplete } from '../util/ace-autocomplete'

const langTools = ace.require('ace/ext/language_tools')

export class EditorView extends LitElement {
    static properties = {
        roomId: { type: String },
        editorWidth: { type: Number },
        leftAlign: { type: Number },
        editorIdentifier: { state: true, type: String },
        message: { type: String, state: true },
        editorVisible: { type: Boolean, state: true },
    }

    room
    editor
    activeError = false
    shortcutExtension
    currentlyFollowing = null

    connectedCallback() {
        this.editorIdentifier = `editor-${this.roomId}`
        this.room = RoomService.get().getRoom(this.roomId)
        this.editorVisible = true
        this.shortcutExtension = ShortcutExtension.get()
        this.shortcutExtension.addShortcuts(this.#shortCuts())
        let localUser = UserService.get().localUser
        localUser.addListener(() => {
            if (this.editor == null) return
            this.editor.setOptions({ fontSize: localUser.getEditorFontSize() })
            this.#updateFollowing(localUser)
        })
        let classroom = ClassroomService.get().classroom
        classroom.addListener((changes) => {
            this.editor.setOptions({ showLineNumbers: classroom.lineNumbers })
            this.editor.setOptions({ showGutter: classroom.lineNumbers })
            this.requestUpdate()
        })
        this.room.addListener(() => {
            this.#updateOnRoomAccess()
        })
        NotifyService.get().addListener((notification) => {
            if (notification.type !== NotificationType.FULLREBUILDOFFRAME) return
            // if (notification.sender.id === UserService.get().localUser.id) return;
            if (notification.message === parseInt(this.roomId)) {
                this.#runCode(true, false)
            }
        })
        super.connectedCallback()
    }

    #updateFollowing(localUser) {
        let trackingUserId = localUser.getTrackingByRoom(this.room.id)
        if (
            trackingUserId !== this.currentlyFollowing &&
            !(this.currentlyFollowing === undefined && trackingUserId === undefined)
        ) {
            let following = UserService.get().getUserByID(trackingUserId)
            let oldFollowUser = UserService.get().getUserByID(this.currentlyFollowing)
            if (oldFollowUser) oldFollowUser.removeListener(this.#followUser)
            if (following) {
                following.addListener(this.#followUser)
            }
            this.currentlyFollowing = trackingUserId
        }
    }

    #followUser = () => {
        let following = UserService.get().getUserByID(this.currentlyFollowing)
        let lineToGoTo = following.getSelectedRow()
        this.editor.scrollToLine(lineToGoTo, true, true, () => {})
    }

    disconnectedCallback() {
        this.editor.getSession().off('change', this.#onEditorChange)
        this.shortcutExtension.releaseShortcuts(this.#shortCuts())
        super.disconnectedCallback()
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties)
        this.#setupEditor()
    }

    updated(changedProperties) {
        super.updated(changedProperties)
        if (changedProperties.has('roomId')) {
            this.#setupContent()
        }
    }

    #setupEditor = () => {
        let cont = this.shadowRoot.getElementById(this.editorIdentifier)
        this.editor = ace.edit(cont)
        this.editor.renderer.attachToShadowRoot()
        this.editor.setTheme('ace/theme/cobalt')
        let activeBinding = BindingService.get().binding
        loadAutoComplete(langTools, activeBinding)
        this.editor.getSession().setMode('ace/mode/javascript')
        this.editor.session.setMode('ace/mode/javascript')
        let classroom = ClassroomService.get().classroom
        this.editor.setOptions({
            showPrintMargin: false,
            animatedScroll: true,
            displayIndentGuides: false,
            useWorker: false,
            scrollPastEnd: 1,
            showLineNumbers: classroom.lineNumbers,
            showGutter: classroom.lineNumbers,
            tabSize: 4,
            useSoftTabs: false,
            fontSize: UserService.get().localUser.getEditorFontSize(),
            enableBasicAutocompletion: true,
            enableSnippets: false,
        })
        this.editor.container.style.background = 'rgba(1,1,1,0)'
        this.editor.commands.removeCommands([
            'gotolineend', // ctrl + e
            'transposeletters', // ctrl + t,
            'macrosreplay',
        ])

        if (this.room.roomType === RoomType.TEACHER && UserService.get().localUser.role === UserRole.STUDENT) {
            this.editor.setReadOnly(true)
        }

        this.#updateOnRoomAccess()

        new CursorSyncExtension(this.editor, this.room, this)

        this.editor.session.on('change', (x) => {
            this.#onEditorChange(x)
            this.#stopLiveCoding()
            this.#startLiveCoding()
        })

        ClassroomService.get().classroom.addListener((changes) => {
            changes.forEach((change) => {
                if (change.keysChanged === undefined) return
                if (change.keysChanged.has('liveCoding') || change.keysChanged.has('liveCodingDelay')) {
                    this.#stopLiveCoding()
                    this.#startLiveCoding()
                }
                if (change.keysChanged.has('mode')) {
                    location.reload()
                    // let mode = ClassroomService.get().classroom.mode;
                    // if (mode === ClassroomMode.GALLERY) {
                    //   this.#removeSyncingBinding();
                    // }
                    // if (mode === ClassroomMode.EDIT) {
                    //   this.#removeSyncingBinding();
                    //   this.#setupSyncingBinding();
                    // }
                }
            })
        })

        this.#setupContent()
    }

    #setupContent() {
        if (this.editor === undefined) return

        if (ClassroomService.get().classroom.isEditMode()) {
            this.#removeSyncingBinding()
            this.#setupSyncingBinding()
        } else {
            this.editor.getSession().setValue(this.room.codeContent.toString())
        }

        this.room.l_editorForRoom = this.editor
        this.#runCode(true)
    }

    #removeSyncingBinding = () => {
        if (this.binding != null) {
            this.binding.destroy()
            this.binding = null
        }
    }

    #setupSyncingBinding = () => {
        let room = RoomService.get().getRoom(this.roomId)
        this.binding = new AceBinding(room.codeContent, this.editor, SyncService.get().getAwareness())
    }

    #updateOnRoomAccess = () => {
        if (!ClassroomService.get().classroom.roomLocks && RoomService.get().getRoom(this.roomId).isStudentRoom()) {
            return
        }

        if (RoomService.get().getRoom(this.roomId).isUnclaimed()) {
            this.editor.setReadOnly(false)
            return
        }

        let localUser = UserService.get().localUser

        if (localUser.isTeacher()) {
            this.editor.setReadOnly(false)
            return
        }

        if (this.room.isWriter(localUser.id) || this.room.isOwnedByLocalUser()) {
            this.editor.setReadOnly(false)
            return
        }

        this.editor.setReadOnly(true)
    }

    #stopLiveCoding = () => {
        clearTimeout(this.liveCodingInterval)
    }

    #startLiveCoding = () => {
        let classroom = ClassroomService.get().classroom
        if (classroom.liveCoding) {
            this.liveCodingInterval = setTimeout(() => {
                if (!this.activeError) {
                    debugLog('live coding recompile!')
                    this.#runCode(false)
                }
            }, classroom.liveCodingDelay * 1000)
        }
    }

    #shortCuts = () => {
        return [
            ...Shortcut.fromPattern(
                'hard-compile',
                ['ctrl+shift+enter'],
                ['ctrl+shift+enter'],
                () => {
                    this.#runCode(true)
                },
                () => {
                    return this.#isEditorFocused()
                }
            ),
            ...Shortcut.fromPattern(
                'soft-compile',
                ['ctrl+enter'],
                ['ctrl+enter'],
                () => {
                    this.#runCode(false)
                },
                () => {
                    return this.#isEditorFocused()
                }
            ),
            ...Shortcut.fromPattern(
                'export snapshot',
                ['ctrl+shift+e'],
                ['ctrl+shift+e'],
                () => {
                    console.log('snapshot')
                },
                () => {
                    return true
                }
            ),
            ...Shortcut.fromPattern(
                'toggle editor',
                ['ctrl+e'],
                ['ctrl+e'],
                () => {
                    this.#toggleEditor()
                },
                () => {
                    return true
                }
            ),
            ...Shortcut.fromPattern(
                'tidy code',
                ['ctrl+shift+t'],
                ['ctrl+shift+t', 'ctrl+t'],
                () => {
                    formatCode(this.editor)
                },
                () => {
                    return this.#isEditorFocused()
                }
            ),
            ...Shortcut.fromPattern(
                'decrease fontsize',
                ['ctrl+-', 'ctrl+shift+-'],
                ['ctrl+-', 'ctrl+shift+-'],
                () => {
                    this.#adjustFontSize(-1)
                },
                () => {
                    return this.#isEditorFocused()
                }
            ),
            ...Shortcut.fromPattern(
                'reset fontsize',
                ['ctrl+=', 'ctrl+shift+='],
                ['ctrl+=', 'ctrl+shift+='],
                () => {
                    this.#adjustFontSize(0)
                },
                () => {
                    return this.#isEditorFocused()
                }
            ),
            ...Shortcut.fromPattern(
                'increase fontsize',
                ['ctrl++', 'ctrl+shift++'],
                ['ctrl++', 'ctrl+shift++'],
                () => {
                    this.#adjustFontSize(1)
                },
                () => {
                    return this.#isEditorFocused()
                }
            ),
            ...Shortcut.fromPattern(
                'export picture',
                ['ctrl+shift+s'],
                ['ctrl+shift+s'],
                () => {
                    this.#exportPicture()
                },
                () => {
                    return this.#isEditorFocused()
                }
            ),
        ]
    }

    #isEditorFocused = () => {
        return this.editor.isFocused()
    }

    #onEditorChange = (delta) => {
        this.room.l_changedPositions.push(delta.start)
    }

    #adjustFontSize = (value) => {
        console.log('adjustFontSize', value)
        if (value == 0) {
            UserService.get().localUser.editorFontSize = 12
        } else {
            UserService.get().localUser.editorFontSize = UserService.get().localUser.editorFontSize + value
        }
    }

    #runCode(fullRebuild = false, onRebuildSuccessfulShare = true) {
        debugLog(`RunCode fullRebuild=${fullRebuild}`)
        interpret(
            fullRebuild,
            this.room,
            (message) => {
                if (this.message === message) {
                    return
                }

                this.message = message
                debugLog(message)
                this.requestUpdate()
            },
            (message) => {
                this.message = message
                debugLog(message)
                this.activeError = true
                this.requestUpdate()
            },
            () => {
                this.message = false
                this.activeError = false
                debugLog('compiled good 🔨')
                this.requestUpdate()
                this.#notifyOthersOfFullRebuild(fullRebuild, onRebuildSuccessfulShare)
            },
            this.activeError
        )
    }

    #notifyOthersOfFullRebuild(fullRebuild, onRebuildSuccessfulShare) {
        if (fullRebuild && onRebuildSuccessfulShare) {
            NotifyService.get().notify(
                new Notification(NotificationType.FULLREBUILDOFFRAME, UserService.get().localUser, this.room.id)
            )
        }
    }

    #toggleEditor = () => {
        this.editorVisible = !this.editorVisible
    }

    #exportPicture = () => {
        console.log('export picture')
        BindingService.get().binding.exportPicture(RoomService.get().getRoom(this.room.id))
    }

    render() {
        const hiddenStyle = {}
        if (!this.editorVisible) hiddenStyle.visibility = 'hidden'

        return html`
            <div class="editor" style="${styleMap(hiddenStyle)}" id="${this.editorIdentifier}"></div>
            ${this.editorVisible ? html`${this.#renderRunButton()} ${this.#renderConsole()}` : ''}
        `
    }

    #renderRunButton = () => {
        const buttonStyle = {}
        buttonStyle.left = this.leftAlign === 1 ? this.editorWidth : 0
        let lineNumbers = ClassroomService.get().classroom.lineNumbers
        if (!lineNumbers) return html``
        return html` <button class="run-button" style="${styleMap(buttonStyle)}" @click="${() => this.#runCode(true)}">
            <lit-icon icon="add" iconset="iconset"></lit-icon>
            <lit-iconset iconset="iconset"> ${unsafeHTML(run)}</lit-iconset>
        </button>`
    }

    #renderConsole = () => {
        if (!this.message) return html``
        return html` <cc-console message="${this.message}"></cc-console>`
    }

    static styles = css`
        .editor {
            z-index: 2;
            position: absolute;
            top: 0;
            bottom: 0;
            width: 100%;
        }

        svg {
            width: 10px;
            height: 10px;
        }

        .run-button {
            position: absolute;
            z-index: 3;
            border: 0;
            top: 2px;
            left: 0;
            background-color: rgba(255, 255, 255, 0);
            display: flex;
            flex-direction: row;
            align-items: flex-start;
        }

        .ace_line span {
            background: rgba(0, 50, 50, 1);
            border-right: 1em solid rgba(0, 50, 50, 1);
            margin-right: -1em;
            padding-bottom: 2px;
            /*color: #fff;*/
        }

        .ace_line span:last-child {
            border-right: none;
            margin-right: 0;
        }

        .marker-del,
        .marker-ins {
            position: absolute;
            z-index: 99;
            background: rgba(0, 255, 0, 0.5) !important;
        }

        .marker-del {
            background: rgba(255, 0, 0, 0.5) !important;
        }

        .ace_marker-layer {
            z-index: 99;
        }

        #merge-holder .ace_marker-layer {
            z-index: 0;
        }

        .ace_active-line {
            width: 0;
        }

        .ace_gutter-active-line {
            background-color: rgba(150, 150, 0, 0.5) !important;
        }

        .added-line {
            background-color: rgba(255, 255, 27, 0.38);
            height: 8px;
            position: absolute;
            opacity: 0;
            animation: fade-out 15s normal;
        }

        .synced_flag {
            font-size: 9pt;
        }

        .synced_cursor {
            animation: blink-animation 1s steps(5, start) infinite;
            -webkit-animation: blink-animation 1s steps(5, start) infinite;
        }

        .cursor-label {
            width: 8px;
            height: 8px;
            color: transparent;
        }

        .cursor-label:hover {
            width: auto;
            height: auto;
            color: inherit;
        }

        @keyframes blink-animation {
            to {
                visibility: hidden;
            }
        }

        @-webkit-keyframes blink-animation {
            to {
                visibility: hidden;
            }
        }

        @keyframes fade-out {
            from {
                opacity: 1;
            }

            to {
                opacity: 0;
            }
        }
    `
}

safeRegister('cc-editor', EditorView)
