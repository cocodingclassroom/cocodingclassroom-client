import { css, html, LitElement } from "lit";
import { User } from "/src/models/user.js";
import { styleMap } from "lit/directives/style-map.js";
import { ClassroomService } from "/src/services/classroom-service.js";
import { UserService } from "/src/services/user-service.js";
import { RoomService } from "/src/services/room-service.js";
import { getSplitScreenWidthAndAlignStyle, safeRegister } from "../util/util";
import { clearSelection } from "../util/clear-selection";
import { murmurhash3_32_gc, toNumbers } from "../util/cc-auth";

export class ClassRoomView extends LitElement {
  static MIN_WIDTH = 5; //percent of screen width
  static properties = {
    localUser: { type: User, state: true, attribute: false },
  };

  authed = false;

  constructor() {
    super();
  }

  firstUpdated(changes) {
    super.firstUpdated(changes);
    this.connectWithHash();
    window.addEventListener("resize", this.onResize);
  }

  connectWithHash = () => {
    let hash = this.getPasswordAuth();
    ClassroomService.get().connectToExistingRoomWithHash(
      this.location.params.id,
      hash,
      () => {
        this._setMembers();
        ClassroomService.get().classroom.addListener(this.localUpdate);
        UserService.get().localUser.addListener(this.localUpdate);
        this.authed = true;
        this.requestUpdate();
      }
    );
  };

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

  getPasswordAuth = () => {
    let auth = sessionStorage.getItem("auth");
    return auth;
  };

  render() {
    if (!this.authed) {
      return html` <div class="row">
        <div class="col">
          <label for="password">Password</label>
          <input
            name="password"
            type="text"
            placeholder="password"
            @change="${this.onChangePassword}"
          />
          <button @click="${this.onSubmit}">Enter!</button>
        </div>
      </div>`;
    }

    if (this.localUser === null || this.localUser === undefined) return "";

    if (ClassroomService.get().isGalleryMode()) {
      return this.#renderGalleryMode();
    }

    return this.#renderEditMode();
  }

  onChangePassword = (e) => {
    this.password = e.target.value;
  };

  onSubmit = () => {
    if (!this.password) {
      this.password = "";
    }

    sessionStorage.setItem(
      "auth",
      murmurhash3_32_gc(
        this.location.params.id,
        toNumbers(this.password)
      ).toString()
    );

    this.connectWithHash();
    this.requestUpdate();
  };

  #renderGalleryMode() {
    let hiddenStyle = { display: "none" };
    let fullStyle = { width: "100%", height: "100%" };

    let teacher = UserService.get().getFirstTeacher();
    return html` ${RoomService.get().rooms.map((room) => {
      return html`
        <div
          style="${styleMap(
            teacher.isRoomRight(room.id) ? fullStyle : hiddenStyle
          )}"
        >
          <cc-room roomId="${room.id}" width="${100}" isLeft="${0}"></cc-room>
        </div>
      `;
    })}`;
  }

  #renderEditMode() {
    let width = window.innerWidth;
    let pixelWidthPerPercent = width / 100;
    let leftWidth = (this.localUser?.leftSize ?? 50) * pixelWidthPerPercent;
    let rightWidth = width - leftWidth;
    leftWidth = width - rightWidth;

    return html`
      ${this.#renderLeftRoom(leftWidth)} ${this.#renderRightRoom(rightWidth)}
      <div
        style="${styleMap({ right: `${rightWidth}px` })}"
        class="middle-bar"
        .onmousedown="${(e) => this._dragMiddleBarStart(e)}"
      ></div>
    `;
  }

  #renderLeftRoom = (leftWidth) => {
    let leftStyle = getSplitScreenWidthAndAlignStyle(leftWidth, 0);

    if (this.localUser.leftSize < ClassRoomView.MIN_WIDTH) return "";

    let leftRoom = RoomService.get().getRoom(this.localUser.selectedRoomLeft);
    return html` <div style="${styleMap(leftStyle)}">
      <cc-room
        roomId="${leftRoom.id}"
        width="${leftWidth}"
        isLeft="${0}"
      ></cc-room>
    </div>`;
  };

  #renderRightRoom = (rightWidth) => {
    let rightStyle = getSplitScreenWidthAndAlignStyle(rightWidth, 1);
    if (100 - this.localUser.leftSize < ClassRoomView.MIN_WIDTH) return "";

    let rightRoom = RoomService.get().getRoom(this.localUser.selectedRoomRight);
    return html` <div style="${styleMap(rightStyle)}">
      <cc-room
        roomId="${rightRoom.id}"
        width="${rightWidth}"
        isLeft="${1}"
      ></cc-room>
    </div>`;
  };

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
      percentage = 0.5;
    }
    if (percentage > 100 - ClassRoomView.MIN_WIDTH) {
      percentage = 100;
    }
    if (percentage > 45 && percentage < 55) {
      percentage = 50;
    }
    return percentage;
  };

  static styles = css`
    .middle-bar {
      z-index: 65;
      position: absolute;
      height: 100vh;
      top: 0;
      width: 6px;
      background-color: grey;
      cursor: col-resize;
    }
  `;
}

safeRegister("cc-classroom", ClassRoomView);
