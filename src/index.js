const { start } = require('./server');
const { startBot } = require('./bot');
const feed = require('./services/upstox-feed.service');
const alertService = require('./services/alert.service');
const poller = require('./services/poller.service');
const env = require('./config/env');
const state = require('./utils/state');
const broadcaster = require('./services/broadcaster.service');

// Start HTTP server
start();

// Start Telegram bot (if token exists)
startBot();

// Connect feed and pipe ticks into alert evaluation
feed.setHandler((decoded) => {
  // Expect decoded ticks: [{ instrument: 'KEY', price: 123.45 }]
  if (decoded && Array.isArray(decoded.ticks)) {
    const priceMap = {};
    decoded.ticks.forEach((t) => {
      if (t && t.instrument) priceMap[t.instrument] = t.price;
    });
    state.updatePrices(decoded.ticks);
    alertService.evaluateTick(priceMap);
  }
});

if (env.upstoxAccessToken) {
  try { feed.connect(); } catch (e) {}
}

// Seed default subscriptions and alerts from env
if (env.defaultInstrumentKeys.length) {
  try { feed.subscribe(env.defaultInstrumentKeys); } catch (_) {}
}

if (env.defaultAlertsJson) {
  try {
    const defaults = JSON.parse(env.defaultAlertsJson);
    if (Array.isArray(defaults)) {
      defaults.forEach((a) => {
        const id = `${a.instrument}:${a.direction}:${a.target}:env`;
        alertService.addAlert({ id, instrument: a.instrument, direction: a.direction, target: Number(a.target), chatId: a.chatId || null, triggered: false });
      });
    }
  } catch (_) {}
}

// Start REST poller as a fallback for automated alerts
poller.start();

// Start broadcaster for streaming messages
broadcaster.start();