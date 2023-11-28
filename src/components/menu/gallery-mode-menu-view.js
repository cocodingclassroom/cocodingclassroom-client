import { css, html, LitElement } from 'lit'
import { version } from 'process'
import { initDataTips } from '../../util/tooltips'
import { showAbout } from '../modals/about-modal'
import { iconSvg } from '../icons/icons'
import { safeRegister } from '../../util/util'
import { cursorTipStyle, menuBackground2, menuBorder1, menuRowStyles, toolTipStyle } from '../../util/shared-css'
import { sendBroadCastMessage } from '../modals/broad-cast-modal'
import { UserService } from '../../services/user-service'
import { RoomService } from '../../services/room-service'

export class GalleryModeMenuView extends LitElement {
    static properties = {
        roomId: { type: String },
        settingsOpen: { type: Boolean, state: true },
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties)
        initDataTips(this.renderRoot)
    }

    render() {
        let user = UserService.get().localUser
        return html` <div class="cc-controls-row-container">
            <div class="cc-controls-row">
                <div
                    class="cc-header-title help bg3"
                    data-tip="${version}"
                    @click="${() => {
                        showAbout()
                    }}"
                >
                    COCODING Classroom
                </div>
                <div
                    class="help bg3"
                    @click="${() => {
                        showAbout()
                    }}"
                    data-tip="About"
                >
                    <cc-icon svg="${iconSvg.about}"></cc-icon>
                </div>
                ${this.#renderSettings()}
            </div>
            ${this.settingsOpen ? html` <cc-settings></cc-settings>` : ''}
            ${user.isTeacher()
                ? html` <div class="cc-controls-row">
                      <div class="grow bg2">
                          <cc-room-select roomId="${this.roomId}"></cc-room-select>
                      </div>
                  </div>`
                : html`
          <div class="cc-controls-row">
            <div class="grow bg2">
              ${RoomService.get().getRoom(this.roomId).getRoomNameDisplay()}
            </div>
          </div>
          </div>`}
            <div class="cc-controls-row">${this.#renderActions()}</div>
        </div>`
    }

    #renderSettings = () => {
        return html` <div
            class="cc-nav-settings  ${this.settingsOpen ? 'bg3 active' : 'bg3 help'}"
            @click="${() => {
                this.settingsOpen = !this.settingsOpen
                initDataTips(this.renderRoot)
            }}"
            data-tip="Settings"
        >
            <cc-icon svg="${iconSvg.settings}" }></cc-icon>
        </div>`
    }


    #renderActions = () => {
        let user = UserService.get().localUser
        if (user.isTeacher()) {
            return this.#renderTeacherActions()
        }
        return this.#renderStudentActions()
    }

    #renderTeacherActions() {
        return html` <div data-tip="Walk rooms" class="bg2">
                <cc-walk-room roomId="${this.roomId}"></cc-walk-room>
            </div>
            <div
                data-tip="Send message to all students"
                class="bg2"
                @click="${() => {
                    sendBroadCastMessage()
                }}"
            >
                <cc-icon svg="${iconSvg.message}"></cc-icon>
            </div>
            ${this.#renderStudentActions()}`
    }

    #renderStudentActions() {
        return html` <div data-tip="Export Code" class="bg2">
            <cc-export-code roomId="${this.roomId}"></cc-export-code>
        </div>`
    }


    static styles = [
        css`
            .cc-controls-row div.cc-header-title {
                font-size: 10pt;
                min-width: calc(100% - 65px);
                padding: 4px;
                cursor: help;
                margin-bottom: -1px;
                border-bottom: 1px solid ${menuBorder1()};
            }

            .help {
                border-bottom: 1px solid ${menuBorder1()} !important;
                margin-bottom: -1px;
            }
        `,
        menuRowStyles(),
        cursorTipStyle(),
        toolTipStyle(),
    ]
}

safeRegister('cc-gallery-menu-view', GalleryModeMenuView)
