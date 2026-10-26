export const hasAuth0CallbackParams = (searchParams) => {
  const urlParams = new URLSearchParams(searchParams);
  return urlParams.has('code') && (urlParams.has('state') || urlParams.has('error'));
};

// The connection is omitted when blank so Auth0 falls back to the tenant's Default
// Directory; naming one opts out of it.
export const buildAuth0AuthorizationParams = (audience, connection) => {
  const namedConnection = connection?.trim();
  return {
    audience,
    ...(namedConnection ? { connection: namedConnection } : {}),
  };
};
