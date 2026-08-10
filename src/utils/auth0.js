export const hasAuth0CallbackParams = (searchParams) => {
  const urlParams = new URLSearchParams(searchParams);
  return urlParams.has('code') && (urlParams.has('state') || urlParams.has('error'));
};
