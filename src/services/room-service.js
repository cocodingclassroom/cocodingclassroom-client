import { Room, RoomType } from "/src/models/room.js";

export class RoomService {
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

  init = (classroom, numberOfRooms) => {
    if (classroom.roomIds.length === 0) {
      this.defineRooms(numberOfRooms, classroom);
    }
    classroom.roomIds.forEach((id) => {
      let room = new Room(id);
      this.rooms.push(room);
    });
  };

  defineRooms = (numberOfRooms, classroom) => {
    for (let i = 0; i < numberOfRooms; i++) {
      classroom.roomIds.push(i);
    }
  };
}
