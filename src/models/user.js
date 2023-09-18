import { YSyncModel } from "./y-sync-model.js";
import { UserService } from "../services/user-service";
import { generateName } from "/src/util/user.js";
import { RoomService } from "../services/room-service.js";

export class User extends YSyncModel {
  id;
  role = UserRole.STUDENT;
  name;
  color;
  needsHelp = false;
  leftSize = 50;
  selectedRoomLeft = 0;
  selectedRoomRight = 1;
  activeRoom = 0;
  selection = { start: { row: 0, column: 0 }, end: { row: 0, column: 0 } };
  editorFontSize = 12;
  trackingList;

  constructor(id) {
    super(`user_${id}`);
    this.id = id;
    this.trackingList = new Map();
    this.setup();
    this.name = this.name ?? generateName();
    this.color =
      this.color ?? "#" + Math.floor(Math.random() * 16777215).toString(16);
  }

  static fromJSON(json) {
    if (json === undefined) return null;
    json = JSON.parse(json);
    let user = new User(json.id);
    user.name = json.name;
    user.color = json.color;
    return user;
  }

  getNameShortened = (maxLength = 15) => {
    return this.name.length < maxLength
      ? this.name
      : `${this.name.substring(0, maxLength)}...`;
  };

  getEditorFontSize = () => {
    return `${UserService.get().localUser.editorFontSize}pt`;
  };

  isRoomLeft(id) {
    return this.selectedRoomLeft === parseInt(id);
  }

  isRoomRight(id) {
    return this.selectedRoomRight === parseInt(id);
  }

  isTeacher() {
    return this.role === UserRole.TEACHER;
  }

  isStudent() {
    return this.role === UserRole.STUDENT;
  }

  isLocalUser = () => {
    return this === UserService.get().localUser;
  };

  getSelectedRow = () => {
    if (!this.selection) return 0;
    return this.selection.end.row;
  };

  getSelectedColumn = () => {
    if (!this.selection) return 0;
    return this.selection.end.column;
  };

  toggleTrackingInRoom(roomId, user) {
    if (this.getTrackingByRoom(roomId)) {
      this.clearTrackInRoom(roomId);
      return;
    }

    this.trackInRoom(roomId, user);
  }

  trackInRoom(roomId, user) {
    this.trackingList.set(`${roomId}`, user.id);
  }

  clearTrackInRoom(roomId) {
    this.trackingList.delete(`${roomId}`);
  }

  getTrackingByRoom(roomId) {
    return this.trackingList.get(`${roomId}`);
  }

  canClaimRoom = () => {
    if (this.isTeacher()) return true;
    let result = true;
    RoomService.get().rooms.forEach((room) => {
      if (room.isOwnedBy(this.id)) result = false;
    });
    return result;
  };

  toJSON = () => {
    return {
      id: this.id,
      role: this.role,
      name: this.name,
      color: this.color,
      leftSize: this.leftSize,
      selectedRoomLeft: this.selectedRoomLeft,
      selectedRoomRight: this.selectedRoomRight,
    };
  };
}

export class UserRole {
  static STUDENT = 0;
  static TEACHER = 1;
}
