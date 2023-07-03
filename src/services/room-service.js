import { Room, RoomType } from "/src/models/room.js";
import { ClassroomService } from "./classroom-service";

export class RoomService {
  static _instance;
  rooms;

  constructor() {
    if (RoomService._instance !== undefined && RoomService._instance !== null) {
      throw new Error(
        `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
      );
    }
    this.rooms = [];
  }

  static get = () => {
    if (RoomService._instance === undefined)
      RoomService._instance = new RoomService();
    return RoomService._instance;
  };

  getRoom = (roomId) => {
    if (roomId >= 0 && roomId < this.rooms.length) return this.rooms[roomId];
  };

  addRoom() {
    let roomAmountAsNewId = this.rooms.length;
    let newRoom = new Room(roomAmountAsNewId);

    ClassroomService.get().classroom.roomIds.push([newRoom.id]);
    this.init(ClassroomService.get().classroom);
  }

  init = (classroom, numberOfRooms) => {
    if (classroom.roomIds.length === 0) {
      this.defineRooms(numberOfRooms, classroom);
    }
    this.rooms = [];
    classroom.roomIds.forEach((id) => {
      let room = new Room(id);
      if (classroom.teacherRoomIds.toArray().includes(id)) {
        room.roomType = RoomType.TEACHER;
      } else {
        room.roomType = RoomType.STUDENT;
      }
      this.rooms.push(room);
    });
    this.#registerListener();
  };

  defineRooms = (numberOfRooms, classroom) => {
    for (let i = 0; i < numberOfRooms; i++) {
      classroom.roomIds.push([i]);
    }
    classroom.teacherRoomIds.push([0]);
  };

  #registerListener = () => {
    ClassroomService.get().classroom.removeListener(this.#roomChangeListener);
    ClassroomService.get().classroom.addListener(this.#roomChangeListener);
  };

  #roomChangeListener = (changes) => {
    if (!changes) return;
    changes.forEach((change) => {
      if (change.target._item.parentSub === "roomIds") {
        this.init(ClassroomService.get().classroom, undefined);
      }
    });
  };
}
