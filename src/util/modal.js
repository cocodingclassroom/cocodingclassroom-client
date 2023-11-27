import { html, render } from 'lit-html'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
import '../resources/css/modal.css'

export const showModal = (content, onConfirm, afterOpen, showCancel = true) => {
    const oldModal = document.getElementById('single-modal')
    if (oldModal != null) {
        oldModal.parentNode.removeChild(oldModal)
    }

    // create the modal backdrop
    const backdrop = document.createElement('div')
    backdrop.id = 'single-modal'
    backdrop.classList.add('modal-backdrop')
    document.body.appendChild(backdrop)
    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) {
            closeModal()
        }
    })

    // create the modal content
    const modalContent = html` <div class="modal-content">${unsafeHTML(content)}</div> `

    // create the cancel button
    const cancelButton = html`
        <button
            id="modal-cancel-button"
            class="modal-cancel-button modal-button"
            @click=${() => {
                closeModal()
            }}
        >
            Cancel
        </button>
    `

    // create the ok button
    const okButton = html`
        <button
            id="modal-ok-button"
            class="modal-ok-button modal-button"
            @click=${() => {
                onConfirm()
                closeModal()
            }}
        >
            Ok
        </button>
    `

    // place this line in the dialog show function - to only add the listener when the dialog is shown
    window.addEventListener('keydown', handleKey)

    // uncomment and place this in the dialog close/hide function to remove the listener when dialog is closed/hidden
    const closeModal = () => {
        window.removeEventListener('keydown', handleKey)
        document.body.removeChild(backdrop)
    }
    // borrowed and adapted from https://stackoverflow.com/a/60031728/1393693
    function handleKey(e) {
        if (e.key === 'Tab') {
            let focusable = document.querySelector('#modal').querySelectorAll('input,button,select,textarea')
            if (focusable.length) {
                let first = focusable[0]
                let last = focusable[focusable.length - 1]
                let shift = e.shiftKey
                if (shift) {
                    if (e.target === first) {
                        // shift-tab pressed on first input in dialog
                        last.focus()
                        e.preventDefault()
                    }
                } else {
                    if (e.target === last) {
                        // tab pressed on last input in dialog
                        first.focus()
                        e.preventDefault()
                    }
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault()
            document.getElementById('modal-ok-button').click()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            document.getElementById('modal-cancel-button').click()
        }
    }

    // render the modal HTML
    const modal = html`
        <div class="modal" id="modal">
            ${modalContent}
            <div class="modal-button-row">${showCancel ? cancelButton : ''} ${okButton}</div>
        </div>
    `

    render(modal, backdrop)
    document.getElementById('modal-ok-button').focus()
    afterOpen()
}
