import { SettingsPanel } from "./settingsPanel";

export class TeacherRoomHeader {
  roomId; //number
  rootElement; //HTMLElement
  settingsPanel; //SettingsPanel
  settingsShowing; //boolean

  constructor(room) {
    this.roomId = room.roomId;
    this.rootElement = document.createElement("div");
    this.settingsPanel = new SettingsPanel(room.s.admin.includes(cc.p.token));
    this.render();
  }

  getRootElement = () => {
    return this.rootElement;
  };

  render = () => {
    this.rootElement.innerHTML = `
    <div class="cc-roomlist-holder cc-header-title-background">
      <div class="cc-header-title" data-tip="${cc.version}" onClick="cc.aboutToggle()">
        COCODING Classroom
      </div>
      <div class="cc-controls-row">
        <div style="cursor: help;" onclick="cc.aboutToggle()" data-tip="About">
            ${cc.icons.about}
        </div>
        <div class="cc-nav-settings" onclick="this.settingsToggle()" data-tip="Settings">
            ${cc.icons.settings}
        </div>
      </div>
     </div>
    `;
    this.rootElement.append(this.settingsPanel.getRootElement());
  };

  settingsToggle = (forceHide) => {
    let settingsButton =
      this.getRootElement().querySelector(".cc-nav-settings");

    if (this.settingsShowing || forceHide) {
      this.settingsPanel.hide();
      settingsButton.classList.remove("cc-settings-active");
    } else {
      this.settingsPanel.show();
      settingsButton.classList.add("cc-settings-active");
    }
    cc.tipsInit();
  };
}
