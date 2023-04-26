import { YSyncModel } from "/src/models/y-sync-model.js";
import { BindingService } from "../services/binding-service";

export class ClassroomModel extends YSyncModel {
  classRoomId;
  activeBindingType;
  roomIds;
  teacherRoomIds;
  peopleIds;
  teacherIds;

  constructor(classRoomId) {
    super(`classroom_${classRoomId}`);
    this.classRoomId = classRoomId;
    this.peopleIds = [];
    this.roomIds = [];
    this.teacherIds = [];
    this.teacherRoomIds = [];
    this.setup();
    this.activeBindingType = this.activeBindingType ?? BindingType.P5;
    BindingService.get().setBindingByBindingType(this.activeBindingType);
  }

  addUser(user) {
    if (this.peopleIds === undefined) return;
    if (!this.peopleIds.toArray().includes(user.id))
      this.peopleIds.push([user.id]);
  }
}

export class BindingType {
  static P5 = "P5";
  static HYDRA = "HYDRA";
}
