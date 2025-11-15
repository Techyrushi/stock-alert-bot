const WebSocket = require('ws');
const env = require('../config/env');
const upstoxConfig = require('../config/upstox');

function makeGuid(prefix = 'sub') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function extractTicksFromFeedMessage(obj) {
  const ticks = [];
  if (!obj || typeof obj !== 'object') return ticks;
  const feeds = obj.feeds;
  if (!feeds || typeof feeds !== 'object') return ticks;
  Object.entries(feeds).forEach(([instrument, payload]) => {
    const ltp = payload?.ltpc?.ltp
      ?? payload?.ff?.marketFF?.ltpc?.ltp
      ?? payload?.oc?.ltpc?.ltp;
    if (typeof ltp === 'number') ticks.push({ instrument, price: ltp });
  });
  return ticks;
}

class UpstoxFeedService {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.onData = null;
    this.subscriptions = new Set();
  }

  connect() {
    if (this.connected) return;
    const token = env.upstoxAccessToken;
    if (!token) return;
    const url = `${upstoxConfig.marketDataUrl}?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(url, { followRedirects: true });
    this.ws.on('open', () => {
      this.connected = true;
      // Resubscribe existing keys on connect
      const keys = Array.from(this.subscriptions);
      if (keys.length) this._sendSubscribe(keys);
    });
    this.ws.on('message', (data) => {
      try {
        const rawStr = Buffer.isBuffer(data) ? data.toString() : String(data);
        const obj = JSON.parse(rawStr);
        const ticks = extractTicksFromFeedMessage(obj);
        if (ticks.length && typeof this.onData === 'function') this.onData({ ticks });
      } catch (_) {
        // ignore malformed frames
      }
    });
    this.ws.on('close', () => {
      this.connected = false;
    });
    this.ws.on('error', () => {
      this.connected = false;
    });
  }

  setHandler(handler) {
    this.onData = handler;
  }

  subscribe(instrumentKeys = []) {
    instrumentKeys.forEach((k) => this.subscriptions.add(k));
    if (!this.ws || !this.connected) return;
    this._sendSubscribe(instrumentKeys);
  }

  unsubscribe(instrumentKeys = []) {
    instrumentKeys.forEach((k) => this.subscriptions.delete(k));
    if (!this.ws || !this.connected) return;
    this._sendUnsubscribe(instrumentKeys);
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }

  _sendSubscribe(keys, mode = 'full') {
    // Upstox WS allows up to 100 instrumentKeys per subscription call
    const batchSize = 100;
    for (let i = 0; i < keys.length; i += batchSize) {
      const chunk = keys.slice(i, i + batchSize);
      const frame = {
        guid: makeGuid('sub'),
        method: 'sub',
        data: { mode, instrumentKeys: chunk }
      };
      try {
        this.ws.send(JSON.stringify(frame));
      } catch (_) {}
    }
  }

  _sendUnsubscribe(keys) {
    const batchSize = 100;
    for (let i = 0; i < keys.length; i += batchSize) {
      const chunk = keys.slice(i, i + batchSize);
      const frame = {
        guid: makeGuid('unsub'),
        method: 'unsub',
        data: { instrumentKeys: chunk }
      };
      try {
        this.ws.send(JSON.stringify(frame));
      } catch (_) {}
    }
  }
}

module.exports = new UpstoxFeedService();