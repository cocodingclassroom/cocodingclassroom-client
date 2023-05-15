import platform from "platform";

export class ShortcutExtension {
  _shortcuts;
  _check;
  _pressedKeys;
  _isWindows;

  constructor() {
    this._shortcuts = [];
    this._pressedKeys = new Set();
    this._isWindows = platform.os.family === "Windows";
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

      let usedKeyBind = this._isWindows ? shortcut.keyBindWin : shortcut.keyBindMac;

      let allKeys = usedKeyBind.every((key) =>
        this._pressedKeys.has(key.toLowerCase())
      );

      let ctrlActiveIfNeeded = shortcut.ctrlKey ? event.ctrlKey : true;
      let altActiveIfNeeded = shortcut.altKey ? event.altKey : true;
      let shiftActiveIfNeeded = shortcut.shiftKey ? event.shiftKey : true;

      if (allKeys && ctrlActiveIfNeeded && altActiveIfNeeded && shiftActiveIfNeeded) {
        console.log("done command");
        shortcut.command();
        this._pressedKeys.delete(event.key);
        event.stopPropagation();
        //event.preventDefault();
        //this.handleSpecialEvents(event);
        return;
      }
    }

    //this.handleSpecialEvents(event);
  };

  handleSpecialEvents = (event) => {
    if (this._pressedKeys.has("control")) {
      //make special case for copy + paste
      if (
        (this._pressedKeys.size === 2 &&
          (this._pressedKeys.has("c") ||
            this._pressedKeys.has("v") ||
            this._pressedKeys.has("r"))) ||
        this._pressedKeys.has("altgraph")
      ) {
        return;
      }
      //block any basic browser "CTRL" shortcuts
      event.stopPropagation();
      event.preventDefault();
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
