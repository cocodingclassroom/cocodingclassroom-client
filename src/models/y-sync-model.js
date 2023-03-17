import { SyncService } from "/src/services/sync-service";

export class YSyncModel {
  mapName;
  listeners;
  map;

  constructor(mapName) {
    this.mapName = mapName;
    this.listeners = [];
    this.map = SyncService.get().getSharedMap(mapName);
    this.map.observeDeep(() => {
      this.notifyListeners();
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
        typeof this[propertyName] !== "function"
      ) {
        initialData[propertyName] = this[propertyName];
        Object.defineProperty(this, propertyName, {
          get: () => this.get(propertyName),
          set: (newValue) => this.set(propertyName, newValue),
        });
      }
    }
    this.populateWithDefaults(initialData);
  }

  addListener(listener) {
    this.listeners.push(listener);
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
    this.notifyListeners();
  }

  get(key) {
    return this.map.get(key);
  }

  delete(key) {
    this.map.delete(key);
    this.notifyListeners();
  }

  notifyListeners = () => {
    this.listeners.forEach((listener) => {
      listener();
    });
  };

  clear() {
    this.map.clear();
    this.notifyListeners();
  }

  populateWithDefaults(defaults) {
    Object.entries(defaults).forEach(([key, value]) => {
      if (value !== undefined) {
        this.map.set(key, value);
      }
    });
  }
}
