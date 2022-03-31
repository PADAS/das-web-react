import uuidv4 from 'uuid/v4';

export const fileNameFromPath = path => path.match(/[^\\/]+$/)[0];
export const uuid = () => uuidv4();
export const caseInsensitiveCompare = (str1, str2) => str1.toLowerCase() === str2.toLowerCase();

export const hashCode = (string) => {
  if (string.length === 0) return 0;

  const hash = string.split('').reduce((hash, char) => {
    hash  = ((hash << 5) - hash) + char.charCodeAt(0);
    hash |= 0;

    return hash;
  }, 0);

  return hash;
};
