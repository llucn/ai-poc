import type { AuthProviderProps } from 'react-oidc-context';

function required(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Copy packages/web/.env.example to packages/web/.env.`,
    );
  }
  return value;
}

const authority = required(
  'VITE_OIDC_AUTHORITY',
  import.meta.env.VITE_OIDC_AUTHORITY,
);
const clientId = required(
  'VITE_OIDC_CLIENT_ID',
  import.meta.env.VITE_OIDC_CLIENT_ID,
);
const responseType = required(
  'VITE_OIDC_RESPONSE_TYPE',
  import.meta.env.VITE_OIDC_RESPONSE_TYPE,
);
const scope = required('VITE_OIDC_SCOPE', import.meta.env.VITE_OIDC_SCOPE);

export const oidcConfig: AuthProviderProps = {
  authority,
  client_id: clientId,
  redirect_uri: window.location.origin + window.location.pathname,
  response_type: responseType,
  scope,
  onSigninCallback: () => {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + window.location.hash,
    );
  },
};

// Cognito-specific logout URL.
//
// The OIDC issuer (cognito-idp.<region>.amazonaws.com/<userPoolId>) is NOT
// where /logout lives — Cognito hosts /logout on the user pool's hosted-UI
// domain (e.g. <prefix>.auth.<region>.amazoncognito.com). We discover that
// domain by reading the user pool's OIDC discovery document and parsing the
// host out of its authorization_endpoint, so no Cognito host is hard-coded
// in source.
let hostedUIBasePromise: Promise<string> | undefined;

function discoverHostedUIBase(): Promise<string> {
  if (!hostedUIBasePromise) {
    hostedUIBasePromise = fetch(`${authority}/.well-known/openid-configuration`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `OIDC discovery failed: ${res.status} ${res.statusText}`,
          );
        }
        return res.json() as Promise<{ authorization_endpoint?: string }>;
      })
      .then((meta) => {
        if (!meta.authorization_endpoint) {
          throw new Error(
            'OIDC discovery response missing authorization_endpoint',
          );
        }
        const url = new URL(meta.authorization_endpoint);
        return `${url.protocol}//${url.host}`;
      })
      .catch((err) => {
        hostedUIBasePromise = undefined;
        throw err;
      });
  }
  return hostedUIBasePromise;
}

export async function buildLogoutUrl(): Promise<string> {
  const base = await discoverHostedUIBase();
  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: window.location.origin + '/',
  });
  return `${base}/logout?${params.toString()}`;
}
