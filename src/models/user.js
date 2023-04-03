import { YSyncModel } from "./y-sync-model.js";

export class User extends YSyncModel {
  constructor(id) {
    super(`user_${id}`);
    this.id = id;
    this.setup();
  }

  static fromJSON(json) {
    let user = new User(json.id);
    user.name = json.name;
    return user;
  }

  id;
  role = UserRole.STUDENT;
  name;
  leftSize = 50;
  selectedRoomLeft = 0;
  selectedRoomRight = 1;

  isRoomLeft(id) {
    return this.selectedRoomLeft === parseInt(id);
  }

  isRoomRight(id) {
    return this.selectedRoomRight === id;
  }

  isTeacher() {
    return this.role === UserRole.TEACHER;
  }

  isStudent() {
    return this.role === UserRole.STUDENT;
  }

  toJSON = () => {
    return {
      id: this.id,
      role: this.role,
      name: this.name,
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
