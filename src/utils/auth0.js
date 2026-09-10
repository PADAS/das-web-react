export const hasAuth0CallbackParams = (searchParams) => {
  const urlParams = new URLSearchParams(searchParams);
  return urlParams.has('code') && (urlParams.has('state') || urlParams.has('error'));
};

// Both params are omitted when blank so Auth0 falls back to the tenant's Default
// Directory; a connection opts out of it. Carrying both at once is an artifact of
// the unfinished migration away from organizations, left unguarded on purpose —
// the combination cannot arise once that finishes.
export const buildAuth0AuthorizationParams = (audience, idpOrgId, connection) => {
  const org = idpOrgId?.trim();
  const namedConnection = connection?.trim();
  return {
    audience,
    ...(org ? { organization: org } : {}),
    ...(namedConnection ? { connection: namedConnection } : {}),
  };
};
