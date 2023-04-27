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
          <label for="live-coding">Live Coding
            <select>
              <option value="0.5">0.5</option>
              <option value="1">1</option>
              <option value="1.5">1.5</option>
              <option value="2">2</option>
            </select>
            /s Delay
          </label>
        </div>
        <div>
          <input id="line-numbers" type="checkbox">
          <label for="line-numbers">Line Numbers</label>
        </div>
        <div>
          <input id="room-locks" type="checkbox">
          <label for="room-locks">Room Locks</label>
        </div>
        <div class="row">
          <label for="walk-delay">Walk Delay:</label>
          <input id="walk-delay" type="number">
          <div>
            sec
          </div>
        </div>
        <div>
          Editor Settings
        </div>
        <div class="row">
          <label for="font-size">Font Size:</label>
          <input id="font-size" type="number">
          <div>
            pt
          </div>
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
      font-size: 8pt;
      padding: 2px;
    }
    
  `, basicFlexStyles()];

}

safeRegister("cc-settings", SettingsView);
