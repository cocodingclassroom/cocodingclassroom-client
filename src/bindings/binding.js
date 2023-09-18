import {
  download,
  downloadPictureFromBase64,
  downloadZipFile,
} from "../util/util";
import { ClassroomService } from "../services/classroom-service";
import { RoomService } from "../services/room-service";

export class BindingTemplate {
  codeTemplate;
  customCode;
  iframeTemplate;

  getIFrameTemplate() {}

  exportRoomJS = (room) => {
    download(`${room.l_filename}.js`, room.codeContent);
  };

  exportPicture = (room) => {
    let iframe = room.l_iframeForRoom.contentWindow.document;
    let canvas = iframe.getElementsByTagName("canvas");

    canvas.forEach((canvas) => {
      let result = canvas.toDataURL();
      downloadPictureFromBase64(`${room.l_filename}_screenshot.png`, result);
    });
  };

  exportRoomHTML = (room) => {
    let exportHtml = `<html lang="en">
    ${this.iframeTemplate}
   <script>
    ${this.customCode}
    ${room.codeContent} 
    </script>
    </html>
    `;
    download(`${room.l_filename}.html`, exportHtml);
  };

  exportClassroomJS = (filename) => {
    let zipFiles = [];
    ClassroomService.get().classroom.roomIds.forEach((id, i) => {
      let room = RoomService.get().getRoom(id);
      zipFiles.push({
        name: `${i}_${room.roomName}.js`,
        lastModified: new Date(),
        input: room.codeContent.toString(),
      });
    });

    downloadZipFile(zipFiles, filename);
  };

  exportClassroomHTML = (filename) => {
    console.log("Export HTML package... coming soon");
  };
}
