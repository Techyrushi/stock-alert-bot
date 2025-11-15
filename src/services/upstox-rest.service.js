const axios = require('axios');
const env = require('../config/env');
const upstox = require('../config/upstox');

async function fetchLtp(keys = []) {
  if (!env.upstoxAccessToken || keys.length === 0) return { ticks: [] };
  try {
    const url = `${upstox.baseUrl}${upstox.quotesLtpUrl}`;
    const params = { instrument_key: keys.join(',') };
    const res = await axios.get(url, {
      params,
      headers: { Accept: 'application/json', Authorization: `Bearer ${env.upstoxAccessToken}` }
    });
    const body = res.data;
    const items = body && body.data ? body.data : {};
    const ticks = Object.entries(items).map(([symbolKey, v]) => ({
      instrument: v.instrument_token || symbolKey,
      price: Number(v.last_price)
    })).filter(t => t.instrument && !Number.isNaN(t.price));
    return { ticks };
  } catch (e) {
    console.warn('Upstox LTP fetch failed', {
      message: e.message,
      status: e.response?.status,
      data: e.response?.data
    });
    return { ticks: [] };
  }
}

async function fetchQuotes(keys = []) {
  if (!env.upstoxAccessToken || keys.length === 0) return { data: {} };
  try {
    const url = `${upstox.baseUrl}${upstox.quotesFullUrl}`;
    const params = { instrument_key: keys.join(',') };
    const res = await axios.get(url, {
      params,
      headers: { Accept: 'application/json', Authorization: `Bearer ${env.upstoxAccessToken}` }
    });
    const body = res.data;
    const items = body && body.data ? body.data : {};
    return { data: items };
  } catch (e) {
    console.warn('Upstox quotes fetch failed', {
      message: e.message,
      status: e.response?.status,
      data: e.response?.data
    });
    return { data: {} };
  }
}

module.exports = { fetchLtp, fetchQuotes };