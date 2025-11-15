const express = require('express');
const { getAuthUrl, exchangeCodeForToken } = require('../services/upstox-auth.service');
const env = require('../config/env');
const feed = require('../services/upstox-feed.service');

const router = express.Router();

router.get('/login', (req, res) => {
  const url = getAuthUrl('stock-alert-bot');
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ ok: false, error: 'code_missing' });
    const token = await exchangeCodeForToken(code);
    // Persist in-memory for current runtime
    if (token && (token.access_token || token.accessToken)) {
      env.upstoxAccessToken = token.access_token || token.accessToken;
      try {
        feed.disconnect();
        feed.connect();
      } catch (e) {
        // ignore
      }
    }
    res.json({ ok: true, token });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'token_exchange_failed' });
  }
});

module.exports = router;