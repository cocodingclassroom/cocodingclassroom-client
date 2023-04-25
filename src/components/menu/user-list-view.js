import { css, html, LitElement } from "lit";
import { UserService } from "../../services/user-service";
import { isColorLight } from "../../util/util";
import { styleMap } from "lit/directives/style-map.js";
import { basicFlexStyles, cursorTipStyle, pulseStyle, toolTipStyle } from "../../util/shared-css";
import { initDataTips } from "../../util/tooltips";
import { UserColorRenameModal } from "../user-color-rename-modal";
import { ClassroomService } from "../../services/classroom-service";

export class UserListView extends LitElement {

  connectedCallback() {
    super.connectedCallback();
    UserService.get().getAllUsers().forEach(user =>
      user.addListener(this.listener)
    );
    UserService.get().localUser.addListener(this.listener);
    ClassroomService.get().classroom.addListener(this.listener);
  }

  disconnectedCallback() {
    UserService.get().getAllUsers().forEach(user =>
      user.removeListener(this.listener)
    );
    UserService.get().localUser.removeListener(this.listener);
    ClassroomService.get().classroom.removeListener(this.listener);
    super.disconnectedCallback();
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    initDataTips(this.renderRoot);
  }

  listener = () => {
    this.requestUpdate()
  }

  requestUpdate = () => {
    super.requestUpdate();
    initDataTips(this.renderRoot);
  };

  render = () => {
    return html` ${
      UserService.get().getAllUsers().map(user => {

        let backgroundColorStyle = { backgroundColor: user.color };
        let textColorStyle = { color: isColorLight(user.color) ? "black" : "white" };

        return html`
          <div class="row border" style="${styleMap(backgroundColorStyle)}">
            <div class="user-row grow pointer" data-tip="Set Username and Color" data-tip-left
                 style="${styleMap(textColorStyle)}"
                 @click="${() => {
                   if (user.isLocalUser())
                     UserColorRenameModal(user);
                 }}"
            >${user.name}
            </div>
            ${user.isLocalUser() ? html`
              <div class="user-row pulse pointer" data-tip="Request Help">🖐</div>` : ""}
            <div class="user-row"></div>
          </div>`;
      })
    }
    `;
  };

  static styles = [css`
    .user-row {
      font-size: 9pt;
      padding: 2px;
    }

    .border {
      border: aliceblue 1px solid;
      border-top: 0;
    }

  `,
    basicFlexStyles(),
    pulseStyle(),
    cursorTipStyle(),
    toolTipStyle()
  ];
}

window.customElements.define("cc-user-list", UserListView);