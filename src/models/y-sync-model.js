import { SyncService } from "/src/services/sync-service";
import { Array as YArray } from "yjs";

export class YSyncModel {
  mapName;
  listeners;
  map;

  constructor(mapName) {
    this.mapName = mapName;
    this.listeners = [];
    this.map = SyncService.get().getSharedMap(mapName);
    this.map.observeDeep((changes) => {
      console.log(changes);
      this.notifyListeners(changes);
    });
  }

  setup() {
    const initialData = {};
    for (let propertyName in this) {
      if (
        propertyName !== "constructor" &&
        propertyName !== "mapName" &&
        propertyName !== "listeners" &&
        propertyName !== "map" &&
        !propertyName.startsWith("l_") &&
        typeof this[propertyName] !== "function"
      ) {
        if (Array.isArray(this[propertyName])) {
          initialData[propertyName] = new YArray();
          Object.defineProperty(this, propertyName, {
            get: () => this.map.get(propertyName),
            set: (newValue) => {
              let array = YArray.from(newValue); // SyncService.get().getSharedArray(`${propertyName}_${this.mapName}`);
              this.map.set(propertyName, array);
              // this.map.get(propertyName).delete(0, this.map.get(propertyName).length);
              // newValue.forEach((item, index) => {
              //   this.map.get(propertyName).insert(index, item);
              // });
            },
          });
        } else {
          initialData[propertyName] = this[propertyName];
          Object.defineProperty(this, propertyName, {
            get: () => this.get(propertyName),
            set: (newValue) => this.set(propertyName, newValue),
          });
        }
      }
    }
    this.populateWithDefaults(initialData);
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    this.listeners = this.listeners.filter((el) => el !== listener);
  }

  addOnceListener(listener) {
    const f = () => {
      listener();
      this.map.unobserveDeep(f);
    };
    this.map.observeDeep(f);
  }

  set(key, value) {
    this.map.set(key, value);
  }

  get(key) {
    return this.map.get(key);
  }

  delete(key) {
    this.map.delete(key);
  }

  notifyListeners = (changes) => {
    this.listeners.forEach((listener) => {
      listener(changes);
    });
  };

  populateWithDefaults(defaults) {
    Object.entries(defaults).forEach(([key, value]) => {
      let currentValue = this.map.get(key);
      if (currentValue === undefined) {
        this.map.set(key, value);
      }
    });
  }
}
