import { UserService } from './user-service'
import { SyncService } from './sync-service'

export class NotifyService {
    static #instance

    #localListeners
    #array

    constructor() {
        if (NotifyService.#instance !== undefined && NotifyService.#instance !== null) {
            throw new Error(
                `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
            )
        }

        this.#localListeners = []
        this.#array = SyncService.get().getSharedArray('notifications')
        this.#array.observeDeep((change) => {
            let allNotifications = this.#array.toArray()
            if (allNotifications.length > 0) {
                let newest = allNotifications[0]
                this.#notifyLocalListeners(JSON.parse(newest))
            }
        })
    }

    static get() {
        if (NotifyService.#instance === undefined) NotifyService.#instance = new NotifyService()
        return NotifyService.#instance
    }

    addListener(listener) {
        this.#localListeners.push(listener)
    }

    removeListener(listener) {
        this.#localListeners = this.#localListeners.filter((el) => el !== listener)
    }

    notify(notification) {
        this.#array.delete(0, this.#array.length)
        this.#array.insert(0, [JSON.stringify(notification)])
    }

    notifyLocal(notification) {
        this.#notifyLocalListeners(notification)
    }

    #notifyLocalListeners(notification) {
        this.#localListeners.forEach((listener) => {
            listener(notification)
        })
    }
}

/***
 * Notification Class to be used when sending notifications in the NotfiyService.
 */
export class Notification {
    type
    sender //user-object of user who sent the message
    message //string

    constructor(type, sender, message) {
        this.type = type
        this.sender = sender
        this.message = message
    }

    static isSentByMe = (notification) => {
        return UserService.get().localUser.id === notification.sender.id
    }
}

export class NotificationType {
    static FULLREBUILDOFFRAME = 0
    static BROADCAST = 1
}
