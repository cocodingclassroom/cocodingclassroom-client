import { Doc as YDoc } from "yjs";
import { WebsocketProvider } from "y-websocket";
import { murmurhash3_32_gc } from "/src/util/cc-auth.js";

export class SyncService {
  static _instance;

  _yDoc;
  _awareness;

  constructor() {
    if (SyncService._instance !== undefined && SyncService._instance !== null) {
      throw new Error(
        `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
      );
    }
  }

  static get() {
    return SyncService._instance;
  }

  static connectAndSetup(
    url,
    createRoom,
    classroomID,
    password,
    connectedCallback
  ) {
    if (SyncService._instance === undefined)
      SyncService._instance = new SyncService();
    let options = this._getOptions(classroomID, password, createRoom);

    // console.log(
    //   `opts: authId: ${options.params.authID} authSet: ${options.params.authSet} authToken: ${options.params.authToken} auth: ${options.params.auth}`
    // );

    this._instance._yDoc = new YDoc();
    let websocketProvider = new WebsocketProvider(
      url,
      classroomID,
      this._instance._yDoc,
      options
    );
    websocketProvider.on("synced", () => {
      this._instance._awareness = websocketProvider.awareness;
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

  getSharedMap = (mapName) => this._yDoc.getMap(mapName);

  getSharedText = (textName) => this._yDoc.getText(textName);

  getSharedArray = (arrayName) => this._yDoc.getArray(arrayName);

  getAwareness = () => {
    return this._awareness;
  };

  getSyncId = () => {
    return this._yDoc.clientID;
  };
}
