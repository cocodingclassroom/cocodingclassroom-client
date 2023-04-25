import { css, html, LitElement } from "lit";
import {
  cursorTipStyle,
  menuRowStyles,
  toolTipStyle,
} from "../../util/shared-css";
import { initDataTips } from "../../util/tooltips";
import { version } from "../../version";
import { iconSvg } from "../icons/icons";

export class TeacherMenuView extends LitElement {
  static properties = {
    roomId: { type: String },
  };

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    initDataTips(this.renderRoot);
  }

  render = () => {
    return html`
      <div class="cc-controls-row">
        <div
          class="cc-header-title help"
          data-tip="${version}"
          @click="${() => {}}"
        >
          COCODING Classroom
        </div>

        <div class="help" @click="${() => {}}" data-tip="About">
          <cc-icon svg="${iconSvg.about}"></cc-icon>
        </div>
        <div class="cc-nav-settings" @click="${() => {}}" data-tip="Settings">
          <cc-icon svg="${iconSvg.settings}" }></cc-icon>
        </div>
      </div>
    `;
  };

  static styles = [
    css`
      .cc-header-title {
        font-size: 10pt;
        min-width: calc(100% - 60px);
      }
    `,
    menuRowStyles(),
    cursorTipStyle(),
    toolTipStyle(),
  ];
}

window.customElements.define("cc-teacher-menu-view", TeacherMenuView);
