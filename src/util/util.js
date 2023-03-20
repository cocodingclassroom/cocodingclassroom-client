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
  styles.height = "100%";
  styles.position = "absolute";
  styles.top = 0;

  // styles.set("width", );
  if (leftAlign === 0) {
    styles.left = 0;
  } else {
    styles.right = 0;
  }
  return styles;
};
