const express = require('express');
const { verifyGoogleIdToken } = require('../auth/googleAuth');

const router = express.Router();

router.post('/google-login', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    const user = await verifyGoogleIdToken(credential);

    return res.json({
      message: 'Authentication successful',
      user
    });
  } catch (err) {
    const status = err.statusCode || 401;
    return res.status(status).json({ error: err.message || 'Google authentication failed' });
  }
});

module.exports = router;
