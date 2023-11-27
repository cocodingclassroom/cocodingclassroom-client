import { css, html, LitElement } from 'lit'
import { ClassroomService } from '/src/services/classroom-service.js'
import { initDataTips } from '../util/tooltips'
import { Router } from '@vaadin/router'
import { safeRegister } from '../util/util'
import { bindings } from '../bindings/bindings-config'
import {
    inputStyle,
    toolTipStyle,
} from '../util/shared-css'

export class Setup extends LitElement {
    initialRoomNumbers = 5
    minRoomNumbers = 2
    maxRoomNumbers = 30
    liveCodingOn = true
    secondsDelay = 0.5
    lineNumbersVisible = true
    roomLocksOn = false
    bindingIndex = 0
    password = ''

    firstUpdated(_changedProperties) {
        initDataTips(this.renderRoot);
    }
    render() {
        let secDelays = Array.from({ length: 4 }, (v, k) => (k + 1) / 2)
        let i = 0
        return html`
            <div class="container-row">
                <div class="container-col">
                    <h3 class="p5">SETUP</h3>
                    <hr class="hr2" />
                    <div class="p5" data-tip="Run code with\nthis library" data-tip-left>
                        <select class="round submit" name="binding" @change="${this.onChangeBinding}">
                            ${bindings.map(
                                (binding) => html` <option value="${i++}">${new binding().bindingName}</option>`
                            )}
                        </select>
                        <label for="binding">Binding Framework</label>
                    </div>
                    <hr />
                    <div class="p5" data-tip="Number of student \nrooms (${this.minRoomNumbers}-${this.maxRoomNumbers})" data-tip-left>
                        <input
                            class="round w55"
                            @change="${this.onChangeRoomNumbers}"
                            @input="${this.onInputRoomNumbers}"
                            type="text"
                            value="${this.initialRoomNumbers}"
                            name="rooms"
                        />
                        <label for="rooms">Room Count</label>
                    </div>
                    <hr />
                    <div class="p5" data-tip="Auto compile \ncode on keyup" data-tip-left>
                        <input
                            type="checkbox"
                            name="LiveCoding"
                            checked="checked"
                            @change="${this.onChangeLiveDelay}"
                        />
                        <label for="LiveCoding"
                            >Live Coding –
                            <select @change="${this.onChangeSecondsDelay}" class="round submit">
                                ${secDelays.map((secDelay) => html` <option value="${secDelay}">${secDelay}</option> `)}
                            </select>
                            sec delay</label
                        >
                    </div>
                    <hr />
                    <div class="p5" data-tip="Display code \nline numbers" data-tip-left>
                        <input
                            @change="${this.onChangeLineNumbers}"
                            type="checkbox"
                            name="line-numbers"
                            checked="checked"
                        />
                        <label for="line-numbers">Line Numbers</label>
                    </div>
                    <hr />
                    <div class="p5" data-tip="Peers can lock \nroom from edits" data-tip-left>
                        <input @change="${this.onChangeRoomLocks}" type="checkbox" name="room-locks" />
                        <label for="room-locks">Room Locks</label>
                    </div>
                    <hr />
                    <div class="p5" data-tip="Require password \nto enter classroom" data-tip-left>
                        <input
                            class="round"
                            @change="${this.onChangePassword}"
                            type="text"
                            placeholder="(optional)"
                            name="password"
                        />
                        <label for="password">Password</label>
                    </div>
                    <hr class="hr2" />
                    <div
                        class="p5 nohover"
                        style="display: flex; flex-direction: column; justify-content: center;padding-left:0;"
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
            <iframe id="setup-meta" src="./src/resources/html/setup-meta.html"></iframe>
        `
    }

    onChangeRoomNumbers = (e) => {
        // try parse value as number
        var rooms = parseInt(e.target.value)
        var value = rooms
        // if not a number
        if (isNaN(rooms)) {
            value = initialRoomNumbers
        } else if (rooms < this.minRoomNumbers) {
            value = this.minRoomNumbers
        } else if (rooms > this.maxRoomNumbers) {
            value = this.maxRoomNumbers
        }
        e.target.value = value
        this.initialRoomNumbers = value
    }

    onInputRoomNumbers = (e) => {
        // try parse value as number
        var rooms = parseInt(e.target.value)
        // only allow integers
        if (isNaN(rooms)) {
            e.target.value = ''
            return
        }
        e.target.value = rooms
    }

    onChangeLiveDelay = (e) => {
        this.liveCodingOn = e.target.checked
    }

    onChangeSecondsDelay = (e) => {
        this.secondsDelay = e.target.value
    }

    onChangeLineNumbers = (e) => {
        this.lineNumbersVisible = e.target.value
    }

    onChangeRoomLocks = (e) => {
        this.roomLocksOn = e.target.checked
    }

    onChangePassword = (e) => {
        this.password = e.target.value
    }

    onChangeBinding = (e) => {
        this.bindingIndex = e.target.value
    }

    onSubmit = () => {
        let newClassroomId = ClassroomService.get().createNewRoom(
            () => {
                console.log('created new room')
                Router.go(`/${newClassroomId}`)
            },
            this.initialRoomNumbers,
            this.liveCodingOn,
            this.secondsDelay,
            this.lineNumbersVisible,
            this.bindingIndex,
            this.roomLocksOn,
            this.password
        )
    }

    static styles = [
        toolTipStyle(),
        css`
            .container-col {
                display: flex;
                flex-direction: column;
                margin-top: 25px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.75);
                border: 1px solid rgba(255, 255, 255, 0.5);
            }

            .container-col div {
                padding: 10px 0 10px 10px;
            }

            .container-col div:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            .nohover {
                background: none !important;
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
                font-size: 1.5em;
                margin: 0 0 0 5px;
            }

            .round {
                padding: 5px;
                border-radius: 5px;
                border: white 1px;
            }

            .submit {
                font-family: Roboto Mono, sans-serif;
                background-color: white;
                font-size: 1.2em;
                cursor: pointer;
            }
            .submit:hover {
                background-color: #eee;
            }

            hr {
                height: 1px;
                background: rgba(255, 255, 255, 0.75);
                border: none;
                width: 400px;
                margin: 0;
            }
            .hr2 {
                height: 2px;
            }

            input,
            textarea,
            select,
            option {
                font-family: inherit;
            }

            div.tooltip2 {
                position: relative;
                display: inline-block;
            }

            div.tooltip2::before {
                content: attr(data-tip);
                position: absolute;
                z-index: 999;
                width: 200px;
                height: 80px;
                bottom: 9999px;
                background: #222222;
                color: #e0e0e0;
                padding: 7px;
                line-height: 24px;
                top: -25px;
                vertical-align: middle;
                left: 102%;
                opacity: 0;
                -webkit-transition: opacity 0.4s ease-out;
                -moz-transition: opacity 0.4s ease-out;
                -o-transition: opacity 0.4s ease-out;
                transition: opacity 0.4s ease-out;
                text-shadow: none;
            }

            div.tooltip2:hover::before {
                opacity: 1;
                /* bottom: -35px; */
            }

            #setup-meta {
                position: fixed;
                top: 0;
                left: 0;
                border: none;
                z-index: -1;
                width: 100vw;
                height: 100vh;
            }
        `,
        inputStyle(),
    ]
}

safeRegister('cc-setup', Setup)
