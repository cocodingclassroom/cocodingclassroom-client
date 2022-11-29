// class yjs + p5 + ace unit
import {AceBinding, AceCursors} from "../y-ace";
import * as ace from "ace-builds";
import {wc_hex_is_light} from "./utils";
import {Chat} from "./chat";
import {CocodingMode} from "./enums";


export class Room {

    chat;
    ydoc;
    provider;
    roomId;
    mode;

    constructor(binding, ydoc, provider, roomID) {
        // class'ify inputs
        this.binding = binding
        this.ydoc = ydoc
        this.provider = provider
        this.room = roomID
        this.mode = CocodingMode.EDIT; //TODO: this is temporary, will take mode from cc again later
        this.s = cc.y.rooms.get(this.room.toString())

        this.chat = new Chat(this)

        this.navInit()
        this.htmlContainer = this.addHTML()
        this.editorContainer = this.htmlContainer.getElementsByClassName('cc-code')[0]
        this.editorContainer.style.fontSize = cc.settings.editor.fontsize + 'pt'
        this.editorContainer.style.visibility = 'visible'
        this.iframe = this.htmlContainer.getElementsByClassName('cc-iframe')[0]
        this.iframeContent = this.iframe.contentWindow
        this.meta = this.htmlContainer.getElementsByClassName('cc-meta')[0]
        //this.chat = this.htmlContainer.getElementsByClassName('cc-chat')[0]
        this.console = this.htmlContainer.querySelector('.cc-console')

        if (this.room === 0 || this.mode === CocodingMode.GALLERY) {
            setTimeout(this.navExtended.bind(this))
            setTimeout(this.navSettings.bind(this))
        }

        if (this.room > 0) {
            setTimeout(this.navUpdate.bind(this))
        }

        // misc vars
        this.active = true // toggle if classroom !visible
        this.collapsed = false // check collapsed splitscreen
        this.syncEvents = false // toggle sync
        this.syncTimerWait = false // limit sync of mouse/keyboard
        this.errorTimer // compiling
        this.validCode = true
        this.windowBroken = false
        this.consoleTimer // console auto-hide
        this.consoleMessageP = '' // store previous message


        this.setupEditor();

        // drawing coords *** (P5LIVE chalkboard or notes per room??)
        // this.coords = ydoc.getArray('chalkboard-'+this.room)


        // const connectBtn = document.getElementById('y-connect-btn')
        // 	connectBtn.addEventListener('click', () => {
        // 		if (this.provider.shouldConnect) {
        // 			this.provider.disconnect()
        // 			connectBtn.textContent = 'Connect'
        // 		} else {
        // 			this.provider.connect()
        // 			connectBtn.textContent = 'Disconnect'
        // 		}
        // 	})
        // }

        // handle iframe mouse/keyboard/console
        this.iframeMeta = `
		// catch mouse focus
		document.addEventListener("mouseup", function(){
			parent.focus()
		})

		// forward mouse/key events to parent
		document.addEventListener('mousemove', forwardMouse);
		document.addEventListener('mouseup', forwardMouse);
		document.addEventListener('mousedown', forwardMouse);

		function forwardMouse(event){
			ccSelf.passMouse(event);
		}

		document.addEventListener('keydown', forwardKey);
		document.addEventListener('keyup', forwardKey);

		function forwardKey(event){
			// ccSelf.sendKey(event); // *** needed??
		}

		// pass errors to parent
		window.onerror = function myErrorHandler(errorMsg) {
			ccSelf.validCode = false
			ccSelf.consoleMessage('👀 window: ' + errorMsg)
			ccSelf.windowError()
			return false
		}

		console.log = function(m){
			ccSelf.consoleMessage(m)
		}
	`


        // base code on init
        this.codeTemplate = this.binding.codeTemplate
// 		this.codeTemplate = `function setup() {
// 	createCanvas(windowWidth, windowHeight)

// }

// function draw() {

// }`

        // iframe as srcdoc template
        this.iframeTemplate = document.createElement('html')
        this.iframeTemplate.innerHTML = this.binding.iframeTemplate
        // this.iframeTemplate.innerHTML = `
        // <!DOCTYPE html>
        // <html>
        // <head>
        // 	<title>P5LIVE – sketch</title>
        // 	<meta charset="utf-8">
        // 	<style type="text/css">
        // 		body{
        // 			margin:0;
        // 			width:100%;
        // 			height:100%;
        // 			overflow:hidden;
        // 			cursor:crosshair;
        // 		}
        // 		canvas{
        // 			position:absolute;
        // 			top:0;
        // 			left:0;
        // 			width:100%;
        // 			height:100%;
        // 			margin:0;
        // 		}
        // 		input{
        // 			cursor:crosshair;
        // 		}
        // 	</style>
        // 	<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js"></script>
        // 	<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js"></script>

        // </head>
        // <body>
        // </body>
        // </html>
        // `


        // extra P5LIVE functions
        this.codeCustom = this.binding.codeCustom
// 		this.codeCustom = `/* CUSTOM FUNCTIONS FOR P5LIVE */
// // keep fullscreen if window resized
// function windowResized() {
// 	resizeCanvas(windowWidth, windowHeight)
// }

// // custom ease function
// function ease(iVal, oVal, eVal){
// 	return oVal += (iVal - oVal) * eVal
// }

// // processing compatibility
// function println(msg){
// 	print(msg)
// }`


        // share recompiles remotely
        this.keyDown = new Map();
        this.editorContainer.addEventListener("keydown", (event) => {
            // toggle metakeys
            this.keyDown.set(event.keyCode, event.type == 'keydown') // check modifiers

            // CTRL + keys
            if (this.keyDown.get(17)) {
                if (event.key == 't') {
                    event.preventDefault()
                    this.tidyCode()
                }

                if (event.keyCode == 13) {
                    event.preventDefault()
                    if (this.keyDown.get(16)) {
                        this.mode === CocodingMode.EDIT ? this.recompileRemote(true) : this.recompile(true)
                    } else {
                        this.mode === CocodingMode.EDIT ? this.recompileRemote() : this.recompile()
                    }
                }

            }
        });

        this.editorContainer.addEventListener("keyup", (event) => {
            this.keyDown.set(event.keyCode, event.type == 'keydown') // check modifiers
        });


        // iFrame magic from P5LIVE (passing key/mouse = small issue on B mouseX)

        // get mouse clicks on top
        // initially inspired from here:
        // https://stackoverflow.com/a/44143731/10885535
        this.htmlContainer.addEventListener('mousemove', (event) => {
            this.passMouse(event)
        })
        this.htmlContainer.addEventListener('mouseup', (event) => {
            this.passMouse(event)
        })
        this.htmlContainer.addEventListener('mousedown', (event) => {
            this.passMouse(event)
        })
        this.mouseFields = ['altKey', 'clientX', 'clientY', 'composed', 'ctrlKey', 'isTrusted', 'layerX', 'layerY', 'metaKey', 'movementX', 'movementY', 'offsetX', 'offsetY', 'pageX', 'pageY', 'screenX', 'screenY', 'shiftKey', 'x', 'y', 'button', 'buttons', 'relatedTarget', 'region']
        this.pass = false

        // keypress
        this.keyFields = ['altKey', 'bubbles', 'cancelBubble', 'cancelable', 'charCode', 'code', 'composed', 'ctrlKey', 'isTrusted', 'key', 'keyCode', 'location', 'metaKey', 'repeat', 'returnValue', 'shiftKey', 'type', 'which']

        // console.log(this.editor.id, 'ready')

        // set template or recompile on init
        if (this.active) {
            // this.provider.on('synced', () => {
            // 	console.log(this.editor.id)
            // 	// console.log(this.editor.id, 'class sync')
            // 	// this.initEditor()
            // })

            // setTimeout(()=>{
            this.initEditor()
            // }, 100)
        }
    }

