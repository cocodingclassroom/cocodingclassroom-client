import { download, downloadZipFile } from "../util/util";
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
    let rooms = ClassroomService.get().classroom.roomIds.forEach((id, i) => {
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
