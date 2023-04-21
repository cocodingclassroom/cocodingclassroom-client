import {html, LitElement} from "lit";

export class StudentMenuView extends LitElement {

    static properties = {
        roomId: {type: String}
    }

    render = () => html`
        <cc-room-select roomId="${this.roomId}"></cc-room-select>
    `;

}

window.customElements.define("cc-student-menu-view", StudentMenuView);
