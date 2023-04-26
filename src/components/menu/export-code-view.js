import { html, LitElement } from "lit";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";

export class ExportCodeView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  render = () => {
    return html` <div>
      <cc-icon svg="${iconSvg.save}"></cc-icon>
    </div>`;
  };
}

safeRegister("cc-export-code", ExportCodeView);