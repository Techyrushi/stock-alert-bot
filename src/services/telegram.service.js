const TelegramBot = require('node-telegram-bot-api');
const { telegramBotToken } = require('../config/env');

class TelegramService {
  constructor() {
    this.bot = telegramBotToken ? new TelegramBot(telegramBotToken, { polling: false }) : null;
  }

  sendMessage(chatId, text) {
    if (!this.bot) return Promise.resolve();
    return this.bot.sendMessage(chatId, text);
  }
}

module.exports = new TelegramService();