import uuidv4 from 'uuid/v4';

export const fileNameFromPath = path => path.match(/[^\\/]+$/)[0];
export const uuid = () => uuidv4();
export const caseInsensitiveCompare = (str1, str2) => str1.toLowerCase() === str2.toLowerCase();
