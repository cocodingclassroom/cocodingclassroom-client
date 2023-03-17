export const getRandomID = () => {
  let chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++)
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
};
