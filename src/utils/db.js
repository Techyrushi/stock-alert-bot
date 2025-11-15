const store = { alerts: [] };

function saveAlert(alert) {
  const idx = store.alerts.findIndex((a) => a.id === alert.id);
  if (idx >= 0) store.alerts[idx] = { ...alert };
  else store.alerts.push({ ...alert });
}

function getAlerts() {
  return store.alerts.map((a) => ({ ...a }));
}

function updateAlert(alert) {
  saveAlert(alert);
}

function removeAlert(id) {
  store.alerts = store.alerts.filter(a => a.id !== id);
}

function removeAlertsByChatId(chatId) {
  store.alerts = store.alerts.filter(a => a.chatId !== chatId);
}

module.exports = { saveAlert, getAlerts, updateAlert, removeAlert, removeAlertsByChatId };