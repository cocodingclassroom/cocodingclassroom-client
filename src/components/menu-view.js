import { css, html, LitElement } from "lit";
import { RoomService } from "../services/room-service";
import { RoomType } from "../models/room";

export class MenuView extends LitElement {
  static properties = {
    roomId: { type: String },
    roomSelected: { type: Function },
  };

  room;

  connectedCallback = () => {
    this.room = RoomService.get().getRoom(this.roomId);
    super.connectedCallback();
  };

  render = () => {
    let isTeacherRoom = this.room.roomType === RoomType.TEACHER;
    return html`
      <div>
        ${isTeacherRoom ? html`<div></div>` : html` <div></div>`}
        <div></div>
      </div>
    `;
  };

  static styles = css``;
}