    setupEditor = () => {
        // ace setup
        this.editor = ace.edit(this.editorContainer)
        this.editor.session.on('changeMode', function (e, session) {
            if ('ace/mode/javascript' === session.getMode().$id) {
                if (!!session.$worker) {
                    session.$worker.send('changeOptions', [{
                        asi: true // disable "Missing semicolon." warning in editor for JavaScript
                    }])
                }
            }
        })
        this.editor.setTheme('ace/theme/cobalt')
        this.editor.session.setMode('ace/mode/javascript')
        this.editor.setOptions({
            showPrintMargin: false,
            animatedScroll: true,
            displayIndentGuides: false,
            useWorker: false,
            scrollPastEnd: 1,
            showLineNumbers: cc.y.settings.get('lineNumbers'),
            showGutter: cc.y.settings.get('lineNumbers'),
            tabSize: 4, useSoftTabs: false,
        })
        this.editor.commands.removeCommands([
            'gotolineend' // ctrl + e
            , 'transposeletters' // ctrl + t (totally removed)
        ]);

        this.editor.on('paste', function () {
            cc.roomSync('clearSelection')
        })


        // *** make all listeners toggle with active?
        this.curPos
        this.curPositions = []
        this.editor.getSession().selection.on('changeCursor', () => {
            this.curPos = this.editor.getCursorPosition()
        })


        this.editor.getSession().on('changeAnnotation', () => {
            let annot = this.editor.getSession().getAnnotations()
            this.validCode = true

            for (let i = 0; i < annot.length; i++) {
                if (annot[i].type === 'error') {
                    // addMarker(annot[i].row);
                    // if(!braketError)
                    // console.log(annot[i].row)
                    this.validCode = false
                    this.consoleMessage('👀 Error line ~ ' + (annot[i].row + 1))
                }
            }
            if (this.validCode) {
                // if(!braketError)
                // consoleHide()
                // removeMarkers();
            }
        });

        // this.consoleMessage('hello')

        // make A editor readonly (unless privs)

        if (this.room === 0 && this.mode === CocodingMode.EDIT) { // check userID too...
            if (this.mode === CocodingMode.EDIT) {
                this.editor.setReadOnly(true)
                if (this.s.admin.includes(cc.p.token) || this.s.write.includes(cc.p.token)) {
                    this.editor.setReadOnly(false)
                }
            }
        } else {
            this.htmlContainer.style.display = 'none'
            this.active = false
        }


        // remove tracker on editor focus
        this.editor.on("focus", function () {
            if (this.mode === CocodingMode.EDIT) {
                cc.cursorTrack(this.room)
            }
            cc.keymap.set(16, false)
            cc.keymap.set(17, false)
            this.keyDown.set(17, false)
        }.bind(this))


        // each room based on y.text shared type
        this.type = this.ydoc.getText(this.editor.id)

        // edit mode
        if (this.mode === CocodingMode.EDIT) {
            this.aceBinding = new AceBinding(this.type, this.editor, this.provider.awareness)

            if (this.room === 0) {
                this.aceCursors = new AceCursors(this.aceBinding)
            }
        }
    }

    emit(key, val) {
        const selfState = this.provider.awareness.getLocalState()
        selfState.type = key
        selfState.value = val
        this.provider.awareness.setLocalState(selfState)
        delete selfState.type
        this.provider.awareness.setLocalState(selfState)
    }

