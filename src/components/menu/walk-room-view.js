import { css, html, LitElement } from 'lit'
import { safeRegister } from '../../util/util'
import { iconSvg } from '../icons/icons'
import { pulseStyle } from '../../util/shared-css'
import { UserService } from '../../services/user-service'
import { RoomService } from '../../services/room-service'
import { RoomType } from '../../models/room'
import { ClassroomService } from '../../services/classroom-service'
import { debugLog } from '../../index'

export class WalkRoomView extends LitElement {
    static properties = {
        roomId: { type: String },
    }

    classroom

    connectedCallback() {
        this.classroom = ClassroomService.get().classroom
        this.classroom.addListener(() => {
            this.requestUpdate()
        })
        super.connectedCallback()
    }

    render = () => {
        return html` <div
            class="box ${this.classroom.isWalking ? 'green-background pulse-on' : ''}"
            @click="${this.#walkRooms}"
        >
            <cc-icon svg="${iconSvg.person}"></cc-icon>
        </div>`
    }

    #walkRooms = () => {
        this.classroom.isWalking = !this.classroom.isWalking
        if (this.classroom.isWalking) {
            this.#startWalking()
        } else {
            this.#stopWalking()
        }
        this.requestUpdate()
    }

    #startWalking() {
        this.interval = setInterval(() => {
            let currentRoom = RoomService.get().getRoom(UserService.get().localUser.selectedRoomRight)
            let nextRoom = RoomService.get().getNextRoomInList(currentRoom)
            while (this.#nextRoomNotOkay(nextRoom)) {
                nextRoom = RoomService.get().getNextRoomInList(nextRoom)
            }
            debugLog(`walked to room ${nextRoom.id}`)
            UserService.get().localUser.selectedRoomRight = nextRoom.id
        }, 1000 * ClassroomService.get().classroom.walkDelay)
    }

    #nextRoomNotOkay(nextRoom) {
        if (ClassroomService.get().isGalleryMode()) {
            return nextRoom.roomType === RoomType.TEACHER
        }
        return nextRoom.roomType === RoomType.TEACHER || !nextRoom.hasUsers()
    }

    #stopWalking = () => {
        clearInterval(this.interval)
    }

    static styles = [
        pulseStyle(),
        css`
            .green-background {
                background-color: green;
                margin: 0;
            }

            .box {
                width: 100%;
                height: 100%;
            }
        `,
    ]
}

safeRegister('cc-walk-room', WalkRoomView)
