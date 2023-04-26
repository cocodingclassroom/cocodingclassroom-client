import { css, html, LitElement } from "lit";
import { ClassroomService } from "/src/services/classroom-service.js";
import { Router } from "@vaadin/router";
import { safeRegister } from "../util/util";

export class Setup extends LitElement {
  initialRoomNumbers = 5;
  liveCodingOn = true;
  secondsDelay = 0.5;
  lineNumbersVisible = true;
  roomLocksOn = false;
  password = "";

  render() {
    let roomNumbers = Array.from({ length: 16 }, (v, k) => k + 5);
    let secDelays = Array.from({ length: 4 }, (v, k) => (k + 1) / 2);

    return html`
      <div class="container-row">
        <div class="container-col">
          <h3 class="p5">COCODING CLASSROOM - SETUP</h3>
          <hr />
          <hr />
          <div class="p5">
            <select
              class="round submit"
              name="rooms"
              @change="${this.onChangeRoomNumbers}"
            >
              ${roomNumbers.map(
                (roomNumber) => html`
                  <option value="${roomNumber}">${roomNumber}</option>
                `
              )}
            </select>
            <label for="rooms">Initial Rooms</label>
          </div>
          <hr />
          <div class="p5">
            <input
              type="checkbox"
              name="LiveCoding"
              checked="checked"
              @change="${this.onChangeLiveDelay}"
            />
            <label for="LiveCoding"
              >Live Coding w/
              <select
                @change="${this.onChangeSecondsDelay}"
                class="round submit"
              >
                ${secDelays.map(
                  (secDelay) => html`
                    <option value="${secDelay}">${secDelay}</option>
                  `
                )}
              </select>
              sec delay</label
            >
          </div>
          <hr />
          <div class="p5">
            <input
              @change="${this.onChangeLineNumbers}"
              type="checkbox"
              name="line-numbers"
              checked="checked"
            />
            <label for="line-numbers">Line Numbers</label>
          </div>
          <hr />
          <div class="p5">
            <input
              @change="${this.onChangeRoomLocks}"
              type="checkbox"
              name="room-locks"
            />
            <label for="room-locks">Room Locks</label>
          </div>
          <hr />
          <div class="p5">
            <input
              class="round"
              @change="${this.onChangePassword}"
              type="text"
              placeholder="(optional)"
              name="password"
            />
            <label for="password">Password</label>
          </div>
          <hr />
          <div
            class="p5"
            style="display: flex; flex-direction: column; justify-content: center"
          >
            <input
              class="p5 round submit"
              @click="${() => this.onSubmit()}"
              type="submit"
              name="submit "
              value="Create Classroom"
            />
          </div>
        </div>
      </div>
      <slot></slot>
    `;
  }

  onChangeRoomNumbers = (e) => {
    this.initialRoomNumbers = e.target.value;
  };

  onChangeLiveDelay = (e) => {
    this.liveCodingOn = e.target.checked;
  };

  onChangeSecondsDelay = (e) => {
    this.secondsDelay = e.target.value;
  };

  onChangeLineNumbers = (e) => {
    this.lineNumbersVisible = e.target.value;
  };

  onChangeRoomLocks = (e) => {
    this.roomLocksOn = e.target.checked;
  };

  onChangePassword = (e) => {
    this.password = e.target.value;
  };

  onSubmit = () => {
    console.log("submitted");
    let newClassroomId = ClassroomService.get().createNewRoom(() => {
      console.log("created new room");
      Router.go(`/classroom/${newClassroomId}`);
    }, this.initialRoomNumbers);
  };

  static styles = css`
    .container-col {
      display: flex;
      flex-direction: column;
    }

    .container-row {
      display: flex;
      flex-direction: row;
      justify-content: center;
    }

    .p5 {
      padding: 5px;
    }

    .round {
      padding: 5px;
      border-radius: 10px;
      border: white 2px;
    }

    .submit {
      font-family: roboto mono, sans-serif;
      background-color: white;
    }

    hr {
      height: 2px;
      background-color: white;
      border: none;
      width: 400px;
    }
  `;
}

safeRegister("cc-setup", Setup);
