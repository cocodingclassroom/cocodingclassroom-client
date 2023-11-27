import { SyncService } from '/src/services/sync-service'
import { Array as YArray, Map as YMap } from 'yjs'

export class YSyncModel {
    mapName
    listeners
    map

    constructor(mapName) {
        this.mapName = mapName
        this.listeners = []
        this.map = SyncService.get().getSharedMap(mapName)
        this.map.observeDeep((changes) => {
            this.notifyListeners(changes)
        })
    }

    setup() {
        const initialData = {}
        for (let propertyName in this) {
            if (
                propertyName !== 'constructor' &&
                propertyName !== 'mapName' &&
                propertyName !== 'listeners' &&
                propertyName !== 'map' &&
                !propertyName.startsWith('l_') &&
                typeof this[propertyName] !== 'function'
            ) {
                if (this[propertyName] instanceof Map) {
                    initialData[propertyName] = new YMap()
                    Object.defineProperty(this, propertyName, {
                        get: () => this.map.get(propertyName),
                        set: (newValue) => {
                            if (newValue instanceof Map) {
                                let map = new YMap()
                                newValue.forEach((key, value) => {
                                    map.set(key, value)
                                })
                                this.map.set(propertyName, map)
                            }
                        },
                    })
                } else if (Array.isArray(this[propertyName])) {
                    initialData[propertyName] = new YArray()
                    Object.defineProperty(this, propertyName, {
                        get: () => this.map.get(propertyName),
                        set: (newValue) => {
                            let array = YArray.from(newValue)
                            this.map.set(propertyName, array)
                        },
                    })
                } else {
                    initialData[propertyName] = this[propertyName]
                    Object.defineProperty(this, propertyName, {
                        get: () => this.get(propertyName),
                        set: (newValue) => this.set(propertyName, newValue),
                    })
                }
            }
        }
        this.populateWithDefaults(initialData)
    }

    addListener(listener) {
        this.listeners.push(listener)
    }

    removeListener(listener) {
        this.listeners = this.listeners.filter((el) => el !== listener)
    }

    addOnceListener(listener) {
        const f = () => {
            listener()
            this.map.unobserveDeep(f)
        }
        this.map.observeDeep(f)
    }

    set(key, value) {
        this.map.set(key, value)
    }

    get(key) {
        return this.map.get(key)
    }

    delete(key) {
        this.map.delete(key)
    }

    notifyListeners = (changes) => {
        this.listeners.forEach((listener) => {
            listener(changes)
        })
    }

    populateWithDefaults(defaults) {
        Object.entries(defaults).forEach(([key, value]) => {
            let currentValue = this.map.get(key)
            if (currentValue === undefined) {
                this.map.set(key, value)
            }
        })
    }
}
