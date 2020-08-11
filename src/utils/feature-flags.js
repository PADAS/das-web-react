export const evaluateFeatureFlag = (flag) => {
  if (!process.env[`REACT_APP_FF_${flag}`]) return false;
  if (process.env[`REACT_APP_FF_${flag}`] === 'true') return true; /* bool-to-string interpolations for production build idiosyncracies */
  if (process.env[`REACT_APP_FF_${flag}`] === 'false') return false;
  return process.env[`REACT_APP_FF_${flag}`];
};