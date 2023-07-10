import { download } from "../util/util";

export class BindingTemplate {
  codeTemplate;
  customCode;
  iframeTemplate;

  getIFrameTemplate() {}

  exportJS = (room) => {
    download(`${room.l_filename}.js`, room.codeContent);
  };

  exportHTML = (room) => {
    let exportHtml = `<html lang="en">
    ${this.iframeTemplate}
   <script>
    ${room.codeContent} 
    ${this.customCode}
    </script>
    </html>
    `;
    download(`${room.l_filename}.html`, exportHtml);
  };
}
