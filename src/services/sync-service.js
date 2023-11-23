import { Doc as YDoc } from "yjs";
import { WebsocketProvider } from "y-websocket";
import { murmurhash3_32_gc, toNumbers } from "/src/util/cc-auth.js";

export class SyncService {
  static #instance;

  #yDoc;
  #awareness;

  constructor() {
    if (SyncService.#instance !== undefined && SyncService.#instance !== null) {
      throw new Error(
        `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
      );
    }
  }

  static get() {
    return SyncService.#instance;
  }

  static connectAndSetup(
    url,
    createRoom,
    classroomID,
    password,
    connectedCallback
  ) {
    if (SyncService.#instance === undefined)
      SyncService.#instance = new SyncService();
    let options = this._getOptions(classroomID, password, createRoom);

    if (createRoom) {
      this.saveHash(options.params.authSet.toString(), classroomID);
    }

    this.connectWithOptions(url, classroomID, options, connectedCallback);
  }

  static saveHash(hash, classroomID) {
    sessionStorage.setItem("auth_" + classroomID, hash);
  }

  static getHash(classroomId) {
    let hash = sessionStorage.getItem("auth_" + classroomId);
    if (!hash) {
      hash = murmurhash3_32_gc(classroomId, toNumbers(""));
    }
    return hash;
  }

  static connectAndSetupWithHash(
    url,
    createRoom,
    classroomID,
    hash,
    connectedCallback
  ) {
    if (SyncService.#instance === undefined)
      SyncService.#instance = new SyncService();
    let options = {
      params: {
        authID: classroomID,
        auth: hash,
        // auth: password,
      },
    };
    this.connectWithOptions(url, classroomID, options, connectedCallback);
  }

  static connectWithOptions(url, classroomID, options, connectedCallback) {
    this.#instance.#yDoc = new YDoc();
    let websocketProvider = new WebsocketProvider(
      url,
      classroomID,
      this.#instance.#yDoc,
      options
    );
    websocketProvider.on("synced", () => {
      this.#instance.#awareness = websocketProvider.awareness;
      connectedCallback();
    });
  }

  static _getOptions(classroomID, password, createRoom) {
    let options = {
      params: {
        authID: classroomID,
        auth: murmurhash3_32_gc(classroomID, toNumbers(password)),
        // auth: password,
      },
    };

    if (createRoom) {
      options = {
        params: {
          authID: classroomID,
          authSet: murmurhash3_32_gc(classroomID, toNumbers(password)),
          // auth: password,
        },
      };
    }
    return options;
  }

  getSharedMap = (mapName) => this.#yDoc.getMap(mapName);

  getSharedText = (textName) => this.#yDoc.getText(textName);

  getSharedArray = (arrayName) => this.#yDoc.getArray(arrayName);

  getAwareness = () => {
    return this.#awareness;
  };

  getSyncId = () => {
    return this.#yDoc.clientID;
  };
}
