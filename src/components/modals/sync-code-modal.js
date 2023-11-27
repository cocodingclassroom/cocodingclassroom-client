import { showModal } from '../../util/modal'
import { RoomService } from '../../services/room-service'
import { Notification, NotificationType, NotifyService } from '../../services/notify-service'
import { UserService } from '../../services/user-service'

function notifyAllRoomsOfSync(room, template) {
    RoomService.get().rooms.forEach((otherRoom) => {
        if (otherRoom === room) return

        otherRoom.codeContent.delete(0, otherRoom.codeContent.length)
        otherRoom.codeContent.insert(0, template)

        NotifyService.get().notify(
            new Notification(NotificationType.FULLREBUILDOFFRAME, UserService.get().localUser, otherRoom.id)
        )
    })
}

export const syncCode = (roomId) => {
    showModal(
        `
        <div>
          Push this room's code to all other rooms?
        </div>
      `,
        () => {
            let room = RoomService.get().getRoom(roomId)
            let template = room.codeContent.toString()
            notifyAllRoomsOfSync(room, template)
        },
        () => {}
    )
}
