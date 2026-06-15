export const calcSvgImageIconId = ({ icon_id, priority, height, width }) => {
  let string = `${icon_id}`;

  [priority, height, width]
    .filter(item => item === 0 || !!item)
    .forEach((item) => {
      string+=`-${item}`;
    });

  return string;
};
