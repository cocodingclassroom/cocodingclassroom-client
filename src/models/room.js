import { YSyncModel } from "/src/models/y-sync-model.js";
import { ClassroomService } from "../services/classroom-service";
import { SyncService } from "../services/sync-service";
import * as Y from "yjs";
import { BindingType } from "./classroom-model";
import { BindingService } from "../services/binding-service";

export class Room extends YSyncModel {
  id;
  roomName;
  roomType;
  codeContent;

  constructor(id) {
    super(`room_${id}`);
    this.id = id;
    this.setup();
    if (this.codeContent === null || this.codeContent === undefined) {
      let activeBinding = BindingService.get().binding;
      this.codeContent = new Y.Text(activeBinding.codeTemplate ?? "");
    }
  }
}

export class RoomType {
  static STUDENT = 0;
  static TEACHER = 1;
}
