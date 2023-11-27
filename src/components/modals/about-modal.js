import showdown from 'showdown'
import md from '../../../README.md'
import { showModal } from '../../util/modal'

export const showAbout = () => {
    let converter = new showdown.Converter()
    let html = converter.makeHtml(md)
    showModal(
        `
    <div>
    ${html}
    <div>
    `,
        () => {},
        () => {},
        false
    )
}
