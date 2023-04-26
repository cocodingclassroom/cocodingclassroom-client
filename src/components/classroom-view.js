import { css, html, LitElement } from "lit";
import { User } from "/src/models/user.js";
import { styleMap } from "lit/directives/style-map.js";
import { ClassroomService } from "/src/services/classroom-service.js";
import { UserService } from "/src/services/user-service.js";
import { RoomService } from "/src/services/room-service.js";
import { getSplitScreenWidthAndAlignStyle, safeRegister } from "../util/util";
import { RoomType } from "../models/room";
import { clearSelection } from "../util/clear-selection";

export class ClassRoomView extends LitElement {
  static MIN_WIDTH = 5; //percent of screen width
  static properties = {
    localUser: { type: User, state: true, attribute: false },
  };

  constructor() {
    super();
  }

  firstUpdated(changes) {
    super.firstUpdated(changes);
    ClassroomService.get().connectToExistingRoom(
      this.location.params.id,
      () => {
        this._setMembers();
        ClassroomService.get().classroom.addListener(this.localUpdate);
        UserService.get().localUser.addListener(this.localUpdate);
      }
    );
    window.addEventListener("resize", this.onResize);
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.onResize);
    ClassroomService.get().classroom.removeListener(this.localUpdate);
    UserService.get().localUser.addListener(this.localUpdate);
  }

  localUpdate = () => {
    this.requestUpdate();
  };

  _setMembers() {
    this.localUser = UserService.get().localUser;

    this.localUser.addListener(this.localUpdate);
  }

  onResize = () => {
    this.requestUpdate();
  };

  render() {
    if (this.localUser === null || this.localUser === undefined) return "";

    let width = window.innerWidth;
    let pixelWidthPerPercent = width / 100;
    let leftWidth = (this.localUser?.leftSize ?? 50) * pixelWidthPerPercent;
    let rightWidth = width - leftWidth;

    const leftStyle = getSplitScreenWidthAndAlignStyle(leftWidth, 0);
    const rightStyle = getSplitScreenWidthAndAlignStyle(rightWidth, 1);
    const hiddenStyle = { display: "none" };

    let leftRooms = RoomService.get().rooms.filter(
      (room) => room.roomType === RoomType.TEACHER
    );
    let rightRooms = RoomService.get().rooms.filter(
      (room) => room.roomType === RoomType.STUDENT
    );

    return html`
      ${leftRooms.map(
        (leftRoom) =>
          html`
            <div
              style="${styleMap(
                this.localUser.isRoomLeft(leftRoom.id) ? leftStyle : hiddenStyle
              )}"
            >
              <cc-room
                roomId="${leftRoom.id}"
                width="${leftWidth}"
                isLeft="${0}"
              ></cc-room>
            </div>
          `
      )}
      ${rightRooms.map(
        (rightRoom) =>
          html`
            <div
              style="${styleMap(
                this.localUser.isRoomRight(rightRoom.id)
                  ? rightStyle
                  : hiddenStyle
              )}"
            >
              <cc-room
                roomId="${rightRoom.id}"
                width="${rightWidth}"
                isLeft="${1}"
              ></cc-room>
            </div>
          `
      )}

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
    clearSelection();
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
      z-index: 3;
      position: absolute;
      height: 100vh;
      top: 0;
      width: 6px;
      margin-left: -2px;
      background-color: grey;
      cursor: e-resize;
    }
  `;
}

safeRegister("cc-classroom", ClassRoomView);
