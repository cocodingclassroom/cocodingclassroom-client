import cast from "../../assets/resource/cast.svg";
import checkCircle from "../../assets/resource/check-circle.svg";
import code from "../../assets/resource/code.svg";
import edit from "../../assets/resource/edit-3.svg";
import filePlus from "../../assets/resource/file-plus.svg";
import fileText from "../../assets/resource/file-text.svg";
import merge from "../../assets/resource/git-merge.svg";
import helpCircle from "../../assets/resource/help-circle.svg";
import layers from "../../assets/resource/layers.svg";
import layout from "../../assets/resource/layout.svg";
import link from "../../assets/resource/link.svg";
import lock from "../../assets/resource/lock.svg";
import messageSquare from "../../assets/resource/message-square.svg";
import minusCircle from "../../assets/resource/minus-circle.svg";
import radio from "../../assets/resource/radio.svg";
import run from "../../assets/resource/run.svg";
import save from "../../assets/resource/save.svg";
import settings from "../../assets/resource/settings.svg";
import shield from "../../assets/resource/shield.svg";
import shieldChecked from "../../assets/resource/shield-checked.svg";
import shuffle from "../../assets/resource/shuffle.svg";
import toggleLeft from "../../assets/resource/toggle-left.svg";
import toggleRight from "../../assets/resource/toggle-right.svg";
import trash from "../../assets/resource/trash-2.svg";
import unlock from "../../assets/resource/unlock.svg";
import user from "../../assets/resource/user.svg";
import users from "../../assets/resource/users.svg";

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
};
