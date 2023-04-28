import { UserService } from "./user-service";

export class NotifyService {
  static _instance;

  #listeners;

  constructor() {
    if (
      NotifyService._instance !== undefined &&
      NotifyService._instance !== null
    ) {
      throw new Error(
        `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
      );
    }
    this.#listeners = [];
  }

  static get() {
    if (NotifyService._instance === undefined)
      NotifyService._instance = new NotifyService();
    return NotifyService._instance;
  }

  addListener(listener) {
    this.#listeners.push(listener);
  }

  removeListener(listener) {
    this.#listeners = this.#listeners.filter((el) => el !== listener);
  }

  notify(notification) {
    this.#listeners.forEach((listener) => {
      listener(notification);
    });
  }
}

export class Notification {
  type;
  sender; //user-object of user who sent the message

  constructor(type, sender) {
    this.type = type;
    this.sender = sender;
  }

  isAddressedToMe = () => {
    return UserService.get().localUser === this.sender;
  };
}

export class NotificationType {
  static FULLREBUILDOFFRAME = 0;
}
