import { v4 as uuidv4 } from 'uuid';

export const fileNameFromPath = path => path.match(/[^\\/]+$/)[0];
export const uuid = () => uuidv4();
export const caseInsensitiveCompare = (str1, str2) => str1.toLowerCase() === str2.toLowerCase();

export const hashCode = (string) => {
  if (string.length === 0) return 0;

  const hash = string.split('').reduce((hash, char) => {
    hash = ((hash << 5) - hash) + char.charCodeAt(0);
    hash |= 0;

    return hash;
  }, 0);

  return hash;
};

export const hashString = (str) => { // Create a simple hash of a string for anonymization. Returns 'unknown' for falsy values, otherwise returns a base36 hash
  if (!str) return 'unknown';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Coerce to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};
