const latestPrices = new Map(); // instrument -> price
const chatSubs = new Map(); // chatId -> Set(instrument)
const streamingChats = new Map(); // chatId -> intervalMs

function addSubscription(chatId, instrument) {
  if (!chatSubs.has(chatId)) chatSubs.set(chatId, new Set());
  chatSubs.get(chatId).add(instrument);
}

function getSubscriptions(chatId) {
  return Array.from(chatSubs.get(chatId) || []);
}

function getAllSubscriptions() {
  const keys = new Set();
  chatSubs.forEach(set => set.forEach(k => keys.add(k)));
  return Array.from(keys);
}

function updatePrices(ticks = []) {
  ticks.forEach(t => {
    if (t && t.instrument && typeof t.price === 'number') {
      latestPrices.set(t.instrument, t.price);
    }
  });
}

function getPrices(instruments = []) {
  const result = {};
  instruments.forEach(k => {
    if (latestPrices.has(k)) result[k] = latestPrices.get(k);
  });
  return result;
}

function enableStream(chatId, intervalMs) {
  streamingChats.set(chatId, intervalMs);
}

function disableStream(chatId) {
  streamingChats.delete(chatId);
}

function getStreamingChats() {
  return Array.from(streamingChats.entries()); // [ [chatId, intervalMs], ... ]
}

function removeSubscription(chatId, instrument) {
  const set = chatSubs.get(chatId);
  if (!set) return;
  set.delete(instrument);
}

function clearSubscriptions(chatId) {
  chatSubs.delete(chatId);
}

module.exports = {
  addSubscription,
  getSubscriptions,
  getAllSubscriptions,
  updatePrices,
  getPrices,
  enableStream,
  disableStream,
  getStreamingChats,
  removeSubscription,
  clearSubscriptions
};