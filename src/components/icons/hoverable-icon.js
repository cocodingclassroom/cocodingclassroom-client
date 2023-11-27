import { css, html, LitElement, unsafeCSS } from 'lit'
import { pulseStyle } from '../../util/shared-css'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
import { safeRegister } from '../../util/util'

export class HoverableIcon extends LitElement {
    static properties = {
        svg: { type: String },
    }
    render = () => {
        return html`
            <lit-icon icon="add" iconset="iconset"></lit-icon>
            <lit-iconset iconset="iconset"> ${unsafeHTML(this.svg)}</lit-iconset>
        `
    }

    static styles = [
        css`
            svg {
                height: 18px;
                width: 18px;
            }

            .svg:hover {
                animation: pulse 1s linear infinite alternate !important;
            }
        `,
        pulseStyle(),
    ]
}

safeRegister('cc-icon', HoverableIcon)
