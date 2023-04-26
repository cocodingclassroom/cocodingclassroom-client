import { SyncService } from "/src/services/sync-service.js";
import { getRandomID } from "/src/util/util.js";
import { ClassroomModel } from "/src/models/classroom-model.js";
import { RoomService } from "/src/services/room-service.js";
import { UserService } from "/src/services/user-service.js";

export class ClassroomService {
  static _instance;
  classroom;

  constructor() {
    if (
      ClassroomService._instance !== undefined &&
      ClassroomService._instance !== null
    ) {
      throw new Error(
        `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
      );
    }
  }

  static get() {
    if (ClassroomService._instance === undefined)
      ClassroomService._instance = new ClassroomService();
    return ClassroomService._instance;
  }

  createNewRoom(callback, numberOfRooms) {
    let newClassroomId = getRandomID();
    console.log(newClassroomId);
    SyncService.connectAndSetup(
      "ws://localhost:1234",
      true,
      newClassroomId,
      "",
      () => {
        this.syncNewSharedData(newClassroomId, numberOfRooms);
        callback();
      }
    );

    return newClassroomId;
  }

  connectToExistingRoom(classroomId, callback) {
    SyncService.connectAndSetup(
      "ws://localhost:1234",
      false,
      classroomId,
      "",
      () => {
        console.log("Connected to existing room");
        this.syncWithExistingRoomData(classroomId);
        callback();
      }
    );
  }

  syncWithExistingRoomData(classroomId) {
    console.log("Sync with existing data");
    this._setupData(classroomId, null);
  }

  syncNewSharedData(classroomId, numberOfRooms) {
    console.log("sync with new data");
    this._setupData(classroomId, numberOfRooms);
  }

  _setupData(classroomId, numberOfRooms) {
    this.classroom = new ClassroomModel(classroomId);
    RoomService.get().init(this.classroom, numberOfRooms);
    UserService.get().init(this.classroom, numberOfRooms !== null);
  }
}
