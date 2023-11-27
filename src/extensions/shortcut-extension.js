import { isMac } from 'lib0/environment'

export class ShortcutExtension {
    static _instance

    _shortcuts
    _check
    _pressedKeys
    _isWindows
    _isMac

    constructor() {
        if (ShortcutExtension._instance !== undefined && ShortcutExtension._instance !== null) {
            throw new Error(
                `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
            )
        }
        this._shortcuts = []
        this._pressedKeys = new Set()
        this._isMac = isMac
        this._isWindows = !isMac
        this._check = () => true
    }

    static get() {
        if (ShortcutExtension._instance === undefined) {
            ShortcutExtension._instance = new ShortcutExtension()
            ShortcutExtension._instance.register()
            // register on window to access it from console.
            window.ShortcutExtension = ShortcutExtension._instance
        }
        return ShortcutExtension._instance
    }

    register = () => {
        document.addEventListener('keyup', (event) => this.keyLifted(event))
        document.addEventListener('keydown', (event) => this.keyPressed(event))
    }

    unregister = () => {
        document.removeEventListener('keyup', (event) => this.keyLifted(event))
        document.removeEventListener('keydown', (event) => this.keyPressed(event))
    }

    addValidityCheck = (check) => {
        this._check = check
    }

    addShortcuts = (shortcuts) => {
        shortcuts.forEach((shortcut) => this._shortcuts.push(shortcut))
        this._shortcuts.sort((a, b) => {
            let lengthA = a.keyBind.length
            let lengthB = b.keyBind.length
            return lengthA - lengthB
        })
    }

    releaseShortcuts = (shortcuts) => {
        shortcuts.forEach((shortcut) => this._shortcuts.splice(this._shortcuts.indexOf(shortcut), 1))
    }

    // open developer console and call: window.ShortcutExtension.shortcutsTable()
    shortcutsTable = () => {
        var prettyPrint = []
        prettyPrint.push('| Name | Windows | MacOs |')
        this._shortcuts.forEach((shortcut) => {
            prettyPrint.push(`| ${shortcut.shortcutName} | ${shortcut.keyBindingsWin} | ${shortcut.keyBindingsMac} |`)
        })
        // remove duplicates
        prettyPrint = prettyPrint.filter((item, index) => prettyPrint.indexOf(item) === index)
        return prettyPrint.join('\n')
    }

    keyLifted = (event) => {
        if (!this._pressedKeys.delete(event.key.toLowerCase())) {
            event.preventDefault()
            event.stopPropagation()
            return false
        }
        return true
    }

    keyPressed = (event) => {
        if (!this._check()) {
            return false
        }

        this._pressedKeys.add(event.key.toLowerCase())
        let success = false
        for (let i = 0; i < this._shortcuts.length; i++) {
            let shortcut = this._shortcuts[i]

            if (shortcut.preValidation !== undefined && !shortcut.preValidation()) continue

            let hasKey = this._pressedKeys.has(shortcut.keyBind.toLowerCase())
            if (!hasKey) {
                continue
            }

            if (event.ctrlKey !== shortcut.ctrlKey) continue
            if (event.metaKey !== shortcut.cmdKey) continue
            if (event.altKey !== shortcut.altKey) continue
            if (event.shiftKey !== shortcut.shiftKey) continue

            shortcut.command()
            success = true
        }
        if (success) {
            this._pressedKeys.clear()
            event.preventDefault()
            event.stopPropagation()
            return false
        }
        return true
    }
}

/**
 * Helper function to parse an array of shortcuts.
 * @param {string[]} shortcutStrings
 * @returns parsed shortcuts as objects
 */
function _parseShortcutStrings(shortcutStrings) {
    return shortcutStrings.map(_parseShortcutString)
}

function _parseShortcutString(shortcutString) {
    // get rid of whitespaces
    shortcutString = shortcutString.replace(/\s/g, '')
    let plus = shortcutString.endsWith('++')
    let short = shortcutString.split('+')
    if (short.length === 0) {
        throw new Error('Shortcut must not be empty.')
    }
    if (plus) {
        short.push('+')
    }
    let cmdKey = short.includes('cmd')
    let ctrlKey = short.includes('ctrl')
    let altKey = short.includes('alt')
    let shiftKey = short.includes('shift')
    let keyBind = short.slice(-1)[0]
    return { cmdKey, ctrlKey, altKey, shiftKey, keyBind }
}

export class Shortcut {
    shortcutName
    remove
    ctrlKey
    cmdKey
    altKey
    shiftKey
    keyBind
    command
    preValidation
    keyBindingsWin // documentation only
    keyBindingsMac // documentation only

    constructor(
        shortcutName,
        ctrlKey,
        cmdKey,
        altKey,
        shiftKey,
        keyBind,
        command,
        preValidation = undefined,
        keyBindingsWin,
        keyBindingsMac
    ) {
        this.shortcutName = shortcutName
        this.keyBind = keyBind
        this.ctrlKey = ctrlKey
        this.cmdKey = cmdKey
        this.altKey = altKey
        this.shiftKey = shiftKey
        this.command = command
        this.preValidation = preValidation
        this.keyBindingsWin = keyBindingsWin
        this.keyBindingsMac = keyBindingsMac
    }

    /**
     * The command to be executed is returned as a callback
     * @callback command
     */

    /**
     * Validator to test if the shortcut should be active at the moment. Must return a boolean.
     * @callback preValidation
     * @returns {boolean} true if the shortcut should be active, false otherwise.
     */

    /**
     *
     * @param {string} shortcutName name of the shortcut. should be unique.
     * @param {string[]} keyBindingsWin windows key strings (e.g. ctrl+shift+Enter)
     * @param {string[]} keyBindingsMac mac key strings (e.g. cmd+shift+Enter)
     * @param {command} command command to exectue
     * @param {preValidation} preValidation validate if the shortcut should be active. Must return a boolean.
     * @returns new Shortcut instance
     */
    static fromPattern(shortcutName, keyBindingsWin, keyBindingsMac, command, preValidation = undefined) {
        let shortcuts = _parseShortcutStrings(isMac ? keyBindingsMac : keyBindingsWin)
        let ret = shortcuts.map((short) => {
            return new Shortcut(
                shortcutName,
                short.ctrlKey,
                short.cmdKey,
                short.altKey,
                short.shiftKey,
                short.keyBind,
                command,
                preValidation,
                keyBindingsWin,
                keyBindingsMac
            )
        })
        return ret
    }
}
