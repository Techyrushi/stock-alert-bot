const axios = require('axios');
const { upstoxApiKey, upstoxApiSecret, upstoxRedirectUri } = require('../config/env');
const upstoxConfig = require('../config/upstox');

function getAuthUrl(state = 'state') {
  const url = `${upstoxConfig.authUrl}?response_type=code&client_id=${encodeURIComponent(upstoxApiKey)}&redirect_uri=${encodeURIComponent(upstoxRedirectUri)}&state=${encodeURIComponent(state)}`;
  return url;
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    code,
    client_id: upstoxApiKey,
    client_secret: upstoxApiSecret,
    redirect_uri: upstoxRedirectUri,
    grant_type: 'authorization_code'
  });

  const res = await axios.post(upstoxConfig.tokenUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return res.data;
}

module.exports = { getAuthUrl, exchangeCodeForToken };