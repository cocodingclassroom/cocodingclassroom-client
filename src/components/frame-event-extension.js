import { stringify } from "lib0/json";

export class FrameEventExtension {
  user;
  room;

  static _toPassMouseEvents = ["mousedown", "mouseup", "mousemove"];

  static _toPassKeyEvents = ["keydown", "keyup"];

  static _toPassMouseFields = [
    "altKey",
    "clientX",
    "clientY",
    "composed",
    "ctrlKey",
    "isTrusted",
    "layerX",
    "layerY",
    "metaKey",
    "movementX",
    "movementY",
    "offsetX",
    "offsetY",
    "pageX",
    "pageY",
    "screenX",
    "screenY",
    "shiftKey",
    "x",
    "y",
    "button",
    "buttons",
    "relatedTarget",
    "region",
  ];

  static _toPassKeyFields = [
    "altKey",
    "bubbles",
    "cancelBubble",
    "cancelable",
    "charCode",
    "code",
    "composed",
    "ctrlKey",
    "isTrusted",
    "key",
    "keyCode",
    "location",
    "metaKey",
    "repeat",
    "returnValue",
    "shiftKey",
    "type",
    "which",
  ];

  constructor(user, room) {
    this.user = user;
    this.room = room;
    this._setupEventListeners();
  }

  _setupEventListeners() {
    FrameEventExtension._toPassMouseEvents.forEach((eventName) => {
      document.addEventListener(eventName, (event) => {
        let copy = this._copyOpts(
          event,
          FrameEventExtension._toPassMouseFields
        );
        let eventCopy = new MouseEvent(eventName, copy);
        this.room.l_iframeForRoom.contentWindow.dispatchEvent(eventCopy);
      });
    });
    FrameEventExtension._toPassKeyEvents.forEach((eventName) => {
      document.addEventListener(eventName, (event) => {
        let copy = this._copyOpts(event, FrameEventExtension._toPassKeyFields);
        let eventCopy = new KeyboardEvent(eventName, copy);
        this.room.l_iframeForRoom.contentWindow.dispatchEvent(eventCopy);
      });
    });
  }

  _copyOpts(event, fields) {
    let opts = {};
    let offX = (this.user.leftSize / 100) * window.innerWidth;
    fields.forEach(function (f) {
      if (f in event) {
        opts[f] = event[f];
        if (f === "offsetX" || f === "clientX" || f === "pageX" || f === "x") {
          opts[f] = opts[f] - offX;
        }
      }
    });
    return opts;
  }
}
