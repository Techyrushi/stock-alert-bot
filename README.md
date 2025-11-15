# Stock Alert Bot

Simple scaffolding for a stock alert bot integrating Upstox auth and feed with Telegram notifications.

## Setup

- Install dependencies: `npm install`
- Configure environment in `.env`
- Run in development: `npm run dev`
- Run in production: `npm start`

## Environment Variables

- `NODE_ENV`
- `PORT`
- `TELEGRAM_BOT_TOKEN`
- `UPSTOX_API_KEY`
- `UPSTOX_API_SECRET`
- `UPSTOX_REDIRECT_URI`
- `UPSTOX_ACCESS_TOKEN`

## API

- `GET /health`
- `GET /auth/login` redirects to Upstox login
- `GET /auth/callback?code=...` exchanges code for access token