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
    this._pressedKeys.delete(event.key);
  };

  keyPressed = (event) => {
    if (!this._check()) {
      return;
    }

    this._pressedKeys.add(event.key);

    for (let i = 0; i < this._shortcuts.length; i++) {
      let shortcut = this._shortcuts[i];

      if (shortcut.preValidation !== undefined && !shortcut.preValidation())
        return;

      if (this._isWindows) {
        let allKeys = shortcut.keyBindWin.every((key) =>
          this._pressedKeys.has(key)
        );

        if (allKeys) {
          console.log("done command");
          shortcut.command();
          this._pressedKeys.delete(event.key);
          this.handleSpecialEvents(event);
          return;
        }
      } else {
        //mac ?? linux
      }
    }

    this.handleSpecialEvents(event);
  };

  handleSpecialEvents = (event) => {
    if (this._pressedKeys.has("Control")) {
      //make special case for copy + paste
      if (
        (this._pressedKeys.size === 2 &&
          (this._pressedKeys.has("c") ||
            this._pressedKeys.has("v") ||
            this._pressedKeys.has("r"))) ||
        this._pressedKeys.has("AltGraph")
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
  command;
  preValidation;

  constructor(
    shortcutName,
    keyBindWin,
    command,
    preValidation = undefined,
    keyBindMac = undefined
  ) {
    this.shortcutName = shortcutName;
    this.keyBindWin = keyBindWin;
    this.keyBindMac = keyBindMac === undefined ? keyBindWin : keyBindMac;
    this.preValidation = preValidation;
    this.command = command;
  }
}
