const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  upstoxApiKey: process.env.UPSTOX_API_KEY || '',
  upstoxApiSecret: process.env.UPSTOX_API_SECRET || '',
  upstoxRedirectUri: process.env.UPSTOX_REDIRECT_URI || '',
  upstoxAccessToken: process.env.UPSTOX_ACCESS_TOKEN || '',
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 2000),
  defaultInstrumentKeys: (process.env.DEFAULT_INSTRUMENT_KEYS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  defaultAlertsJson: process.env.DEFAULT_ALERTS || ''
  ,
  streamIntervalMs: Number(process.env.STREAM_INTERVAL_MS || 5000)
};