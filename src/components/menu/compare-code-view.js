import { html, LitElement } from "lit";
import { iconSvg } from "../icons/icons";
import { safeRegister } from "../../util/util";
import { UserService } from "../../services/user-service";
import { RoomService } from "../../services/room-service";
import { patienceDiffPlus } from "../../util/patience-diff";
import { Range } from "ace-builds";

export class CompareCodeView extends LitElement {
  activeMarkers;

  constructor() {
    super();
    this.activeMarkers = [];
  }

  render() {
    return html` <div
      @click="${() => {
        this.#compareCode();
      }}"
    >
      <cc-icon svg="${iconSvg.merge}"></cc-icon>
    </div>`;
  }

  #compareCode = () => {
    let user = UserService.get().localUser;
    let roomLeft = RoomService.get().getRoom(user.selectedRoomLeft);
    let roomRight = RoomService.get().getRoom(user.selectedRoomRight);

    let linesLeft = roomLeft.codeContent.toString().split("\n");
    let lineRight = roomRight.codeContent.toString().split("\n");

    let results = patienceDiffPlus(lineRight, linesLeft);
    this.#clearMarkers(roomLeft.l_editorForRoom);

    //needs timeout, to make sure that the markers are actually removed, so the fade animation works
    setTimeout(() => {
      results.lines.forEach((line) => {
        if (line.aIndex === -1 && line.line.length !== 0) {
          let rowLeft = line.bIndex;
          let marker = roomLeft.l_editorForRoom.session.addMarker(
            new Range(rowLeft, 0, rowLeft, line.line.length),
            "added-line",
            "fullLine",
            true
          );
          this.activeMarkers.push(marker);
        }
      });
    }, 10);
  };

  #clearMarkers = (editor) => {
    this.activeMarkers.forEach((id) => {
      editor.session.removeMarker(id);
    });
    this.activeMarkers = [];
  };
}

safeRegister("cc-compare-code-view", CompareCodeView);
