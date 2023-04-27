import { css, html, LitElement } from "lit";
import { safeRegister } from "../../util/util";
import { basicFlexStyles } from "../../util/shared-css";

export class SettingsView extends LitElement {

  render = () => {
    return html`
      <div class="settings-panel col">
        <div>
          Classroom Settings
        </div>
        <div class="row">
          <div class="grow">
            Mode
          </div>
          <div>
            <input name="mode" id="editInput" type="radio" value="Edit">
            <label for="editInput">Edit</label>
            <input name="mode" id="galleryInput" type="radio" value="Gallery">
            <label for="galleryInput">Gallery</label>
          </div>
        </div>
        <div class="row">
          <input id="live-coding" type="checkbox">
          <label for="live-coding">Live Coding</label>
        </div>
      </div>
    `;
  };

  static styles = [css`
    .settings-panel {
      min-height: 50px;
      max-height: 500px;
      width: 100%;
    }
    
    .settings-panel div {
      padding: 2px;
    }
    
  `, basicFlexStyles()];

}

safeRegister("cc-settings", SettingsView);
