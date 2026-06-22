export const hasAuth0CallbackParams = (searchParams) => {
  const urlParams = new URLSearchParams(searchParams);
  return urlParams.has('code') && (urlParams.has('state') || urlParams.has('error'));
};

// Build the authorizationParams for an Auth0 redirect login. The IdP
// organization is forwarded only when one is configured (a non-blank value
// after trimming); common-DB sites have no org and must omit the param
// entirely so Auth0 falls back to the tenant's Default Directory.
export const buildAuth0AuthorizationParams = (audience, idpOrgId) => {
  const org = idpOrgId?.trim();
  return {
    audience,
    ...(org ? { organization: org } : {}),
  };
};
