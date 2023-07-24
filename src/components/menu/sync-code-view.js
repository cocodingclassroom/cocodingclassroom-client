import { html, LitElement } from "lit";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";
import { syncCode } from "../modals/sync-code-modal";

export class SyncCodeView extends LitElement {
  static properties = {
    roomId: { type: String },
  };
  render = () => {
    return html` <div @click="${() => syncCode(this.roomId)}">
      <cc-icon svg="${iconSvg.code}"></cc-icon>
    </div>`;
  };
}

safeRegister("cc-sync-code", SyncCodeView);
