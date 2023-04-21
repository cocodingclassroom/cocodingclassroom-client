import {html, LitElement} from "lit";
import {repeat} from "lit-html/directives/repeat.js";
import {RoomService} from "../../services/room-service";
import {UserService} from "../../services/user-service";
import {RoomType} from "../../models/room";

export class RoomSelectView extends LitElement {

    static properties = {
        roomId: {type: String},
    }

    room;

    connectedCallback() {
        this.room = RoomService.get().getRoom(this.roomId);
        UserService.get().localUser.addListener(() => {
            this._setSelectedOption();
            this.requestUpdate();
        });
        super.connectedCallback();
    }

    render = () => {
        return html`
            <div>
                <div class="cc-roomlist-holder">
                    <select id="${this._getRoomSelectId()}"
                            name="rooms"
                            @change="${this._onChangeRoomSelection}">
                        ${repeat(
                                RoomService.get().rooms.filter(
                                        (room) => room.roomType === RoomType.STUDENT
                                ),
                                (e) => e,
                                (room) => html`
                                    <option
                                            value="${room.id}"
                                    >
                                        ${room.roomName}
                                    </option>`
                        )}
                    </select>
                </div>
            </div>`;
    }


    _getRoomSelectId = () => `room-select-${this.room.id}`;

    _onChangeRoomSelection = (e) => {
        console.log(e.target.value);
        UserService.get().localUser.selectedRoomRight = parseInt(e.target.value);
        this._setSelectedOption();
    };

    _setSelectedOption() {
        let selectDOM = this._getSelectDOMElement();
        if (selectDOM === null) return;
        for (let i = 0; i < selectDOM.options.length; i++) {
            let option = selectDOM.options[i];
            if (UserService.get().localUser.isRoomRight(option.value)) {
                option.setAttribute("selected", true);
            } else {
                option.removeAttribute("selected");
            }
        }
    }

    _getSelectDOMElement = () => this.renderRoot?.querySelector(`#${this._getRoomSelectId()}`) ?? null;
}

window.customElements.define("cc-room-select", RoomSelectView);
