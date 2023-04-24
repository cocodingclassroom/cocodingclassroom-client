import { SyncService } from "/src/services/sync-service.js";
import { User } from "/src/models/user.js";
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";

export class UserService {
  static _instance;
  localUser;
  otherUsers;

  constructor() {
    if (UserService._instance !== undefined && UserService._instance !== null) {
      throw new Error(
        `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
      );
    }
    this.otherUsers = [];
  }

  static get() {
    if (UserService._instance === undefined)
      UserService._instance = new UserService();
    return UserService._instance;
  }

  init = (classroom) => {
    window.localStorage.clear();
    let user = this._getLocalUser();
    if (user == null) {
      user = this._createNewLocalUser();
      classroom.peopleIds.push(user.id);
    }
    this.localUser = user;
    classroom.peopleIds.forEach((peopleId) => {
      let otherUser = new User(peopleId);
      this.otherUsers.push(otherUser);
    });
  };

  _createNewLocalUser = () => {
    let id = SyncService.get().getSyncId();
    let user = new User(id);
    user.name = this._getRandomUserName();
    this._saveLocalUser(user);
    return user;
  };

  _getRandomUserName = () => {
    return uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      length: 2,
      separator: "_",
    });
  };

  _saveLocalUser = (user) => {
    window.localStorage.setItem("self", JSON.stringify(user));
  };

  _getLocalUser = () => {
    let userJson = window.localStorage.getItem("self");
    if (userJson == null) return null;
    return User.fromJSON(userJson);
  };

  getAllUsers = () => {
    return [this.localUser, ...this.otherUsers]
  }
}
