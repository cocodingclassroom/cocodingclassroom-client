import {css, html, LitElement} from "lit";
import {menuRowStyles} from "../../util/shared-css";
import { UserColorRenameModal } from "../user-color-rename-modal";
import { UserService } from "../../services/user-service";

export class TeacherMenuView extends LitElement {

    static properties = {
        roomId: {type: String}
    }

    render = () => {
        return html`

            <div class="cc-controls-row">
                <div
                        class="cc-header-title"
                        style="cursor: help;"
                        data-tip=""
                        @click="${() => {
                          UserColorRenameModal(UserService.get().localUser)
                        }}"
                >
                    COCODING Classroom
                </div>

                <div
                        style="cursor: help;"
                        @onclick="${() => {
                        }}"
                        data-tip="About"
                >
                    <cc-about></cc-about>
                </div>
                <div
                        class="cc-nav-settings"
                        @onclick="${() => {
                        }}"
                        data-tip="Settings"
                >
                    <cc-settings></cc-settings>
                </div>
            </div>
        `
    }

    static styles = [
        css`
      .cc-header-title {
        font-size: 10pt;
        min-width: calc(100% - 56px);
        cursor: help;
      }
    `,
        menuRowStyles()
    ]
}

window.customElements.define("cc-teacher-menu-view", TeacherMenuView);
