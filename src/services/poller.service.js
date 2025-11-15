const env = require('../config/env');
const feed = require('./upstox-feed.service');
const rest = require('./upstox-rest.service');
const alertService = require('./alert.service');
const state = require('../utils/state');

let timer = null;

function getSubscriptions() {
  // Pull keys from feed subscriptions set
  return Array.from(feed.subscriptions || []);
}

async function tick() {
  const keys = getSubscriptions();
  if (keys.length === 0) return;
  try {
    const { ticks } = await rest.fetchLtp(keys);
    if (Array.isArray(ticks) && ticks.length) {
      const priceMap = {};
      ticks.forEach((t) => { priceMap[t.instrument] = t.price; });
      state.updatePrices(ticks);
      alertService.evaluateTick(priceMap);
    }
  } catch (_) {}
}

function start() {
  if (timer) return;
  timer = setInterval(tick, env.pollIntervalMs);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop };