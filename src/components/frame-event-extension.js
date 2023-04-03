export class FrameEventExtension {
  user;
  room;
  passedEvents;

  static mouseFields = [
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

  static keyFields = [
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
    this.passedEvents = [];
  }

  addNewEventToPass(eventName) {
    if (!this.passedEvents.contains(eventName))
      this.passedEvents.push(eventName);
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
