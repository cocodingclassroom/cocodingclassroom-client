import {css, html, LitElement} from "lit";
import {RoomService} from "../../services/room-service";
import {UserService} from "../../services/user-service";
import {RoomType} from "../../models/room";

export class MenuView extends LitElement {
    static properties = {
        roomId: {type: String},
        isTeacherRoom: {type: Boolean, state: true},
    };

    room;

    connectedCallback() {
        this.room = RoomService.get().getRoom(this.roomId);
        this.isTeacherRoom = this.room.roomType === RoomType.TEACHER;
        UserService.get().localUser.addListener(() => {
            this.requestUpdate();
        });
        super.connectedCallback();
    }

    firstUpdated = (change) => {
        super.firstUpdated(change);
    };

    render = () => {
        return html`
            <div class="cc-meta">
                ${this.isTeacherRoom
                        ? html`
                            <cc-teacher-menu-view roomId="${this.room.id}"></cc-teacher-menu-view>`
                        : html`
                            <cc-student-menu-view roomId="${this.room.id}"></cc-student-menu-view>`}
            </div>
        `;
    };

    static styles = css`
      .cc-meta {
        position: absolute;
        z-index: 3;
        top: 6px;
        right: 6px;
        background: #333;
        width: 250px;
        height: auto;
        opacity: 0.3;
        transition: opacity 0.5s;
      }

      .cc-meta:hover {
        opacity: 1;
      }

      .cc-meta-visible {
        opacity: 1;
      }

      

      
    `;
}

window.customElements.define("cc-menu", MenuView);
