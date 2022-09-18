// COCODING CLASSROOM - splitscreen
// import.meta.hot;

// import libs
import * as Y from 'yjs'
// import { Awareness } from 'y-protocols/awareness'
import { WebrtcProvider } from 'y-webrtc'
import { WebsocketProvider } from 'y-websocket'

import {AceBinding, AceCursors} from './y-ace.js';
import Ace from 'ace-builds/src-min-noconflict/ace'



import 'ace-builds/src-min-noconflict/mode-javascript'
import 'ace-builds/src-min-noconflict/worker-javascript'
import 'ace-builds/src-min-noconflict/theme-cobalt'


// // *** double check if broken on snowpack build??
if(__SNOWPACK_ENV__.MODE === 'development'){
	console.log('dev mode')
	Ace.config.set('basePath', './node_modules/ace-builds/src-min-noconflict/');
}else if(__SNOWPACK_ENV__.MODE === 'production'){
	console.log('prod mode')
	Ace.config.set('basePath', './_snowpack/pkg/ace-builds/src-min-noconflict/');
}

// const {SNOWPACK_PUBLIC_API_URL} = __SNOWPACK_ENV__;
// console.log(__SNOWPACK_ENV__.MODE)


// Ace.config.set('modePath', './node_modules/ace-builds/src-min-noconflict/');
// Ace.config.set('themePath', './node_modules/ace-builds/src-min-noconflict/');
// Ace.config.set('workerPath','./node_modules/ace-builds/src-min-noconflict/');

// encode room name, room count

var offline = false
var version = '1.0.0'
var earlyAccessMode = false


