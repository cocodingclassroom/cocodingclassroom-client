import {
  download,
  downloadPictureFromBase64,
  downloadZipFile,
} from "../util/util";
import { ClassroomService } from "../services/classroom-service";
import { RoomService } from "../services/room-service";

export class BindingBase {
  bindingName = "Some Binding";

  /**
   * Get the Custom Code that is defined for the binding.
   *
   * Binding specific helper functions can be defined here, these will be injected into the iframe, before the users code is being added, so that the user can use them.
   * @returns {string} custom code as a string
   */
  getCustomCode = () => {
    return `
    function myFancyFunction() {
      console.log("I am fancy")
    }
    `;
  };

  /**
   * Get the Javascript code, that will be shown as the "blank" page from where the users starts writing their code
   * @returns {string} code template as string
   */
  getCodeTemplate = () => {
    return `
      function start() {
      
      }
      
      function update() {
      
      }
    `;
  };

  /**
   * Get the Script configs that need to be loaded into the iframe before running the users code.
   *
   * On how to build JSLoadingConfig's refer to the classes' documentation.
   *
   * @returns {*[JSLoadingConfig]}
   */
  getScriptTags = () => {
    return [];
  };

  /**
   * Get the iframe template that will be rendered into the html
   *
   * It should consist of the <head> and <body> of a html document.
   * The <html> Tag will be added later when building the iframe or the exported html.
   *
   * Inside the head it must have {SCRIPTS} as text, that is where later the defined script tags are being injected.
   *
   * @returns {string} iframe template as a string
   */
  getIFrameTemplate = () => {
    // Example to adapt in inherited class
    return `<head>
	<title>Binding Base</title>
	<meta charset="utf-8">
  <!--	Fill out full iframe-->
	<style type="text/css">
		body{
			margin: 0;
			width: 100%;
			height: 100%;
			overflow: hidden;
			cursor: crosshair;
			background: #000;
		}
		canvas{
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			margin: 0;
		}
		input{
			cursor: crosshair;
		}
	  </style>
    {SCRIPTS}
  </head>
<body>
</body>`;
  };

  /**
   *
   *
   * @param editor AceEditor
   * @returns {string | undefined} Code to Eval in Iframe
   */
  bindingSpecificSoftCompile = (editor) => {
    return undefined;
  };

  getIInAppFrameTemplate = () => {
    return `
    <!DOCTYPE html>
      <html lang="en">
      ${this.getInjectedIframeTemplate(false)}
      </html>
    `;
  };

  #getExportIFrameTemplate = () => {
    return this.getInjectedIframeTemplate(true);
  };

  getInjectedIframeTemplate = (forExport = false) => {
    let preferLocalScripts = !forExport;
    return this.getIFrameTemplate().replace(
      "{SCRIPTS}",
      this.getStringScriptTags(preferLocalScripts)
    );
  };

  getStringScriptTags = (preferLocalScripts) => {
    return this.getScriptTags()
      .map((scriptTag) => scriptTag.getScriptTag(preferLocalScripts))
      .join("\n");
  };

  exportRoomJS = (room) => {
    download(
      `${room.l_filename}_${new Date().toLocaleString()}.js`,
      room.codeContent
    );
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
    let exportHtml = `
      <html lang="en">
        ${this.#getExportIFrameTemplate(true)}
      <script>
        ${this.getCustomCode()}
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

/**
 * Defines a library to be imported into the binding before running, can configure local and remote binding for a single library.
 * In export the remote path will be chosen first, if only a local path exists when exporting the room, then the library will not be added and a comment is added instead, telling you to add the library manually back.
 *
 * In App the local variant is chosen first, if a local variant is available.
 */
export class JSLoadingConfig {
  scriptName = "Some Script";
  localPath = undefined;
  remoteScriptTag = undefined;

  constructor(remoteScriptTag, scriptName, localPath = undefined) {
    this.remoteScriptTag = remoteScriptTag;
    this.localPath = localPath;
    this.scriptName = scriptName;
  }

  getScriptTag(isLocal = false) {
    if (isLocal && this.localPath !== undefined) {
      return (
        "<script type='text/javascript' src='" + this.localPath + "'></script>"
      );
    }

    if (this.remoteScriptTag === undefined) {
      return `<!-- Missing remote library url for export. Manually add library ${this.scriptName} back to HTML to run this code -->`;
    }

    return this.remoteScriptTag;
  }
}
