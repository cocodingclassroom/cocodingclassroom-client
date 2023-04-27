import { YSyncModel } from "/src/models/y-sync-model.js";
import { Text as YText } from "yjs";
import { BindingService } from "../services/binding-service";

export class Room extends YSyncModel {
  id;
  roomName;
  roomType;
  codeContent;
  messages;
  l_changedPositions;
  l_editorForRoom;
  l_iframeForRoom;
  l_iframeMeta = `
		// catch mouse focus
		// document.addEventListener("mouseup", function(){
		// 	parent.focus()
		// })
		//
		// document.addEventListener("keydown", (event) => {
		//   console.log("In Frame Event" + event);
		// })
		
        //
		// // forward mouse/key events to parent
		// document.addEventListener('mousemove', forwardMouse);
		// document.addEventListener('mouseup', forwardMouse);
		// document.addEventListener('mousedown', forwardMouse);
        //
		// function forwardMouse(event){
		// 	ccSelf.passMouse(event);
		// }
        //
		// document.addEventListener('keydown', forwardKey);
		// document.addEventListener('keyup', forwardKey);
        //
		// function forwardKey(event){
		// 	// ccSelf.sendKey(event); // *** needed??
		// }

		// pass errors to parent
		window.onerror = function myErrorHandler(errorMsg) {
			ccSelf.consoleMessage('❌' + errorMsg)
			return false
		}

		console.log = function(m){
			ccSelf.consoleMessage(m)
		}
	`;

  constructor(id) {
    super(`room_${id}`);
    this.id = id;
    this.messages = [];
    this.setup();
    this.roomName = this.roomName ?? this.id + "_Room";
    if (this.codeContent === null || this.codeContent === undefined) {
      let activeBinding = BindingService.get().binding;
      this.codeContent = new YText(activeBinding.codeTemplate ?? "");
    }
    this.l_changedPositions = [];
  }
}

export class RoomType {
  static STUDENT = 0;
  static TEACHER = 1;
}
