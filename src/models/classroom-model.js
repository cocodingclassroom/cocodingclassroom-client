import { YSyncModel } from "/src/models/y-sync-model.js";

export class ClassroomModel extends YSyncModel {
  classRoomId;
  binding;
  roomIds;
  peopleIds;

  constructor(classRoomId) {
    super(`classroom_${classRoomId}`);
    this.classRoomId = classRoomId;
    this.setup();
    this.binding = this.binding ?? BindingType.P5;
    this.roomIds = this.roomIds ?? [];
    this.peopleIds = this.peopleIds ?? [];
  }
}

export class BindingType {
  static P5 = "P5";
  static HYDRA = "HYDRA";
}
