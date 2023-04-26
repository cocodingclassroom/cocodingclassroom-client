import { html, LitElement } from "lit";
import { basicFlexStyles, menuRowStyles } from "../../util/shared-css";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";

export class StudentMenuView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  render = () => html`
    <div class="cc-controls-row-container">
      <div class="cc-controls-row">
        <cc-room-select roomId="${this.roomId}"></cc-room-select>
        <div class="grow">
          <cc-icon svg="${iconSvg.rename}"></cc-icon>
        </div>
      </div>
    </div>
  `;

  static styles = [menuRowStyles(), basicFlexStyles()];
}

safeRegister("cc-student-menu-view", StudentMenuView);
