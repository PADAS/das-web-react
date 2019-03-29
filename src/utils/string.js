import uuidv4 from 'uuid/v4';

export const fileNameFromPath = path => path.match(/[^\\/]+$/)[0];
export const uuid = () => uuidv4();