const express = require('express');
const rest = require('../services/upstox-rest.service');
const { formatQuote } = require('../utils/formatters');
const router = express.Router();

router.get('/ltp', async (req, res) => {
  const keys = String(req.query.keys || '').split(',').map(s => s.trim()).filter(Boolean);
  const { ticks } = await rest.fetchLtp(keys);
  res.json({ ok: true, ticks });
});

router.get('/quote', async (req, res) => {
  const keys = String(req.query.keys || '').split(',').map(s => s.trim()).filter(Boolean);
  const { data } = await rest.fetchQuotes(keys);
  const format = String(req.query.format || '').toLowerCase() === 'text';
  if (format && keys.length === 1) {
    const key = keys[0];
    const item = data[key] || Object.values(data)[0];
    const text = formatQuote(key, item);
    res.type('text/plain').send(text);
    return;
  }
  res.json({ ok: true, data });
});

module.exports = router;