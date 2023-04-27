import { YSyncModel } from "./y-sync-model.js";
import { UserService } from "../services/user-service";
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";

export class User extends YSyncModel {
  id;
  role = UserRole.STUDENT;
  name;
  color;
  needsHelp = false;
  leftSize = 50;
  selectedRoomLeft = 0;
  selectedRoomRight = 1;
  editorFontSize = 12;

  constructor(id) {
    super(`user_${id}`);
    this.id = id;
    this.setup();
    this.name = this.name ?? this._getRandomUserName();
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

  _getRandomUserName = () => {
    return uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      length: 2,
      separator: "_",
    });
  };
}

export class UserRole {
  static STUDENT = 0;
  static TEACHER = 1;
}
