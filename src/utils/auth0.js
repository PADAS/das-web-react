export const hasAuth0CallbackParams = (searchParams) => {
  const urlParams = new URLSearchParams(searchParams);
  return urlParams.has('code') && (urlParams.has('state') || urlParams.has('error'));
};

// Build the authorizationParams for an Auth0 redirect login. The IdP
// organization is forwarded only when one is configured (a non-blank value
// after trimming); common-DB sites have no org and must omit the param
// entirely so Auth0 falls back to the tenant's Default Directory. A connection
// is forwarded on the same terms, and opts the login out of the Default
// Directory into that named connection instead.
//
// The two are forwarded independently. A request carrying both is an artifact
// of the unfinished migration away from organizations, and is deliberately left
// unguarded: once the last org-scoped site is migrated the combination cannot
// arise, so a rule against it would be dead code from the day it shipped.
// Letting the non-production case through beats encoding cleverness for it.
export const buildAuth0AuthorizationParams = (audience, idpOrgId, connection) => {
  const org = idpOrgId?.trim();
  const namedConnection = connection?.trim();
  return {
    audience,
    ...(org ? { organization: org } : {}),
    ...(namedConnection ? { connection: namedConnection } : {}),
  };
};
