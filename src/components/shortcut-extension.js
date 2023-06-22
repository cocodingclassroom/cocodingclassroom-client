import platform from "platform";

export class ShortcutExtension {
  _shortcuts;
  _check;
  _pressedKeys;
  _isWindows;
  _isMac;

  constructor() {
    this._shortcuts = [];
    this._pressedKeys = new Set();
    this._isWindows = platform.os.family === "Windows";
    this._isMac = platform.os.family === "OS X";
    this._check = () => true;
  }

  register = () => {
    document.addEventListener("keyup", (event) => this.keyLifted(event));
    document.addEventListener("keydown", (event) => this.keyPressed(event));
  };

  unregister = () => {
    document.removeEventListener("keyup", (event) => this.keyLifted(event));
    document.removeEventListener("keydown", (event) => this.keyPressed(event));
  };

  addValidityCheck = (check) => {
    this._check = check;
  };

  addShortcuts = (shortcuts) => {
    shortcuts.forEach((shortcut) => this._shortcuts.push(shortcut));
    this._shortcuts.sort((a, b) => {
      let lengthA = this._isWindows ? a.keyBindWin.length : a.keyBindMac.length;
      let lengthB = this._isWindows ? b.keyBindWin.length : b.keyBindMac.length;
      return lengthA - lengthB;
    });
  };

  keyLifted = (event) => {
    this._pressedKeys.delete(event.key.toLowerCase());
  };

  keyPressed = (event) => {
    if (!this._check()) {
      return;
    }

    this._pressedKeys.add(event.key.toLowerCase());

    for (let i = 0; i < this._shortcuts.length; i++) {
      let shortcut = this._shortcuts[i];

      if (shortcut.preValidation !== undefined && !shortcut.preValidation())
        return;

      let usedKeyBind = this._isWindows
        ? shortcut.keyBindWin
        : shortcut.keyBindMac;

      let allKeys = usedKeyBind.every((key) =>
        this._pressedKeys.has(key.toLowerCase())
      );

      let ctrlActiveIfNeeded = shortcut.ctrlKey ? event.ctrlKey : true;
      if (this._isMac) {
        ctrlActiveIfNeeded = shortcut.ctrlKey ? event.metaKey : true;
      }
      let altActiveIfNeeded = shortcut.altKey ? event.altKey : true;
      let shiftActiveIfNeeded = shortcut.shiftKey ? event.shiftKey : true;

      if (
        allKeys &&
        ctrlActiveIfNeeded &&
        altActiveIfNeeded &&
        shiftActiveIfNeeded
      ) {
        shortcut.command();
        this._pressedKeys.clear();
        event.stopPropagation();
        return;
      }
    }
  };
}

export class Shortcut {
  shortcutName;
  keyBindWin;
  keyBindMac;
  ctrlKey;
  altKey;
  shiftKey;
  command;
  preValidation;

  constructor(
    shortcutName,
    keyBindWin,
    command,
    ctrlKey,
    altKey,
    shiftKey,
    preValidation = undefined,
    keyBindMac = undefined
  ) {
    this.shortcutName = shortcutName;
    this.keyBindWin = keyBindWin;
    this.ctrlKey = ctrlKey;
    this.altKey = altKey;
    this.shiftKey = shiftKey;
    this.keyBindMac = keyBindMac === undefined ? keyBindWin : keyBindMac;
    this.preValidation = preValidation;
    this.command = command;
  }
}
