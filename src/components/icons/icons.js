import cast from '../../resources/icons/cast.svg'
import checkCircle from '../../resources/icons/check-circle.svg'
import code from '../../resources/icons/code.svg'
import edit from '../../resources/icons/edit-3.svg'
import filePlus from '../../resources/icons/file-plus.svg'
import fileText from '../../resources/icons/file-text.svg'
import merge from '../../resources/icons/git-merge.svg'
import helpCircle from '../../resources/icons/help-circle.svg'
import layers from '../../resources/icons/layers.svg'
import layout from '../../resources/icons/layout.svg'
import link from '../../resources/icons/link.svg'
import lock from '../../resources/icons/lock.svg'
import messageSquare from '../../resources/icons/message-square.svg'
import minusCircle from '../../resources/icons/minus-circle.svg'
import radio from '../../resources/icons/radio.svg'
import run from '../../resources/icons/run.svg'
import save from '../../resources/icons/save.svg'
import settings from '../../resources/icons/settings.svg'
import shield from '../../resources/icons/shield.svg'
import shieldChecked from '../../resources/icons/shield-checked.svg'
import shuffle from '../../resources/icons/shuffle.svg'
import toggleLeft from '../../resources/icons/toggle-left.svg'
import toggleRight from '../../resources/icons/toggle-right.svg'
import trash from '../../resources/icons/trash-2.svg'
import unlock from '../../resources/icons/unlock.svg'
import user from '../../resources/icons/user.svg'
import users from '../../resources/icons/users.svg'

export const iconSvg = {
    new: filePlus,
    save: save,
    rename: edit,
    link: link,
    room: layers,
    layers: layers,
    trash: trash,
    merge: fileText,
    shuffle: shuffle,
    about: helpCircle,
    settings: settings,
    shield: {
        empty: shield,
        checked: shieldChecked,
    },
    person: user,
    layout: layout,
    message: messageSquare,
    radio: radio,
    screencast: cast,
    toggle: {
        left: toggleLeft,
        right: toggleRight,
    },
    lock: lock,
    unlock: unlock,
    users: users,
    code: code,
}
