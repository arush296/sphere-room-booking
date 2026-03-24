const { OAuth2Client } = require('google-auth-library');

let oauthClient = null;

function getClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured in backend environment');
  }

  if (!oauthClient) {
    oauthClient = new OAuth2Client(clientId);
  }

  return oauthClient;
}

function isAllowedDomainEmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith('@goa.bits-pilani.ac.in');
}

async function verifyGoogleIdToken(idToken) {
  const client = getClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  const email = payload?.email?.toLowerCase();

  if (!payload || !payload.email_verified || !isAllowedDomainEmail(email)) {
    const err = new Error('Only goa.bits-pilani.ac.in accounts are allowed');
    err.statusCode = 403;
    throw err;
  }

  return {
    googleId: payload.sub,
    email,
    name: payload.name || email,
    picture: payload.picture || ''
  };
}

module.exports = {
  verifyGoogleIdToken,
  isAllowedDomainEmail
};
