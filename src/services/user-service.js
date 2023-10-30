import { SyncService } from "/src/services/sync-service.js";
import { User, UserRole } from "/src/models/user.js";
import { debugLog } from "../index";

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

    document.addEventListener("visibilitychange", () => {
      debugLog("Current State: ", document.visibilityState);
      if (this.localUser) {
        this.localUser.isOnline = document.visibilityState === "visible";
      }
    });
  }

  setup = () => {
    // SyncService.get()
    //   .getAwareness()
    //   .on("change", ({ added, updated, removed }) => {
    //     if (added.length > 0) {
    //       this.#OnUserJoined(added);
    //     }
    //     if (removed.length > 0) {
    //       this.#OnUserLeft(removed);
    //     }
    //   });
  };

  static get() {
    if (UserService._instance === undefined)
      UserService._instance = new UserService();
    return UserService._instance;
  }

  init = (classroom, isRoomCreation) => {
    let user = this._getLocalUser();
    if (user == null) {
      user = this._createNewLocalUser();
    }
    user.isOnline = true;

    if (classroom.teacherIds.toArray().includes(user.id)) {
      user.role = UserRole.TEACHER;
    } else if (isRoomCreation) {
      //make the new user to a teacher
      user.role = UserRole.TEACHER;
      classroom.teacherIds.push([user.id]);
    } else {
      user.role = UserRole.STUDENT;
    }

    classroom.addUser(user);
    this.localUser = user;
    this.localUser.addListener(() => {
      this._saveLocalUser();
    });
    this.updateOtherUsers(classroom);
    classroom.peopleIds.observe(() => {
      this.updateOtherUsers(classroom);
    });
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
    this.localUser = new User(id);
    this._saveLocalUser(this.localUser);
    this.localUser.awarenessId = SyncService.get().getAwareness().clientID;
    return this.localUser;
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

  getUserByID = (id) => {
    return this.getAllUsers().find((user) => user.id === id);
  };

  getUserByAwarenessID = (id) => {
    return this.getAllUsers().find((user) => user.awarenessId === id);
  };

  getFollowedBy = (roomId) => {
    let results = [];
    let localUser = UserService.get().localUser;
    for (let i = 0; i < this.otherUsers.length; i++) {
      let user = this.otherUsers[i];
      if (user.getTrackingByRoom(roomId) === localUser.id) {
        results.push(user);
      }
    }
    return results;
  };

  getFirstTeacher = () => {
    let allTeachers = this.getAllUsers().filter((user) => user.isTeacher());
    if (allTeachers.length === 0) return this.getAllUsers()[0];
    return allTeachers[0];
  };
}
