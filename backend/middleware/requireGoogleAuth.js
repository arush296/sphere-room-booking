const { verifyGoogleIdToken } = require('../auth/googleAuth');

async function requireGoogleAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const user = await verifyGoogleIdToken(token);
    req.user = user;
    req.googleIdToken = token;
    return next();
  } catch (err) {
    const status = err.statusCode || 401;
    return res.status(status).json({ error: err.message || 'Authentication failed' });
  }
}

module.exports = requireGoogleAuth;
