import { Room, RoomType } from '/src/models/room.js'
import { ClassroomService } from './classroom-service'

export class RoomService {
    static _instance
    rooms

    constructor() {
        if (RoomService._instance !== undefined && RoomService._instance !== null) {
            throw new Error(
                `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
            )
        }
        this.rooms = []
    }

    static get = () => {
        if (RoomService._instance === undefined) RoomService._instance = new RoomService()
        return RoomService._instance
    }

    getRoom = (roomId) => {
        return this.rooms.filter((room) => room.id === parseInt(roomId))[0]
    }

    getNextRoomInList = (room) => {
        const currentIndex = this.rooms.indexOf(room)
        const newIndex = (currentIndex + 1) % this.rooms.length
        return this.rooms[newIndex]
    }

    addRoom() {
        let roomAmountAsNewId = this.rooms.length - 1
        let newRoom = new Room(roomAmountAsNewId)

        ClassroomService.get().classroom.roomIds.push([newRoom.id])
        this.init(ClassroomService.get().classroom)
    }

    init = (classroom, numberOfRooms) => {
        if (classroom.roomIds.length === 0) {
            this.defineRooms(numberOfRooms, classroom)
        }

        let newRooms = []
        classroom.roomIds.forEach((id) => {
            let room = new Room(id)
            if (classroom.teacherRoomIds.toArray().includes(id)) {
                room.roomType = RoomType.TEACHER
            } else if (id < 0) {
                room.roomName = 'Lobby'
                room.roomType = RoomType.LOBBY
            } else {
                room.roomType = RoomType.STUDENT
            }
            newRooms.push(room)
        })
        this.rooms = newRooms
        this.#registerListener()
    }

    defineRooms = (numberOfRooms, classroom) => {
        //define lobby
        classroom.roomIds.push([-1])
        //define +1 normal room
        for (let i = 0; i < numberOfRooms + 1; i++) {
            classroom.roomIds.push([i])
        }
        classroom.teacherRoomIds.push([0])
    }

    #registerListener = () => {
        ClassroomService.get().classroom.removeListener(this.#roomChangeListener)
        ClassroomService.get().classroom.addListener(this.#roomChangeListener)
    }

    #roomChangeListener = (changes) => {
        if (!changes) return
        changes.forEach((change) => {
            if (!change.target._item) return
            if (change.target._item.parentSub === 'roomIds') {
                this.init(ClassroomService.get().classroom, undefined)
            }
        })
    }

    clearAllGalleryChats = () => {
        this.rooms.forEach((room) => {
            room.galleryMessages.delete(0, room.galleryMessages.length)
        })
    }
}
