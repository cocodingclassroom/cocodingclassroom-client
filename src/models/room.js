import { YSyncModel } from "/src/models/y-sync-model.js";
import { Text as YText } from "yjs";
import { BindingService } from "../services/binding-service";
import { UserService } from "../services/user-service";

export class Room extends YSyncModel {
  id;
  roomName;
  roomType;
  codeContent;
  messages;
  ownerId;
  writersIds;
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
			ccSelf.errorCallback('❌' + errorMsg)
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
    this.writersIds = [];
    this.setup();
    this.roomName = this.roomName ?? "Room";
    if (this.codeContent === null || this.codeContent === undefined) {
      let activeBinding = BindingService.get().binding;
      this.codeContent = new YText(activeBinding.codeTemplate ?? "");
    }
    this.l_changedPositions = [];
  }

  isTeacherRoom = () => {
    return this.roomType === RoomType.TEACHER;
  };

  isStudentRoom = () => {
    return this.roomType === RoomType.STUDENT;
  };

  clearAllAuthorizationOnRoom = () => {
    this.writersIds.delete(0, this.writersIds.length);
    this.ownerId = null;
  };

  claimRoomToLocalUser = () => {
    this.ownerId = UserService.get().localUser.id;
  };

  removeClaim = () => {
    this.ownerId = null;
  };

  isUnclaimed = () => {
    return this.ownerId === null || this.ownerId === undefined;
  };

  isClaimed = () => {
    return !this.isUnclaimed();
  };

  isOwnedByLocalUser = () => {
    return this.ownerId === UserService.get().localUser.id;
  };

  isOwnedBy = (userId) => {
    return this.ownerId === userId;
  };

  getOwnerAsUser = () => {
    return UserService.get()
      .getAllUsers()
      .find((user) => user.id === this.ownerId);
  };

  isWriter = (userId) => {
    return (
      this.writersIds.toArray().includes(userId) || this.ownerId === userId
    );
  };

  giveAccess = (userId) => {
    this.writersIds.push([userId]);
  };

  removeAccess = (userId) => {
    const index = this.writersIds.toArray().indexOf(userId);
    if (index !== -1) {
      this.writersIds.delete(index);
    }
  };

  hasUsers = () => {
    return (
      UserService.get()
        .getAllUsers()
        .filter((user) => user.isRoomLeft(this.id) || user.isRoomRight(this.id))
        .length > 0
    );
  };
}

export class RoomType {
  static STUDENT = 0;
  static TEACHER = 1;
}