    navInit() {
        let id = this.room
        this.nav = {
            reset: `<div onclick="cc.reset(${id})" data-tip="New Sketch">${cc.icons.new}</div>`,
            code: `<div onclick="cc.code()" data-tip="Sync Code">${cc.icons.code}</div>`,
            save: `<div onclick="cc.roomExport(${id})" data-tip="Export Code">${cc.icons.save}</div>`,
            rename: `<div onclick="cc.roomRename(${id})" data-tip="Rename">${cc.icons.rename}</div>`,
            renameDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.rename}</div>`,
            //admin: `<button onclick="cc.roomLock(${id})" style="height:50px;width:50px;" data-tip="Claim Room">${cc.icons.shield.empty}</button>`, // <div onclick="cc.roomLock(${id})" data-tip="Admin">${cc.icons.shield.empty}</div>
            adminDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.shield.empty}</div>`,
            merge: `<div onclick="cc.mergeDialog()" data-tip="« Compare Code »">${cc.icons.merge}</div>`,
            login: `<div onclick="cc.userAuth()" data-tip="Admin Login">${cc.icons.shield.empty}</div>`,
            layers: `<div onclick="cc.roomAdd(this)" data-tip="Add Room">${cc.icons.layers}</div>`,
            layersFull: `<div data-tip="Add Rooms - Limit 30" style="opacity:.5;">${cc.icons.layers}</div>`,
            walk: `<div class="cc-roomwalk" onclick="cc.roomWalk()" data-tip="Walk Classroom">${cc.icons.users}</div>`,
            about: `<div style="cursor: help;" onclick="cc.aboutToggle()" data-tip="About">${cc.icons.about}</div>`,
            settings: `<div class="cc-nav-settings" onclick="cc.settingsToggle(${id})" data-tip="Settings">${cc.icons.settings}</div>`,
            trash: `<div onclick="cc.roomRemove(${id}, this)" data-tip="Remove">${cc.icons.trash}</div>`,
            splitter: `<div onclick="cc.splitterSync()" data-tip="Sync Split-Screen">${cc.icons.layout}</div>`,
            message: `<div onclick="cc.broadcastMessage()" data-tip="Broadcast Message">${cc.icons.message}</div>`,
            screencast: `<div class="cc-nav-radio" onclick="cc.toggleSyncEvents(${id})" data-tip="Broadcast mouse/keyboard">${cc.icons.screencast}</div>`,
            lock: `<div class="cc-nav-lock" ${this.s.admin.includes(cc.p.token) || cc.admins().includes(cc.p.token) ? 'onclick="cc.roomLock(' + id + ', false)" data-tip="Unlock Editor"' : 'data-tip="Locked Editor" style="opacity:.6;cursor:help;"'}>${cc.icons.lock}</div>`,
            lockDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.lock}</div>`,
            unlock: `<div class="cc-nav-lock unlock" ${this.s.admin.includes(cc.p.token) || cc.admins().includes(cc.p.token) || this.s.admin.length == 1 ? 'onclick="cc.roomLock(' + id + ', true)" data-tip="Lock Editor"' : 'data-tip="Lock Editor" style="opacity:.6;cursor:help;"'}>${cc.icons.unlock}</div>`,
            unlockDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.unlock}</div>`,
        }
    }

    // check user color lightness for text overlay black or white
    // https://stackoverflow.com/a/51567564/10885535


    /* USER */

    // only view your own user info
    userListSelf() {
        const elmUL = this.htmlContainer.querySelector('.cc-userlist-self')
        let user = this.userParse(this.provider.awareness.clientID)
        elmUL.innerHTML = user.html
    }

    // list other users
    userList() {
        const elmUL = this.htmlContainer.querySelector('.cc-userlist')
        let ul = []
        let states = this.provider.awareness.getStates()
        cc.helpNeeded = false
        states.forEach((value, key) => {
            // ignore self
            if (this.provider.awareness.clientID !== key) {
                let user = this.userParse(key)
                if (value.room === this.room || this.room === 0) {
                    if (user.helpNeeded || user.request || user.admin || user.write) {
                        ul.unshift(user.html)
                        if (user.helpNeeded) {
                            cc.helpNeeded = true
                        }
                    } else {
                        ul.push(user.html)
                    }
                }
            }
        })

        // show users
        elmUL.querySelector('.cc-userlist-peers').innerHTML = ul.join('')
        if (this.mode === CocodingMode.EDIT) {
            cc.cursorTrackUpdate()
        }
        cc.tipsInit()

        // pulse window
        if (this.room === 0 && this.mode === CocodingMode.EDIT) {
            if (cc.helpNeeded) {
                this.meta.classList.add('cc-meta-visible')
            } else {
                this.meta.classList.remove('cc-meta-visible')
            }
        }

        if (this.mode === CocodingMode.GALLERY) {
            this.meta.classList.add('cc-meta-visible')
        }
    }

    // render user as html
    userParse(key) {
        let states = this.provider.awareness.getStates()
        let value = states.get(key)
        let user = {}
        user.isSelf = (this.provider.awareness.clientID === key) ? true : false
        user.helpNeeded = (value.user.hasOwnProperty('help') && value.user.help) ? true : false
        user.blur = value.user.blur ? true : false
        user.adminGlobal = cc.admins().includes(value.user.token) ? true : false
        user.admin = (cc.y.settings.get('roomLocks') && this.s.admin.includes(value.user.token) || cc.admins().includes(value.user.token)) ? true : false
        user.request = this.s.request.includes(value.user.token) ? true : false
        user.write = this.s.write.includes(value.user.token) ? true : false

        let curName = value.user.name
        let curNameMax = 14
        if (curName.length > curNameMax) {
            curName = curName.substring(0, curNameMax) + '...'
        }


        // html help
        let helpStyle = ``
        if (user.helpNeeded) {
            helpStyle = `cc-helpneeded`
        }

        let helpEmoji = user.helpNeeded ? '👋' : '✋'
        let helpNeeded = ``
        if (this.mode === CocodingMode.EDIT) {
            if (user.isSelf) {
                helpNeeded = `<div class="cc-raisehand ${helpStyle}" onclick="cc.toggleHelp();event.stopPropagation();" data-tip="Request Help">${helpEmoji}</div>`
            } else {
                if (user.helpNeeded) {
                    let helpAction = (this.room === 0) ? `onclick="cc.roomChange(${value.room});cc.roomWalkCheck();event.stopPropagation();" data-tip="Offer Help"` : ''

                    // lower hand if admin
                    if (this.room !== 0 && cc.admins().includes(cc.p.token)) {
                        helpAction = `onclick="cc.toggleHelp(${key});event.stopPropagation();" data-tip="Lower Hand"`
                    }
                    helpNeeded = `<div class="cc-raisehand ${helpStyle}" ${helpAction}>${helpEmoji}</div>`
                }
            }
        }


        // set name
        let userName = `${curName}`
        if (user.isSelf) {
            userName = `<span class="cc-user-rename ${helpStyle}">${curName}</span>`
        }

        // set self vs peer
        let userType = 'peer'
        if (user.isSelf) {
            userType = 'self'
        }

        // fade if lost focus
        let blurStatus = ''
        if (user.blur) {
            blurStatus = 'opacity: .5;'
        }

        // invert name color if light/dark background
        let userNameColor = 'color-light'
        if (wc_hex_is_light(value.user.color)) {
            userNameColor = 'color-dark'
        }

        let userWrite = ``
        if (this.s.locked && this.mode === CocodingMode.EDIT) {
            if (!user.isSelf) {
                if (this.s.write.includes(value.user.token)) {
                    userWrite = this.s.admin.includes(cc.p.token) ? `<span onclick="event.stopPropagation();cc.toggleWrite(${this.room}, ${value.user.token}, false)" class="cc-user-write-active" data-tip="Toggle Write Access">${cc.icons.toggle.right}</span>` : `<span class="cc-user-write-active">${cc.icons.toggle.right}</span>`
                } else if (this.s.request.includes(value.user.token)) {
                    userWrite = this.s.admin.includes(cc.p.token) ? `<span onclick="event.stopPropagation();cc.toggleWrite(${this.room}, ${value.user.token}, true)" class="cc-user-write pulse" data-tip="Toggle Write Access">${cc.icons.toggle.left}</span>` : `<span class="cc-user-write pulse">${cc.icons.toggle.left}</span>`
                } else if (!this.s.admin.includes(value.user.token)) {
                    userWrite = this.s.admin.includes(cc.p.token) ? `<span onclick="event.stopPropagation();cc.toggleWrite(${this.room}, ${value.user.token}, true)" class="cc-user-write" data-tip="Toggle Write Access">${cc.icons.toggle.left}</span>` : ``
                }
            }
            if (!this.s.admin.includes(cc.p.token) && user.isSelf) {
                if (this.s.write.includes(value.user.token)) {
                    userWrite = `<span class="cc-user-write-active" data-tip="Granted Write">${cc.icons.toggle.right}</span>`
                } else if (this.s.request.includes(value.user.token)) {
                    userWrite = `<span onclick="event.stopPropagation();cc.requestWrite(${this.room}, ${value.user.token}, false)" class="cc-user-write pulse" data-tip="Cancel Request Write">${cc.icons.toggle.left}</span>`
                } else {
                    userWrite = `<span onclick="event.stopPropagation();cc.requestWrite(${this.room}, ${value.user.token}, true)" class="cc-user-write" data-tip="Request Write">${cc.icons.toggle.left}</span>`
                }
            }
        }

        let userAdmin = ''
        if (user.admin) {
            userAdmin = `<span>${cc.icons.shield.empty}</span>`
        }
        if (user.adminGlobal) {
            userAdmin = `<span>${cc.icons.shield.checked}</span>`
        }

        // show users room only on left side
        let userSessionAction = user.isSelf ? 'cc-user-room-self"' : `cc-user-room-action" onclick="cc.roomChange(${value.room});cc.roomWalkCheck();event.stopPropagation();" data-tip="Jump to Room"`
        let userSession = `<sup class="cc-user-room ${userSessionAction} ${userNameColor}>${value.room}</sup>`
        if (this.room !== 0 || this.mode !== 'edit') {
            userSession = ``
        }

        let trackingClass = 'cursor-eyes'
        let tracking = `onclick="cc.cursorTrack(${this.room}, ${key})" data-tip="Track Cursor" data-tip-left`
        if (user.isSelf) {
            tracking = `onclick="cc.userRename()" data-tip="Set Name + Color" data-tip-left`
        }
        if (this.mode !== 'edit') {
            tracking = ``
            trackingClass = ''
        }

        let userSplitterValue = value.user.hasOwnProperty('splitter') ? value.user.splitter : 50
        let userSplitter = (this.room === 0) ? `<div class="cc-user-splitter ${userNameColor}" style="left:${userSplitterValue}%;border-left:4px solid ${value.user.color}"></div>` : ``

        user.html = `<div class="cc-user cc-user-${userType} cc-user-id-${key} ${helpStyle} ${trackingClass}" style="background:${value.user.color};${blurStatus}" ${tracking}>
			${userSplitter}
			<div class="cc-user-name ${userNameColor}">
				${userName} ${userSession}
			</div>
			<div class="cc-user-nav ${userNameColor}" style="">
				${helpNeeded} ${userWrite} ${userAdmin}
			</div>
		</div>
		`
        return user
    }


    /* ROOMS */
    roomList() {
        if (this.room !== 0) { //  || this.mode === CocodingMode.GALLERY  || this.mode !== 'edit'
            let rl = this.htmlContainer.querySelector('.cc-roomlist')
            rl.innerHTML = this.roomItems()
            rl.onchange = function (elm) {
                if (cc.admins().includes(cc.p.token) && this.mode === CocodingMode.GALLERY) {
                    cc.y.settings.set('room', elm.target.value)
                } else {
                    cc.roomChange(elm.target.value)
                }
            }.bind(this);
            if (!cc.admins().includes(cc.p.token) && this.mode === CocodingMode.GALLERY) {
                rl.disabled = 'disabled'
            }
            cc.tipsInit()
        }
    }

    roomItems() {
        let opts = ''

        // sort rooms based on key (as number)
        let arr = [...cc.y.rooms]
        arr.sort(function (a, b) {
            return a[0] - b[0]
        })
        arr.forEach((v, k) => {
            if (k > 0) {
                let sel = ''
                if (k === this.room) {
                    sel = 'selected'
                }
                let status = ''
                if (cc.y.settings.get('mode') === 'edit' && cc.y.settings.get('roomLocks')) {
                    if (v[1].locked) {
                        status = '🔒'
                    }
                    if (v[1].admin.includes(cc.p.token) && !cc.admins().includes(cc.p.token)) {
                        status = '🛡️'
                    }
                }
                opts += `<option value=${k} ${sel}>${k} _ ${v[1].name} ${status}</option>` // '<option value='+k+' '+ sel +'>'+k+' – '+v+'</option>'
            }
        })
        return opts
    }

    /* TOGGLE GUI/INSTANCE */

    // show/hide editor
    toggleEditor(id) {
        if (this.editorContainer.style.visibility !== 'visible') {
            // this.meta.style.display = 'block'
            this.editorContainer.style.visibility = 'visible'
            if (id === this.room) {
                this.editor.focus()
            }
        } else {
            // this.meta.style.display = 'none'
            this.editorContainer.style.visibility = 'hidden'
            this.editor.blur()
            // this.editorContainer.focus()
        }
    }

    // show/hide meta
    toggleMeta() {
        if (this.meta.style.display === 'none') {
            this.meta.style.display = 'block'
        } else {
            this.meta.style.display = 'none'
        }
    }

    toggleActive(togState) {
        if (togState) {
            this.htmlContainer.style.display = 'block'
            this.active = true
            this.collapsed = false
            this.initEditor()
            //this.chatRender()
            if (this.iframeContent.noLoop !== undefined) {
                this.iframeContent.loop()
            }


            // this.userList()
            // setTimeout(()=>{this.initEditor()}, 0)
        } else {
            this.htmlContainer.style.display = 'none'
            this.active = false
            this.collapsed = true

            this.editor.getSession().off('change', function (delta) {
                this.curPos = delta.start
                this.curPositions.push(delta.start)
                this.checkErrors()
            }.bind(this))

            // how to bind custom 'noLoop' from other frameworks?
            if (this.iframeContent.noLoop !== undefined) {
                this.iframeContent.noLoop()
            }
        }
    }

    toggleWrite() {
        if (this.mode === CocodingMode.EDIT) {
            let locked = true
            this.editor.setReadOnly(true)
            // console.log([this.s.admin[0], this.s.write[0], cc.p.token])
            if (this.room === 0) {
                if (this.s.admin.includes(cc.p.token) || this.s.write.includes(cc.p.token)) {
                    locked = false
                }
            } else {
                // all other rooms
                if (cc.y.settings.get('roomLocks')) {
                    if (this.s.admin.includes(cc.p.token) || this.s.write.includes(cc.p.token) || !this.s.locked) {
                        locked = false
                    }
                } else {
                    locked = false
                }
            }

            this.editor.setReadOnly(locked)


            // && {
            // 	this.editor.setReadOnly(false)
            // 	console.log(this.room + ' - unlocked')
            // }else if(!cc.y.settings.get('roomLocks')){
            // 	this.editor.setReadOnly(false)
            // 	console.log(this.room + ' - unlocked')
            // }else if(cc.y.settings.get('roomLocks') && (this.s.admin.includes(cc.p.token) || this.s.write.includes(cc.p.token) || !this.s.locked)){
            // 	this.editor.setReadOnly(false)
            // 	console.log(this.room + ' - unlocked')
            // }
            // if(this.s.admin.includes(cc.p.token) || this.s.write.includes(cc.p.token) || !this.s.locked || !cc.y.settings.get('roomLocks')){
            // 	this.editor.setReadOnly(false)
            // 	console.log(this.room + ' - unlocked')
            // }
        }
    }

    windowError() {
        this.windowBroken = true
    }

    /* CONSOLE */
    consoleMessage(m) {
        this.console.style.display = 'block'

        if (this.consoleMessageP !== m) {
            this.consoleMessageP = m
            console.log(m)
            if (typeof m === 'object') {
                m = JSON.stringify(m)
            }
            this.console.value = m
        }

        if (this.validCode) {
            if (this.consoleTimer !== undefined) {
                clearTimeout(this.consoleTimer)
            }
            this.consoleTimer = setTimeout(function () {
                this.consoleClear()
            }.bind(this), 100)
        }
    }

    consoleClear() {
        this.console.value = ''
        this.console.style.display = 'none'
        this.consoleMessageP = ''
        if (cc.y.settings.get('liveCoding') && !this.validCode) {
            console.log('check errors')
            // 	this.checkErrors()
        }
    }


    /* EDITOR */

    // set template or recompile on init
    initEditor() {
        // console.log(this.editor.getValue().length)
        this.userList()
        this.userListSelf()
        this.roomList()

        if (this.type.toString() === '') {
            this.editor.setValue(this.codeTemplate, 1) // `//Room ${this.room}\n\n`+  // for debugging
            this.editor.getSession().setUndoManager(new ace.UndoManager());
        } else {
            if (this.active) {
                if (cc.y.settings.get('mode') === 'gallery') {
                    this.editor.setValue(this.type.toString(), -1)
                    this.editor.getSession().setUndoManager(new ace.UndoManager());
                    this.tidyCode() // *** make global setting??
                }
                this.editor.renderer.updateFull();
                this.editor.getSession().on('change', function (delta) {
                    this.curPos = delta.start
                    this.curPositions.push(delta.start)
                    this.checkErrors()
                }.bind(this))
                // this.checkErrors()
                setTimeout(function () {
                    this.recompile(true)
                }.bind(this))
            }
            this.editor.getSession().setUndoManager(new ace.UndoManager());
        }

    }

    tidyCode() {
        // beautify!
        let beautifyOptions = {
            'indent_size': '1',
            'indent_char': '\t',
            'max_preserve_newlines': '5',
            'preserve_newlines': true,
            'keep_array_indentation': false,
            'break_chained_methods': false,
            'indent_scripts': 'normal',
            'brace_style': 'collapse',
            'space_before_conditional': false,
            'unescape_strings': false,
            'jslint_happy': false,
            'end_with_newline': false,
            'wrap_line_length': '0',
            'indent_inner_html': false,
            'comma_first': false,
            'e4x': false
        }

        let aceEdit = this.editor
        let tempPos = aceEdit.getCursorPosition()
        let tempCode = js_beautify(aceEdit.getValue(), beautifyOptions)
        aceEdit.setValue(tempCode, -1)
        aceEdit.gotoLine(tempPos.row + 1, tempPos.column, false)
        if (this.mode === CocodingMode.EDIT) {
            cc.editorClearSelection()
            cc.roomSync('clearSelection')
        }
    }


    /* RECOMPILING */

    // check for errors on keyup (based on settings delay)
    checkErrors() {
        // console.log(this.room +" : "+this.iframeContent.frameCount)
        clearTimeout(this.errorTimer)
        let compileDelay = this.iframeContent.frameCount === undefined ? 10 : cc.y.settings.get('liveDelay') * 1000
        this.errorTimer = setTimeout(function () {
            this.checkErrorsWorker()
        }.bind(this), compileDelay)
    }

    checkErrorsWorker() {
        let annos = this.editor.getSession().getAnnotations();
        let errorsFound = false;
        for (let i = 0; i < annos.length; i++) {
            if (annos[i].type === 'error') {
                errorsFound = true
            }
        }

        if (errorsFound) {
            this.validCode = false;
            this.checkErrors();
        } else {
            clearTimeout(this.errorTimer);
            this.validCode = true;
            this.consoleClear()
            if (cc.y.settings.get('liveCoding')) {
                this.recompile() // ** true is more expected, but prob more errors
            }
        }
        // console.log([annos, 'errors: '+errorsFound, 'valid: '+this.validCode])
    }


    /* RECOMPILE */

    // share recompile of editor with remote peers
    recompileRemote(force) {
        if (this.room !== 0 || this.s.admin.includes(cc.p.token) || cc.admins().includes(cc.p.token)) {
            this.emit('compiled', {room: this.room, force: force})
        }
        this.recompile(force)
    }

    // build code from ace editor into iframe
    recompile(force) {
        clearTimeout(this.errorTimer)
        if (this.collapsed) {
            return
        }

        if (cc.safeMode) {
            console.log('in safeMode! to disable, remove #bug from URL and refresh page')
            return
        }

        let pVars = {}
        if (this.iframeContent.frameCount !== undefined) {
            // p5 specific
            pVars.frameCount = this.iframeContent.frameCount + 1
            pVars.mouseX = this.iframeContent.mouseX
            pVars.mouseY = this.iframeContent.mouseY
        }

        let codeNoComments = this.removeComments(this.editor.getValue())
        let rawLines = this.editor.session.getLines(0, this.editor.session.getLength())

        // softCompile
        if (force === undefined && !this.windowBroken) {
            // p5 specific
            if (this.iframeContent.frameCount !== undefined) {
                let drawPos = [] //{};
                let drawPosSel = -1
                let countBrackets = false
                let braces = 0
                let softFunction = false
                let softClass = false


                let allLines = codeNoComments.split('\n')

                // sandbox
                let sandboxMatch = this.editor.getValue().match(/^\/\/\s*(hydra)*sandbox.*?\/\/.*?(hydra)*sandbox.*?\n/ism);
                if (sandboxMatch !== null) {
                    let currline = this.editor.getSelectionRange().start.row

                    let currCode = this.editor.session.getLine(currline)
                    let sandboxParts = sandboxMatch[0].split('\n')
                    if (sandboxParts.indexOf(currCode) > -1) {
                        this.iframeContent.eval(sandboxMatch[0])
                        if (!force) {
                            return false;
                        }
                    }
                }

                // test purging of comments
                // let offLines = 6;
                // console.log(rawLines[offLines]);
                // console.log(allLines[offLines]);

                // extract all functions and their line number
                for (let i = 0; i < allLines.length; i++) {

                    // catch function or class
                    if (allLines[i].includes('function ') && !countBrackets) {
                        countBrackets = true
                        let functionName = allLines[i].match(/function ([\w\d]*)\(/)[1].trim()
                        drawPos.push({type: 'function', name: functionName, start: i})
                    } else if (allLines[i].includes('class ') && !countBrackets) {
                        countBrackets = true
                        let className = allLines[i].match(/class\s([\w\d]*)/)[1].trim()
                        drawPos.push({type: 'class', name: className, start: i})
                    }

                    // count {} and mark where class/function ends
                    if (countBrackets) {
                        if (allLines[i].includes('{')) {
                            braces += (allLines[i].match(/{/g) || []).length
                        }
                        if (allLines[i].includes('}')) {
                            braces -= (allLines[i].match(/}/g) || []).length
                            if (braces === 0) {
                                drawPos[drawPos.length - 1].end = i
                                countBrackets = false
                            }
                        }
                    }
                }

                // check all changed positions + if custom function
                let funName = ''
                for (let i = 0; i < drawPos.length; i++) {
                    for (let j = 0; j < this.curPositions.length; j++) {
                        let cPos = this.curPositions[j]
                        if (cPos.row >= drawPos[i].start && cPos.row <= drawPos[i].end) {
                            // console.log(drawPos[i].name); // debug where change occured
                            if (drawPos[i].name !== 'setup' && drawPos[i].name !== 'preload' && drawPos[i].type === 'function') {
                                softFunction = true
                                drawPosSel = i
                                funName = drawPos[i].name
                            } else if (drawPos[i].type === 'class') {
                                softClass = true
                                drawPosSel = i
                            }
                        }
                    }
                }

                // if custom function, grab where it's used
                let functionPos = []
                for (let j = 0; j < drawPos.length; j++) {
                    if (funName === drawPos[j].name) {
                        // find lines where drawPos[i].name sits
                        for (let i = 0; i < allLines.length; i++) {
                            if (allLines[i].includes(drawPos[j].name + '(')) {
                                functionPos.push(i)
                            }
                        }
                    }
                }

                // catch custom functions in preload + setup
                for (let i = 0; i < functionPos.length; i++) {
                    let fPos = functionPos[i]
                    for (let j = 0; j < drawPos.length; j++) {
                        if (fPos >= drawPos[j].start && fPos <= drawPos[j].end) {
                            // console.log(drawPos[i].name); // debug where chage occured
                            if (drawPos[j].name === 'setup' || drawPos[j].name === 'preload') { // && !settings.cocoding.active
                                softFunction = false
                            }
                        }
                    }
                }

                // if possible, only overwrite function/class for softCompile
                if (softClass || softFunction) {
                    this.softCompile(drawPos[drawPosSel].type, drawPos[drawPosSel].name, drawPos[drawPosSel].start, drawPos[drawPosSel].end);
                    this.curPositions = []
                    return false // prevent complete rebuild
                }
            }
        }


        // base template
        let el = this.iframeTemplate.cloneNode(true);
        let iFrameHead = el.getElementsByTagName('head')[0] //el.document.getElementsByTagName('body')[0];
        let iFrameBody = el.getElementsByTagName('body')[0] //el.document.getElementsByTagName('body')[0];

        // COCODING Classroom meta for console/error etc
        let sMeta = document.createElement('script')
        sMeta.type = 'text/javascript'
        sMeta.innerHTML = this.iframeMeta
        iFrameHead.appendChild(sMeta)

        let scriptsCol = [];
        let scriptsList = this.processLibs(codeNoComments);
        for (let i = 0; i < scriptsList.length; i++) {
            scriptsCol.push(scriptsList[i]);
        }

        for (let sc of scriptsCol) {
            let s = document.createElement('script');
            s.type = 'text/javascript';
            s.src = sc;
            // s.async = false;
            iFrameHead.appendChild(s);
        }

        // sketch as script tag
        let s = document.createElement('script')
        s.type = 'text/javascript'
        let sketchCode = this.editor.getValue()

        // break infinite loops
        if (!sketchCode.match(/(\/\/).*(no.*protect)/g)) {
            try {
                sketchCode = loopBreaker(sketchCode).code
            } catch (e) {
                this.validCode = false
                this.consoleMessage(`👀 error found near line ~ ${e.lineNumber}, ${e.description}`)
                console.log(e.description) // debug full message
                return
            }
        }

        let fullCode = sketchCode + '\n\n' + this.codeCustom;
        s.innerHTML = fullCode;

        // set template as iframe srcdoc
        this.iframe.srcdoc = el.innerHTML;

        // when ready, add sketch script
        this.iframe.onload = () => {
            this.windowBroken = false
            this.iframeContent.ccSelf = this
            this.iframeContent.document.body.appendChild(s)
            // this.validCode = true
            // this.consoleClear()

            // p5 specific
            if (pVars.hasOwnProperty('frameCount')) {
                this.iframeContent.frameCount = pVars.frameCount
                this.iframeContent.mouseX = pVars.mouseX
                this.iframeContent.mouseY = pVars.mouseY
            }
            this.curPositions = []
        }
    }

    recompileLine() {
        if (this.collapsed) {
            return
        }

        if (cc.safeMode) {
            console.log('in safeMode! to disable, remove #bug from URL and refresh page')
            return
        }

        let s = document.createElement('script');
        s.type = 'text/javascript';

        var currline = this.editor.getSelectionRange().start.row;
        var wholelinetxt = this.editor.session.getLine(currline);
        s.innerHTML = wholelinetxt
        // console.log(wholelinetxt)
        this.iframeContent.document.body.appendChild(s);
    }

    softCompile(codeType, codeName, codeStart, codeEnd) {
        let curCodeTemp = '';
        if (codeType == 'function') {
            curCodeTemp = this.editor.session.getLines(codeStart, codeEnd).join('\n');
        } else if (codeType == 'class') {
            curCodeTemp = codeName + ' = class {' + this.editor.session.getLines(codeStart + 1, codeEnd).join('\n');
        }
        let s = document.createElement('script');
        s.type = 'text/javascript';

        // break infinite loops
        if (!this.editor.getValue().match(/(\/\/).*(no.*protect)/g)) {
            try {
                curCodeTemp = loopBreaker(curCodeTemp).code;
            } catch (e) {
                // console.log(e.description)
                this.validCode = false
                this.consoleMessage(`👀 error found near line ~ ${e.lineNumber}, "${e.description}"`)
                console.log(e.description) // debug full message
                return
            }

        }
        s.innerHTML = curCodeTemp
        this.iframeContent.document.head.appendChild(s)
        // this.validCode = true
        // this.consoleClear()
    }

    removeComments(code) {
        return code.replace(/\/\*[\s\S]*?\*\/|([^:\}\)]|^)\/\/.*$/gm, (_, g1, g2) => Array(_.split('\n').length).join('\n'))
    }

    processLibs(code) {
        let sketchTest = code.replace(/(?:\r\n|\r|\n|\t)/g, '');
        let sketchScriptsString = sketchTest.match(/(?=loadScripts|libs|scripts).*?(\])/);
        let scriptsList = [];
        if (sketchScriptsString != undefined) {
            let sketchLoadScripts = sketchScriptsString[0].match(/(["'])(?:(?=(\\?))\2.)*?\1/g);
            for (let i = 0; i < sketchLoadScripts.length; i++) {
                if (sketchLoadScripts[i] != '') {
                    scriptsList.push(sketchLoadScripts[i].replace(/["']/g, ''));
                }
            }
        }
        return scriptsList;
    }


    /* MOUSE + KEYBOARD EVENTS */

    // mouse stuff
    passMouse(event) {
        this.pass = !this.pass;
        if (this.pass || event.type == 'mousedown' || event.type == 'mouseup') {
            this.processMouse(event);
        }
        cc.roomFocus = this.room
    };

    passMouseClick(event) {
        this.processMouse(event);
    };

    getOpts(event, fields) {
        let opts = {};
        let offX = this.htmlContainer.offsetLeft;
        fields.forEach(function (f) {
            if (f in event) {
                opts[f] = event[f];
                // *** issue with mouseX on B room.. using global mouseX..
                if (f === 'offsetX' || f === 'clientX' || f === 'pageX' || f === 'x') {
                    opts[f] = opts[f] - offX
                    // console.log(opts[f])
                }
            }
        });
        return opts;
    }

    processMouse(event) {
        // console.log('processing mouse')
        // console.log(event)
        let opts = this.getOpts(event, this.mouseFields);
        let copy = new MouseEvent(event.type, opts);
        // copy.x = 0
        // console.log(copy.x)
        this.iframeContent.dispatchEvent(copy);

        if (this.syncEvents) {
            // console.log('syncing events')
            this.syncEventOut('mouse', event.type, opts);
        }


        // prevent drag+drop+shift of code, while mouseDragging visuals
        // *** disabled due to sess 0 unlock...
        // if(event.type == 'mousedown'){
        // 	this.editor.setReadOnly(true);
        // }else if(event.type == 'mouseup'){
        // 	this.editor.setReadOnly(false);
        // }
    }

    sendKey(event) {
        let opts = this.getOpts(event, this.keyFields)
        let copy = new KeyboardEvent(event.type, opts)
        this.iframeContent.dispatchEvent(copy)

        if (this.syncEvents) {
            this.syncEventOut('keyboard', event.type, opts)
        }
    }

    syncEventIn(evData) {
        let ev = evData;
        let copy;
        if (ev.mode === 'keyboard') {
            copy = new KeyboardEvent(ev.type, ev.opts)
        } else if (ev.mode === 'mouse') {
            // let opts = this.getOpts(event, this.mouseFields);
            copy = new MouseEvent(ev.type, ev.opts)
        }
        this.iframeContent.dispatchEvent(copy)

        // p5 specific
        if (ev.hasOwnProperty('fc')) {
            this.iframeContent.frameCount = ev.fc // disabled below
        }
    }

    syncEventOut(evMode, evType, evOpts) {
        this.ev = {room: this.room, 'mode': evMode, 'type': evType, 'opts': evOpts} // , 'fc':this.iframeContent.frameCount

        // p5 specific
        this.ev.fc = this.iframeContent.frameCount

        if (!this.syncTimerWait) {
            this.syncTimerWait = true
            this.syncTimer = setTimeout(() => {
                this.syncTimerWait = false
                this.emit('dispatchSyncEvent', this.ev)
            }, 30) // *** play with timing, lag vs flood
        }


    }

    destroy() {
        this.chat.destroy();
        if (this.aceCursors !== undefined) {
            this.aceCursors.destroy()
        }
        this.aceBinding.destroy()
        // cc.rooms.delete(this.room)
    }

    roomExport() {
        console.log(this.room + ' !!!')
    }

    /* HTML RENDER */

    // *** one big thing or [√] break into components?
    addHTML() {
        // 0 = A, 1 = B, 2+ = rest
        let id = this.room

        // overhall holding div
        let newContainer = document.createElement('div')
        newContainer.className = 'cc-container'

        let newFlash = document.createElement('div')
        newFlash.className = 'cc-flash'
        newContainer.appendChild(newFlash)

        // iframes for code
        let newFrame = document.createElement('iframe')
        newFrame.name = 'frame-' + id
        newFrame.className = 'cc-iframe'
        newFrame.sandbox = 'allow-same-origin allow-scripts allow-downloads allow-pointer-lock'
        newFrame.srcdoc = ''
        newContainer.appendChild(newFrame)

        // ace
        let newEditor = document.createElement('div')
        newEditor.className = 'cc-code'
        newContainer.appendChild(newEditor)

        // console
        let newConsole = document.createElement('textarea')
        newConsole.className = 'cc-console'
        // newConsole.setAttribute('readonly')
        newContainer.appendChild(newConsole)

        // meta
        let newMetalist = document.createElement('div')
        newMetalist.className = 'cc-meta'

        newMetalist.addEventListener('mouseenter', e => {
            cc.showUsers()
        })
        newMetalist.addEventListener('mouseleave', e => {
            cc.hideUsers()
        })
        newContainer.appendChild(newMetalist)


        if (cc.y.rooms.size > 30 || this.mode !== 'edit') {
            this.nav.layers = `<div data-tip="Add Rooms - Limit 30" style="opacity:.5;">${cc.icons.layers}</div>`
        }

        // header
        let newHeader = document.createElement('div')
        newHeader.className = 'cc-header'
        newHeader.innerHTML = `
			<div class="cc-roomlist-holder cc-room-0">
				<div class="cc-header-title" data-tip="${cc.version}" onclick="cc.aboutToggle()">
					COCODING Classroom
				</div>
				<div class="cc-controls-row">
					${this.nav.about} ${this.nav.settings}
				</div>
			</div>
		`
        if (this.room !== 0 && this.mode === CocodingMode.EDIT) {
            newHeader.style = 'display:none;'
        }
        newMetalist.appendChild(newHeader)

        if (this.room > 0 || this.mode === CocodingMode.GALLERY) {


            // roomlist as select pulldown
            let newSessionHolder = document.createElement('div')
            newSessionHolder.className = 'cc-roomlist-holder'
            newMetalist.appendChild(newSessionHolder)

            let newSessionlist = document.createElement('select')
            newSessionlist.setAttribute('data-tip', 'Change Room')
            newSessionlist.className = 'cc-roomlist'
            if (this.mode === CocodingMode.GALLERY) {
                if (!cc.admins().includes(cc.p.token)) {
                    newSessionlist.setAttribute('data-tip', 'Synced View')
                }

                newSessionlist.style = 'min-width:100% !important;max-width:100% !important;'
            }
            newSessionHolder.appendChild(newSessionlist)

            let newSessionRenamer = document.createElement('div')
            newSessionRenamer.className = 'cc-controls-row cc-roomlist-nav'
            newSessionHolder.appendChild(newSessionRenamer)
        }

        let newSessionExtendedNav = document.createElement('div')
        newSessionExtendedNav.innerHTML = `<div class="cc-controls-row">
				${this.room === 0 && this.s.admin.includes(cc.p.token) && this.mode === CocodingMode.EDIT ? this.nav.reset + this.nav.code : ''} ${this.nav.save} ${this.s.admin.includes(cc.p.token) ? this.nav.screencast : ''}
				${this.room === 0 && this.mode === CocodingMode.EDIT ? this.nav.merge : ''}

			</div>

			<!-- potential extended save nav ***** -->
			<div class="cc-controls-extended-save" style="display:none;">
				<div class="cc-controls-row">
					${this.nav.reset}${this.nav.about}
				</div>
			</div>

			<div class="cc-controls-extended"></div>
		`
        if (this.room === 0 || this.mode === CocodingMode.GALLERY) {
            newMetalist.appendChild(newSessionExtendedNav)
        }


        // controls
        let newControls = document.createElement('div')
        newControls.className = 'cc-controls'
        // contents set below
        newMetalist.appendChild(newControls)


        // userlist
        let newUserlist = document.createElement('div')
        newUserlist.className = 'cc-userlist'
        newMetalist.appendChild(newUserlist)

        // userSelf
        let newUserSelf = document.createElement('div')
        newUserSelf.className = 'cc-userlist-self'
        newUserlist.appendChild(newUserSelf)

        // userOthers
        let newUserPeers = document.createElement('div')
        newUserPeers.className = 'cc-userlist-peers'
        newUserlist.appendChild(newUserPeers)

        // chat
        let newChat = this.chat.getRootElement();
        // let newChat = document.createElement('div')
        // newChat.className = 'cc-chat'
        newMetalist.appendChild(newChat)

        // settings
        if (this.room === 0 || this.mode === CocodingMode.GALLERY) {
            let newSettings = document.createElement('div')
            newSettings.className = 'cc-settings'
            newMetalist.appendChild(newSettings)
        }

        // place left/right
        let roomHolder = (id === 0 && this.mode === CocodingMode.EDIT) ? 'room-a' : 'room-b'
        if (this.mode === CocodingMode.GALLERY) {
            roomHolder = 'room-b'
        }
        document.getElementById(roomHolder).appendChild(newContainer)

        return newContainer
    }

    navSettings() {
        let adminSettings = `<div class="cc-settings-subhead">CLASSROOM</div>
				<div data-tip="Set classroom mode" data-tip-left>
					Mode <select class="cc-settings-mode" data-tip="" onchange="cc.modeChange(this.value)">
						<option ${cc.y.settings.get('mode') === 'edit' ? 'selected' : ''}>edit</option>
						<option ${cc.y.settings.get('mode') === 'gallery' ? 'selected' : ''}>gallery</option>
					</select>
				</div>
				<div data-tip="Auto compile code on keyup" data-tip-left>
					<input class="cc-setting-checkbox" type="checkbox" ${cc.y.settings.get('liveCoding') ? 'checked' : ''} onchange="cc.y.settings.set('liveCoding', this.checked);">
					Live Coding

					<select class="cc-settings-livedelay" data-tip="Keyup delay in seconds" onchange="cc.y.settings.set('liveDelay', this.value)">
						${this.navSettingsLiveDelay()}
					</select> sec
				</div>
				<div data-tip="Display code line numbers" data-tip-left>
					<input class="cc-setting-checkbox" type="checkbox" ${cc.y.settings.get('lineNumbers') ? 'checked' : ''} onchange="cc.y.settings.set('lineNumbers', this.checked);">
					Line Numbers
				</div>
				<div data-tip="Anyone can lock their room" data-tip-left>
					<input class="cc-setting-checkbox" type="checkbox" ${cc.y.settings.get('roomLocks') ? 'checked' : ''} onchange="cc.y.settings.set('roomLocks', this.checked);">
					Room Locks
				</div>
				<div data-tip="Speed of walking through rooms" data-tip-left>
					Walk Delay:
					<input class="cc-setting-input cc-settings-walkdelay" type="text" value="${cc.settings.walkDelay}" onchange="cc.settings.walkDelay=this.value;cc.roomWalk(true);cc.settingsSave()"> sec
				</div>`

        let settingsHTML = `
				<div class="cc-settings-bar"></div>
				${cc.admins().includes(cc.p.token) ? adminSettings : ''}

				<div class="cc-settings-subhead">EDITOR</div>

				<div data-tip="Set code font size" data-tip-left>
					Font Size:
					<input class="cc-setting-input cc-settings-fontsize" type="text" value="${cc.settings.editor.fontsize}" onkeyup="cc.editorFontSize(this.value)"> pt
				</div>
			`

        if (this.htmlContainer.querySelector('.cc-settings') !== undefined) {
            this.htmlContainer.querySelector('.cc-settings').innerHTML = settingsHTML
        }
    }

    navSettingsLiveDelay() {
        let opts = ''
        let curDelay = cc.y.settings.get('liveDelay')
        for (let i = .5; i <= 2; i += .5) {
            let sel = ''
            if (i === curDelay) {
                sel = 'selected'
            }
            opts += `<option ${sel}>${i}</option>`
        }
        return opts
    }

    navUpdate() {
        let navRoom = `
			<div class="cc-controls-row">
				${!this.s.locked || !cc.y.settings.get('roomLocks') || this.s.locked && this.s.admin.includes(cc.p.token) ? this.nav.reset : ''}
				${this.nav.save}
				${(cc.y.settings.get('roomLocks') && this.s.admin.includes(cc.p.token)) || cc.admins().includes(cc.p.token) ? this.nav.screencast : ''}
			</div>
		`

        if (this.room !== 0 && this.mode === CocodingMode.EDIT) {
            this.htmlContainer.querySelector('.cc-controls').innerHTML = navRoom
        }


        // nav options
        let lockStatus = ''
        if (this.room > 0 && cc.y.settings.get('roomLocks')) {
            if (this.room === 1 && !cc.admins().includes(cc.p.token)) {
                lockStatus = this.nav.unlockDisabled
            } else if (this.s.locked) {
                lockStatus = this.nav.lock
            } else {
                lockStatus = this.nav.unlock
            }
        }

        let renameStatus = this.nav.renameDisabled
        if (this.room > 1) {
            renameStatus = this.nav.rename
        }
        if (cc.y.settings.get('roomLocks') && this.s.locked && !this.s.admin.includes(cc.p.token)) {
            renameStatus = this.nav.renameDisabled
        }

        if (this.mode === CocodingMode.EDIT) {
            let roomlistNav = this.htmlContainer.querySelector('.cc-roomlist-nav')
            if (roomlistNav !== null) {
                this.htmlContainer.querySelector('.cc-roomlist-nav').innerHTML = `${renameStatus}${lockStatus}`
            }
            this.toggleWrite()
            this.roomList()
        }
        cc.tipsInit()
    }

    navExtended() {
        let nav = ``
        if (this.mode === CocodingMode.EDIT) {
            nav = `
				<div class="cc-controls-row" ${cc.admins().includes(cc.p.token) ? '' : 'style="display:none;"'}>
					${cc.admins().includes(cc.p.token) ? this.nav.layers + this.nav.walk + this.nav.message + this.nav.splitter : ''}
				</div>
			`
        } else if (this.mode === CocodingMode.GALLERY) {
            nav = `
				<div class="cc-controls-row" ${cc.admins().includes(cc.p.token) ? '' : 'style="display:none;"'}>
					${cc.admins().includes(cc.p.token) ? this.nav.walk + this.nav.message : ''}
				</div>
			`
        }
        this.htmlContainer.querySelector('.cc-controls-extended').innerHTML = nav
        cc.tipsInit()
    }
}