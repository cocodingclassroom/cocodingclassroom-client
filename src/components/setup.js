import { css, html, LitElement } from "lit";
import { ClassroomService } from "/src/services/classroom-service.js";
import { Router } from "@vaadin/router";
import { safeRegister } from "../util/util";
import { inputStyle } from "../util/shared-css";
import { bindings } from "../bindings/bindings-config";
import { number } from "lib0";

export class Setup extends LitElement {
    initialRoomNumbers = 5;
    liveCodingOn = true;
    secondsDelay = 0.5;
    lineNumbersVisible = true;
    roomLocksOn = false;
    bindingIndex = 0;
    password = "";

    render() {
        let secDelays = Array.from({ length: 4 }, (v, k) => (k + 1) / 2);
        let i = 0;
        return html`
      <div class="container-row">
        <div class="container-col">
          <h3 class="p5">COCODING CLASSROOM - SETUP</h3>
          <hr />
          <div class="p5">
            <select
              class="round submit"
              name="binding"
              @change="${this.onChangeBinding}"
            >
              ${bindings.map(
            (binding) => html` <option value="${i++}">
                  ${new binding().bindingName}
                </option>`
        )}
            </select>
            <label for="binding">Selected Binding</label>
          </div>
          <div class="p5">
            <input
              class="round w55"
              @change="${this.onChangeRoomNumbers}"
              @input="${this.onInputRoomNumbers}"
              type="text"
              value="5"
              name="rooms"
            />
            <label for="rooms">initial Rooms (2-30)</label>
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
        // try parse value as number
        var rooms = parseInt(e.target.value);
        var value = rooms;
        // if not a number
        if (isNaN(rooms)) {
            value = 5;
        } else if (rooms < 2) {
            value = 2;
        } else if (rooms > 30) {
            value = 30;
        }
        e.target.value = value;
        this.initialRoomNumbers = value;
    };

    onInputRoomNumbers = (e) => {
        // try parse value as number
        var rooms = parseInt(e.target.value);
        // only allow integers
        if (isNaN(rooms)) {
            e.target.value = "";
            return;
        }
        e.target.value = rooms;
    }

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

    onChangeBinding = (e) => {
        this.bindingIndex = e.target.value;
    };

    onSubmit = () => {
        let newClassroomId = ClassroomService.get().createNewRoom(
            () => {
                console.log("created new room");
                Router.go(`/${newClassroomId}`);
            },
            this.initialRoomNumbers,
            this.liveCodingOn,
            this.secondsDelay,
            this.lineNumbersVisible,
            this.bindingIndex,
            this.roomLocksOn,
            this.password
        );
    };

    static styles = [
        css`
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

      .w55 {
        width: 55px;
      }

      h3 {
        margin-bottom: 0;
      }

      .round {
        padding: 5px;
        border-radius: 5px;
        border: white 1px;
      }

      .submit {
        font-family: Roboto Mono, sans-serif;
        background-color: white;
        text-transform: uppercase;
      }

      hr {
        height: 2px;
        background-color: white;
        border: none;
        width: 400px;
      }

      input,
      textarea,
      select,
      option {
        font-family: inherit;
      }
    `,
        inputStyle(),
    ];
}

safeRegister("cc-setup", Setup);
