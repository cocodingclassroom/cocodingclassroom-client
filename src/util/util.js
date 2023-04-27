export const getRandomID = () => {
  let chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++)
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
};

export const getSplitScreenWidthAndAlignStyle = (width, leftAlign) => {
  const styles = {};
  styles.width = `${width}px`;
  styles.position = "absolute";
  styles.top = 0;
  styles.bottom = "1px";

  // styles.set("width", );
  if (leftAlign === 0) {
    styles.left = 0;
    if (width){}
  } else {
    styles.right = 0;
  }

  return styles;
};

export const isColorLight = (color) => {
  const hex = color.replace("#", "");
  const c_r = parseInt(hex.substr(0, 2), 16);
  const c_g = parseInt(hex.substr(2, 2), 16);
  const c_b = parseInt(hex.substr(4, 2), 16);
  const brightness = (c_r * 299 + c_g * 587 + c_b * 114) / 1000;
  return brightness > 155;
};

export const safeRegister = (name, element) => {
  customElements.get(name) || customElements.define(name, element);
};

export const linkifyText = (text) => {
  let urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(urlRegex, url => "<a href=\"" + url + "\" target=\"_blank\">" + url + "</a>");
};
