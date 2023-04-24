import { SyncService } from "/src/services/sync-service.js";
import { User } from "/src/models/user.js";
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
    let user = this._getLocalUser();
    if (user == null) {
      user = this._createNewLocalUser();

    }
    classroom.addUser(user);
    this.localUser = user;
    this.localUser.addListener(() => {
      this._saveLocalUser();
    });
    this.updateOtherUsers(classroom);
    classroom.peopleIds.observe(() => {
      this.updateOtherUsers(classroom);
    })
  };

  updateOtherUsers(classroom) {
    this.otherUsers = [];
    classroom.peopleIds.forEach((peopleId) => {
      if (peopleId === this.localUser.id) return;
      let otherUser = new User(peopleId);
      this.otherUsers.push(otherUser);
    });
  }

  _createNewLocalUser = () => {
    let id = SyncService.get().getSyncId();
    let user = new User(id);
    this._saveLocalUser(user);
    return user;
  };

  _saveLocalUser = () => {
    if (this.localUser === undefined) return;
    window.localStorage.setItem("self", JSON.stringify(this.localUser));
  };

  _getLocalUser = () => {
    let userJson = window.localStorage.getItem("self");
    if (userJson === null) return null;
    return User.fromJSON(userJson);
  };

  getAllUsers = () => {
    return [this.localUser, ...this.otherUsers];
  };
}
