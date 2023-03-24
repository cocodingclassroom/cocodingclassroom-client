import { css, html, LitElement } from "lit";
import { User } from "/src/models/user.js";
import { styleMap } from "lit/directives/style-map.js";
import { ClassroomService } from "/src/services/classroom-service.js";
import { UserService } from "/src/services/user-service.js";
import { RoomService } from "/src/services/room-service.js";
import { getSplitScreenWidthAndAlignStyle } from "../util/util";

export class ClassRoomView extends LitElement {
  static MIN_WIDTH = 5; //percent of screen width
  static properties = {
    localUser: { type: User, state: true, attribute: false },
    roomRight: { state: true },
    roomLeft: { state: true },
    classroom: { state: true },
  };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    ClassroomService.get().connectToExistingRoom(
      this.location.params.id,
      () => {
        this._setMembers();
      }
    );
    document.addEventListener("resize", this.onResize);
  }

  disconnectedCallback() {
    document.removeEventListener("resize", this.onResize);
  }

  _setMembers() {
    this.classroom = ClassroomService.get().classroom;
    this.localUser = UserService.get().localUser;
    this.roomRight = RoomService.get().rooms[this.localUser.selectedRoomRight];
    this.roomLeft = RoomService.get().rooms[this.localUser.selectedRoomLeft];
    let update = () => {
      this.roomRight =
        RoomService.get().rooms[this.localUser.selectedRoomRight];
      this.roomLeft = RoomService.get().rooms[this.localUser.selectedRoomLeft];
      this.requestUpdate();
    };

    this.localUser.addListener(update);
    this.roomRight.addListener(update);
    this.roomLeft.addListener(update);
    this.classroom.addListener(update);
  }

  onResize = () => {
    this.requestUpdate();
  };

  render() {
    let width = window.innerWidth;
    let pixelWidthPerPercent = width / 100;
    let leftWidth = (this.localUser?.leftSize ?? 50) * pixelWidthPerPercent;
    let rightWidth = width - 5 - leftWidth;

    const leftStyle = getSplitScreenWidthAndAlignStyle(leftWidth, 0);
    const rightStyle = getSplitScreenWidthAndAlignStyle(rightWidth, 1);

    return html`
      ${this.roomLeft
        ? html` <div style="${styleMap(leftStyle)}">
            <cc-room
              roomId="${this.roomLeft.id}"
              width="${leftWidth}"
              isLeft="${0}"
            ></cc-room>
          </div>`
        : ""}
      ${this.roomRight
        ? html`
            <div style="${styleMap(rightStyle)}">
              <cc-room
                roomId="${this.roomRight.id}"
                width="${rightWidth}"
                isLeft="${1}"
              ></cc-room>
            </div>
          `
        : ``}

      <div
        style="${styleMap({ left: `${leftWidth}px` })}"
        class="middle-bar"
        .onmousedown="${(e) => this._dragMiddleBarStart(e)}"
      ></div>
    `;
  }

  _dragMiddleBarStart = () => {
    document.onmousemove = this._dragMiddleBar;
    document.onmouseup = this._dragMiddleBarEnd;
  };

  _dragMiddleBar = (e) => {
    let x = e.clientX;
    let screenWidth = window.innerWidth;
    let percentageDrag = (100 / screenWidth) * x;
    this.localUser.leftSize = this._clampPercentage(percentageDrag);
  };

  _dragMiddleBarEnd = () => {
    document.onmousemove = () => {};
  };

  _clampPercentage = (percentage) => {
    if (percentage < ClassRoomView.MIN_WIDTH) {
      percentage = 0;
    }
    return percentage;
  };

  static styles = css`
    .middle-bar {
      position: absolute;
      height: 100vh;
      top: 0;
      width: 5px;
      background-color: grey;
      cursor: e-resize;
    }
  `;
}

window.customElements.define("cc-classroom", ClassRoomView);
