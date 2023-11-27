import { downloadZip } from 'client-zip'

export const getRandomID = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let id = ''
    for (let i = 0; i < 8; i++) id += chars.charAt(Math.floor(Math.random() * chars.length))
    return id
}

export const getSplitScreenWidthAndAlignStyle = (width, leftAlign) => {
    const styles = {}
    styles.width = `${width}px`
    styles.position = 'absolute'
    styles.top = 0
    styles.bottom = '1px'

    // styles.set("width", );
    if (leftAlign === 0) {
        styles.left = 0
        styles['z-index'] = 60
    } else {
        styles.right = 0
        styles['z-index'] = 50
    }

    return styles
}

export const isColorLight = (color) => {
    const hex = color.replace('#', '')
    const c_r = parseInt(hex.substr(0, 2), 16)
    const c_g = parseInt(hex.substr(2, 2), 16)
    const c_b = parseInt(hex.substr(4, 2), 16)
    const brightness = (c_r * 299 + c_g * 587 + c_b * 114) / 1000
    return brightness > 155
}

export const safeRegister = (name, element) => {
    customElements.get(name) || customElements.define(name, element)
}

export const linkifyText = (text) => {
    let urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi
    return text.replace(urlRegex, (url) => '<a href="' + url + '" target="_blank">' + url + '</a>')
}

export const newShade = (hexColor, magnitude) => {
    hexColor = hexColor.replace(`#`, ``)
    if (hexColor.length === 6) {
        const decimalColor = parseInt(hexColor, 16)
        let r = (decimalColor >> 16) + magnitude
        r > 255 && (r = 255)
        r < 0 && (r = 0)
        let g = (decimalColor & 0x0000ff) + magnitude
        g > 255 && (g = 255)
        g < 0 && (g = 0)
        let b = ((decimalColor >> 8) & 0x00ff) + magnitude
        b > 255 && (b = 255)
        b < 0 && (b = 0)
        return `#${(g | (b << 8) | (r << 16)).toString(16)}`
    } else {
        return hexColor
    }
}

export const numberOfTabs = (text) => {
    let count = 0
    let index = 0
    while (text.charAt(index++) === '\t') {
        count++
    }
    return count
}

export const download = (filename, text) => {
    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

export const downloadPictureFromBase64 = (filename, base64) => {
    let element = document.createElement('a')
    element.setAttribute('href', base64)
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

export async function downloadZipFile(zipFiles, filename) {
    // get the ZIP stream in a Blob
    const blob = await downloadZip(zipFiles).blob()

    // make and click a temporary link to download the Blob
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.zip`
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
}
