const db = require('../utils/db');
const telegram = require('./telegram.service');

class AlertService {
  constructor() {
    this.alerts = db.getAlerts();
  }

  addAlert(alert) {
    db.saveAlert(alert);
    this.alerts = db.getAlerts();
  }

  evaluateTick(tick) {
    this.alerts.forEach((a) => {
      const price = tick[a.instrument];
      if (price == null) return;
      const crossedUp = a.direction === 'above' && price >= a.target;
      const crossedDown = a.direction === 'below' && price <= a.target;
      if (crossedUp || crossedDown) {
        if (!a.triggered) {
          a.triggered = true;
          db.updateAlert(a);
          const text = `Alert ${a.instrument} ${a.direction} ${a.target} at ${price}`;
          if (a.chatId) telegram.sendMessage(a.chatId, text);
        }
      }
    });
  }

  clearAlertsByChat(chatId) {
    db.removeAlertsByChatId(chatId);
    this.alerts = db.getAlerts();
  }
}

module.exports = new AlertService();