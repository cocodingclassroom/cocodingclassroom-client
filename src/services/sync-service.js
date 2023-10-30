import { Doc as YDoc } from "yjs";
import { WebsocketProvider } from "y-websocket";
import { murmurhash3_32_gc, toNumbers } from "/src/util/cc-auth.js";
import { Router } from "@vaadin/router";

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
      sessionStorage.setItem("auth", options.params.authSet.toString());
    }

    this.connectWithOptions(url, classroomID, options, connectedCallback);
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