// class yjs + p5 + ace unit
class CocodingClassroom{
	constructor(binding, ydoc, provider, roomID){
		// class'ify inputs
		this.binding = binding
		this.ydoc = ydoc
		this.provider = provider
		this.room = roomID
		this.mode = cc.y.settings.get('mode')
		this.s = cc.y.rooms.get(this.room.toString())

		this.navInit()
		this.htmlContainer = this.addHTML()
		this.editorContainer = this.htmlContainer.getElementsByClassName('cc-code')[0]
		this.editorContainer.style.fontSize = cc.settings.editor.fontsize + 'pt'
		this.editorContainer.style.visibility = 'visible'
		this.iframe = this.htmlContainer.getElementsByClassName('cc-iframe')[0]
		this.iframeContent = this.iframe.contentWindow
		this.meta = this.htmlContainer.getElementsByClassName('cc-meta')[0]
		this.chat = this.htmlContainer.getElementsByClassName('cc-chat')[0]
		this.console = this.htmlContainer.querySelector('.cc-console')

		if(this.room == 0 || this.mode === 'gallery'){
			setTimeout(this.navExtended.bind(this))
			setTimeout(this.navSettings.bind(this))
		}

		if(this.room > 0){
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



		// ace setup
		this.editor = Ace.edit(this.editorContainer)
		this.editor.session.on('changeMode', function(e, session) {
		    if('ace/mode/javascript' === session.getMode().$id) {
		        if(!!session.$worker) {
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
			scrollPastEnd:1,
			showLineNumbers: cc.y.settings.get('lineNumbers'),
			showGutter: cc.y.settings.get('lineNumbers'),
			tabSize: 4, useSoftTabs: false,
		})
		this.editor.commands.removeCommands([
			'gotolineend' // ctrl + e
			,'transposeletters' // ctrl + t (totally removed)
			]);

		this.editor.on('paste', function(){
			cc.roomSync('clearSelection')
		})


		// *** make all listeners toggle with active?
		this.curPos
		this.curPositions = []
		this.editor.getSession().selection.on('changeCursor', function(){
			this.curPos = this.editor.getCursorPosition()
		}.bind(this))



		this.editor.getSession().on('changeAnnotation', function(){
			let annot = this.editor.getSession().getAnnotations()
			this.validCode = true

			for(let i=0; i < annot.length; i++){
				if(annot[i].type === 'error'){
					// addMarker(annot[i].row);
					// if(!braketError)
					// console.log(annot[i].row)
					this.validCode = false
					this.consoleMessage('👀 Error line ~ '+ (annot[i].row+1) )
				}
			}
			if(this.validCode){
				// if(!braketError)
				// consoleHide()
				// removeMarkers();
			}
		}.bind(this));

		// this.consoleMessage('hello')

		// make A editor readonly (unless privs)

		if(this.room == 0 && this.mode === 'edit'){ // check userID too...
			if(this.mode === 'edit'){
				this.editor.setReadOnly(true)
				if(this.s.admin.includes(cc.p.token) || this.s.write.includes(cc.p.token)){
					this.editor.setReadOnly(false)
				}
			}
		}else{
			this.htmlContainer.style.display = 'none'
			this.active = false
		}


		// remove tracker on editor focus
		this.editor.on("focus", function() {
			if(this.mode === 'edit'){
				cc.cursorTrack(this.room)
			}
			cc.keymap.set(16, false)
			cc.keymap.set(17, false)
			this.keyDown.set(17, false)
		}.bind(this))


		// each room based on y.text shared type
		this.type = this.ydoc.getText(this.editor.id)

		// edit mode
		if(this.mode === 'edit'){
			this.aceBinding = new AceBinding(this.type, this.editor, this.provider.awareness, this.room)

			if(this.room == 0){
				this.aceCursors = new AceCursors(this.aceBinding)
			}
		}

		// drawing coords *** (P5LIVE chalkboard or notes per room??)
		// this.coords = ydoc.getArray('chalkboard-'+this.room)


		// chat room
		this.chatType = this.mode
		this.chatID = `chat_${this.editor.id}-${this.chatType}`//"chat_" + this.editor.id +

		// chat trash
		this.chatTrash = ''
		if(this.mode === 'edit' || cc.admins().includes(cc.p.token)){
			this.chatTrash = `<div class="cc-chat-trash" data-tip="Clear Chat">${cc.icons.trash}</div>`
			if((this.room == 0 && !cc.admins().includes(cc.p.token)) || (cc.y.settings.get('roomLocks') && this.s.locked && !this.s.admin.includes(cc.p.token))){
				this.chatTrash = ``
			}
		}

		// chat container
		this.chat.innerHTML = `
			<div class="cc-chat-header">
				CHAT ${this.chatTrash}
			</div>
			<div class="cc-chat-log"></div>
			<input class="cc-chat-input" type="text" placeholder="chat...">
		`

		let chatTrash = this.chat.querySelector('.cc-chat-trash')
		if(chatTrash !== null && ((this.mode == 'edit' && this.room != 0) || cc.admins().includes(cc.p.token))){
			chatTrash.addEventListener('mousedown', (event)=>{
				this.chatClear()
			})
		}

		let chatInput = this.chat.querySelector('.cc-chat-input')
		chatInput.addEventListener('keyup', (event)=>{
			if(event.keyCode == 13){
				this.chatSend(chatInput)
			}
		})
		this.chatElm = this.chat.querySelector('.cc-chat-log')
		this.chatLog = this.ydoc.getArray(this.chatID)

		this._chatLogObserver = (e, t) =>{
			e.target === this.chatLog // => true
			this.chatRender()
		}
		this.chatLog.observe(this._chatLogObserver)




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
		this.editorContainer.addEventListener("keydown", (event)=>{
			// toggle metakeys
			this.keyDown.set(event.keyCode, event.type == 'keydown') // check modifiers

			// CTRL + keys
			if(this.keyDown.get(17)){
				if(event.key == 't'){
					event.preventDefault()
					this.tidyCode()
				}

				if(event.keyCode == 13){
					event.preventDefault()
					if(this.keyDown.get(16)){
						this.mode === 'edit' ? this.recompileRemote(true) : this.recompile(true)
					}else{
						this.mode === 'edit' ? this.recompileRemote() : this.recompile()
					}
				}

			}
		});

		this.editorContainer.addEventListener("keyup", (event)=>{
			this.keyDown.set(event.keyCode, event.type == 'keydown') // check modifiers
		});


		// iFrame magic from P5LIVE (passing key/mouse = small issue on B mouseX)

		// get mouse clicks on top
		// initially inspired from here:
		// https://stackoverflow.com/a/44143731/10885535
		this.htmlContainer.addEventListener('mousemove', (event)=>{this.passMouse(event)})
		this.htmlContainer.addEventListener('mouseup', (event)=>{this.passMouse(event)})
		this.htmlContainer.addEventListener('mousedown', (event)=>{this.passMouse(event)})
		this.mouseFields = ['altKey', 'clientX', 'clientY', 'composed', 'ctrlKey', 'isTrusted', 'layerX', 'layerY', 'metaKey', 'movementX', 'movementY', 'offsetX', 'offsetY', 'pageX', 'pageY', 'screenX', 'screenY', 'shiftKey', 'x', 'y', 'button', 'buttons', 'relatedTarget', 'region']
		this.pass = false

		// keypress
		this.keyFields = ['altKey', 'bubbles', 'cancelBubble', 'cancelable', 'charCode', 'code', 'composed', 'ctrlKey', 'isTrusted', 'key', 'keyCode', 'location', 'metaKey', 'repeat', 'returnValue', 'shiftKey', 'type', 'which']

		// console.log(this.editor.id, 'ready')

		// set template or recompile on init
		if(this.active){
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

	/* PROVIDER FUNCTIONS */
	connect(){

	}

	disconnect(){

	}

	emit(key, val){
		const selfState = this.provider.awareness.getLocalState()
		selfState.type = key
		selfState.value = val
		this.provider.awareness.setLocalState(selfState)
		delete selfState.type
		this.provider.awareness.setLocalState(selfState)
	}

	navInit(){
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
			lock: `<div class="cc-nav-lock" ${this.s.admin.includes(cc.p.token) || cc.admins().includes(cc.p.token) ? 'onclick="cc.roomLock('+id+', false)" data-tip="Unlock Editor"': 'data-tip="Locked Editor" style="opacity:.6;cursor:help;"'}>${cc.icons.lock}</div>`,
			lockDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.lock}</div>`,
			unlock: `<div class="cc-nav-lock unlock" ${this.s.admin.includes(cc.p.token) || cc.admins().includes(cc.p.token) || this.s.admin.length == 1 ? 'onclick="cc.roomLock('+id+', true)" data-tip="Lock Editor"': 'data-tip="Lock Editor" style="opacity:.6;cursor:help;"'}>${cc.icons.unlock}</div>`,
			unlockDisabled: `<div style="opacity:.3;cursor:inherit;">${cc.icons.unlock}</div>`,
		}
	}

	// check user color lightness for text overlay black or white
	// https://stackoverflow.com/a/51567564/10885535
	wc_hex_is_light(color) {
	    const hex = color.replace('#', '');
	    const c_r = parseInt(hex.substr(0, 2), 16);
	    const c_g = parseInt(hex.substr(2, 2), 16);
	    const c_b = parseInt(hex.substr(4, 2), 16);
	    const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
	    return brightness > 155;
	}


	/* USER */

	// only view your own user info
	userListSelf(){
		const elmUL = this.htmlContainer.querySelector('.cc-userlist-self')
		let user = this.userParse(this.provider.awareness.clientID)
		elmUL.innerHTML = user.html
	}

	// list other users
	userList(){
		const elmUL = this.htmlContainer.querySelector('.cc-userlist')
		let ul = []
		let states = this.provider.awareness.getStates()
		cc.helpNeeded = false
		states.forEach((value, key) => {
			// ignore self
			if(this.provider.awareness.clientID !== key){
				let user = this.userParse(key)
				if(value.room == this.room || this.room == 0){
					if(user.helpNeeded || user.request || user.admin || user.write){
						ul.unshift(user.html)
						if(user.helpNeeded){
							cc.helpNeeded = true
						}
					}else{
						ul.push(user.html)
					}
				}
			}
		})

		// show users
		elmUL.querySelector('.cc-userlist-peers').innerHTML = ul.join('')
		if(this.mode === 'edit'){
			cc.cursorTrackUpdate()
		}
		cc.tipsInit()

		// pulse window
		if(this.room == 0 && this.mode === 'edit'){
			if(cc.helpNeeded){
				this.meta.classList.add('cc-meta-visible')
			}else{
				this.meta.classList.remove('cc-meta-visible')
			}
		}

		if(this.mode === 'gallery'){
			this.meta.classList.add('cc-meta-visible')
		}
	}

	// render user as html
	userParse(key){
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
		if(curName.length > curNameMax){
			curName = curName.substring(0, curNameMax) + '...'
		}


		// html help
		let helpStyle = ``
		if(user.helpNeeded){
			helpStyle = `cc-helpneeded`
		}

		let helpEmoji = user.helpNeeded ? '👋' : '✋'
		let helpNeeded = ``
		if(this.mode === 'edit'){
			if(user.isSelf){
				helpNeeded = `<div class="cc-raisehand ${helpStyle}" onclick="cc.toggleHelp();event.stopPropagation();" data-tip="Request Help">${helpEmoji}</div>`
			}else{
				if(user.helpNeeded){
					let helpAction = (this.room == 0) ? `onclick="cc.roomChange(${value.room});cc.roomWalkCheck();event.stopPropagation();" data-tip="Offer Help"` : ''

					// lower hand if admin
					if(this.room != 0 && cc.admins().includes(cc.p.token)){
						helpAction = `onclick="cc.toggleHelp(${key});event.stopPropagation();" data-tip="Lower Hand"`
					}
					helpNeeded = `<div class="cc-raisehand ${helpStyle}" ${helpAction}>${helpEmoji}</div>`
				}
			}
		}


		// set name
		let userName = `${curName}`
		if(user.isSelf){
			userName = `<span class="cc-user-rename ${helpStyle}">${curName}</span>`
		}

		// set self vs peer
		let userType = 'peer'
		if(user.isSelf){
			userType = 'self'
		}

		// fade if lost focus
		let blurStatus = ''
		if(user.blur){
			blurStatus = 'opacity: .5;'
		}

		// invert name color if light/dark background
		let userNameColor = 'color-light'
		if(this.wc_hex_is_light(value.user.color)){
			userNameColor = 'color-dark'
		}

		let userWrite = ``
		if(this.s.locked && this.mode === 'edit'){
			if(!user.isSelf){
				if(this.s.write.includes(value.user.token)){
					userWrite = this.s.admin.includes(cc.p.token) ? `<span onclick="event.stopPropagation();cc.toggleWrite(${this.room}, ${value.user.token}, false)" class="cc-user-write-active" data-tip="Toggle Write Access">${cc.icons.toggle.right}</span>` : `<span class="cc-user-write-active">${cc.icons.toggle.right}</span>`
				}else if(this.s.request.includes(value.user.token)){
					userWrite = this.s.admin.includes(cc.p.token) ? `<span onclick="event.stopPropagation();cc.toggleWrite(${this.room}, ${value.user.token}, true)" class="cc-user-write pulse" data-tip="Toggle Write Access">${cc.icons.toggle.left}</span>` : `<span class="cc-user-write pulse">${cc.icons.toggle.left}</span>`
				}else if(!this.s.admin.includes(value.user.token)){
					userWrite = this.s.admin.includes(cc.p.token) ? `<span onclick="event.stopPropagation();cc.toggleWrite(${this.room}, ${value.user.token}, true)" class="cc-user-write" data-tip="Toggle Write Access">${cc.icons.toggle.left}</span>` : ``
				}
			}
			if(!this.s.admin.includes(cc.p.token) && user.isSelf){
				if(this.s.write.includes(value.user.token)){
					userWrite = `<span class="cc-user-write-active" data-tip="Granted Write">${cc.icons.toggle.right}</span>`
				}else if(this.s.request.includes(value.user.token)){
					userWrite = `<span onclick="event.stopPropagation();cc.requestWrite(${this.room}, ${value.user.token}, false)" class="cc-user-write pulse" data-tip="Cancel Request Write">${cc.icons.toggle.left}</span>`
				}else{
					userWrite = `<span onclick="event.stopPropagation();cc.requestWrite(${this.room}, ${value.user.token}, true)" class="cc-user-write" data-tip="Request Write">${cc.icons.toggle.left}</span>`
				}
			}
		}

		let userAdmin = ''
		if(user.admin){
			userAdmin = `<span>${cc.icons.shield.empty}</span>`
		}
		if(user.adminGlobal){
			userAdmin = `<span>${cc.icons.shield.checked}</span>`
		}

		// show users room only on left side
		let userSessionAction = user.isSelf ? 'cc-user-room-self"' : `cc-user-room-action" onclick="cc.roomChange(${value.room});cc.roomWalkCheck();event.stopPropagation();" data-tip="Jump to Room"`
		let userSession = `<sup class="cc-user-room ${userSessionAction} ${userNameColor}>${value.room}</sup>`
		if(this.room !== 0 || this.mode !== 'edit'){
			userSession = ``
		}

		let trackingClass = 'cursor-eyes'
		let tracking = `onclick="cc.cursorTrack(${this.room}, ${key})" data-tip="Track Cursor" data-tip-left`
		if(user.isSelf){
			tracking = `onclick="cc.userRename()" data-tip="Set Name + Color" data-tip-left`
		}
		if(this.mode !== 'edit'){
			tracking = ``
			trackingClass = ''
		}

		let userSplitterValue = value.user.hasOwnProperty('splitter') ? value.user.splitter : 50
		let userSplitter = (this.room == 0) ? `<div class="cc-user-splitter ${userNameColor}" style="left:${userSplitterValue}%;border-left:4px solid ${value.user.color}"></div>` : ``

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
	roomList(){
		if(this.room != 0){ //  || this.mode === 'gallery'  || this.mode !== 'edit'
			let rl = this.htmlContainer.querySelector('.cc-roomlist')
			rl.innerHTML = this.roomItems()
			rl.onchange = function(elm){
				if(cc.admins().includes(cc.p.token) && this.mode === 'gallery'){
					cc.y.settings.set('room', elm.target.value)
				}else{
					cc.roomChange(elm.target.value)
				}
			}.bind(this);
			if(!cc.admins().includes(cc.p.token) && this.mode === 'gallery'){
				rl.disabled = 'disabled'
			}
			cc.tipsInit()
		}
	}

	roomItems(){
		let opts = ''

		// sort rooms based on key (as number)
		let arr = [...cc.y.rooms]
		arr.sort(function(a,b) {
		    return a[0]-b[0]
		})
		arr.forEach((v, k)=>{
			if(k > 0){
				let sel = ''
				if(k == this.room){
					sel = 'selected'
				}
				let status = ''
				if(cc.y.settings.get('mode') === 'edit' && cc.y.settings.get('roomLocks')){
					if(v[1].locked){
						status = '🔒'
					}
					if(v[1].admin.includes(cc.p.token) && !cc.admins().includes(cc.p.token)){
						status = '🛡️'
					}
				}
				opts += `<option value=${k} ${sel}>${k} _ ${v[1].name} ${status}</option>` // '<option value='+k+' '+ sel +'>'+k+' – '+v+'</option>'
			}
		})
		return opts
	}


	/* CHAT */
	chatSend(elm){
		let userSelf = this.provider.awareness.getLocalState().user
		// console.log(this.room, userSelf, elm.value)
		this.chatLog.push([{room:this.room, name:userSelf.name, color:userSelf.color, msg:elm.value}])
		// cc.chat
		elm.value = ''
	}

	chatClear(){
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
			afterOpen: function(){
				cc.vexSmall(this.rootEl);
				cc.vexFocus()
			}
		})

	}

	chatRender(){
		this.meta.classList.add('cc-meta-visible')
		let chatHTML = []
		this.chatLog.forEach(e =>{
			let urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
			let msgLinkified = e.msg.replace(urlRegex, function(url) {
				return '<a href="' + url + '" target="_blank">' + url + '</a>';
			})

			// invert name color if light/dark background
			let userNameColor = 'color-light'
			if(this.wc_hex_is_light(e.color)){
				userNameColor = 'color-dark'
			}

			chatHTML.push(`<div><span class="${userNameColor}" style="background:${e.color};">${e.name.substring(0, 10)}</span> <span>${msgLinkified}</span></div>`)
		})
		this.chatElm.innerHTML = chatHTML.join('')

		setTimeout(function(){
			this.chatElm.scrollTop = this.chatElm.scrollHeight
		}.bind(this), 10)

		setTimeout(function(){
			this.meta.classList.remove('cc-meta-visible')
		}.bind(this), 1000)



	}


	/* TOGGLE GUI/INSTANCE */
	// show/hide editor
	toggleEditor(id){
		if(this.editorContainer.style.visibility !== 'visible'){
			// this.meta.style.display = 'block'
			this.editorContainer.style.visibility = 'visible'
			if(id == this.room){
				 this.editor.focus()
			}
		}else{
			// this.meta.style.display = 'none'
			this.editorContainer.style.visibility = 'hidden'
			this.editor.blur()
			// this.editorContainer.focus()
		}
	}

	// show/hide meta
	toggleMeta(){
		if(this.meta.style.display == 'none'){
			this.meta.style.display = 'block'
		}else{
			this.meta.style.display = 'none'
		}
	}

	toggleActive(togState){
		if(togState){
			this.htmlContainer.style.display = 'block'
			this.active = true
			this.collapsed = false
			this.initEditor()
			this.chatRender()
			if(this.iframeContent.noLoop !== undefined){
				this.iframeContent.loop()
			}


			// this.userList()
			// setTimeout(()=>{this.initEditor()}, 0)
		}else{
			this.htmlContainer.style.display = 'none'
			this.active = false
			this.collapsed = true

			this.editor.getSession().off('change', function(delta){
				this.curPos = delta.start
				this.curPositions.push(delta.start)
				this.checkErrors()
			}.bind(this))

			// how to bind custom 'noLoop' from other frameworks?
			if(this.iframeContent.noLoop !== undefined){
				this.iframeContent.noLoop()
			}
		}
	}

	toggleWrite(){
		if(this.mode === 'edit'){
			let locked = true
			this.editor.setReadOnly(true)
			// console.log([this.s.admin[0], this.s.write[0], cc.p.token])
			if(this.room === 0){
				if(this.s.admin.includes(cc.p.token) || this.s.write.includes(cc.p.token)){
					locked = false
				}
			}else{
				// all other rooms
				if(cc.y.settings.get('roomLocks')){
					if(this.s.admin.includes(cc.p.token) || this.s.write.includes(cc.p.token) || !this.s.locked){
						locked = false
					}
				}else{
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

	windowError(){
		this.windowBroken = true
	}
	/* CONSOLE */
	consoleMessage(m){
		this.console.style.display = 'block'

		if(this.consoleMessageP !== m){
			this.consoleMessageP = m
			console.log(m)
			if(typeof m === 'object'){
				m = JSON.stringify(m)
			}
			this.console.value = m
		}

		if(this.validCode){
			if(this.consoleTimer != undefined){
				clearTimeout(this.consoleTimer)
			}
			this.consoleTimer = setTimeout(function(){this.consoleClear()}.bind(this), 100)
		}
	}

	consoleClear(){
		this.console.value = ''
		this.console.style.display = 'none'
		this.consoleMessageP = ''
		if(cc.y.settings.get('liveCoding') && !this.validCode){
			console.log('check errors')
		// 	this.checkErrors()
		}
	}


	/* EDITOR */

	// set template or recompile on init
	initEditor(){
		// console.log(this.editor.getValue().length)
		this.userList()
		this.userListSelf()
		this.roomList()

		if(this.type.toString() === ''){
			this.editor.setValue(this.codeTemplate, 1) // `//Room ${this.room}\n\n`+  // for debugging
			this.editor.getSession().setUndoManager(new ace.UndoManager());
		}else{
			if(this.active){
				if(cc.y.settings.get('mode') === 'gallery'){
					this.editor.setValue(this.type.toString(), -1)
					this.editor.getSession().setUndoManager(new ace.UndoManager());
					this.tidyCode() // *** make global setting??
				}
				this.editor.renderer.updateFull();
				this.editor.getSession().on('change', function(delta){
					this.curPos = delta.start
					this.curPositions.push(delta.start)
					this.checkErrors()
				}.bind(this))
				// this.checkErrors()
				setTimeout(function(){this.recompile(true)}.bind(this))
			}
			this.editor.getSession().setUndoManager(new ace.UndoManager());
		}

	}

	tidyCode(){
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
		aceEdit.gotoLine(tempPos.row+1, tempPos.column, false)
		if(this.mode === 'edit'){
			cc.editorClearSelection()
			cc.roomSync('clearSelection')
		}
	}


	/* RECOMPILING */

	// check for errors on keyup (based on settings delay)
	checkErrors(){
		// console.log(this.room +" : "+this.iframeContent.frameCount)
		clearTimeout(this.errorTimer)
		let compileDelay = this.iframeContent.frameCount === undefined ? 10 : cc.y.settings.get('liveDelay')*1000
		this.errorTimer = setTimeout(function(){this.checkErrorsWorker()}.bind(this), compileDelay)
	}

	checkErrorsWorker(){
		let annos = this.editor.getSession().getAnnotations();
		let errorsFound = false;
		for(let i=0; i < annos.length; i++){
			if(annos[i].type == 'error'){
				errorsFound = true
			}
		}

		if(errorsFound){
			this.validCode = false;
			this.checkErrors();
		}else{
			clearTimeout(this.errorTimer);
			this.validCode = true;
			this.consoleClear()
			if(cc.y.settings.get('liveCoding')){
				this.recompile() // ** true is more expected, but prob more errors
			}
		}
		// console.log([annos, 'errors: '+errorsFound, 'valid: '+this.validCode])
	}


	/* RECOMPILE */

	// share recompile of editor with remote peers
	recompileRemote(force){
		if(this.room !== 0 || this.s.admin.includes(cc.p.token) || cc.admins().includes(cc.p.token)){
			this.emit('compiled', {room: this.room, force:force})
		}
		this.recompile(force)
	}

	// build code from ace editor into iframe
	recompile(force){
		clearTimeout(this.errorTimer)
		if(this.collapsed){
			return
		}

		if(cc.safeMode){
			console.log('in safeMode! to disable, remove #bug from URL and refresh page')
			return
		}

		let pVars = {}
		if(this.iframeContent.frameCount != undefined){
			// p5 specific
			pVars.frameCount = this.iframeContent.frameCount+1
			pVars.mouseX = this.iframeContent.mouseX
			pVars.mouseY = this.iframeContent.mouseY
		}

		let codeNoComments = this.removeComments(this.editor.getValue())
		let rawLines = this.editor.session.getLines(0, this.editor.session.getLength())

		// softCompile
		if(force == undefined && !this.windowBroken){
			// p5 specific
			if(this.iframeContent.frameCount != undefined){
				let drawPos = [] //{};
				let drawPosSel = -1
				let countBrackets = false
				let braces = 0
				let softFunction = false
				let softClass = false


				let allLines = codeNoComments.split('\n')

				// sandbox
				let sandboxMatch = this.editor.getValue().match(/^\/\/\s*(hydra)*sandbox.*?\/\/.*?(hydra)*sandbox.*?\n/ism);
				if(sandboxMatch !== null){
					let currline = this.editor.getSelectionRange().start.row

					let currCode = this.editor.session.getLine(currline)
					let sandboxParts = sandboxMatch[0].split('\n')
					if(sandboxParts.indexOf(currCode) > -1){
						this.iframeContent.eval(sandboxMatch[0])
						if(!force){
							return false;
						}
					}
				}

				// test purging of comments
				// let offLines = 6;
				// console.log(rawLines[offLines]);
				// console.log(allLines[offLines]);

				// extract all functions and their line number
				for(let i=0; i < allLines.length; i++){

					// catch function or class
					if(allLines[i].includes('function ') && !countBrackets){
							countBrackets = true
							let functionName = allLines[i].match(/function ([\w\d]*)\(/)[1].trim()
							drawPos.push({type:'function', name:functionName, start:i})
					}else if(allLines[i].includes('class ') && !countBrackets){
							countBrackets = true
							let className = allLines[i].match(/class\s([\w\d]*)/)[1].trim()
							drawPos.push({type:'class', name:className, start:i})
					}

					// count {} and mark where class/function ends
					if(countBrackets){
						if(allLines[i].includes('{')){
							braces += (allLines[i].match(/{/g) || []).length
						}
						if(allLines[i].includes('}')){
							braces -= (allLines[i].match(/}/g) || []).length
							if(braces == 0){
								drawPos[drawPos.length-1].end = i
								countBrackets = false
							}
						}
					}
				}

				// check all changed positions + if custom function
				let funName = ''
				for(let i=0; i<drawPos.length; i++){
					for(let j=0; j < this.curPositions.length; j++){
						let cPos = this.curPositions[j]
						if(cPos.row >= drawPos[i].start && cPos.row <= drawPos[i].end){
							// console.log(drawPos[i].name); // debug where change occured
							if(drawPos[i].name != 'setup' && drawPos[i].name != 'preload' && drawPos[i].type == 'function'){
								softFunction = true
								drawPosSel = i
								funName = drawPos[i].name
							}else if(drawPos[i].type == 'class'){
								softClass = true
								drawPosSel = i
							}
						}
					}
				}

				// if custom function, grab where it's used
				let functionPos = []
				for(let j=0; j<drawPos.length; j++){
					if(funName == drawPos[j].name){
						// find lines where drawPos[i].name sits
						for(let i=0; i<allLines.length; i++){
							if(allLines[i].includes(drawPos[j].name + '(')){
								functionPos.push(i)
							}
						}
					}
				}

				// catch custom functions in preload + setup
				for(let i=0; i < functionPos.length; i++){
					let fPos = functionPos[i]
					for(let j=0; j < drawPos.length; j++){
						if(fPos >= drawPos[j].start && fPos <= drawPos[j].end){
							// console.log(drawPos[i].name); // debug where chage occured
							if(drawPos[j].name == 'setup' || drawPos[j].name == 'preload'){ // && !settings.cocoding.active
								softFunction = false
							}
						}
					}
				}

				// if possible, only overwrite function/class for softCompile
				if(softClass || softFunction){
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
		for(let i=0; i < scriptsList.length; i++){
			scriptsCol.push(scriptsList[i]);
		}

		for(let sc of scriptsCol){
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
		if(!sketchCode.match(/(\/\/).*(no.*protect)/g)){
			try{
				sketchCode = loopBreaker(sketchCode).code
			} catch (e) {
				this.validCode = false
				this.consoleMessage(`👀 error found near line ~ ${e.lineNumber}, ${e.description}`)
				console.log(e.description) // debug full message
			  return
			}
		}

		let fullCode = sketchCode +'\n\n' + this.codeCustom ;
		s.innerHTML = fullCode;

		// set template as iframe srcdoc
		this.iframe.srcdoc = el.innerHTML;

		// when ready, add sketch script
		this.iframe.onload = ()=>{
			this.windowBroken = false
			this.iframeContent.ccSelf = this
			this.iframeContent.document.body.appendChild(s)
			// this.validCode = true
			// this.consoleClear()

			// p5 specific
			if(pVars.hasOwnProperty('frameCount')){
				this.iframeContent.frameCount = pVars.frameCount
				this.iframeContent.mouseX = pVars.mouseX
				this.iframeContent.mouseY = pVars.mouseY
			}
			this.curPositions = []
		}
	}

	recompileLine(){
		if(this.collapsed){
			return
		}

		if(cc.safeMode){
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

	softCompile(codeType, codeName, codeStart, codeEnd){
		let curCodeTemp = '';
		if(codeType == 'function'){
			curCodeTemp = this.editor.session.getLines(codeStart, codeEnd).join('\n');
		}else if(codeType == 'class'){
			curCodeTemp = codeName + ' = class {' + this.editor.session.getLines(codeStart+1, codeEnd).join('\n');
		}
		let s = document.createElement('script');
		s.type = 'text/javascript';

		// break infinite loops
		if(!this.editor.getValue().match(/(\/\/).*(no.*protect)/g)){
			try{
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

	removeComments(code){
		return code.replace(/\/\*[\s\S]*?\*\/|([^:\}\)]|^)\/\/.*$/gm, (_, g1, g2) => Array(_.split('\n').length).join('\n'))
	}

	processLibs(code){
		let sketchTest = code.replace(/(?:\r\n|\r|\n|\t)/g, '');
		let sketchScriptsString = sketchTest.match(/(?=loadScripts|libs|scripts).*?(\])/);
		let scriptsList = [];
		if(sketchScriptsString != undefined){
			let sketchLoadScripts = sketchScriptsString[0].match(/(["'])(?:(?=(\\?))\2.)*?\1/g);
			for(let i=0; i < sketchLoadScripts.length; i++){
				if(sketchLoadScripts[i] != ''){
					scriptsList.push(sketchLoadScripts[i].replace(/["']/g, ''));
				}
			}
		}
		return scriptsList;
	}


	/* MOUSE + KEYBOARD EVENTS */

	// mouse stuff
	passMouse(event){
		this.pass = !this.pass;
		if (this.pass || event.type == 'mousedown' || event.type == 'mouseup') {
			this.processMouse(event);
		}
		cc.roomFocus = this.room
	};

	passMouseClick(event){
		this.processMouse(event);
	};

	getOpts(event, fields){
		let opts = {};
		let offX = this.htmlContainer.offsetLeft;
		fields.forEach(function(f) {
			if (f in event) {
				opts[f] = event[f];
				// *** issue with mouseX on B room.. using global mouseX..
				if(f === 'offsetX' || f === 'clientX' || f === 'pageX'|| f === 'x'){
					opts[f] = opts[f] - offX
					// console.log(opts[f])
				}
			}
		});
		return opts;
	}

	processMouse(event){
		// console.log('processing mouse')
		// console.log(event)
		let opts = this.getOpts(event, this.mouseFields);
		let copy = new MouseEvent(event.type, opts);
		// copy.x = 0
		// console.log(copy.x)
		this.iframeContent.dispatchEvent(copy);

		if(this.syncEvents){
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

	sendKey(event){
		let opts = this.getOpts(event, this.keyFields)
		let copy = new KeyboardEvent(event.type, opts)
		this.iframeContent.dispatchEvent(copy)

		if(this.syncEvents){
			this.syncEventOut('keyboard', event.type, opts)
		}
	}

	syncEventIn(evData){
		let ev = evData;
		let copy;
		if(ev.mode == 'keyboard'){
			copy = new KeyboardEvent(ev.type, ev.opts)
		}else if(ev.mode == 'mouse'){
			// let opts = this.getOpts(event, this.mouseFields);
			copy = new MouseEvent(ev.type, ev.opts)
		}
		this.iframeContent.dispatchEvent(copy)

		// p5 specific
		if(ev.hasOwnProperty('fc')){
			this.iframeContent.frameCount = ev.fc // disabled below
		}
	}

	syncEventOut(evMode, evType, evOpts){
		this.ev = {room:this.room, 'mode':evMode, 'type':evType, 'opts':evOpts} // , 'fc':this.iframeContent.frameCount

		// p5 specific
		this.ev.fc = this.iframeContent.frameCount

		if(!this.syncTimerWait){
			this.syncTimerWait = true
			this.syncTimer = setTimeout(function(){
				this.syncTimerWait = false
				this.emit('dispatchSyncEvent', this.ev)
			}.bind(this), 30) // *** play with timing, lag vs flood
		}


	}

	destroy(){
		this.chatLog.unobserve(this._chatLogObserver)
		if(this.aceCursors !== undefined){
			this.aceCursors.destroy()
		}
		this.aceBinding.destroy()
		// cc.rooms.delete(this.room)
	}

	roomExport(){
		console.log(this.room + ' !!!')
	}

	/* HTML RENDER */

	// *** one big thing or [√] break into components?
	addHTML(){
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


		if(cc.y.rooms.size > 30 || this.mode !== 'edit'){
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
		if(this.room != 0 && this.mode === 'edit'){
			newHeader.style = 'display:none;'
		}
		newMetalist.appendChild(newHeader)

		if(this.room > 0 || this.mode === 'gallery'){



			// roomlist as select pulldown
			let newSessionHolder = document.createElement('div')
			newSessionHolder.className = 'cc-roomlist-holder'
			newMetalist.appendChild(newSessionHolder)

			let newSessionlist = document.createElement('select')
			newSessionlist.setAttribute('data-tip', 'Change Room')
			newSessionlist.className = 'cc-roomlist'
			if(this.mode === 'gallery'){
				if(!cc.admins().includes(cc.p.token)){
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
				${this.room == 0 && this.s.admin.includes(cc.p.token) && this.mode === 'edit' ? this.nav.reset + this.nav.code : ''} ${this.nav.save} ${this.s.admin.includes(cc.p.token) ? this.nav.screencast : ''}
				${this.room == 0 && this.mode === 'edit' ? this.nav.merge : ''}

			</div>

			<!-- potential extended save nav ***** -->
			<div class="cc-controls-extended-save" style="display:none;">
				<div class="cc-controls-row">
					${this.nav.reset}${this.nav.about}
				</div>
			</div>

			<div class="cc-controls-extended"></div>
		`
		if(this.room == 0 || this.mode === 'gallery'){
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
		let newChat = document.createElement('div')
		newChat.className = 'cc-chat'
		newMetalist.appendChild(newChat)

		// settings
		if(this.room == 0 || this.mode === 'gallery'){
			let newSettings = document.createElement('div')
			newSettings.className = 'cc-settings'
			newMetalist.appendChild(newSettings)
		}

		// place left/right
		let roomHolder = (id == 0 && this.mode === 'edit') ? 'room-a' : 'room-b'
		if(this.mode === 'gallery'){
			roomHolder = 'room-b'
		}
		document.getElementById(roomHolder).appendChild(newContainer)

		return newContainer
	}

	navSettings(){
		let adminSettings = `<div class="cc-settings-subhead">CLASSROOM</div>
				<div data-tip="Set classroom mode" data-tip-left>
					Mode <select class="cc-settings-mode" data-tip="" onchange="cc.modeChange(this.value)">
						<option ${cc.y.settings.get('mode') == 'edit' ? 'selected' : ''}>edit</option>
						<option ${cc.y.settings.get('mode') == 'gallery' ? 'selected' : ''}>gallery</option>
					</select>
				</div>
				<div data-tip="Auto compile code on keyup" data-tip-left>
					<input class="cc-setting-checkbox" type="checkbox" ${cc.y.settings.get('liveCoding') ? 'checked':''} onchange="cc.y.settings.set('liveCoding', this.checked);">
					Live Coding

					<select class="cc-settings-livedelay" data-tip="Keyup delay in seconds" onchange="cc.y.settings.set('liveDelay', this.value)">
						${this.navSettingsLiveDelay()}
					</select> sec
				</div>
				<div data-tip="Display code line numbers" data-tip-left>
					<input class="cc-setting-checkbox" type="checkbox" ${cc.y.settings.get('lineNumbers') ? 'checked':''} onchange="cc.y.settings.set('lineNumbers', this.checked);">
					Line Numbers
				</div>
				<div data-tip="Anyone can lock their room" data-tip-left>
					<input class="cc-setting-checkbox" type="checkbox" ${cc.y.settings.get('roomLocks') ? 'checked':''} onchange="cc.y.settings.set('roomLocks', this.checked);">
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

			if(this.htmlContainer.querySelector('.cc-settings') !== undefined){
				this.htmlContainer.querySelector('.cc-settings').innerHTML = settingsHTML
			}
	}

	navSettingsLiveDelay(){
		let opts = ''
		let curDelay = cc.y.settings.get('liveDelay')
		for(let i=.5; i <= 2; i+=.5){
			let sel = ''
			if(i == curDelay){
				sel = 'selected'
			}
			opts += `<option ${sel}>${i}</option>`
		}
		return opts
	}

	navUpdate(){
		let navRoom = `
			<div class="cc-controls-row">
				${!this.s.locked || !cc.y.settings.get('roomLocks') ||this.s.locked && this.s.admin.includes(cc.p.token) ? this.nav.reset : ''}
				${this.nav.save}
				${(cc.y.settings.get('roomLocks') && this.s.admin.includes(cc.p.token)) || cc.admins().includes(cc.p.token) ? this.nav.screencast : ''}
			</div>
		`

		if(this.room != 0 && this.mode === 'edit'){
			this.htmlContainer.querySelector('.cc-controls').innerHTML = navRoom
		}


		// nav options
		let lockStatus = ''
		if(this.room > 0 && cc.y.settings.get('roomLocks')){
			if(this.room == 1 && !cc.admins().includes(cc.p.token)){
				lockStatus = this.nav.unlockDisabled
			}else if(this.s.locked){
				lockStatus = this.nav.lock
			}else{
				lockStatus = this.nav.unlock
			}
		}

		let renameStatus = this.nav.renameDisabled
		if(this.room > 1){
			renameStatus = this.nav.rename
		}
		if(cc.y.settings.get('roomLocks') && this.s.locked && !this.s.admin.includes(cc.p.token)){
			renameStatus = this.nav.renameDisabled
		}

		if(this.mode === 'edit'){
			let roomlistNav = this.htmlContainer.querySelector('.cc-roomlist-nav')
			if(roomlistNav !== null){
				this.htmlContainer.querySelector('.cc-roomlist-nav').innerHTML = `${renameStatus}${lockStatus}`
			}
			this.toggleWrite()
			this.roomList()
		}
		cc.tipsInit()
	}

	navExtended(){
		let nav = ``
		if(this.mode == 'edit'){
			nav = `
				<div class="cc-controls-row" ${cc.admins().includes(cc.p.token) ? '':'style="display:none;"'}>
					${cc.admins().includes(cc.p.token) ? this.nav.layers + this.nav.walk + this.nav.message + this.nav.splitter : ''}
				</div>
			`
		}else if(this.mode == 'gallery'){
			nav = `
				<div class="cc-controls-row" ${cc.admins().includes(cc.p.token) ? '':'style="display:none;"'}>
					${cc.admins().includes(cc.p.token) ? this.nav.walk + this.nav.message : ''}
				</div>
			`
		}
		this.htmlContainer.querySelector('.cc-controls-extended').innerHTML = nav
		cc.tipsInit()
	}
}



window.cc = {
	version: `v.${version}`,
	ydoc: new Y.Doc(), // single ydoc
	wsServer: offline ? 'ws://localhost:1234' : 'wss://classroom.p5live.org', // ws server
	rooms: new Map(), // store CocodingClassroom instances

	y:{},
	opts:{
		settings: {
			lineNumbers: true,
			liveCoding: true,
			liveDelay: 1,
			mode: 'edit',
			room: 1,
			roomLocks: false,
		},
		room: {
			name: 'Room',
			locked: false,
			admin: [],
			request: [],
			write: []
		},
	},
	bindingPath: 'bindings/p5/',
	settings: {},
	prefs: {
		classrooms: {}
	},
	safeMode: false,
	init: true,
	authed: false,
	password: '',
	max: 0,
	roomFocus: 0,
	helpNeeded: false,
	tracked: new Map(),
}

cc.settingsInit = {
	walkDelay: 3,
	splitColor: '#ed225d',
	editor: {
		fontsize: 10,
		theme: 'cobalt',
		background: true,
		backgroundcolor: '#'
	},
	snapshot: true,
	eco: true,
	tooltips: true,
	'shortcuts':{
		// 'softcompile':{
		// 	'name':'Soft-Compile'
		// 	,'key':'ctrl+enter'
		// 	,'callback':'recompile()'
		// },
		// 'hardcompile':{
		// 	'name':'Hard-Compile'
		// 	,'key':'ctrl+shift+enter'
		// 	,'callback':'recompile(true)'
		// },
		'editor':{
			'name':'Editor Toggle'
			,'key':'ctrl+e'
			,'callback':'editorToggle()'
		},
		'menu':{
			'name':'Menu Toggle'
			,'key':'ctrl+m'
			,'callback':'menuToggle()'
		},
		// 'settings':{
		// 	'name':'Settings Toggle'
		// 	,'key':'ctrl+,'
		// 	,'callback':'showSettings(true)'
		// },
		// 'references':{
		// 	'name':'References Toggle'
		// 	,'key':'ctrl+r'
		// 	,'callback':'toggleRef()'
		// },
		// 'chalkboard':{
		// 	'name':'Chalkboard Toggle'
		// 	,'key':'ctrl+b'
		// 	,'callback':'toggleChalkboard()'
		// },
		// 'autocompile':{
		// 	'name':'Live-Coding Toggle'
		// 	,'key':'ctrl+a'
		// 	,'callback':'liveCodingToggle()'
		// },
		// 'newsketch':{
		// 	'name':'New Sketch'
		// 	,'key':'ctrl+n'
		// 	,'callback':'loadDefault()'
		// },
		'tidy':{
			'name':'Tidy Code'
			,'key':'ctrl+t'
			// ,'callback':'tidyCode(editor)'
		},
		'codecomment':{
			'name':'Comment Code'
			,'key':'meta+/'
			,'init': 'editor.commands.bindKey(settings.shortcuts["codecomment"].key, "togglecomment")'
		},
		'fontbigger':{
			'name':'Increase Fontsize'
			,'key':'ctrl+='
			,'callback':'fontSizeAdjust(0.25)'
		},
		'fontsmaller':{
			'name':'Decrease Fontsize'
			,'key':'ctrl+-'
			,'callback':'fontSizeAdjust(- 0.25)'
		},
		// 'pause':{
		// 	'name':'Pause'
		// 	,'key':'ctrl+p'
		// 	,'callback':'pauseSketch()'
		// },
		'snapshot':{
			'name':'Export Snapshot'
			,'key':'ctrl+s'
			,'callback':'savePNG()'
		},
		// 'import':{
		// 	'name':'Import Sketch'
		// 	,'key':'ctrl+o'
		// 	,'callback':'importSketchesDialog()'
		// },
		// 'instagram':{
		// 	'name':'Instagram Window'
		// 	,'key':'ctrl+i'
		// 	,'callback':'pop720()'
		// },
		'jump':{
			'name':'Quick Sketch Jump'
			,'key':'ctrl' // modifier for 1-0
			,'init':'setupJumpSketches(settings.shortcuts["jump"].key)'
			,'tippy':'Then combine w/ 1, 2,...0 to jump thru sketches'
		}
	},
}


/* UTILS */
cc.cloneOBJ = function(obj){
	return JSON.parse(JSON.stringify(obj))
}


/* SETTINGS */
cc.settingsSave = function(){
	localStorage.setItem('cc-settings', JSON.stringify(cc.settings))
}

cc.settingsLoad = function(){
	let tempSettings = localStorage.getItem('cc-settings')
	if(tempSettings !== null){
		cc.settings = JSON.parse(cc.cloneOBJ(tempSettings))

		// double check no missing init settings
		let addedSetting = false
		Object.keys(cc.settingsInit).forEach(function(k){
			if(!cc.settings.hasOwnProperty(k)){
				cc.settings[k] = cc.settingsInit[k]
				addedSetting = true
			}else if(typeof cc.settingsInit[k] === 'object'){
				Object.keys(cc.settingsInit[k]).forEach(function(kk){
					if(!cc.settings[k].hasOwnProperty(kk)){
						cc.settings[k][kk] = cc.settingsInit[k][kk]
						addedSetting = true
					}
				});
			}
		});
		if(addedSetting){
			cc.settingsSave()
		}
	}else{
		localStorage.setItem('cc-settings', JSON.stringify(cc.settingsInit))
		setTimeout(cc.settingsLoad, 0)
	}
}

cc.settingsParse = function(){
	// process all settings
	Array.from(document.querySelectorAll('.cc-code')).forEach((element,index) => {element.style.fontSize = cc.settings.editor.fontsize + 'pt'});

}

cc.editorFontSize = function(val){
	cc.settings.editor.fontsize = val
	Array.from(document.querySelectorAll('.cc-code')).forEach((element,index) => {element.style.fontSize = val + 'pt'});
	cc.settingsSave()
}

cc.editorLineNumbers = function(val){
	for (const room of cc.rooms.values()) {
	  room.editor.setOptions({
			showLineNumbers: val, // false
			showGutter: val, // false
		});
	}

	// document.getElementById('cc-settings-linenumbers').checked = val
}

cc.editorClearSelection = function(){

	// move cursor to existing pos..(?!) to remove selection on paste/tidy
	let tempEditor = cc.rooms.get(cc.p.room).editor
	let tempPos = tempEditor.getCursorPosition()
	// tempEditor.gotoLine(tempPos.row+1, tempPos.column, false)
}

cc.modeChange = function(val){
	if(val === 'gallery'){
		cc.y.settings.set('room', 1);
	}
	cc.y.settings.set('mode', val);
}

cc.roomMapSync = function(roomID, key, val){
	let curMap = cc.y.rooms.get(roomID.toString())
	curMap[key] = val
	cc.y.rooms.set(roomID.toString(), curMap)
}

cc.roomRename = function(id){
	vex.dialog.open({
		input:`
			<div id="cc-room-setting" class="vex-form">
					<div class="cocoding-rename-input" >
						<label for="nick">Name</label><br>
						<input id="roomnick" name="nick" type="text" value="${cc.y.rooms.get(id.toString()).name}">
					</div>
			</div>
		`,
		callback: function (data) {
			if(data){
				if(data.nick != null && data.nick != cc.y.rooms.get(id.toString()).name){
					data.nick.replace(/["']/g, '')
					let nameClean = cc.sanitize(data.nick)
					if(nameClean.length > 1){
						cc.roomMapSync(id, 'name', nameClean)
					}
				}
				cc.rooms.get(id).roomList()
				cc.roomSync('roomList')
			}
		},
		afterOpen: function(){
			cc.vexSmall(this.rootEl)
			setTimeout(function(){document.getElementById('roomnick').select()}, 0)
			cc.tipsInit()
		}
	})
}

// switch rooms in B window
cc.roomChange = function(newID){

		// check and force newID into range of available roomID's
		newID = parseInt(newID)
		if(newID == -1){
			console.log('empty')
			return
		}else if(newID == 0 || !cc.y.rooms.has(newID.toString())){
			console.log(newID + ' not found')
			newID = cc.y.settings.get('mode') === 'edit' ? 1 : 0
		}

		// store current room pref
		let curID = cc.p.room
		if(curID === undefined){
			curID = 1
		}

		// only change rooms if new selection
		if(curID != newID){

			// check room exists
			if(cc.rooms.has(curID)){

				// disable current room
				cc.rooms.get(curID).toggleActive(false)

				//disable ace cursors if active
				if(cc.rooms.get(curID).aceCursors !== undefined){

					// remove any lasting selections
					cc.rooms.get(curID).editor.selection.moveTo(0, 0);
					cc.provider.awareness.setLocalStateField('cursor', {id:cc.ydoc.clientID, ace:'editor'+(curID), sel:false})
					cc.rooms.get(curID).aceCursors.destroy()
				}

				if(cc.rooms.get(curID).s.admin.includes(cc.p.token) || cc.admins().includes(cc.p.token)){
					cc.toggleSyncEvents(curID, false)
				}
			}
		}
			// setTimeout(function(){
				if(cc.y.settings.get('mode') === 'edit'){
					cc.rooms.get(newID).aceCursors = new AceCursors(cc.rooms.get(newID).aceBinding)
				}
				cc.rooms.get(newID).toggleActive(true)
			// }, 500)

		// *** remove yourself from here... or add roomID to cursor..

		cc.emit('room', newID, true)
		cc.toggleUserKey('help', false)

		cc.p.room = parseInt(newID)
		cc.savePrefs()
		cc.userListsSelf()
		cc.userListsLocal()
		cc.roomSync('userList')

		if(cc.y.settings.get('mode') == 'edit'){
			cc.rooms.get(newID).navUpdate()
		}else{
			// keep settings open if so between rooms
			let settingsPanel = cc.rooms.get(curID).meta.querySelector('.cc-settings')
			if(cc.computedStyle(settingsPanel,'display') != 'none'){
				setTimeout(function(){cc.settingsToggle(newID)})
			}
			cc.settingsToggle(curID, true)


			// keep roomwalk green if active across rooms
			let roomWalkElm = cc.rooms.get(newID).htmlContainer.querySelector('.cc-roomwalk')
			if(roomWalkElm !== null){
				if(cc.timerWalk != undefined){
					if(!roomWalkElm.classList.contains('cc-nav-active')){
						roomWalkElm.classList.add('cc-nav-active')
					}
				}else{
					roomWalkElm.classList.remove('cc-nav-active')
				}
			}
			// ** toggle walk here too
		}
}

cc.userRooms = function(){
	let usedRooms = [...cc.provider.awareness.getStates().values()].map(a => a.hasOwnProperty('room') ? a.room : 0)
	usedRooms.sort(function(a,b) {
		return a-b
	})
	return [...new Set(usedRooms)]
}

cc.roomWalkCheck = function(){
	if(cc.timerWalk !== undefined){
		cc.roomWalk()
	}
}

cc.roomWalk = function(force){
	let elm = cc.rooms.get(cc.roomFocus).htmlContainer.querySelector('.cc-roomwalk')

	// toggle off if called while active
	if(cc.timerWalk != undefined && force === undefined){
		clearInterval(cc.timerWalk)
		cc.timerWalk = undefined
		elm.style.background = '#444'
		elm.classList.remove('cc-nav-active')
		return
	}else if(force){
		// used if changing walkDelay
		clearInterval(cc.timerWalk)
		cc.timerWalk = undefined
	}

	cc.roomCurrent = 0

	// create pulse to wander rooms + visual feedback
	cc.timerWalk = setInterval(function(){
		if(cc.y.settings.get('mode') == 'edit'){
			let userRooms = cc.userRooms()
			cc.roomCurrent++
			if(userRooms.length > 1){
				cc.roomChange(userRooms[cc.roomCurrent % userRooms.length])
			}
		}else{
			let curRoom = ((parseInt(cc.y.settings.get('room')) + 1) % cc.y.rooms.size)
			if(curRoom == 0){
				curRoom = 1
			}
			cc.y.settings.set('room', curRoom)
		}
	}, cc.settings.walkDelay * 1000)
	elm.style.background = '#888'
	elm.classList.add('cc-nav-active')
}

cc.roomLock = function(roomID, lock){
	let adminsList = [...new Set([...cc.y.rooms.values()].map(a => a.hasOwnProperty('admin') ? a.admin : 0).flat())]
	//console.log(adminsList.includes(cc.p.token))
	// return
	if(lock){
		if(!adminsList.includes(cc.p.token) || cc.admins().includes(cc.p.token)){
			// let room = cc.y.rooms.get(id.toString())
			let curMap = cc.y.rooms.get(roomID.toString())
			// console.log(curMap)
			if(!cc.admins().includes(cc.p.token)){
				curMap.admin.push(cc.p.token.toString())
			}
			curMap.locked = true
			cc.y.rooms.set(roomID.toString(), curMap)
		}else{
			// *** poll and share which room?
			cc.alertMsg('Already locked another room, unlock it first...')
		}
	}else if(!lock){
		if(cc.admins(roomID).includes(cc.p.token)){
			let curMap = cc.y.rooms.get(roomID.toString())
			if(!cc.admins().includes(cc.p.token)){
				curMap.admin = curMap.admin.filter(item => item !== cc.p.token.toString())
			}else{
				curMap.admin = [cc.p.token.toString()]
			}
			curMap.locked = false
			cc.y.rooms.set(roomID.toString(), curMap)
		}

	}
}

cc.roomAdd = function(elm){
	// only allow admin + less than 30 rooms
	if(cc.admins().includes(cc.p.token) && cc.y.rooms.size < 30){
		elm.classList.add('pulse') // start feedback

		// grab rooms count (array size vs index), use for key
		let roomsCount = cc.y.rooms.size

		// adopt standard room options + add to ymap
		let roomOpts = cc.cloneOBJ(cc.opts.room)
		roomOpts.admin.push(cc.p.token)
		cc.y.rooms.set(roomsCount.toString(), roomOpts)

		// parse ymap (adds local room instance) + share message to others
		cc.roomsParse()
		cc.roomSync('roomList')
		elm.classList.remove('pulse') // end feedback
	}
}

// cc.roomRemove = function(roomID, elm){
// 	if(cc.prefs.user.admin){
// 		elm.classList.add('pulse')
// 		cc.rooms.get(roomID).editor.setValue('')

// 		// setTimeout(function(){
// 			cc.rooms.delete(roomID)
// 			cc.y.rooms.delete(roomID.toString())
// 			cc.roomChange(1)
// 			cc.emit('roomRemove', roomID)
// 		// }, 100)

// 		setTimeout(function(){
// 			cc.roomSync('roomList')
// 			elm.classList.remove('pulse')
// 		}, 500)
// 	}
// }


cc.roomsParse = function(){
	let arr = [...cc.y.rooms]
	arr.sort(function(a,b) {
	    return a[0]-b[0]
	})

	arr.forEach((v, k)=>{
		if(!cc.rooms.has(parseInt(k))){
			cc.rooms.set(parseInt(k), new CocodingClassroom(cc.binding, cc.ydoc, cc.provider, parseInt(k)))
		}
	})

	cc.rooms.get(cc.p.room).roomList()

	// for(const k of cc.y.rooms.keys()){
	// 	if(!cc.rooms.has(parseInt(k))){
	// 		cc.rooms.set(parseInt(k), new CocodingClassroom(cc.binding, cc.ydoc, cc.provider, parseInt(k)))
	// 	}
	// }

}

cc.destroy = function(){
	for(let c of cc.rooms.values()){
		c.toggleActive(0)
		c.destroy()
	}
	cc.y.rooms.unobserve(cc.y._roomsObserver)
	cc.provider.awareness.destroy()
	cc.rooms = new Map()
	// cc.provider.destroy()
}

cc.broadcastMessage = function(msg){
	if(msg == undefined){
		vex.dialog.open({
		input:`
			<div id="cc-room-setting" class="vex-form">
					<div class="cocoding-rename-input" ><label for="nick">Broadcast Message</label><br>
					<input type="text" id="broadcast-message" name="broadcast"></div>
			</div>
		`,
		callback: function (data) {
			if(data){
				if(data.broadcast != null){
					cc.emit('broadcastMessage', data.broadcast)
				}
			}
		},
		afterOpen: function(){
			cc.vexSmall(this.rootEl)
			setTimeout(function(){document.getElementById('broadcast-message').select()}, 0)
		}
	})
		return
	}
	cc.emit('broadcastMessage', msg)
}

cc.roomSync = function(msg){
	cc.emit(msg, true)
}

cc.toggleSyncEvents = function(roomID, force){
	if(cc.rooms.get(roomID).s.admin.includes(cc.p.token) || cc.admins().includes(cc.p.token)){
		let elm = cc.rooms.get(roomID).htmlContainer.querySelector('.cc-nav-radio')
		if(elm === null){
			return
		}
		let syncCheck = cc.rooms.get(roomID).syncEvents
		cc.rooms.get(roomID).syncEvents = (force === undefined)? !syncCheck : force
		if(cc.rooms.get(roomID).syncEvents){
			elm.classList.add('cc-nav-active')
		}else{
			elm.classList.remove('cc-nav-active')
		}
	}
}

cc.emit = function(key, val, update){
	// console.log('updating: ' +key)
	const selfState = cc.provider.awareness.getLocalState()
	selfState.type = key
	selfState.value = val
	if(update){
		selfState[key] = val
		// console.log(key)
	}
	cc.provider.awareness.setLocalState(selfState)
	delete selfState.type
	// console.log(selfState[key])
	cc.provider.awareness.setLocalState(selfState)
}


cc.roomExport = function(roomID){

	// check for custom binding
	if(cc.binding.hasOwnProperty('roomExport')){
		cc.binding.roomExport(roomID)
	}else{
		// *** make just plain text file, without formatting..

		let tCode = cc.rooms.get(roomID).editor.getValue()
		let tName = cc.y.rooms.get(roomID.toString()).name

		vex.dialog.open({
			input:`
				<div id="cc-room-setting" class="vex-form">
						<div class="cocoding-rename-input" ><label for="nick">Sketch name:</label><br>
						<input id="roomnick" name="nick" type="text" value="${tName}"></div>
				</div>
			`,
			callback: function (data) {
				if(data){
					let tempName = data.nick
					let tName = cc.sanitize(tempName)
					let tFilename = 'CC_'+tName + cc.timeStampFile()
					cc.exportTXT(tCode, tFilename + '.txt')
					cc.roomImage(roomID, tFilename)
				}
			},
			afterOpen: function(){
				cc.vexSmall(this.rootEl)
				setTimeout(function(){document.getElementById('roomnick').select()}, 0)


			}
		})
		// let tCode = cc.rooms.get(roomID).editor.getValue()
		// let tName = cc.y.rooms.get(roomID) //cc.rooms.get(roomID).name
		// let tFilename = 'CC_'+tName + cc.timeStampFile()
		// cc.exportTXT(tCode, tFilename + '.txt')
		// cc.roomImage(roomID, tFilename)
	}

}
// cc.roomExport = function(roomID){
// 	let tExport = {
// 		"version": "1.3.7",
// 		"revision": 42,
// 		"structure": [],
// 		"count": {
// 			"sketches": 0,
// 			"folders": 0
// 		}
// 	};



// 	let tCode = cc.rooms.get(roomID).editor.getValue()
// 	let tName = cc.y.rooms.get(roomID) //cc.rooms.get(roomID).name

// 	let tempName = prompt('Sketch name:', tName)
// 	if(tempName && tempName !== null){
// 		let tName = cc.sanitize(tempName)
// 		let tSketch = {
// 			"name": tName,
// 		      "mod": cc.timeDate(),
// 		      "type": "sketch",
// 		      "code": tCode
// 		}
// 		tExport.structure.push(tSketch)
// 		tExport.count.sketches++
// 		let tFilename = 'CC_'+tName + '_' + cc.timeStampFile()
// 		cc.exportJSON(tExport, tFilename + '.json')
// 		cc.roomImage(roomID, tFilename)
// 	}
// }


cc.roomImage = function(roomID, filename){
	cc.binding.roomImage(roomID, filename)
}


cc.exportJSON = function(jsonData, jsonFilename){
	const filename = jsonFilename;
	const jsonStr = JSON.stringify(jsonData, undefined, 2);

	let element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

cc.exportTXT = function(txtData, txtFilename){
	let blob = new Blob([txtData], { type: "text/plain;charset=utf-8" });
    // saveAs(blob, txtFilename + ".txt");
    window.URL = window.URL || window.webkitURL;
    let element = document.createElement('a');
	element.setAttribute('href', window.URL.createObjectURL(blob));
	element.setAttribute('download', txtFilename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

cc.timeDate = function(){
	let d = new Date() ;
	d.setTime( d.getTime() - new Date().getTimezoneOffset()*60*1000 );
	return d.getTime();
}

cc.timeStamp = function(timeInput){
	let d = new Date();
	d.setTime( d.getTime() - new Date().getTimezoneOffset()*60*1000 );
	if(timeInput != undefined){
		d = new Date(timeInput * 1);
	}
	return d.toISOString().replace(/[^0-9]/g, '').slice(0, -3);
}

cc.timeStampFile = function(timeInput){
	return '_' + cc.timeStamp(timeInput);
}


// follow users cursor on demand (per split-screen!)
cc.cursorTrack = function(room, id){
	let elm = cc.rooms.get(room).htmlContainer.querySelector('.cc-userlist-peers').querySelectorAll('.cc-user-id-'+id)[0]
	let tracked = cc.rooms.get(room).htmlContainer.querySelector('.cc-userlist-peers').querySelectorAll('.cc-user-tracking')[0]

	// remove tracker on editor focus
	if(id == undefined){
		if(cc.tracked.has(room)){
			cc.cursorTrackRemove(room)
			cc.cursorTrackUpdate()
		}
		return
	}

	// check if existing, remove, add
	if(elm == tracked || tracked !== undefined){
		cc.cursorTrackRemove(room)
	}else{
		cc.tracked.set(room, {id: id, interval: null})
	}
	cc.cursorTrackUpdate()
}

// remove tracking on toggle or lost cursor
cc.cursorTrackRemove = function(room){
	let tracking = cc.tracked.get(room)
	if(tracking !== undefined){
		let elm = cc.rooms.get(room).htmlContainer.querySelector('.cc-userlist-peers').querySelectorAll('.cc-user-id-'+tracking.id)[0]
		let tracked = cc.rooms.get(room).htmlContainer.querySelector('.cc-userlist-peers').querySelectorAll('.cc-user-tracking')[0]

		if(tracked !== undefined){
			tracked.classList.remove('cc-user-tracking')
		}
		if(tracking.interval !== null){
			clearInterval(tracking.interval)
		}
		cc.tracked.delete(room)
	}
}

// add cursor tracking style + interval
cc.cursorTrackUpdate = function(){
	for(let [room, tracking] of cc.tracked){
		let elm = cc.rooms.get(room).htmlContainer.querySelector('.cc-userlist-peers').querySelectorAll('.cc-user-id-'+tracking.id)[0]
		let tracked = cc.rooms.get(room).htmlContainer.querySelector('.cc-userlist-peers').querySelectorAll('.cc-user-tracking')[0]

		// trash if user reloaded page
		if(elm === undefined){
			cc.cursorTrackRemove(room)
			return
		}

		// add tracking style + interval
		elm.classList.add('cc-user-tracking')
		if(tracking.interval == null){
			tracking.interval = setInterval(()=>{
				let states = this.provider.awareness.getStates()
				let value = states.get(tracking.id)
				let cursorEditor = 'editor'+(room+1)
				let cursor = 'cursor'// + cursorEditor
				// console.log([value[cursor].ace, cursorEditor]) // debug
				if(value !== undefined && value.hasOwnProperty(cursor)){
					if(value[cursor].ace === cursorEditor){
						let pos = cc.rooms.get(room).editor.getSession().doc.indexToPosition(value[cursor].head)
						cc.rooms.get(room).editor.renderer.scrollToLine(pos.row, true, true);
					}
				}else{
					// catch interval broken on user refresh
					cc.cursorTrackRemove(room)
				}
			}, 200)
		 }
	}
}

cc.userRename = function(){
	vex.dialog.open({
		input:`
			<div id="cc-user-setting" class="vex-form">
				<div id="cc-user-rename-color" class="cc-user-setting-color-holder"><label for="color">Color</label><br>
				<input type="color" class="cc-user-setting-color" name="usercolor" value="${cc.prefs.user.color}"></div>
				<div id="cocoding-rename-nick" class="cocoding-rename-input" ><label for="nick">Nickname</label><br>
				<input id="cocodingnick" name="nick" type="text" value="${cc.prefs.user.name.replace(/["']/g, '')}"></div>
			</div>
		`,
		callback: function (data) {
			if(data){
				if(data.nick != null && data.nick != cc.prefs.user.name){
					data.nick.replace(/["']/g, '')
					let nameClean = cc.sanitize(data.nick)
					if(nameClean.length > 1){
						cc.prefs.user.name = nameClean
					}
				}
				if(data.usercolor != undefined && data.usercolor != cc.prefs.user.color){
					cc.prefs.user.color = data.usercolor
				}

				cc.savePrefs()
				cc.emit('user', cc.prefs.user, true)
				cc.roomSync('userList')
				cc.userListsSelf()
			}
		},
		afterOpen: function(){
			cc.vexSmall(this.rootEl)
			setTimeout(function(){document.getElementById('cocodingnick').select()}, 0)
		}
	})
}

cc.sanitize = function(str){
	return str.replace(/["']/g, '').trim()
}

cc.userColor = function(newColor){
	let curColor = cc.prefs.user.color
	if(newColor !== curColor){
		cc.prefs.user.color = newColor
		cc.savePrefs()
		// cc.provider.awareness.setLocalStateField('user', cc.prefs.user)
		cc.emit('user', cc.prefs.user, true)
		cc.roomSync('userList')
		cc.userListsSelf()
	}
}

cc.userListsLocal = function(){
	cc.rooms.get(0).userList()
	cc.rooms.get(cc.p.room).userList()
}

cc.userListsSelf = function(){
	cc.rooms.get(0).userListSelf()
	cc.rooms.get(cc.p.room).userListSelf()
	cc.tipsInit()
}

// rough merge of A to B
cc.mergeDialog = function(){
	document.getElementById('merge-holder').style.display = 'block'
	cc.differ = new AceDiff({
			  // ace: window.ace, // You Ace Editor instance
			  mode: 'ace/mode/javascript',
			  theme: 'ace/theme/cobalt',
			  element: '.merge-compare',
			  // diffGranularity: 'broad',
			  left: {
			    content: cc.rooms.get(0).editor.getValue(),
			    editable: false,
			    // copyLinkEnabled: false

			  },
			  right: {
			    content: cc.rooms.get(cc.p.room).editor.getValue(),
			    copyLinkEnabled: false
			  },
			});

			let diffOptions = {
				useWorker: false, // https://stackoverflow.com/a/65721242/10885535
				showPrintMargin: false,
				animatedScroll: false,
				displayIndentGuides: false,
				showLineNumbers: true,
				showGutter: true,
				tabSize: 4, useSoftTabs: false,
			}
			let diffEditors = cc.differ.getEditors()
			diffEditors.left.setOptions(diffOptions)
			diffEditors.right.setOptions(diffOptions)

	// alt routes:
	// https://github.com/ace-diff/ace-diff
	// https://github.com/kpdecker/jsdiff
	// https://stackoverflow.com/a/55511464/10885535
}

cc.mergeClose = function(){
	let diffEditors = cc.differ.destroy()//.getEditors()
	document.getElementById('merge-holder').style.display = 'none'
}

cc.mergeCode = function(){
	let diffEditors = cc.differ.getEditors()
	cc.rooms.get(cc.p.room).editor.setValue(diffEditors.right.getValue(), -1)
	cc.emit('clearSelection')
	cc.mergeClose()
	// cc.rooms.get(cc.p.room).recompile()
	cc.rooms.get(cc.p.room).recompileRemote()
}

cc.reset = function(id){
	// *** maybe not needed when re-drawing nav!
	if(cc.rooms.get(id).s.locked && !cc.admins(id).includes(cc.p.token)){
		cc.alertMsg('Sorry, ask admin of room to reset it.')
		return
	}
	// reset dialog
	vex.dialog.confirm({
		unsafeMessage: 'Replace code with new sketch?',
		callback: function (value) {
			if (value) {
				let e1 = cc.rooms.get(id).editor.setValue(cc.rooms.get(id).codeTemplate, -1)
				cc.rooms.get(id).recompileRemote()
				cc.rooms.get(id).editor.renderer.scrollToLine(0, false, true)
			}
		},
		afterOpen: function(){
			cc.vexSmall(this.rootEl);
			cc.vexFocus()
		}
	})
}

cc.code = function(){
	let templateCode = cc.rooms.get(0).editor.getValue()
	vex.dialog.confirm({
		unsafeMessage: 'Sync code in rooms with main code?',
		callback: function (value) {
			if (value) {
				for(let c of cc.rooms.values()){
					c.editor.setValue(templateCode, -1)
				}
			}
		},
		afterOpen: function(){
			cc.vexSmall(this.rootEl);
			cc.vexFocus()
		}
	})

}

// *** purge
// cc.save = function(id){
// 	let curCode = cc.rooms.get(id).editor.getValue()
// 	let baseCode = utf8_to_b64(curCode)

// 	let url = 'https://p5live.org/?code=' + baseCode
// 	window.open(url, '_blank').focus();
// }

// https://developer.mozilla.org/de/docs/Web/API/WindowOrWorkerGlobalScope/btoa
function utf8_to_b64(str) {
	return window.btoa(unescape(encodeURIComponent(str)));
}

cc.toggleUserKey = function(key, value){
	if(!cc.provider.awareness.getLocalState()){
		return
	}
	let user = cc.provider.awareness.getLocalState().user
	let curVal = user[key];
	// if(helpStatus !== undefined){
	curVal = !curVal;
	if(value !== undefined){
		curVal = value
	}
	cc.prefs.user[key] = curVal

	cc.emit('user', cc.prefs.user, true)
	cc.roomSync('userList')
	cc.userListsSelf()
	return curVal
}

cc.setUserKey = function(userID, key, value){
	const states = cc.provider.awareness.getStates()
	const update = states.get(userID)
	let user = update.user
	// console.log(user)
	// user[key] = value
}

cc.toggleHelp = function(userID){
	// lower hand if sent by admin
	if(userID !== undefined){
		cc.emit('lowerhand', userID)
		return
	}

	let helpStatus = cc.toggleUserKey('help')
}

cc.toggleBlur = function(status){
	let blurStatus = cc.toggleUserKey('blur', status)
}

cc.toggleWrite = function(roomID, token, value){
	let curMap = cc.y.rooms.get(roomID.toString())
	if(value){
		curMap.write.push(token.toString())
		if(curMap.request.includes(token.toString())){
			curMap.request = curMap.request.filter(item => item !== token.toString())
		}
	}else{
		curMap.write = curMap.write.filter(item => item !== token.toString())
	}
	cc.y.rooms.set(roomID.toString(), curMap)
	cc.userListsLocal()
	// cc.emit('toggleWrite', roomID)
}

cc.requestWrite = function(roomID, token, value){
	let curMap = cc.y.rooms.get(roomID.toString())
	if(value){
		curMap.request.push(token.toString())
	}else{
		curMap.request = curMap.write.filter(item => item !== token.toString())
	}
	cc.y.rooms.set(roomID.toString(), curMap)
	cc.userListsLocal()
	cc.emit('requestWrite', roomID)
}

cc.showUsers = function(){
	let cursorSel = document.getElementsByClassName('cursor-label');
	for(let i=0; i < cursorSel.length; i++){
		cursorSel[i].classList.add('cursor-show')
	}
}

cc.hideUsers = function(){
	let cursorSel = document.getElementsByClassName('cursor-label');
	for(let i=0; i < cursorSel.length; i++){
		cursorSel[i].classList.remove('cursor-show')
	}
}

cc.getParam = function(paramSearch){
	let params = document.location.search.substring(1).split('&');
	for(let i=0; i<params.length; i++){
		let keyVal = params[i].split('=');
		if(keyVal[0] == paramSearch){
			return keyVal[1];
		}
	}
}

cc.setPref = function(prop, val){
	cc.prefs[prop] = val
	cc.savePrefs()
	// cc.localStorage(prop, val)
}

cc.savePrefs = function(){
	// cc.localStorage('cc-prefs', cc.prefs)
	localStorage.setItem('cc-prefs', JSON.stringify(cc.prefs));
}

cc.initPrefs = function(){
	cc.savePrefs()
	cc.prefs = JSON.parse(localStorage['cc-prefs'])
}

cc.getPrefs = function(){
	if(cc.prefs !== null && localStorage.hasOwnProperty('cc-prefs') && localStorage['cc-prefs'] !== null){
		cc.prefs = JSON.parse(localStorage['cc-prefs'])
	}else{
		cc.initPrefs()
	}

}

cc.localStorage = function(prop, val){
	if(arguments.length > 1){
		localStorage.setItem(prop, JSON.stringify(val));
	}else{
		if(localStorage.hasOwnProperty(prop)){
			return JSON.parse(localStorage[prop])
		}else{
			localStorage.setItem(prop, JSON.stringify('{}'));
		}
	}
}

/* General Alert */
cc.alertMsg = function(txt){
	vex.dialog.alert({
		unsafeMessage:txt.split('\n').join('<br>'),
		afterOpen: function(){
			cc.vexSmall(this.rootEl);
		}
	})
}

cc.vexFocus = function(){
	setTimeout(function(){document.getElementsByClassName('vex-dialog-button-primary')[0].focus();}, 500);
}

cc.vexSmall = function(elm){
	elm.classList.add('vex-small');
}

cc.tipsInit = function(){
	// purge previous for dynamic render
	Array.from(document.querySelectorAll('.tooltip')).forEach(el => {
		el.remove()
	})

	// ignore if false
	if(!cc.settings.tooltips){
		return
	}

	// built upon: https://stackoverflow.com/a/69340293/10885535
	Array.from(document.querySelectorAll('[data-tip]')).forEach(el => {
		// tip
		let tip = document.createElement('div');
		tip.classList.add('tooltip');
		tip.innerText = el.getAttribute('data-tip');
		document.body.appendChild(tip);

		// arrow
		let arrow = document.createElement('div');
		arrow.classList.add('tooltip-arrow')
		tip.appendChild(arrow)

		// position tip + arrow once added
		setTimeout(()=>{
			let elmPos = el.getBoundingClientRect()
			let tipPos = tip.getBoundingClientRect()
			let tipLeft = elmPos.left + (elmPos.width - tipPos.width)/2
			let tipTop = elmPos.bottom + 5
			let arrowLeft = tipPos.width/2 - 5
			let arrowTop = -4

			if(el.hasAttribute('data-tip-left')){
				tipLeft = elmPos.left - tipPos.width - 5
				tipTop = elmPos.top + elmPos.height/2 - tipPos.height/2
				arrowLeft = tipPos.width - 6
				arrowTop = tipPos.height/2 - 5
				arrow.style.borderLeft = 0
				arrow.style.borderBottom = 0
			}else if(el.hasAttribute('data-tip-right')){
				tipLeft = elmPos.right + 5
				tipTop = elmPos.top + elmPos.height/2 - tipPos.height/2
				arrowLeft = - 4
				arrowTop = tipPos.height/2 - 5
				arrow.style.borderRight = 0
				arrow.style.borderTop = 0
			}else{
				arrow.style.borderRight = 0
				arrow.style.borderBottom = 0
			}

			if(tipLeft < 5){
				tipLeft = 5
			}
			tip.style.left = tipLeft + 'px'
			tip.style.top = tipTop + 'px'
			arrow.style.left = arrowLeft + 'px'
			arrow.style.top = arrowTop + 'px'
		}, 0)

		// toggle with mouse
		el.onmouseover = e => {
			tip.style.opacity = 1
			tip.style.visibility = 'visible'
			e.stopPropagation() // stop parent
		};
		 el.onmouseout = e => {
			tip.style.opacity = 0
			tip.style.visibility = 'hidden'
		};
	});
}

// AUTH
cc.auth = function(){
	if(cc.authed) return
	cc.password = cc.hash(cc.classroom, cc.elms.auth.password.value)//cc.elms.auth.password.value
	cc.guiToggle('auth', false)
	cc.classroomRenderInit()
}

cc.userAuth = function(){
	// login for becomming co-admin
}

cc.hash = function(str, seed){
	return murmurhash3_32_gc(str, toNumbers(seed)).toString()
}

cc.admins = function(roomID = 0){
	return cc.y.rooms.get(roomID.toString()).admin
}

// set/clear ?cc url
cc.classroomURL = function(classroomURL = ''){
	if(classroomURL !== ''){
		classroomURL = '?cc='+classroomURL
	}
	window.history.replaceState( {} , 'COCODING Classroom', location.origin+location.pathname+classroomURL );
}

// init classroom from form
cc.classroomSetup = function(){
	if(cc.authed) return
	cc.classroom = cc.classroomID()//cc.elms.setup.classroom.value

	// password
	cc.password = ''
	if(cc.elms.setup.password.value !== ''){
		cc.password = cc.hash(cc.classroom, cc.elms.setup.password.value) // cc.elms.setup.password.value
	}

	// room count
	let roomsCount = parseInt(cc.elms.setup.rooms.value)
	cc.max = (roomsCount != '' && roomsCount > 1) ? roomsCount+1 : 2 // custom amount or 5

	// settings
	cc.opts.settings.liveCoding = document.getElementById('setup-livecoding').checked
	cc.opts.settings.liveDelay = document.getElementById('setup-livedelay').value
	cc.opts.settings.lineNumbers = document.getElementById('setup-linenumbers').checked
	cc.opts.settings.roomLocks = document.getElementById('setup-roomlocks').checked

	let wsOpts = {
		params : {
			authID: cc.classroom,
			authSet: cc.password,
			authToken: cc.authToken
		}
	}
	let providerAuth = new WebsocketProvider(cc.wsServer, cc.classroom, cc.ydoc, wsOpts)
	providerAuth.on('synced', () => {
		// success after setting auth
		sessionStorage.setItem(cc.classroom, cc.password);
		cc.classroomURL(cc.classroom)
		cc.classroomRenderInit()

		// cleanup
		providerAuth.destroy()
		// setTimeout(()=>{console.log(providerAuth.wsconnected)}, 1000)
	})
}

cc.chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
cc.classroomID = function(){
	let id = ''
	for(let i=0; i < 8; i++)
		id += cc.chars.charAt(Math.floor(Math.random() * cc.chars.length))
	return id
}

cc.classroomRenderInit = function(){
	cc.init = true
	cc.classroomRender()
}

// attempt to render classroom
cc.classroomRender = function(){
	// hide setup if classroom known
	if(cc.classroom !== undefined){
		cc.guiToggle('setup', false)
	}

	// check auth
	if(cc.password === undefined){
		cc.guiToggle('auth', true)
		return
	}else if(sessionStorage.getItem(cc.classroom) !== null){
		cc.password = sessionStorage.getItem(cc.classroom)
	}

	let wsOpts = {
		params : {
			authID: cc.classroom,
			auth: cc.password
		}
	}
	cc.provider = new WebsocketProvider(cc.wsServer, cc.classroom, cc.ydoc, wsOpts)

	// waiting for auth
	cc.provider.on('synced', () => {
		cc.authed = true
		cc.guiToggle('auth', false)
		sessionStorage.setItem(cc.classroom, cc.password);

		// connected and ready
		if(cc.init){
			cc.getPrefs()

			// safemode incase big bug (prevents compile)
			if(window.location.hash == '#bug'){
				cc.safeMode = true
			}


			// generative user name + color (use localstorage/input/picker)
			let token = cc.hash(cc.classroom, cc.classroomID())
			let userDefault = {
				name: generateName(),// Math.random().toString(36).substring(7),
				color: '#'+Math.floor(Math.random()*16777215).toString(16),
				help: false,
				blur: false,
				token: token
			}

			let user = { ...userDefault }

			if(cc.prefs.hasOwnProperty('user') && cc.prefs.user !== null){
				user = cc.prefs.user
			}else{
				cc.prefs.user = user
				cc.savePrefs()
				cc.userRename()
			}

			// disable help on reload
			cc.prefs.user.help = false
			cc.savePrefs()


			// init first visit
			if(!cc.prefs.classrooms.hasOwnProperty(cc.classroom)){
				cc.prefs.classrooms[cc.classroom] = {
					token: token,
					room: 0,
					password: cc.password
				}
				cc.savePrefs()
			}else{
				// catch spoofer
				let tokens = [...cc.provider.awareness.getStates().values()].map(a => a.hasOwnProperty('user') ? a.user.token : 0)
				if(tokens.includes(cc.prefs.classrooms[cc.classroom].token)){
					console.log('SPOOFER')
				// 	cc.prefs.classrooms[cc.classroom].token = cc.hash(cc.classroom, cc.classroomID())
				// 	cc.prefs.user.token = cc.prefs.classrooms[cc.classroom].token
				// 	cc.savePrefs()
				}
			}

			// create shorthand to prefs
			cc.p = cc.prefs.classrooms[cc.classroom]

			// check if out of sync from previous classroom
			if(cc.p.token != cc.prefs.user.token){
				cc.prefs.user.token = cc.p.token
			}

			cc.emit('user', user, true)



			// grab shared classroom yMaps
			cc.y.rooms = cc.ydoc.getMap('rooms')
			cc.y.settings = cc.ydoc.getMap('settings')

			if(cc.y.settings.size == 0){
				// console.log(cc.cloneOBJ(cc.y.settingsOpts))
				let settingsOpts = cc.cloneOBJ(cc.opts.settings)
				for (const [key, value] of Object.entries(cc.opts.settings)) {
					cc.y.settings.set(`${key}`, value)
				}
			}

			// console.log([...cc.y.settings.values()])

			// init rooms if first time in room
			for(let i=0; i < cc.max; i++){
				let roomName = 'Room'
				if(i == 0){
					roomName = 'Main'
				}else if(i == 1){
					roomName = 'Sandbox'
				}
				let roomLocked = (i==0) ? true : false

				// initial setup
				if(!cc.y.rooms.has((i).toString())){
					let roomOpts = cc.cloneOBJ(cc.opts.room)
					roomOpts.name = roomName
					roomOpts.locked = roomLocked
					roomOpts.admin.push(cc.p.token)
					cc.y.rooms.set((i).toString(), roomOpts)
				}
			}

			// if room hasn't been init via setup, show GUI
			// if(cc.roomsCount() == 0){
			// 	cc.classroomURL()
			// 	cc.guiToggle('setup')
			// 	return
			// }

			// build classrooms
			// cc.binding = new CocodingClassroomBinding()
			// console.log(cc.binding)

			// build rooms from ymap rooms
			cc.roomsParse()

			// activate 0/main room
			if(cc.y.settings.get('mode') === 'edit'){
				cc.rooms.get(0).toggleActive(1)
			}


			// observe changes to ymap rooms
			cc.y._roomsObserver = (e, t) =>{
				let roomObserve = [...e.keysChanged.values()][0]

				// own room vs changed room
				let roomCur = cc.rooms.get(parseInt(cc.p.room))
				let roomChange = cc.rooms.get(parseInt(roomObserve)) // -1 why added, caused togglewrite bug..

				// update yjs for changed room
				if(roomChange === undefined){ // catch roomAdd
					return
				}
				roomChange.s = cc.y.rooms.get(roomObserve.toString())


				// *** spoofing + adding room breaks here??
				// update main or current room
				if(roomObserve == 0 || roomObserve == cc.p.room){
					roomChange.navInit()
					roomChange.userListSelf()
					roomChange.userList()
					roomChange.toggleWrite()
				}

				// update lockview if roomLocks
				if(cc.y.settings.get('roomLocks')){
					roomCur.navUpdate()
				}
			}

			// activate observer for rooms
			cc.y.rooms.observe(cc.y._roomsObserver)



			// observe changes to ymap settings
			cc.y._settingsObserver = (e, t) =>{
				let settingChanged = [...e.keysChanged.values()][0]
				// console.log(settingChanged)
				if(settingChanged === 'lineNumbers'){
					cc.editorLineNumbers(cc.y.settings.get('lineNumbers'))
				}

				if(settingChanged === 'room'){
					// console.log(cc.y.settings.get('room'))
					cc.roomChange(cc.y.settings.get('room'))
				}

				if(settingChanged === 'mode'){ // **** also refresh for roomLocks?
					// edit, gallery, etc
					location.reload()
					return // prevent navSettings below
				}

				if(settingChanged === 'roomLocks'){
					let curClassroom = cc.rooms.get(parseInt(cc.p.room))
					curClassroom.navUpdate()
				}

				// redraw settings on changes
				if(cc.y.settings.get('mode') == 'gallery'){
					for(let c of cc.rooms.values()){
						c.navSettings()
					}
				}
			}

			// activate observer for settings
			cc.y.settings.observe(cc.y._settingsObserver)


			// *** cc.y.rooms iter
			// cc.y.rooms.forEach((v, k)=>{
			// 	// cc.rooms.set(k, new CocodingClassroom(ydoc, cc.provider, k))
			// })



			// *** only connect to needed ones..
			// √- move more gneric cc functions inside class...
			// - when added new room, prefill text with template?

			// √-add roomlist + merge button


			/****
			√check who updated.. react only on them.. change name, color, add to user-list, etc.
			√move 'help' to user?
			useful to only update on demand per user ID...!
			√use aw id for far more things.

			√- move all cursor activities (awareness) into aceCursors class
			√- test, un/observing changes per ace, on room change.. only listen to rooms you're in...
			X- ** only build c's on demand (0 + #).. build dropdown list, and trash/build the active one?!
			- add background, smooth to window...
			*/

			// *** double check if 'change' is same as 'update' w/ origin !='local'
			cc.provider.awareness.on('change', (aw, origin)=>{

				if(aw.updated.length > 0 ){// && origin !== 'local' // (this.active || this.collapsed) &&
					let ccClassroom = cc.rooms.get(cc.p.room)
					const states = cc.provider.awareness.getStates()
					const userID = aw.updated[0]
					const update = states.get(userID)
					const user = update.user


					if(update.hasOwnProperty('type')){
						let key = update.type
						let value = update.value
						if(key == 'compiled'){
							if((value.room == 0 || value.room === cc.p.room) && !ccClassroom.collapsed){
								cc.rooms.get(value.room).recompile(value.force)
							}
						}else if(key === 'user'){
							cc.userListsLocal() //
						}else if(key === 'userList'){
							cc.userListsLocal()
						}else if(key === 'lowerhand'){
							if(value === cc.provider.awareness.clientID){
								cc.toggleUserKey('help', false)
							}
						}else if(key === 'roomList'){
							// build classroom is missing from local list
							if(cc.rooms.size < cc.y.rooms.size){ // *** bug for adding rooms?
								cc.roomsParse()
							}
							cc.rooms.get(0).roomList()
							cc.rooms.get(cc.p.room).roomList()
						}else if(key === 'roomRemove'){
							// remove people from deleted room
							if(cc.p.room == value){
								cc.roomChange(1)
								cc.rooms.get(cc.p.room).roomList()
							}
						}else if(key == 'requestWrite'){
							if(cc.admins(value).includes(cc.p.token)){
								cc.userListsLocal()
							}
						}else if(key == 'toggleWrite'){
							cc.userListsLocal()
							cc.rooms.get(value).toggleWrite()
						}else if(key == 'clearSelection'){
							cc.editorClearSelection()
						}else if(key === 'splitterSync'){
							cc.splitter.setSizes([value, 100 - value])
							cc.splitterParse()
							cc.splitterSave()
						}else if(key === 'broadcastMessage'){
							cc.alertMsg(`Incoming Message<hr><i>${value}</i>`)
						}else if(key === 'dispatchSyncEvent'){
							if(cc.rooms.has(value.room) && (value.room === 0 || value.room === cc.p.room)){
								cc.rooms.get(value.room).syncEventIn(value)
							}
						}
						cc.tipsInit()
					}

				}

				// removed
				if(aw.removed.length > 0 || aw.added.length > 0){
					cc.userListsLocal()
				}
			})


			// set room to prefs or 1
			if(cc.y.settings.get('mode') === 'edit'){
				if(cc.p.room != 0 && cc.y.rooms.has(cc.p.room.toString())){
					// existing user
					cc.roomChange(cc.p.room)
				}else{
					// init user

					cc.roomChange(1)
				}
			}else{
				cc.roomChange(cc.y.settings.get('room'))
			}


			cc.tipsInit()


			if(cc.y.settings.get('mode') === 'edit'){
				// setup splitscreen of A + B
				let splitterSize = localStorage.getItem('split-sizes')

				if (splitterSize) {
				    splitterSize = JSON.parse(splitterSize)
				} else {
				    splitterSize = [50, 50] // default sizes
				}
				cc.splitter = Split(['#room-a', '#room-b'], {
					minSize: 0,
					sizes: splitterSize,
					gutterSize: 11,
					onDrag: function(){
						cc.splitterParse()
					},
					onDragEnd: function(sizes){
						cc.splitterSave()
					}
				})


				cc.splitterSync = function(){
					vex.dialog.open({
						input:`
							Sync Splitter View<br><br>
							<div id="cc-room-split" class="vex-form" style="height:25px;border:1px solid #aaa;overflow:hidden;">
								<div id="cc-room-split-a" style="height:25px;background:#666;text-align:center;color:#fff;">MAIN</div>
								<div id="cc-room-split-b" style="height:25px;background:#888;text-align:center;color:#fff;">ROOMS</div>
							</div>
						`,
						callback: function (data) {
							if(data){
								let newSize = Math.round(cc.splitterPopup.getSizes()[0])
								if(newSize < 5){
									newSize = 0
								}else if(newSize > 95){
									newSize = 100
								}
								cc.emit('splitterSync', newSize)
								cc.splitter.setSizes([newSize, 100 - newSize])
								cc.splitterParse()
								cc.splitterSave()
							}
						},
						afterOpen: function(){
							cc.vexSmall(this.rootEl)
							cc.splitterPopup = Split(['#cc-room-split-a', '#cc-room-split-b'], {
								minSize: 0,
								sizes: [50, 50],
								gutterSize: 11,
							})
							cc.tipsInit()
						}
					})
				}

				cc.splitterSave = function(){
					localStorage.setItem('split-sizes', JSON.stringify(splitterSize))
					cc.tipsInit()

					cc.prefs.user.splitter = parseInt(cc.splitter.getSizes()[0])
					cc.savePrefs()
					cc.emit('user', cc.prefs.user, true)
					cc.roomSync('userList')
					cc.userListsSelf()
				}

				cc.splitterParse = function(){
					splitterSize = cc.splitter.getSizes()
					// left side
					let activeStateL = cc.rooms.get(0).active
					let activeCheckL = (splitterSize[0] < 5) ? false : true
					// console.log([0, activeStateL, activeCheckL])

					if(activeStateL !== activeCheckL && cc.rooms.get(0) !== undefined){
						cc.rooms.get(0).toggleActive(activeCheckL)
						cc.rooms.get(0).editor.resize()
						cc.rooms.get(0).editor.renderer.updateFull();
					}

					// right side
					let curID = cc.p.room
					let activeStateR = cc.rooms.get(curID).active
					let activeCheckR = (splitterSize[1] < 5) ? false : true
					// console.log([1, activeStateR, activeCheckR])
					if(activeStateR !== activeCheckR && cc.rooms.get(curID) !== undefined){
						cc.rooms.get(curID).toggleActive(activeCheckR)
						cc.rooms.get(curID).editor.resize()
						cc.rooms.get(curID).editor.renderer.updateFull();
					}

				}
				cc.splitterParse()
			}else{
				document.getElementById('room-b').style.width = '100vw'
			}

			// window keyboard toggle of editors
			cc.keymap = new Map()
			let activeElm = -1
			window.addEventListener("keydown", (event)=>{
				cc.keymap.set(event.keyCode, event.type == 'keydown')
				if(cc.keymap.get(17)){
					if(event.key == 'e'){
						event.preventDefault();
						if(document.activeElement.parentNode.id.includes('editor')){
							activeElm = document.activeElement.parentNode.id.split('-')[1]
						}
						for(let c of cc.rooms.values()){
							c.toggleEditor(activeElm)
						}
					}

					if(event.key == 'm'){
						event.preventDefault();
						for(let c of cc.rooms.values()){
							c.toggleMeta()
						}
					}

					if(event.key == 's'){
						event.preventDefault();


						// console.log(document.elementFromPoint(mx, my))
						// console.log([...document.querySelectorAll( ":hover" )])
						// return
						cc.roomExport(cc.roomFocus)
					}

					if(event.key == '-' || event.key == '='){
						let fontSetting = document.querySelector('.cc-settings-fontsize')
						let fontSize = fontSetting.value
						if(event.key == '-'){
							fontSize--
						}else if(event.key == '='){
							fontSize++
						}
						fontSetting.value = fontSize
						cc.editorFontSize(fontSize)
					}

					// quick change rooms, 1 - 9
					if(event.keyCode >= 49 && event.keyCode  <= 57){
						if(cc.admins().includes(cc.p.token) && cc.y.settings.get('mode') === 'gallery'){
							cc.y.settings.set('room', event.keyCode - 48)
						}else{
							cc.roomChange(event.keyCode - 48)
						}
					}

					if(event.keyCode == 13){
						event.preventDefault()
						cc.rooms.get(cc.roomFocus).recompile(true)
					}


				}

				// pass keys into sketch (only one with mouse hover)
				cc.rooms.get(cc.roomFocus).sendKey(event)
				// for(let c of cc.rooms.values()){
					// c.sendKey(event)
				// }

			});

			window.addEventListener("keyup", (event)=>{
				cc.keymap.set(event.keyCode, event.type == 'keydown')

				// pass keys into sketch (only one with mouse hover)
				cc.rooms.get(cc.roomFocus).sendKey(event)
				// for(let c of cc.rooms.values()){
				// 	c.sendKey(event)
				// }
			});


			window.onfocus = function () {
				// console.log('focus')
				// deactivate modifier keys
				cc.keymap.set(16, false)
				cc.keymap.set(17, false)

				for(let c of cc.rooms.values()){
					c.keyDown.set(17, false)
				}
				cc.toggleBlur(false)
			}

			window.onblur = function (event) {
				// console.log(event.target.window)
				if(!document.activeElement.classList.contains('cc-iframe')){
					cc.toggleBlur(true)
				}
			}

			window.onresize = function(){
				cc.tipsInit() // redraw tips on resize
			}

			// setTimeout(cc.settingsParse, 0)
			cc.init = false
		}
	})

	if(!cc.authed){
		cc.guiToggle('auth', true)
		cc.elms.auth.password.select()
	}
}

cc.icons = {
	new : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-plus"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>`,
	save : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`,
	rename : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-3"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
	link : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
	room : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
	layers  : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-layers"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
	trash : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
	merge : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-git-merge"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg>`,
	shuffle : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shuffle"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`,
	about : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-help-circle"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12" y2="17"></line></svg>`,
	settings : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
	shield : {
		empty : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shield"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
		checked : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path> <path d="M9 12l2 2 4-4"></path> </svg>`,
	},
	person : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
	layout : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-layout"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
	message : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
	radio : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-radio"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>`,
	screencast : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-cast"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path><line x1="2" y1="20" x2="2" y2="20"></line></svg>`,
	toggle : {
		left : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-toggle-left"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle fill="white" cx="8" cy="12" r="4"></circle></svg>`,
		right : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-toggle-right"><rect fill="#00aa00" x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle fill="white" cx="16" cy="12" r="4"></circle></svg>`,
	},
	lock : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-lock"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
	unlock : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-unlock"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V5a4 5 1 0 1 6.9-1"></path></svg>`,
	users : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-users"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
	code : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-code"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,

}

// store various gui elms
cc.elms = {
	setup: {
		container : document.getElementById('setup'),
		classroom : document.getElementById('setup-classroom'),
		password : document.getElementById('setup-password'),
		rooms : document.getElementById('setup-rooms'),
		binding : document.getElementById('setup-binding'),
	},
	auth: {
		container : document.getElementById('auth'),
		classroom : document.getElementById('auth-classroom'),
		password : document.getElementById('auth-password'),
	},

}

// turn GUI interfaces on/off
cc.guiToggle = function(elm, toggle = true){
	if(toggle){
		cc.elms[elm].container.style.display = 'block'
	}else{
		cc.elms[elm].container.style.display = 'none'
	}
}

cc.aboutToggle = function(){

	let markedOptions = {
		headerPrefix:'marked-'
	};
	let readmePath = 'README.md?' + version;
	let request = new XMLHttpRequest();
	request.open('GET', readmePath, true);
	request.send();
	request.addEventListener('load', function(){
		let markedReadme = marked.parse(request.responseText, markedOptions);
		let verrev = '<p>v '+ version + '<br>';
		markedReadme = markedReadme.replace(/(<p>).+?(<br>)/, verrev); // <p[^>]*> // [v-\d].*<br>cc
		let aboutDiv = '<div id="about-alert" class="vex-long">'+markedReadme+'</div>';

		vex.dialog.alert({
			unsafeMessage:aboutDiv,
			afterOpen: function(){
				cc.vexFocus();
			}
		})
	});


	// vex.dialog.alert({
	// 	unsafeMessage: `COCODING Classroom<hr>
	// 	Signup for Early-Access (~ Spring '22):<br>
	// 	» <a href="https://forms.gle/F2bWtJErYj3S4Pc5A" target="_blank">Registration Form</a>`,
	// 	afterOpen: function(){
	// 		// cc.vexSmall(this.rootEl);
	// 		cc.vexFocus()
	// 	}
	// })
}

cc.settingsToggle = function(roomID, hide){
	let elm = cc.rooms.get(roomID).htmlContainer.querySelector('.cc-nav-settings')

	let settingsPanelSel = cc.y.settings.get('mode') === 'edit' ? 0 : cc.p.room
	let settingsPanel = cc.rooms.get(settingsPanelSel).meta.getElementsByClassName('cc-settings')[0]

	if(cc.computedStyle(settingsPanel,'display') != 'none' || hide){
		settingsPanel.style.display = 'none'
		elm.classList.remove('cc-settings-active')
	}else{
		settingsPanel.style.display = 'block'
		elm.classList.add('cc-settings-active')
	}
	cc.tipsInit()
}

cc.computedStyle = function (el,style) {
    var cs;
    if (typeof el.currentStyle != 'undefined'){
        cs = el.currentStyle;
    }
    else {
        cs = document.defaultView.getComputedStyle(el,null);
    }
    return  cs[style];
}

cc.vexFocus = function(){
	setTimeout(function(){document.getElementsByClassName('vex-dialog-button-primary')[0].focus();}, 500);
}

// ** kicks off whole thing
cc.classroom = cc.getParam('cc') // try grabbing via url



// page finished loading
window.addEventListener('load', () => {

	// vex dialog
	vex.defaultOptions.className = 'vex-theme-plain'

	// grab settings
	cc.settingsLoad()

	// dynamically load binding *** move into classroomRender, for linking to setup...
	// alternative: https://stackoverflow.com/a/31374433/10885535
	const scriptPromise = new Promise((resolve, reject) => {
	  const script = document.createElement('script');
	  document.body.appendChild(script);
	  script.onload = resolve;
	  script.onerror = reject;
	  script.async = true;
	  script.src = cc.bindingPath + 'binding.js';
	}).then(() => {

		cc.binding = binding

		// show GUI if no classroom ID via url
		if(cc.classroom == undefined){
			for(let i=0; i < 30; i++){
				let sel = ''
				if(i==4){
					sel = 'selected'
				}
				cc.elms.setup.rooms.innerHTML += `<option ${sel}>${i+1}</option>`
			}

			if(!earlyAccessMode || localStorage.hasOwnProperty('cc-auth')){
				cc.authToken = localStorage.getItem('cc-auth')
				cc.guiToggle('setup')
				cc.tipsInit()
			}else{
				document.getElementById('earlyaccess-youtube').innerHTML = `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/ZROH0ajeNIE?start=1929" title="YouTube video player" frameborder="0" allow=" encrypted-media;picture-in-picture" allowfullscreen></iframe>`
				document.getElementById('earlyaccess').style.display = 'block'
			}

			// old ?setup technique
			// if(cc.getParam('setup')){
			// 	cc.guiToggle('setup')
			// }
			return
		}

		// attempt to render room if classroom ID
		cc.classroomRender()
	});

})