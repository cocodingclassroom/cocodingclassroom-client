import { download } from "../util/util";

export class BindingTemplate {
  codeTemplate;
  customCode;
  iframeTemplate;

  getIFrameTemplate() {}

  export = (room) => {
    let exportHtml = `<html lang="en">
    ${this.iframeTemplate}
   <script>
    ${room.codeContent} 
    ${this.customCode}
    </script>
    </html>
    `;
    download("export.html", exportHtml);
  };
}
