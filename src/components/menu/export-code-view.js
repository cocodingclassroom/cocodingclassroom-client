import { html, LitElement } from "lit";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";
import { BindingService } from "../../services/binding-service";
import { RoomService } from "../../services/room-service";

export class ExportCodeView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  render = () => {
    return html` <div
      @click="${() => {
        BindingService.get().binding.export(
          RoomService.get().getRoom(this.roomId)
        );
      }}"
    >
      <cc-icon svg="${iconSvg.save}"></cc-icon>
    </div>`;
  };
}

safeRegister("cc-export-code", ExportCodeView);
