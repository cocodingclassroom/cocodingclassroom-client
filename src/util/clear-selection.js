export const clearSelection = () => {
    let sel
    if ((sel = document.selection) && sel.empty) {
        sel.empty()
    } else {
        if (window.getSelection) {
            window.getSelection().removeAllRanges()
        }
        let activeEl = document.activeElement
        if (activeEl) {
            let tagName = activeEl.nodeName.toLowerCase()
            if (tagName == 'textarea' || (tagName == 'input' && activeEl.type == 'text')) {
                // Collapse the selection to the end
                activeEl.selectionStart = activeEl.selectionEnd
            }
        }
    }
}
