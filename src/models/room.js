import { YSyncModel } from "/src/models/y-sync-model.js";

export class Room extends YSyncModel {
  id;
  roomName;
  roomType;

  constructor(id) {
    super(`room_${id}`);
    this.id = id;
    this.setup();
  }
}

export class RoomType {
  static STUDENT = 0;
  static TEACHER = 1;
}
