import { SyncService } from '/src/services/sync-service.js'
import { getRandomID } from '/src/util/util.js'
import { ClassroomMode, ClassroomModel } from '/src/models/classroom-model.js'
import { RoomService } from '/src/services/room-service.js'
import { UserService } from '/src/services/user-service.js'

export class ClassroomService {
    static _instance
    classroom

    constructor() {
        if (ClassroomService._instance !== undefined && ClassroomService._instance !== null) {
            throw new Error(
                `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
            )
        }
    }

    static get() {
        if (ClassroomService._instance === undefined) ClassroomService._instance = new ClassroomService()
        return ClassroomService._instance
    }

    isGalleryMode = () => {
        return this.classroom.mode === ClassroomMode.GALLERY
    }

    createNewRoom(
        callback,
        numberOfRooms,
        liveCoding,
        liveCodingDelay,
        lineNumbers,
        bindingIndex,
        roomLocks,
        password
    ) {
        let newClassroomId = getRandomID()
        SyncService.connectAndSetup('ws://localhost:1234', true, newClassroomId, password, () => {
            this.syncNewSharedData(
                newClassroomId,
                numberOfRooms,
                liveCoding,
                liveCodingDelay,
                lineNumbers,
                bindingIndex,
                roomLocks
            )
            callback()
        })

        return newClassroomId
    }

    connectToExistingRoom(classroomId, password, callback) {
        SyncService.connectAndSetup('ws://localhost:1234', false, classroomId, password, () => {
            console.log('Connected to existing room')
            this.syncWithExistingRoomData(classroomId)
            callback()
        })
    }

    connectToExistingRoomWithHash(classroomId, hash, callback) {
        SyncService.connectAndSetupWithHash('ws://localhost:1234', false, classroomId, hash, () => {
            console.log('Connected to existing room')
            this.syncWithExistingRoomData(classroomId)
            callback()
        })
    }

    syncWithExistingRoomData(classroomId) {
        console.log('Sync with existing data')
        this._setupData(classroomId, null, null, null, null, null, null)
    }

    syncNewSharedData(classroomId, numberOfRooms, liveCoding, liveCodingDelay, lineNumbers, bindingIndex, roomLocks) {
        console.log('sync with new data')
        this._setupData(classroomId, numberOfRooms, liveCoding, liveCodingDelay, lineNumbers, bindingIndex, roomLocks)
    }

    _setupData(classroomId, numberOfRooms, liveCoding, liveCodingDelay, lineNumbers, bindingIndex, roomLocks) {
        this.classroom = new ClassroomModel(
            classroomId,
            liveCoding,
            liveCodingDelay,
            lineNumbers,
            roomLocks,
            2,
            bindingIndex
        )
        RoomService.get().init(this.classroom, numberOfRooms)
        UserService.get().init(this.classroom, numberOfRooms !== null)
        // this.#startLiveCoding();
        // this.classroom.addListener((changes) => {
        //
        // });
    }
}
