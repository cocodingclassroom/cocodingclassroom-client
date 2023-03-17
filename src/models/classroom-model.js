import { YSyncModel } from "/src/models/y-sync-model.js";

export class ClassroomModel extends YSyncModel {
  classRoomId;
  roomIds;
  peopleIds;

  constructor(classRoomId) {
    super(`classroom_${classRoomId}`);
    this.classRoomId = classRoomId;
    this.setup();
    this.roomIds = this.roomIds ?? [];
    this.peopleIds = this.peopleIds ?? [];
  }
}
