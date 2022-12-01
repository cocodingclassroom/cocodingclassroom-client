import { SettingsPanel } from "./settingsPanel";
import { version } from "../../index";

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
      <div class="cc-header-title cc-about-toggle" data-tip="${cc.version}">
        COCODING Classroom
      </div>
      <div class="cc-controls-row">
        <div class="cc-about-toggle" style="cursor: help;" data-tip="About">
            ${cc.icons.about}
        </div>
        <div class="cc-nav-settings" data-tip="Settings">
            ${cc.icons.settings}
        </div>
      </div>
     </div>
    `;

    let aboutButtons = this.getRootElement().querySelectorAll(".cc-about-toggle");
    aboutButtons.forEach(aboutButton => {
      aboutButton.onclick = () => {
        this.showAbout();
      }
    })

    let settingsButton =
      this.getRootElement().querySelector(".cc-nav-settings");
    settingsButton.onclick = () => {
      this.toggleSettings();
    }

    this.rootElement.append(this.settingsPanel.getRootElement());
  };

  toggleSettings = (forceHide = false) => {
    let settingsButton =
      this.getRootElement().querySelector(".cc-nav-settings");

    if (this.settingsShowing || forceHide) {
      this.settingsShowing = false;
      this.settingsPanel.hide();
      settingsButton.classList.remove("cc-settings-active");
    } else {
      this.settingsShowing = true;
      this.settingsPanel.show();
      settingsButton.classList.add("cc-settings-active");
    }
    cc.tipsInit();
  };

  showAbout = () => {
    let markedOptions = {
      headerPrefix:'marked-'
    };
    let readmePath = 'README.md?' + version;
    let request = new XMLHttpRequest();
    request.open('GET', readmePath, true);
    request.send();
    request.addEventListener('load', function(){
      let markedReadme = marked.parse(request.responseText, markedOptions);
      let verrev = '<p>v '+ version + '<br>';
      markedReadme = markedReadme.replace(/(<p>).+?(<br>)/, verrev); // <p[^>]*> // [v-\d].*<br>cc
      let aboutDiv = '<div id="about-alert" class="vex-long">'+markedReadme+'</div>';

      vex.dialog.alert({
        unsafeMessage:aboutDiv,
        afterOpen: function(){
          cc.vexFocus();
        }
      })
    });
  }
}
