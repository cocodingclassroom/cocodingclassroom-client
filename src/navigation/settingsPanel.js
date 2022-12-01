export class SettingsPanel {
  isAdmin; //boolean
  rootElement; //HTMLElement
  showing; //boolean

  constructor(isAdmin) {
    this.isAdmin = isAdmin;
    this.rootElement = document.createElement("div");
    this.render();
  }

  getRootElement = () => {
    return this.rootElement;
  };

  render = () => {
    let adminSettings = `<div class="cc-settings-subhead">CLASSROOM</div>
				<div data-tip="Set classroom mode" data-tip-left>
					Mode <select class="cc-settings-mode" data-tip="" onchange="cc.modeChange(this.value)">
						<option ${cc.y.settings.get("mode") === "edit" ? "selected" : ""}>edit</option>
						<option ${
              cc.y.settings.get("mode") === "gallery" ? "selected" : ""
            }>gallery</option>
					</select>
				</div>
				<div data-tip="Auto compile code on keyup" data-tip-left>
					<input class="cc-setting-checkbox" type="checkbox" ${
            cc.y.settings.get("liveCoding") ? "checked" : ""
          } onchange="cc.y.settings.set('liveCoding', this.checked);">
					Live Coding

					<select class="cc-settings-livedelay" data-tip="Keyup delay in seconds" onchange="cc.y.settings.set('liveDelay', this.value)">
						${this._renderLiveDelaySettings()}
					</select> sec
				</div>
				<div data-tip="Display code line numbers" data-tip-left>
					<input class="cc-setting-checkbox" type="checkbox" ${
            cc.y.settings.get("lineNumbers") ? "checked" : ""
          } onchange="cc.y.settings.set('lineNumbers', this.checked);">
					Line Numbers
				</div>
				<div data-tip="Anyone can lock their room" data-tip-left>
					<input class="cc-setting-checkbox" type="checkbox" ${
            cc.y.settings.get("roomLocks") ? "checked" : ""
          } onchange="cc.y.settings.set('roomLocks', this.checked);">
					Room Locks
				</div>
				<div data-tip="Speed of walking through rooms" data-tip-left>
					Walk Delay:
					<input class="cc-setting-input cc-settings-walkdelay" type="text" value="${
            cc.settings.walkDelay
          }" onchange="cc.settings.walkDelay=this.value;cc.roomWalk(true);cc.settingsSave()"> sec
				</div>`;

    this.rootElement.innerHTML = `
        <div class="cc-settings">
				  <div class="cc-settings-bar"></div>
          <!--	Add Admin settings if the user an admin	-->
				  ${this.isAdmin ? adminSettings : ""}

				<div class="cc-settings-subhead">EDITOR</div>

				<div data-tip="Set code font size" data-tip-left>
					Font Size:
					<input class="cc-setting-input cc-settings-fontsize" type="text" value="${
            cc.settings.editor.fontsize
          }" onkeyup="cc.editorFontSize(this.value)"> pt
				</div>
				</div>
			`;
  };

  _renderLiveDelaySettings = () => {
    let opts = "";
    let curDelay = cc.y.settings.get("liveDelay");
    for (let i = 0.5; i <= 2; i += 0.5) {
      let sel = "";
      if (i === curDelay) {
        sel = "selected";
      }
      opts += `<option ${sel}>${i}</option>`;
    }
    return opts;
  };

  show = () => {
    this.rootElement.style.display = "block";
  };

  hide = () => {
    this.rootElement.style.display = "none";
  };
}
