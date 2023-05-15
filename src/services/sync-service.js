import { Doc as YDoc } from "yjs";
import { WebsocketProvider } from "y-websocket";
import { murmurhash3_32_gc } from "/src/util/cc-auth.js";

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

    // console.log(
    //   `opts: authId: ${options.params.authID} authSet: ${options.params.authSet} authToken: ${options.params.authToken} auth: ${options.params.auth}`
    // );

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
        auth: murmurhash3_32_gc(classroomID, password),
      },
    };
    if (createRoom) {
      options = {
        params: {
          authID: classroomID,
          authSet: murmurhash3_32_gc(classroomID, password),
          authToken: null,
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
