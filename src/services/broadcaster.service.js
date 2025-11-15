const env = require('../config/env');
const telegram = require('./telegram.service');
const state = require('../utils/state');
const rest = require('./upstox-rest.service');
const { formatQuote } = require('../utils/formatters');

let timer = null;

function buildFormattedMessage(chatId, quotesMap) {
  const subs = state.getSubscriptions(chatId);
  if (!subs.length) return null;
  const blocks = [];
  subs.forEach((key) => {
    const q = quotesMap[key];
    // Fallback: try to find by instrument_token
    const item = q || Object.values(quotesMap).find(v => v?.instrument_token === key) || null;
    const text = formatQuote(key, item);
    blocks.push(text);
  });
  if (!blocks.length) return null;
  return `Live Quotes:\n\n${blocks.join('\n\n')}`;
}

async function tick() {
  const entries = state.getStreamingChats();
  if (!entries.length) return;
  // Union of all subscriptions across streaming chats
  const union = new Set();
  entries.forEach(([chatId]) => {
    state.getSubscriptions(chatId).forEach(k => union.add(k));
  });
  const keys = Array.from(union);
  if (!keys.length) return;

  // Fetch quotes in chunks to respect Upstox limits (<=500 per call)
  const batchSize = 500;
  const quotesMap = {};
  for (let i = 0; i < keys.length; i += batchSize) {
    const chunk = keys.slice(i, i + batchSize);
    try {
      const { data } = await rest.fetchQuotes(chunk);
      Object.assign(quotesMap, data || {});
    } catch (_) {
      // continue
    }
  }

  entries.forEach(async ([chatId]) => {
    const msg = buildFormattedMessage(chatId, quotesMap);
    if (msg) await telegram.sendMessage(chatId, msg);
  });
}

function start() {
  if (timer) return;
  const interval = Number(env.streamIntervalMs || 5000);
  timer = setInterval(tick, interval);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop };