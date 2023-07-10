import { html, LitElement } from "lit";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";
import { BindingService } from "../../services/binding-service";
import { RoomService } from "../../services/room-service";
import { showModal } from "../../util/modal";

export class ExportCodeView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  render = () => {
    return html` <div
      @click="${() => {
        let room = RoomService.get().getRoom(this.roomId);
        if (room.l_filename == undefined) {
          room.l_filename = room.roomName;
        }
        showModal(
          `
            <div>
              Export:<br>
              <select id="export-type" style="background:#444;">
              <option value="export-room-js">Room as .js</option>
              <option value="export-room-html">Room as .html</option>
              <!--<option value="export-classroom-js">Classroom Session as .js</option>-->
              <!--<option value="export-classroom-html">Classroom Session as .html</option>-->
              </select> <br>
              Filesname: <br><input id="export-filename" value="${
                RoomService.get().getRoom(this.roomId).l_filename
              }" style="color:#000;">
            </div>
          `,
          () => {
            let filename = document.getElementById("export-filename").value;
            let room = RoomService.get().getRoom(this.roomId);
            room.l_filename = filename;
            let exportType = document.getElementById("export-type").value;
            switch (exportType) {
              case "export-room-js":
                console.log(exportType);
                BindingService.get().binding.exportJS(
                  RoomService.get().getRoom(this.roomId)
                );
                break;
              case "export-room-html":
                console.log(exportType);
                BindingService.get().binding.exportHTML(
                  RoomService.get().getRoom(this.roomId)
                );
                break;
              case "export-classroom-js":
                console.log(exportType);
                break;
              case "export-classroom-html":
                console.log(exportType);
                break;
            }
            // let room = RoomService.get().getRoom(this.roomId);
            // let template = room.codeContent.toString();
            // RoomService.get().rooms.forEach((otherRoom) => {
            //   if (otherRoom === room) return;
            //   otherRoom.codeContent.delete(0, otherRoom.codeContent.length);
            //   otherRoom.codeContent.insert(0, template);
            // });
          },
          () => {}
        );
        // BindingService.get().binding.export(
        //   RoomService.get().getRoom(this.roomId)
        // );
      }}"
    >
      <cc-icon svg="${iconSvg.save}"></cc-icon>
    </div>`;
  };
}

safeRegister("cc-export-code", ExportCodeView);
