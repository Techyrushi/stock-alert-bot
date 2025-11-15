function formatNumber(n) {
  if (n == null || Number.isNaN(Number(n))) return 'n/a';
  const v = Number(n);
  if (Math.abs(v) >= 1000000) return `${(v/1000000).toFixed(2)}M`;
  if (Math.abs(v) >= 1000) return `${(v/1000).toFixed(2)}K`;
  return `${v}`;
}

function formatTime(ts) {
  try {
    // Accept ISO or epoch millis as string
    const d = /^[0-9]+$/.test(String(ts)) ? new Date(Number(ts)) : new Date(ts);
    return d.toLocaleString();
  } catch (_) {
    return String(ts || '');
  }
}

function formatQuote(key, q) {
  if (!q) return `No data for ${key}`;
  const symbol = q.symbol || key.split(':').pop();
  const token = q.instrument_token || key;
  const lp = q.last_price;
  const change = q.net_change;
  const o = q.ohlc?.open;
  const h = q.ohlc?.high;
  const l = q.ohlc?.low;
  const c = q.ohlc?.close;
  const vol = q.volume;
  const avg = q.average_price;
  const tBQ = q.total_buy_quantity;
  const tSQ = q.total_sell_quantity;
  const lcl = q.lower_circuit_limit;
  const ucl = q.upper_circuit_limit;
  const ltt = q.last_trade_time;

  const header = `${symbol} (${token})\nPrice: ${lp} (${change >= 0 ? '+' : ''}${change})`;
  const ohlc = `OHLC: O ${o}  H ${h}  L ${l}  C ${c}`;
  const metrics = `Vol: ${formatNumber(vol)}  Avg: ${avg}  BuyQty: ${formatNumber(tBQ)}  SellQty: ${formatNumber(tSQ)}`;
  const circuits = `Circuits: L ${lcl}  U ${ucl}`;
  const time = `Last Trade: ${formatTime(ltt)}`;

  // Depth (top 5)
  const buys = Array.isArray(q.depth?.buy) ? q.depth.buy.slice(0, 5) : [];
  const sells = Array.isArray(q.depth?.sell) ? q.depth.sell.slice(0, 5) : [];
  const buyLines = buys.map((b, i) => `B${i+1}: ${formatNumber(b.quantity)} @ ${b.price}`);
  const sellLines = sells.map((s, i) => `S${i+1}: ${formatNumber(s.quantity)} @ ${s.price}`);
  const book = (buyLines.length || sellLines.length)
    ? `Depth:\n${[...buyLines, ...sellLines].join('\n')}`
    : '';

  const parts = [header, ohlc, metrics, circuits, time, book].filter(Boolean);
  return parts.join('\n');
}

module.exports = { formatQuote };