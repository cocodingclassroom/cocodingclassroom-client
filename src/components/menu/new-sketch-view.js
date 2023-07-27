import { html, LitElement } from "lit";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";
import { setNewSketch } from "../modals/new-sketch-modal";

export class NewSketchView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  render = () => {
    return html` <div @click="${() => setNewSketch(this.roomId)}">
      <cc-icon svg="${iconSvg.new}"></cc-icon>
    </div>`;
  };
}

safeRegister("cc-new-sketch", NewSketchView);
