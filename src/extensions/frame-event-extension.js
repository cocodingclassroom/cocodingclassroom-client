export class FrameEventExtension {
    user
    room

    registeredMouseListeners
    registeredKeyListeners

    static _toPassMouseEvents = ['mousedown', 'mouseup', 'mousemove']

    static _toPassKeyEvents = ['keydown', 'keyup']

    static _toPassMouseFields = [
        'altKey',
        'clientX',
        'clientY',
        'composed',
        'ctrlKey',
        'isTrusted',
        'layerX',
        'layerY',
        'metaKey',
        'movementX',
        'movementY',
        'offsetX',
        'offsetY',
        'pageX',
        'pageY',
        'screenX',
        'screenY',
        'shiftKey',
        'x',
        'y',
        'button',
        'buttons',
        'relatedTarget',
        'region',
    ]

    static _toPassKeyFields = [
        'altKey',
        'bubbles',
        'cancelBubble',
        'cancelable',
        'charCode',
        'code',
        'composed',
        'ctrlKey',
        'isTrusted',
        'key',
        'keyCode',
        'location',
        'metaKey',
        'repeat',
        'returnValue',
        'shiftKey',
        'type',
        'which',
    ]

    constructor(user, room) {
        this.user = user
        this.room = room
        this.registeredKeyListeners = []
        this.registeredMouseListeners = []
        this._setupEventListeners()
    }

    _setupEventListeners() {
        FrameEventExtension._toPassMouseEvents.forEach((eventName) => {
            const f = (event) => {
                let copy = this._copyOpts(event, FrameEventExtension._toPassMouseFields)
                let eventCopy = new MouseEvent(eventName, copy)
                this.room.l_iframeForRoom.contentWindow.dispatchEvent(eventCopy)
            }
            this.registeredMouseListeners.push(f)
            document.addEventListener(eventName, f)
        })
        FrameEventExtension._toPassKeyEvents.forEach((eventName) => {
            const f = (event) => {
                let copy = this._copyOpts(event, FrameEventExtension._toPassKeyFields)
                let eventCopy = new KeyboardEvent(eventName, copy)
                this.room.l_iframeForRoom.contentWindow.dispatchEvent(eventCopy)
            }
            this.registeredKeyListeners.push(f)
            document.addEventListener(eventName, f)
        })
    }

    cleanUp = () => {
        let i = 0
        FrameEventExtension._toPassMouseEvents.forEach((eventName) => {
            let correspondingFunction = this.registeredMouseListeners[i]
            document.removeEventListener(eventName, correspondingFunction)
            i++
        })
        i = 0
        FrameEventExtension._toPassKeyEvents.forEach((eventName) => {
            let correspondingFunction = this.registeredKeyListeners[i]
            document.removeEventListener(eventName, correspondingFunction)
            i++
        })
    }

    _copyOpts(event, fields) {
        let opts = {}
        let offX = (this.user.leftSize / 100) * window.innerWidth
        fields.forEach((f) => {
            if (f in event) {
                opts[f] = event[f]
                if (this.user.selectedRoomRight === this.room.id) {
                    if (f === 'offsetX' || f === 'clientX' || f === 'pageX' || f === 'x') {
                        opts[f] = opts[f] - offX
                    }
                }
            }
        })
        return opts
    }
}
