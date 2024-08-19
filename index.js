require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const CHECK_INTERVAL = 2000; // Интервал проверки
const TIMEOUT = 8000; // Тайм-аут ожидания запроса
const TgBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

let lastRequestTime = Date.now(); // Время последнего запроса
let alertSent = false; // Флаг уведомления о потере электричества
let restoreAlertSent = true; // Флаг уведомления о восстановлении электричества
let lastPowerOnTime = Date.now();
let lastPowerOffTime = Date.now();

app.post('/checkenergy', (req, res) => {
  lastRequestTime = Date.now(); // Обновляем время последнего запроса
  alertSent = false;
  console.log(`Request received at ${new Date().toLocaleString()}`);
  res.sendStatus(200);
});

// Проверка времени последнего запроса
const checkLastRequestTime = () => {
  const currentTime = Date.now();
  if (currentTime - lastRequestTime > TIMEOUT) {
    if (!alertSent) {
      let duration = (Date.now() - lastPowerOffTime);
      sendTelegramAlert(`⚠️ Світла немає! Світло було ${formatDuration(duration)}`);
      lastPowerOnTime = Date.now(); // Время когда последний раз было электричество
      alertSent = true;
      restoreAlertSent = false;
      console.log("Electricity outage alert sent.");
    }
  } else {
    if (!restoreAlertSent) {
      let duration = (Date.now() - lastPowerOnTime);
      sendTelegramAlert(`✅ Електропостачання відновлено! Світла не було ${formatDuration(duration)}`);
      lastPowerOffTime = Date.now(); // Время последнего отключения
      restoreAlertSent = true;
      console.log("Electricity restored alert sent.");
    }
  }
};

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  let formatted = '';
  if (hours > 0) {
    formatted += `${hours} годин${hours !== 1 ? '' : 'а'}`;
    if (remainingMinutes > 0) {
      formatted += ` і ${remainingMinutes} хвилин${remainingMinutes !== 1 ? '' : 'а'}`;
    }
  } else if (minutes > 0) {
    formatted += `${minutes} хвилин${minutes !== 1 ? '' : 'а'}`;
  } else {
    formatted = 'менше хвилини';
  }
  return formatted;
}


// Функция отправки уведомления в Telegram
const sendTelegramAlert = (message) => {
  TgBot.sendMessage(TELEGRAM_CHAT_ID, message).catch((e) => console.log(e));
};

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Запускаем периодическую проверку
  setInterval(checkLastRequestTime, CHECK_INTERVAL);
});