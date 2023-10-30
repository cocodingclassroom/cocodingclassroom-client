import { YSyncModel } from "/src/models/y-sync-model.js";
import { BindingService } from "../services/binding-service";

export class ClassroomModel extends YSyncModel {
  classRoomId;
  activeBindingType;
  roomIds;
  teacherRoomIds;
  peopleIds;
  teacherIds;
  mode;
  liveCoding;
  liveCodingDelay;
  lineNumbers;
  roomLocks;
  walkDelay;
  isWalking;

  constructor(
    classRoomId,
    liveCoding,
    liveCodingDelay,
    lineNumbers,
    roomLocks,
    walkDelay,
    bindingIndex
  ) {
    super(`classroom_${classRoomId}`);
    this.classRoomId = classRoomId;
    this.peopleIds = [];
    this.roomIds = [];
    this.teacherIds = [];
    this.teacherRoomIds = [];
    this.mode = ClassroomMode.EDIT;
    this.setup();
    this.activeBindingType = bindingIndex ?? this.activeBindingType;
    BindingService.get().setBindingByIndex(this.activeBindingType);
    this.liveCoding = liveCoding ?? this.liveCoding;
    this.liveCodingDelay = liveCodingDelay ?? this.liveCodingDelay;
    this.lineNumbers = lineNumbers ?? this.lineNumbers;
    this.roomLocks = roomLocks ?? this.roomLocks;
    this.walkDelay = walkDelay ?? this.walkDelay;
    this.isWalking = this.isWalking ?? false;
  }

  addUser(user) {
    if (this.peopleIds === undefined) return;
    if (!this.peopleIds.toArray().includes(user.id))
      this.peopleIds.push([user.id]);
  }

  isGalleryMode = () => {
    return this.mode === ClassroomMode.GALLERY;
  };
  isEditMode = () => {
    return this.mode === ClassroomMode.EDIT;
  };
}

export class BindingType {
  static P5 = "P5";
  static HYDRA = "HYDRA";
}

export class ClassroomMode {
  static EDIT = "Edit";
  static GALLERY = "Gallery";
}
