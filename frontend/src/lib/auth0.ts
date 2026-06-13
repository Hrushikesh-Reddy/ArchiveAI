import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
    authorizationParameters: {
        scope:process.env.AUTH0_SCOPE,
        audience: process.env.AUTH0_AUDIENCE,
        redirect_uri:process.env.AUTH0_REDIRECT_URL,
    },
    clientId:process.env.AUTH0_CLIENT_ID,
    domain:process.env.AUTH0_DOMAIN,
    clientSecret:process.env.AUTH0_CLIENT_SECRET,
    secret:process.env.AUTH0_SECRET,
    appBaseUrl:process.env.AUTH0_BASE_URL,
    enableAccessTokenEndpoint: true,
}); 







