const TelegramBot = require('node-telegram-bot-api');
const env = require('./config/env');
const alertService = require('./services/alert.service');
const feed = require('./services/upstox-feed.service');
const rest = require('./services/upstox-rest.service');
const state = require('./utils/state');
const broadcaster = require('./services/broadcaster.service');
const { formatQuote } = require('./utils/formatters');

let bot = null;

function startBot() {
  if (!env.telegramBotToken) {
    return null;
  }
  bot = new TelegramBot(env.telegramBotToken, { polling: true });

  bot.onText(/^\/start$/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome! Use /alert <KEY> <above|below> <PRICE> to set alerts. Example: /alert NIFTY_50 above 22000');
  });

  bot.onText(/^\/alert\s+(\S+)\s+(above|below)\s+(\d+(?:\.\d+)?)$/, (msg, match) => {
    const chatId = msg.chat.id;
    const instrument = match[1];
    const direction = match[2];
    const target = parseFloat(match[3]);

    if (!instrument.includes('|')) {
      bot.sendMessage(chatId, 'Please use a valid Upstox instrument key (e.g., NSE_EQ|INE848E01016).');
      return;
    }

    const id = `${instrument}:${direction}:${target}:${chatId}`;
    alertService.addAlert({ id, instrument, direction, target, chatId, triggered: false });
    state.addSubscription(chatId, instrument);

    // Subscribe to feed for this instrument
    try { feed.subscribe([instrument]); } catch (e) {}

    bot.sendMessage(chatId, `Alert set for ${instrument} ${direction} ${target}`);
  });

  bot.onText(/^\/help$/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Commands:\n/alert <INSTRUMENT_KEY> <above|below> <PRICE>\n/list\n/subscribe <INSTRUMENT_KEY>\n/unsubscribe <INSTRUMENT_KEY>\n/subs\n/quote <INSTRUMENT_KEY>\n/stream_on [seconds]\n/stream_off\n/stop\n/clear_alerts');
  });

  bot.onText(/^\/list$/, (msg) => {
    const chatId = msg.chat.id;
    const alerts = alertService.alerts.filter(a => a.chatId === chatId);
    if (!alerts.length) return bot.sendMessage(chatId, 'No alerts yet.');
    const text = alerts.map(a => `${a.instrument} ${a.direction} ${a.target} ${a.triggered ? '(triggered)' : ''}`).join('\n');
    bot.sendMessage(chatId, text);
  });

  bot.onText(/^\/subscribe\s+(\S+)$/, (msg, match) => {
    const chatId = msg.chat.id;
    const key = match[1];
    try {
      feed.subscribe([key]);
      state.addSubscription(chatId, key);
      bot.sendMessage(chatId, `Subscribed to ${key}`);
    } catch (e) {
      bot.sendMessage(chatId, `Failed to subscribe: ${e.message || e}`);
    }
  });

  bot.onText(/^\/subs$/, (msg) => {
    const chatId = msg.chat.id;
    const subs = state.getSubscriptions(chatId);
    if (!subs.length) return bot.sendMessage(chatId, 'No subscriptions yet. Use /subscribe <INSTRUMENT_KEY>.');
    bot.sendMessage(chatId, subs.join('\n'));
  });

  bot.onText(/^\/stream_on(?:\s+(\d+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    const interval = match[1] ? Number(match[1]) * 1000 : env.streamIntervalMs;
    state.enableStream(chatId, interval);
    broadcaster.start();
    bot.sendMessage(chatId, `Streaming enabled. Interval: ${Math.round(interval/1000)}s`);
  });

  bot.onText(/^\/stream_off$/, (msg) => {
    const chatId = msg.chat.id;
    state.disableStream(chatId);
    bot.sendMessage(chatId, 'Streaming disabled.');
  });

  // Alias for stopping streaming quickly
  bot.onText(/^\/stop$/, (msg) => {
    const chatId = msg.chat.id;
    state.disableStream(chatId);
    bot.sendMessage(chatId, 'Stopped streaming. Use /stream_on to resume.');
  });

  // Unsubscribe from an instrument
  bot.onText(/^\/unsubscribe\s+(\S+)$/, (msg, match) => {
    const chatId = msg.chat.id;
    const key = match[1];
    try {
      state.removeSubscription(chatId, key);
      feed.unsubscribe([key]);
      bot.sendMessage(chatId, `Unsubscribed from ${key}`);
    } catch (e) {
      bot.sendMessage(chatId, `Failed to unsubscribe: ${e.message || e}`);
    }
  });

  // Clear all alerts for this chat
  bot.onText(/^\/clear_alerts$/, (msg) => {
    const chatId = msg.chat.id;
    try {
      alertService.clearAlertsByChat(chatId);
      bot.sendMessage(chatId, 'All alerts cleared for this chat.');
    } catch (e) {
      bot.sendMessage(chatId, `Failed to clear alerts: ${e.message || e}`);
    }
  });

  // Get a formatted full quote snapshot
  bot.onText(/^\/quote\s+(\S+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const key = match[1];
    if (!(key.includes('|') || key.includes(':'))) {
      bot.sendMessage(chatId, 'Please use a valid Upstox instrument key (e.g., NSE_EQ|INE848E01016 or NSE_EQ:NHPC).');
      return;
    }
    try {
      const { data } = await rest.fetchQuotes([key]);
      const item = data[key] || Object.values(data)[0];
      if (!item) {
        bot.sendMessage(chatId, `No quote data for ${key}`);
        return;
      }
      const text = formatQuote(key, item);
      bot.sendMessage(chatId, text);
    } catch (e) {
      bot.sendMessage(chatId, `Failed to fetch quote: ${e.message || e}`);
    }
  });

  return bot;
}

module.exports = { startBot };