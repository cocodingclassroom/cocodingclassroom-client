import { YSyncModel } from "/src/models/y-sync-model.js";
import { BindingService } from "../services/binding-service";

export class ClassroomModel extends YSyncModel {
  classRoomId;
  activeBindingType;
  roomIds;
  teacherRoomIds;
  peopleIds;

  constructor(classRoomId) {
    super(`classroom_${classRoomId}`);
    this.classRoomId = classRoomId;
    this.setup();
    this.activeBindingType = this.activeBindingType ?? BindingType.P5;
    BindingService.get().setBindingByBindingType(this.activeBindingType);
    this.roomIds = this.roomIds ?? [];
    this.peopleIds = this.peopleIds ?? [];
    this.teacherRoomIds = this.teacherRoomIds ?? [];
  }
}

export class BindingType {
  static P5 = "P5";
  static HYDRA = "HYDRA";
}
