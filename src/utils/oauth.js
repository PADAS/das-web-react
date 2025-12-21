export const hasOAuthCallbackParams = (searchParams) => {
  const urlParams = new URLSearchParams(searchParams);
  return urlParams.has('code') || urlParams.has('state') || urlParams.has('error');
};
