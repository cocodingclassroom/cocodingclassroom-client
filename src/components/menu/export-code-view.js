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
              <div>
                Export:<br>
                <select id="export-type" style="">
                <option value="export-room-js">Room as .js</option>
                <option value="export-room-html">Room as .html</option>
                <option value="export-classroom-js">Classroom Session as .js</option>
                <option value="export-classroom-html" disabled>Classroom Session as .html</option>
                </select>
              </div><br>
              <div>
                Filesname: <br><input type="text" id="export-filename" value="${
                  RoomService.get().getRoom(this.roomId).l_filename
                }" onclick="this.select();">
              </div>
            </div>
          `,
          () => {
            let exportType = document.getElementById("export-type").value;
            let filename = document.getElementById("export-filename").value;
            let room = RoomService.get().getRoom(this.roomId);
            switch (exportType) {
              case "export-room-js":
                console.log(exportType);
                room.l_filename = filename;
                BindingService.get().binding.exportRoomJS(
                  RoomService.get().getRoom(this.roomId)
                );
                break;
              case "export-room-html":
                console.log(exportType);
                room.l_filename = filename;
                BindingService.get().binding.exportRoomHTML(
                  RoomService.get().getRoom(this.roomId)
                );
                break;
              case "export-classroom-js":
                console.log(exportType);
                BindingService.get().binding.exportClassroomJS(filename);
                break;
              case "export-classroom-html":
                console.log(exportType);
                BindingService.get().binding.exportClassroomHTML(filename);
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
          () => {
            document.getElementById("export-filename").select();
          }
        );
      }}"
    >
      <cc-icon svg="${iconSvg.save}"></cc-icon>
    </div>`;
  };
}

safeRegister("cc-export-code", ExportCodeView);
