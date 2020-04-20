import uuidv4 from 'uuid/v4';

export const fileNameFromPath = path => path.match(/[^\\/]+$/)[0];
export const uuid = () => uuidv4();
export const caseInsensitiveCompare = (str1, str2) => str1.toLowerCase() === str2.toLowerCase();
// capitalize first letter of a (multi) word sequence, vs the capitalize behavior of css
export const capitalize = capText => capText.charAt(0).toUpperCase() + capText.slice(1);
